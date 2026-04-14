import argparse
import os
import sys
import time
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.tables_db import TablesDB
from appwrite.models import RowList
from appwrite.query import Query
from appwrite.exception import AppwriteException


def rows_to_plain_dicts(result: RowList) -> list[dict]:
	"""Convert SDK Row objects to plain dicts that include user-defined columns."""
	return [row.to_dict() for row in result.rows]


def print_results(rows: list[dict]) -> None:
	if not rows:
		print("No rows found.")
		return

	for index, row in enumerate(rows, 1):
		data = row.get("data", {})
		food_name = data.get("food_name")
		food_id = data.get("food_id")
		nutrition = data.get("nutrition_breakdown")
		print(f"[{index}] food_name={food_name!r} food_id={food_id!r}")
		if nutrition is not None:
			print(f"    nutrition_breakdown={nutrition}")


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
	table_id = os.getenv("APPWRITE_FNRI_FOOD_COLLECTION_ID")

	missing = []
	if not database_id:
		missing.append("APPWRITE_DATABASE_ID")
	if not table_id:
		missing.append("APPWRITE_FNRI_FOOD_COLLECTION_ID")

	if missing:
		raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

	return database_id, table_id



def run_sample(tabledb: TablesDB, database_id: str, table_id: str) -> None:
	result: RowList = tabledb.list_rows(
		database_id=database_id,
		table_id=table_id,
		queries=[Query.limit(5)]
	)
	print({"total": result.total, "rows": rows_to_plain_dicts(result)})


def run_exact(tabledb: TablesDB, database_id: str, table_id: str, value: str, limit: int) -> None:
	result: RowList = tabledb.list_rows(
		database_id=database_id,
		table_id=table_id,
		queries=[Query.equal("food_name", [value]), Query.limit(limit)],
	)
	rows = rows_to_plain_dicts(result)
	print(f"Exact matches for food_name='{value}': {len(rows)}")
	print_results(rows)

def run_search_server(tabledb: TablesDB, database_id: str, table_id: str, value: str, limit: int) -> None:
    query = value.strip()
    if not query:
        print("Search term is empty.")
        return

    start_time = time.perf_counter()

    result: RowList = tabledb.list_rows(
        database_id=database_id,
        table_id=table_id,
        queries=[
            Query.starts_with("food_name", query), 
            Query.limit(limit)
        ],
    )
    
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time

    rows = rows_to_plain_dicts(result)
    print(f"Prefix matches for food_name starting with '{value}': {len(rows)}")
    print_results(rows)
    
    # 4. Print the final speed result
    print(f"\n⏱️ Search completed in {elapsed_time:.4f} seconds")


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
        database_id, table_id = get_db_ids()

        if args.sample:
            run_sample(tabledb, database_id, table_id)
        elif args.exact:
            run_exact(tabledb, database_id, table_id, args.exact, args.limit)
        else:
            run_search_server(tabledb, database_id, table_id, args.search, args.limit)

        return 0

    except AppwriteException as exc:
        print(f"Appwrite error: {exc}")
        return 1
    except Exception as exc:
        print(f"Error: {exc}")
        return 1


if __name__ == "__main__":
	sys.exit(main())
