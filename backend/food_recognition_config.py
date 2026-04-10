from dotenv import load_dotenv
from google import genai
import json
import os
import time

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
USDA_API_KEY = os.getenv('USDA_API_KEY')
USDA_BASE_URL = os.getenv('USDA_BASE_URL', 'https://api.nal.usda.gov/fdc/v1')

client = genai.Client(api_key=GEMINI_API_KEY)


NUTRIENT_MATCHERS = {
    'calories': {
        'numbers': ('208', '1008'),
        'ids': (1008,),
        'name_contains': ('energy', 'kcal')
    },
    'protein_g': {
        'numbers': ('203', '1003'),
        'ids': (1003,),
        'name_contains': ('protein',)
    },
    'carbohydrates_g': {
        'numbers': ('205', '1005'),
        'ids': (1005,),
        'name_contains': ('carbohydrate',)
    },
    'fat_g': {
        'numbers': ('204', '1004'),
        'ids': (1004,),
        'name_contains': ('total lipid', 'fat')
    },
    'fiber_g': {
        'numbers': ('291', '1079'),
        'ids': (1079,),
        'name_contains': ('fiber',)
    },
    'sugar_g': {
        'numbers': ('269', '2000'),
        'ids': (2000,),
        'name_contains': ('sugars, total',)
    },
    'sodium_mg': {
        'numbers': ('307', '1093'),
        'ids': (1093,),
        'name_contains': ('sodium',)
    },
    'saturated_fat_g': {
        'numbers': ('606', '1258'),
        'ids': (1258,),
        'name_contains': ('fatty acids, total saturated', 'saturated')
    }
}

USDA_ALLOWED_DATA_TYPES = ('SR Legacy', 'Foundation')
USDA_PROCESSED_KEYWORDS = (
    'flour', 'powder', 'starch', 'chip', 'chips', 'fried', 'baked',
    'dehydrated', 'dried', 'instant', 'mix', 'snack', 'canned',
    'frozen', 'puree', 'mashed'
)

USDA_DISH_KEYWORDS = (
    'cake', 'pie', 'bread', 'cookie', 'pastry', 'dessert', 'donut',
    'noodle', 'soup', 'stew', 'pasta', 'pizza', 'burger', 'sandwich',
    'salad', 'adobo', 'lomi', 'pancit', 'mami', 'curry', 'omelet'
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


NUTRITION_FIELDS = (
    'calories',
    'protein_g',
    'carbohydrates_g',
    'fat_g',
    'fiber_g',
    'sugar_g',
    'sodium_mg',
    'saturated_fat_g',
)

CARB_DENSE_HINTS = (
    'rice', 'noodle', 'pasta', 'bread', 'potato', 'corn', 'yam',
    'cassava', 'sweet potato', 'taro', 'flour', 'grain'
)

PROTEIN_DENSE_HINTS = (
    'fish', 'chicken', 'beef', 'pork', 'meat', 'egg', 'tofu', 'shrimp',
    'tuna', 'salmon', 'mackerel', 'sardine'
)

LOW_DENSITY_HINTS = (
    'sauce', 'broth', 'gravy', 'dressing', 'oil', 'butter', 'water'
)

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
