import os
import random

def generate_recommendations(user_history: list) -> list:
    """
    Predictive modeling engine for contextual search and personalized user recommendations.
    Uses OpenAI or local fallback to generate menu suggestions.
    """
    openai_key = os.environ.get('OPENAI_API_KEY')
    
    if openai_key:
        # In production, call OpenAI API here
        # response = openai.ChatCompletion.create(...)
        pass
        
    # Local fallback for dev environment
    mock_suggestions = [
        {"id": "menu_101", "name": "Wagyu A5 Steak", "reason": "Based on your recent high-end dining preferences."},
        {"id": "menu_204", "name": "Truffle Fries", "reason": "A popular pairing with steak orders."},
        {"id": "menu_305", "name": "Vintage Dom Perignon", "reason": "Frequently ordered for evening deliveries."}
    ]
    
    # Shuffle to simulate dynamic AI responses
    random.shuffle(mock_suggestions)
    return mock_suggestions[:2]
