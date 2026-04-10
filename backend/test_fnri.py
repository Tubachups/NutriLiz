import argparse
import os
import sys

from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.tables_db import TablesDB
from appwrite.query import Query
from appwrite.exception import AppwriteException


def build_client() -> TablesDB:
	load_dotenv()

	endpoint = os.getenv("APPWRITE_ENDPOINT")
	project_id = os.getenv("APPWRITE_PROJECT_ID")
	api_key = os.getenv("APPWRITE_API_KEY")

	missing = []
	if not endpoint:
		missing.append("APPWRITE_ENDPOINT")
	if not project_id:
		missing.append("APPWRITE_PROJECT_ID")
	if not api_key:
		missing.append("APPWRITE_API_KEY")

	if missing:
		raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

	client = Client()
	client.set_endpoint(endpoint)
	client.set_project(project_id)
	client.set_key(api_key)

	return TablesDB(client)


def get_db_ids() -> tuple[str, str]:
	database_id = os.getenv("APPWRITE_DATABASE_ID")
	collection_id = os.getenv("APPWRITE_FNRI_FOOD_COLLECTION_ID")

	missing = []
	if not database_id:
		missing.append("APPWRITE_DATABASE_ID")
	if not collection_id:
		missing.append("APPWRITE_FNRI_FOOD_COLLECTION_ID")

	if missing:
		raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

	return database_id, collection_id


def print_results(rows: list[dict]) -> None:
	if not rows:
		print("No matching documents found.")
		return

	for idx, row in enumerate(rows, start=1):
		nutrition = row.get("nutrition_breakdown")
		nutrition_type = type(nutrition).__name__ if nutrition is not None else "None"
		print(
			f"{idx}. id={row.get('$id')} | food_id={row.get('food_id')}"
			f" | food_name={row.get('food_name')} | nutrition_breakdown={nutrition_type}"
		)


def run_sample(tabledb: TablesDB, database_id: str, collection_id: str, limit: int) -> None:
	response = tabledb.list_rows(
		database_id,
		collection_id,
		queries=[Query.limit(limit)],
	)
	rows = response.get("rows", [])
	print(f"Fetched {len(rows)} rows (sample limit={limit}).")
	print_results(rows)


def run_exact(tabledb: TablesDB, database_id: str, collection_id: str, value: str, limit: int) -> None:
	response = tabledb.list_rows(
		database_id,
		collection_id,
		queries=[Query.equal("food_name", [value]), Query.limit(limit)],
	)
	rows = response.get("rows", [])
	print(f"Exact matches for food_name='{value}': {len(rows)}")
	print_results(rows)


def run_search_local(tabledb: TablesDB, database_id: str, collection_id: str, value: str, limit: int) -> None:
	needle = value.lower().strip()
	if not needle:
		print("Search term is empty.")
		return

	offset = 0
	page_size = 100
	matches = []

	while len(matches) < limit:
		response = tabledb.list_rows(
			database_id,
			collection_id,
			queries=[Query.limit(page_size), Query.offset(offset)],
		)
		rows = response.get("rows", [])
		if not rows:
			break

		for row in rows:
			food_name = str(row.get("food_name") or "")
			if food_name.lower().startswith(needle):
				matches.append(row)
				if len(matches) >= limit:
					break

		offset += page_size
		if len(rows) < page_size:
			break

	print(f"Prefix matches for food_name starting with '{value}': {len(matches)}")
	print_results(matches)


def run_search(tabledb: TablesDB, database_id: str, collection_id: str, value: str, limit: int) -> None:
	try:
		response = tabledb.list_rows(
			database_id,
			collection_id,
			queries=[Query.search("food_name", value), Query.limit(limit)],
		)
		rows = response.get("rows", [])
		print(f"Search matches for food_name containing '{value}': {len(rows)}")
		print_results(rows)
	except AppwriteException as exc:
		if "requires a fulltext index" in str(exc):
			print("No full-text index on food_name. Falling back to local contains() scan...")
			run_search_local(tabledb, database_id, collection_id, value, limit)
		else:
			raise


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(
		description="Query FNRI food collection in Appwrite by food_name"
	)
	parser.add_argument(
		"--sample",
		action="store_true",
		help="List sample rows from the FNRI collection",
	)
	parser.add_argument(
		"--exact",
		type=str,
		help="Exact match on food_name",
	)
	parser.add_argument(
		"--search",
		type=str,
		help="Text search on food_name (requires full-text index)",
	)
	parser.add_argument(
		"--limit",
		type=int,
		default=10,
		help="Max documents to return (default: 10)",
	)
	return parser.parse_args()


def main() -> int:
	args = parse_args()

	selected = sum([bool(args.sample), bool(args.exact), bool(args.search)])
	if selected != 1:
		print("Choose exactly one: --sample, --exact, or --search")
		return 2

	try:
		tabledb = build_client()
		database_id, collection_id = get_db_ids()

		if args.sample:
			run_sample(tabledb, database_id, collection_id, args.limit)
		elif args.exact:
			run_exact(tabledb, database_id, collection_id, args.exact, args.limit)
		else:
			run_search(tabledb, database_id, collection_id, args.search, args.limit)

		return 0

	except AppwriteException as exc:
		print(f"Appwrite error: {exc}")
		return 1
	except Exception as exc:
		print(f"Error: {exc}")
		return 1


if __name__ == "__main__":
	sys.exit(main())
