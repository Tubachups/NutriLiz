from dotenv import load_dotenv
from google import genai
import json
import os
import time

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
USDA_API_KEY = os.getenv('USDA_API_KEY')
USDA_BASE_URL = os.getenv('USDA_BASE_URL', 'https://api.nal.usda.gov/fdc/v1')
OPENFOODFACTS_BASE_URL = os.getenv('OPENFOODFACTS_BASE_URL', 'https://world.openfoodfacts.org')

client = genai.Client(api_key=GEMINI_API_KEY)


NUTRIENT_NUMBER_MAP = {
    'calories': '208',
    'protein_g': '203',
    'carbohydrates_g': '205',
    'fat_g': '204',
    'fiber_g': '291',
    'sugar_g': '269',
    'sodium_mg': '307',
    'saturated_fat_g': '606'
}

USDA_ALLOWED_DATA_TYPES = ('SR Legacy', 'Foundation')
USDA_PROCESSED_KEYWORDS = (
    'flour', 'powder', 'starch', 'chip', 'chips', 'fried', 'baked',
    'dehydrated', 'dried', 'instant', 'mix', 'snack', 'canned',
    'frozen', 'puree', 'mashed'
)

OPENFOODFACTS_PACKAGED_HINTS = (
    'biscuit', 'cookies', 'cookie', 'cracker', 'chips', 'choco', 'chocolate',
    'instant', 'noodles', 'cereal', 'drink', 'beverage', 'soda', 'juice',
    'pack', 'packet', 'pouch', 'bottle', 'can', 'bar', 'snack', 'flavor',
    'flavour', 'label', 'labeled', 'labelled', 'brand', 'processed'
)

FRESH_FOOD_CATEGORY_HINTS = (
    'vegetable', 'fruit', 'meat', 'fish', 'seafood', 'egg',
    'legume', 'bean', 'grain', 'rice', 'root'
)

FRESH_FOOD_TEXT_HINTS = (
    'fresh', 'raw', 'whole', 'unprocessed', 'leafy', 'home-cooked',
    'steamed', 'boiled', 'grilled'
)

NOODLE_DISH_HINTS = (
    'noodle', 'noodles', 'pancit', 'pansit', 'canton', 'lomi', 'mami',
    'batchoy', 'ramen', 'udon', 'soba', 'sotanghon', 'misua'
)

BROTH_SAUCE_HINTS = (
    'broth', 'soup', 'sabaw', 'sauce', 'dressing', 'gravy', 'thick',
    'creamy', 'coated', 'covered'
)

FILIPINO_LOCAL_DISHES = {
    'lomi': {
        'canonical_name': 'Lomi',
        'aliases': (
            'lomi', 'batangas lomi', 'pancit lomi', 'pansit lomi',
            'lomihang', 'loming'
        ),
        'usda_queries': (
            'filipino noodle soup',
            'noodle soup with meat and vegetables',
            'egg noodle soup'
        )
    },
    'pancit_canton': {
        'canonical_name': 'Pancit Canton',
        'aliases': (
            'pancit canton', 'pansit canton', 'canton noodles', 'pancit kanton'
        ),
        'usda_queries': (
            'stir fried noodles with vegetables and meat',
            'noodles with vegetables and meat'
        )
    },
    'mami': {
        'canonical_name': 'Mami',
        'aliases': (
            'mami', 'beef mami', 'chicken mami', 'pork mami'
        ),
        'usda_queries': (
            'chicken noodle soup',
            'beef noodle soup',
            'noodle soup'
        )
    }
}


def env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


def to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    return str(value or '').strip().lower() in {'1', 'true', 'yes', 'on'}


FOOD_ANALYSIS_FAST_MODE = env_flag('FOOD_ANALYSIS_FAST_MODE', True)
CACHE_TTL_SECONDS = int(os.getenv('FOOD_ANALYSIS_CACHE_TTL_SECONDS', '300'))
CACHE_MAX_ITEMS = int(os.getenv('FOOD_ANALYSIS_CACHE_MAX_ITEMS', '500'))

ANALYSIS_CACHE = {}
OFF_SEARCH_CACHE = {}
USDA_SEARCH_CACHE = {}


def clone_data(value):
    """JSON-safe deep copy for cached payloads."""
    return json.loads(json.dumps(value))


def cache_get(cache: dict, key: str):
    if key not in cache:
        return False, None

    expires_at, value = cache.get(key, (0, None))
    if expires_at < time.time():
        cache.pop(key, None)
        return False, None

    return True, clone_data(value)


def cache_set(cache: dict, key: str, value):
    now = time.time()

    if len(cache) >= CACHE_MAX_ITEMS:
        expired_keys = [k for k, (exp, _) in cache.items() if exp < now]
        for old_key in expired_keys:
            cache.pop(old_key, None)

    if len(cache) >= CACHE_MAX_ITEMS:
        oldest_key = min(cache.items(), key=lambda item: item[1][0])[0]
        cache.pop(oldest_key, None)

    cache[key] = (now + CACHE_TTL_SECONDS, clone_data(value))
