import requests

BASE_URL = "https://world.openfoodfacts.org/api/v0/product/"

def get_product_data(barcode):
  try:
    url = f"{BASE_URL}{barcode}.json"
    response = requests.get(url,timeout=10)
    return response.json()
  except requests.exceptions.RequestException as e:
      print(f"API request failed: {e}")
      return None