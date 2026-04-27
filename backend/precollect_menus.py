"""
JetSlice - Menu Pre-Collector
==============================
Batch scrapes menu items and prices for ALL trending food emoji restaurants.
Saves results to menu_cache.json for instant frontend retrieval.

Run this script once (or on a schedule) to populate the cache:
  python precollect_menus.py

The server serves the cached data via GET /api/menu-cache
"""

import json
import time
import os
import sys

# Fix Windows console encoding for emoji output
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from menu_scraper import scrape_restaurant_menu

# ---------------------------------------------------------------------------
# We assume this script runs from inside the backend/ folder.
CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'menu_cache.json')

def save_cache(data):
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ---------------------------------------------------------------------------
# All 16 Trending Emoji Restaurants (from app.js + sentiment-recommendations)
# ---------------------------------------------------------------------------
EMOJI_RESTAURANTS = [
    # === app.js hardcoded trendingFeatures (14 markers) ===
    {
        "emoji": "\U0001f355",
        "restaurant": "L'Industrie Pizzeria",
        "city": "New York, NY",
        "origin": "104 Christopher St, New York, NY",
        "dest": "Beverly Hills, CA",
        "foodItem": "Signature Artisan Pizza"
    },
    {
        "emoji": "\U0001f363",
        "restaurant": "Sushi Roku",
        "city": "Los Angeles, CA",
        "origin": "Los Angeles, CA",
        "dest": "Manhattan, NY",
        "foodItem": "Premium Omakase Box"
    },
    {
        "emoji": "\U0001f32f",
        "restaurant": "La Taqueria",
        "city": "San Francisco, CA",
        "origin": "San Francisco, CA",
        "dest": "Chicago, IL",
        "foodItem": "Carne Asada Super Burrito"
    },
    {
        "emoji": "\U0001f354",
        "restaurant": "Au Cheval",
        "city": "Chicago, IL",
        "origin": "Chicago, IL",
        "dest": "Miami, FL",
        "foodItem": "Double Cheeseburger"
    },
    {
        "emoji": "\U0001f357",
        "restaurant": "Gus's Fried Chicken",
        "city": "Memphis, TN",
        "origin": "Memphis, TN",
        "dest": "New York, NY",
        "foodItem": "Spicy Fried Chicken Plate"
    },
    {
        "emoji": "\U0001f980",
        "restaurant": "Joe's Stone Crab",
        "city": "Miami, FL",
        "origin": "Miami, FL",
        "dest": "Denver, CO",
        "foodItem": "Large Stone Crab Claws"
    },
    {
        "emoji": "\U0001f32e",
        "restaurant": "Torchy's Tacos",
        "city": "Austin, TX",
        "origin": "Austin, TX",
        "dest": "Seattle, WA",
        "foodItem": "Trailer Park Taco Set"
    },
    {
        "emoji": "\U0001f356",
        "restaurant": "Pecan Lodge",
        "city": "Dallas, TX",
        "origin": "Dallas, TX",
        "dest": "San Francisco, CA",
        "foodItem": "Smoked Brisket Pound"
    },
    {
        "emoji": "\U0001f9aa",
        "restaurant": "Neptune Oyster",
        "city": "Boston, MA",
        "origin": "Boston, MA",
        "dest": "Phoenix, AZ",
        "foodItem": "Wellfleet Oysters (Dozen, Iced)"
    },
    {
        "emoji": "\U0001f99e",
        "restaurant": "Luke's Lobster",
        "city": "Portland, ME",
        "origin": "Portland, ME",
        "dest": "Las Vegas, NV",
        "foodItem": "Maine Lobster Roll (Cold)"
    },
    {
        "emoji": "\U0001f950",
        "restaurant": "Cafe Du Monde",
        "city": "New Orleans, LA",
        "origin": "New Orleans, LA",
        "dest": "Seattle, WA",
        "foodItem": "Fresh Beignets & Chicory Coffee"
    },
    {
        "emoji": "\U0001f369",
        "restaurant": "Voodoo Doughnut",
        "city": "Portland, OR",
        "origin": "Portland, OR",
        "dest": "Miami, FL",
        "foodItem": "Magic Dozen Box"
    },
    {
        "emoji": "\U0001f32d",
        "restaurant": "The Varsity",
        "city": "Atlanta, GA",
        "origin": "Atlanta, GA",
        "dest": "Boston, MA",
        "foodItem": "Chili Cheese Dog Combo"
    },
    {
        "emoji": "\U0001f9c1",
        "restaurant": "Cupcake Royale",
        "city": "Seattle, WA",
        "origin": "Seattle, WA",
        "dest": "Dallas, TX",
        "foodItem": "Assorted Hand-piped Cupcakes"
    },

    # === Sentiment Recommendations (2 AI markers) ===
    {
        "emoji": "\U0001f959",
        "restaurant": "The Halal Guys",
        "city": "New York, NY",
        "origin": "New York, NY",
        "dest": "Miami, FL",
        "foodItem": "Gyro Platter & White Sauce"
    },
    {
        "emoji": "\U0001f35a",
        "restaurant": "Din Tai Fung",
        "city": "Los Angeles, CA",
        "origin": "Los Angeles, CA",
        "dest": "Las Vegas, NV",
        "foodItem": "Pork XLB & Truffle Fried Rice"
    },
]


def precollect_all():
    """Scrape menus for all trending emoji restaurants and save to JSON."""
    print("=" * 70)
    print("  JetSlice Menu Pre-Collector")
    print("  Scraping menus for all trending emoji restaurants...")
    print("=" * 70)

    results = {}
    total = len(EMOJI_RESTAURANTS)
    success_count = 0
    fail_count = 0

    for i, entry in enumerate(EMOJI_RESTAURANTS, 1):
        name = entry['restaurant']
        city = entry['city']
        key = f"{name}|{city}"

        print(f"\n[{i}/{total}] Scraping: {entry['emoji']}  {name} ({city})")
        print("-" * 50)

        try:
            menu_data = scrape_restaurant_menu(name, city)
            item_count = menu_data.get('item_count', 0)

            results[key] = {
                "emoji": entry['emoji'],
                "restaurant": name,
                "city": city,
                "origin": entry.get('origin', city),
                "dest": entry.get('dest', ''),
                "foodItem": entry.get('foodItem', ''),
                "menu": menu_data.get('items', []),
                "item_count": item_count,
                "source": menu_data.get('source', 'none'),
                "menu_url": menu_data.get('menu_url'),
                "scraped_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }

            if item_count > 0:
                success_count += 1
                print(f"  [OK] {item_count} items scraped (source: {menu_data.get('source')})")
            else:
                fail_count += 1
                print(f"  [EMPTY] No menu items found")

        except Exception as e:
            fail_count += 1
            print(f"  [ERROR] {e}")
            results[key] = {
                "emoji": entry['emoji'],
                "restaurant": name,
                "city": city,
                "menu": [],
                "item_count": 0,
                "source": "error",
                "error": str(e),
                "scraped_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }

        # Rate-limit between scrapes to avoid API throttling
        if i < total:
            time.sleep(1.5)

    # Save to JSON
    cache_data = {
        "version": "1.0",
        "generated_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        "total_restaurants": total,
        "successful_scrapes": success_count,
        "failed_scrapes": fail_count,
        "restaurants": results
    }

    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache_data, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print(f"  Pre-Collection Complete!")
    print(f"  Saved to: {CACHE_FILE}")
    print(f"  Results: {success_count}/{total} successful, {fail_count} failed")
    total_items = sum(r.get('item_count', 0) for r in results.values())
    print(f"  Total menu items collected: {total_items}")
    print("=" * 70)

    return cache_data


if __name__ == '__main__':
    precollect_all()
