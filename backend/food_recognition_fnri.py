import os
import re
import json
import logging
from difflib import SequenceMatcher
from typing import Optional

from appwrite.client import Client
from appwrite.query import Query
from appwrite.services.tables_db import TablesDB

from food_recognition_config import NUTRITION_FIELDS
from food_recognition_helpers import normalize_food_text, resolve_local_dish_mapping


_FNRI_TABLE_DB: Optional[TablesDB] = None
logger = logging.getLogger(__name__)

FNRI_TO_APP_NUTRIENT_MAP = {
    'energy, calculated (kcal)': 'calories',
    'protein (g)': 'protein_g',
    'carbohydrate, total (g)': 'carbohydrates_g',
    'total fat (g)': 'fat_g',
    'fiber, total dietary (g)': 'fiber_g',
    'sugars, total (g)': 'sugar_g',
    'sodium, na (mg)': 'sodium_mg',
    'fatty acids, saturated, total (g)': 'saturated_fat_g',
}

FNRI_TO_APP_NUTRIENT_MAP_NORMALIZED = {
    normalize_food_text(key): value
    for key, value in FNRI_TO_APP_NUTRIENT_MAP.items()
}


def _row_get(row, key: str, default=None):
    """Safely get a field from either a dict or an Appwrite Row/Document object."""
    if isinstance(row, dict):
        return row.get(key, default)
    return getattr(row, key, default)


def _build_tabledb() -> TablesDB:
    global _FNRI_TABLE_DB
    if _FNRI_TABLE_DB is not None:
        return _FNRI_TABLE_DB

    endpoint = os.getenv('APPWRITE_ENDPOINT')
    project_id = os.getenv('APPWRITE_PROJECT_ID')
    api_key = os.getenv('APPWRITE_API_KEY')

    missing = []
    if not endpoint:
        missing.append('APPWRITE_ENDPOINT')
    if not project_id:
        missing.append('APPWRITE_PROJECT_ID')
    if not api_key:
        missing.append('APPWRITE_API_KEY')

    if missing:
        raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

    client = Client()
    client.set_endpoint(endpoint)
    client.set_project(project_id)
    client.set_key(api_key)

    _FNRI_TABLE_DB = TablesDB(client)
    return _FNRI_TABLE_DB


def _get_fnri_ids() -> tuple[str, str]:
    database_id = os.getenv('APPWRITE_DATABASE_ID')
    table_id = os.getenv('APPWRITE_FNRI_FOOD_TABLE_ID') or os.getenv('APPWRITE_FNRI_FOOD_COLLECTION_ID')

    missing = []
    if not database_id:
        missing.append('APPWRITE_DATABASE_ID')
    if not table_id:
        missing.append('APPWRITE_FNRI_FOOD_TABLE_ID or APPWRITE_FNRI_FOOD_COLLECTION_ID')

    if missing:
        raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

    return database_id, table_id


def _parse_numeric(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text or text == '-':
        return None

    text = text.replace(',', '')
    try:
        return float(text)
    except ValueError:
        return None


def _tokenize(text: str) -> set[str]:
    """Split normalized text into tokens, stripping punctuation like commas.

    This ensures FNRI food names such as 'Apple, red' (which normalize to
    'apple, red') produce the token set {'apple', 'red'} rather than
    {'apple,', 'red'}, so they correctly match queries like 'red apple'.
    """
    return {re.sub(r'[^\w]', '', t) for t in text.split() if re.sub(r'[^\w]', '', t)}


def _extract_nutrition_per_100g(row) -> dict:
    breakdown = _row_get(row, 'nutrition_breakdown')
    result = {field: None for field in NUTRITION_FIELDS}

    if isinstance(breakdown, str):
        try:
            breakdown = json.loads(breakdown)
        except (TypeError, ValueError):
            logger.debug("FNRI nutrition_breakdown is not valid JSON for row_id=%s", _row_get(row, '$id'))
            return result

    if not isinstance(breakdown, dict):
        return result

    for raw_key, raw_value in breakdown.items():
        key = normalize_food_text(raw_key)
        mapped_key = FNRI_TO_APP_NUTRIENT_MAP_NORMALIZED.get(key)
        if mapped_key:
            result[mapped_key] = _parse_numeric(raw_value)

    return result


def _score_match(query: str, candidate: str) -> tuple:
    query_norm = normalize_food_text(query)
    cand_norm = normalize_food_text(candidate)

    # Use punctuation-safe tokenization so "Apple, red" == "red apple"
    query_set = _tokenize(query_norm)
    cand_set = _tokenize(cand_norm)

    if cand_norm == query_norm:
        return (0, len(cand_norm))

    if query_set and cand_set and query_set == cand_set:
        # Same words in different order / punctuation, e.g. "red apple" vs "Apple, red"
        return (1, len(cand_norm))

    if cand_norm.startswith(query_norm):
        return (2, len(cand_norm))

    if query_set and cand_set and query_set.issubset(cand_set):
        return (3, len(cand_norm))

    overlap = len(query_set & cand_set)
    if overlap > 0:
        ratio = SequenceMatcher(None, query_norm, cand_norm).ratio()
        return (4, -overlap, -ratio, len(cand_norm))

    ratio = SequenceMatcher(None, query_norm, cand_norm).ratio()
    return (5, -ratio, len(cand_norm))


def _search_rows_startswith(food_name: str, limit: int = 8, page_size: int = 100, max_scan: int = 1200) -> list:
    query = normalize_food_text(food_name)
    if not query:
        return []

    # Punctuation-safe token set for the search query
    query_tokens = _tokenize(query)

    tabledb = _build_tabledb()
    database_id, table_id = _get_fnri_ids()

    scanned = 0
    offset = 0
    matches = []

    while scanned < max_scan and len(matches) < limit:
        response = tabledb.list_rows(
            database_id,
            table_id,
            queries=[Query.limit(page_size), Query.offset(offset)],
        )

        # Appwrite SDK returns a RowList object — access .rows, not .get('rows')
        rows = response.rows if hasattr(response, 'rows') else []
        if not rows:
            break

        for row in rows:
            scanned += 1
            candidate_name = normalize_food_text(_row_get(row, 'food_name', '') or '')

            # Punctuation-safe token set — strips commas from tokens like "apple,"
            candidate_tokens = _tokenize(candidate_name)

            similarity_ratio = SequenceMatcher(None, query, candidate_name).ratio()

            starts_with = candidate_name.startswith(query)
            same_token_set = bool(query_tokens) and query_tokens == candidate_tokens
            token_subset = bool(query_tokens) and query_tokens.issubset(candidate_tokens)
            # Also match when the candidate's tokens are a subset of the query's
            # e.g. query="red apple juice" should still match candidate="Apple, red"
            token_subset_reverse = bool(candidate_tokens) and candidate_tokens.issubset(query_tokens)
            token_overlap = len(query_tokens & candidate_tokens)
            min_overlap = 1 if len(query_tokens) <= 1 else 2
            has_good_overlap = (
                bool(query_tokens)
                and token_overlap >= min_overlap
                and (token_overlap == len(query_tokens) or similarity_ratio >= 0.72)
            )

            if starts_with or same_token_set or token_subset or token_subset_reverse or has_good_overlap:
                matches.append(row)
                if len(matches) >= limit:
                    break
            if scanned >= max_scan:
                break

        offset += page_size
        if len(rows) < page_size:
            break

    logger.debug(
        "FNRI scan complete query='%s' scanned=%s matches=%s limit=%s",
        query,
        scanned,
        len(matches),
        limit,
    )
    return matches


def get_fnri_nutrition(food_name: str, ingredients=None, fast_mode: bool = False) -> dict:
    """Find FNRI nutrition by food_name using STARTS WITH matching."""
    cleaned_name = str(food_name or '').strip()
    if not cleaned_name:
        logger.info('FNRI lookup skipped: empty food_name')
        print('[FNRI] lookup skipped: empty food_name')
        return {}

    query_candidates = [cleaned_name]
    mapping = resolve_local_dish_mapping(cleaned_name)
    if mapping.get('canonical_name'):
        query_candidates.insert(0, mapping['canonical_name'])

    if isinstance(ingredients, list):
        for ingredient in ingredients:
            text = str(ingredient or '').strip()
            if text:
                query_candidates.append(text)

    deduped = []
    seen = set()
    for item in query_candidates:
        key = normalize_food_text(item)
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    if fast_mode and deduped:
        deduped = deduped[:2]

    logger.info(
        "FNRI lookup start: food='%s' queries=%s fast_mode=%s",
        cleaned_name,
        [normalize_food_text(item) for item in deduped],
        fast_mode,
    )
    print(f"[FNRI] lookup start: food='{cleaned_name}' queries={[normalize_food_text(item) for item in deduped]} fast_mode={fast_mode}")

    best_row = None
    best_query = ''
    best_score = (99, 9999)

    for query in deduped:
        rows = _search_rows_startswith(query, limit=8 if not fast_mode else 3)
        logger.debug("FNRI query='%s' returned %s prefix matches", query, len(rows))
        for row in rows:
            score = _score_match(query, _row_get(row, 'food_name', '') or '')
            if score < best_score:
                best_score = score
                best_row = row
                best_query = query

        if best_score[0] == 0:
            break

    if not best_row:
        logger.info("FNRI lookup miss: no row matched for '%s'", cleaned_name)
        print(f"[FNRI] lookup miss: no row matched for '{cleaned_name}'")
        return {}

    nutrition_per_100g = _extract_nutrition_per_100g(best_row)
    if not any(value is not None for value in nutrition_per_100g.values()):
        logger.info(
            "FNRI lookup miss: row found but nutrition empty for food='%s' matched='%s'",
            cleaned_name,
            _row_get(best_row, 'food_name', ''),
        )
        print(
            f"[FNRI] lookup miss: row found but nutrition empty for food='{cleaned_name}' matched='{_row_get(best_row, 'food_name', '')}'"
        )
        return {}

    logger.info(
        "FNRI lookup hit: food='%s' matched='%s' query='%s' match_type=%s",
        cleaned_name,
        _row_get(best_row, 'food_name', ''),
        best_query,
        'exact' if best_score[0] == 0 else 'prefix',
    )
    print(
        f"[FNRI] lookup hit: food='{cleaned_name}' matched='{_row_get(best_row, 'food_name', '')}' query='{best_query}' match_type={'exact' if best_score[0] == 0 else 'prefix'}"
    )

    return {
        'fdc_id': _row_get(best_row, '$id') or _row_get(best_row, 'food_id'),
        'description': _row_get(best_row, 'food_name') or best_query,
        'data_type': 'FNRI',
        'nutrition_per_100g': nutrition_per_100g,
        'fnri_match': {
            'food_id': _row_get(best_row, 'food_id'),
            'food_name': _row_get(best_row, 'food_name'),
            'query': best_query,
            'match_type': 'exact' if best_score[0] == 0 else 'prefix',
        },
    }