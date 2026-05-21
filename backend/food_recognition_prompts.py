import json

def build_food_image_analysis_prompt(user_profile: dict = None, health_context: str = '') -> str:
    """Build prompt used for food image analysis."""
    prompt = """Analyze this food image and provide detailed information in the following JSON format:

{
    "identified": true/false,
    "confidence": "high/medium/low",
    "has_visible_label_or_packaging": true/false,
    "food_name": "Name of the food",
    "food_name_local": "Local/regional name if applicable",
    "category": "Category (e.g., Fruit, Vegetable, Meat, Dairy, Grain, etc.)",
    "description": "Brief description of the food",
    "food_safety_status": "safe/unsafe/uncertain",
    "is_expired_or_spoiled": true/false,
    "food_safety_note": "Brief note if unsafe or uncertain",
    "serving_size": "Estimated serving size shown",
    "nutrition_per_100g": {
        "calories": null,
        "protein_g": null,
        "carbohydrates_g": null,
        "fat_g": null,
        "fiber_g": null,
        "sugar_g": null,
        "sodium_mg": null,
        "saturated_fat_g": null
    },
    "health_benefits": ["benefit1", "benefit2"],
    "potential_concerns": ["concern1", "concern2"],
    "allergens": ["allergen1", "allergen2"],
    "dietary_info": {
        "is_vegetarian": true/false,
        "is_vegan": true/false,
        "is_gluten_free": true/false,
        "is_dairy_free": true/false
    },
    "nutri_score_estimate": "A/B/C/D/E",
    "ingredients_if_dish": ["ingredient1", "ingredient2"],
    "preparation_notes": "How the food appears to be prepared",
    "disambiguation_needed": false,
    "alternatives": []
  "items": [
    {
        "identified": true/false,
        "confidence": "high/medium/low",
        "confidence_score": 0,
        "has_visible_label_or_packaging": true/false,
        "food_name": "Name of the food",
        "food_name_local": "Local/regional name if applicable",
        "category": "Category (e.g., Fruit, Vegetable, Meat, Dairy, Grain, etc.)",
        "description": "Brief description of the food",
        "food_safety_status": "safe/unsafe/uncertain",
        "is_expired_or_spoiled": true/false,
        "food_safety_note": "Brief note if unsafe or uncertain",
        "serving_size": "Estimated serving size shown",
        "nutrition_per_100g": {
            "calories": null,
            "protein_g": null,
            "carbohydrates_g": null,
            "fat_g": null,
            "fiber_g": null,
            "sugar_g": null,
            "sodium_mg": null,
            "saturated_fat_g": null
        },
        "health_benefits": ["benefit1", "benefit2"],
        "potential_concerns": ["concern1", "concern2"],
        "allergens": ["allergen1", "allergen2"],
        "dietary_info": {
            "is_vegetarian": true/false,
            "is_vegan": true/false,
            "is_gluten_free": true/false,
            "is_dairy_free": true/false
        },
        "nutri_score_estimate": "A/B/C/D/E",
        "ingredients_if_dish": ["ingredient1", "ingredient2"],
        "preparation_notes": "How the food appears to be prepared",
        "disambiguation_needed": false,
        "alternatives": []
    }
  ]
}

If you cannot identify the food or it's not a food item, set "identified" to false and explain in the description.
Do not estimate nutrition values. Keep nutrition fields null, they will be populated from an external nutrition database.

Set "disambiguation_needed" to true only when the exact food identity is genuinely ambiguous due to:
1. The food appears to be an unlabeled liquid (e.g., tea, juice, smoothie, soup, broth, coffee, unknown drink) where the specific variety cannot be reliably determined from the image alone.
2. The dish has heavy sauces, dressings, gravies, or toppings that significantly obscure the identity of the underlying main food item (e.g., pasta completely submerged in sauce, a salad fully drenched in thick dressing).
3. The dish appears to be a regional noodle dish with broth/sauce where lookalike noodle dishes are common (e.g., Lomi vs Pancit Canton vs Mami).
When "disambiguation_needed" is true, populate "alternatives" with 2-3 of the most plausible food names as candidates for what is shown.
In all other cases, keep "disambiguation_needed" as false and "alternatives" as an empty array.

Set "has_visible_label_or_packaging" to true only when there are explicit visible cues of commercial packaging or labels
(for example: branded wrappers, product labels, bottle/can labels, nutrition panel, barcodes, clear package text).
For plated, home-cooked, unpacked, or unlabeled foods, set it to false.

Set "is_expired_or_spoiled" to true only if there are clear visual signs that the food is likely spoiled or expired,
such as mold growth, obvious rot, severe discoloration consistent with spoilage, or visibly decomposed texture.
When true, set "food_safety_status" to "unsafe" and provide a short explanation in "food_safety_note".
Otherwise set "is_expired_or_spoiled" to false and use "food_safety_status" as "safe" or "uncertain".

Return ONLY valid JSON, no additional text.

Set "confidence_score" as an integer from 0-100 representing the AI certainty for the identified food.
Keep "confidence" aligned with the numeric score (high: 75-100, medium: 45-74, low: 0-44)."""

    if user_profile:
        prompt += (
            f"\n\nUser Health Context:\n{health_context}\n\n"
            "Also include a 'personalized_advice' field with specific recommendations for this user."
        )

    return prompt


def build_food_validation_prompt(food_name: str, context: dict = None) -> str:
    """Build prompt used to validate user-typed food names."""
    context_str = ""
    if context:
        ctx_name = context.get('food_name', '')
        ctx_category = context.get('category', '')
        ctx_desc = context.get('description', '')
        if ctx_name or ctx_category:
            context_str = (
                "\nThe image was previously analysed and appears to show: "
                f"{ctx_name} ({ctx_category})."
            )
            if ctx_desc:
                context_str += f" Description: {ctx_desc}"

    escaped_food_name = json.dumps(str(food_name))[1:-1]

    return f"""You are a food validation assistant.
A user manually typed \"{escaped_food_name}\" as the name of a food item they just photographed.{context_str}

Respond ONLY with valid JSON in this exact format:
{{
  "valid": true,
  "reason": "brief explanation",
  "sanitized_name": "Properly capitalised, clean version of the food name"
}}

Rules:
1. "valid" is true ONLY if the input is a real, recognisable food or beverage name (including regional, brand, or colloquial names).
2. "valid" is false if the input is not food/beverage (e.g. household objects, people, random text, offensive language, nonsense) OR if it is obviously impossible given the image context (e.g. typing "raw carrot" when tea/liquid was detected).
3. Do NOT be overly strict - regional dishes, brand names, and informal names are all acceptable as long as they refer to something edible.
4. "sanitized_name" must be filled when valid is true; leave it as an empty string when valid is false.
Return ONLY valid JSON, no additional text."""
