"""
Restaurant Business Hours Scraper
=================================
Dual-layer scraper for retrieving restaurant operating hours.
1. Primary: SerpAPI Google Local (most reliable)
2. Fallback: Headless Chromium Playwright Google Search
"""

import os
import re
import requests
import traceback
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv('SERPAPI_KEY')

# Lazy-load playwright
_playwright_available = None

def _check_playwright():
    global _playwright_available
    if _playwright_available is None:
        try:
            from playwright.sync_api import sync_playwright
            _playwright_available = True
        except ImportError:
            _playwright_available = False
            print("[RestaurantScraper] playwright not installed")
    return _playwright_available

def scrape_restaurant_hours(restaurant_name, location_city):
    """
    Get business hours and status for a restaurant.
    
    Returns: dict with:
        hours: str (e.g. "Closes at 10 PM", "Open 24 hours")
        is_open: bool
        source: str ("serpapi" or "playwright_fallback" or "unknown")
    """
    if not restaurant_name or restaurant_name == "Target Restaurant":
        return {"hours": "Unknown", "is_open": True, "source": "mock"}

    query = f"{restaurant_name} {location_city}"
    
    # --- Strategy 1: SerpAPI Google Maps ---
    if SERPAPI_KEY:
        try:
            print(f"[RestaurantScraper] Querying SerpAPI Maps for: {query}")
            url = f"https://serpapi.com/search.json?engine=google_maps&q={quote_plus(query)}&api_key={SERPAPI_KEY}"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                place_results = data.get("place_results", {})
                if place_results:
                    hours_list = place_results.get("hours", [])
                    status = place_results.get("open_state", "")
                    
                    # Usually "open_state" looks like "Open ⋅ Closes 2 AM"
                    hours_str = status.replace('⋅', '-').replace('\u22c5', '-').strip()
                    if not hours_str and hours_list:
                        # Grab the first one as a fallback
                        try:
                            first_day = list(hours_list[0].keys())[0]
                            hours_str = f"{first_day.capitalize()}: {hours_list[0][first_day]}"
                        except Exception:
                            hours_str = "Hours available"
                    
                    is_open = True
                    if "Closed" in hours_str:
                        is_open = False
                        
                    if hours_str:
                        print(f"[RestaurantScraper] SerpAPI Success: {hours_str} (Open: {is_open})")
                        return {
                            "hours": hours_str,
                            "is_open": is_open,
                            "source": "serpapi_maps"
                        }
        except Exception as e:
            print(f"[RestaurantScraper] SerpAPI error: {e}")

    # --- Strategy 2: Playwright Headless Fallback ---
    if _check_playwright():
        try:
            print(f"[RestaurantScraper] Fallback to Playwright for: {query}")
            from playwright.sync_api import sync_playwright
            
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-blink-features=AutomationControlled'
                    ]
                )
                context = browser.new_context(
                    viewport={'width': 1280, 'height': 900},
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
                )
                page = context.new_page()
                
                search_url = f"https://www.google.com/search?q={quote_plus(query)}"
                page.goto(search_url, wait_until='domcontentloaded', timeout=15000)
                
                # Google Knowledge Panel hours usually have a data-attr or specific class
                # 'span' with text "Open" or "Closed"
                
                try:
                    # Wait for knowledge panel
                    page.wait_for_selector('div.VwiC3b, span.BNeawe, div.BNeawe, span.wgkxie', timeout=5000)
                except Exception:
                    pass
                
                # We extract all text and look for "Closed ⋅ Opens" or "Open ⋅ Closes"
                full_text = page.inner_text('body')
                
                hours_match = re.search(r'(Closed|Open)\s*[⋅\.\-]\s*(Opens|Closes)[^\\n]*', full_text, re.IGNORECASE)
                if hours_match:
                    hours_str = hours_match.group(0).strip()
                    is_open = "Open" in hours_match.group(1)
                    print(f"[RestaurantScraper] Playwright Success: {hours_str} (Open: {is_open})")
                    browser.close()
                    return {
                        "hours": hours_str,
                        "is_open": is_open,
                        "source": "playwright_fallback"
                    }
                    
                # Alternative format "Open 24 hours"
                if re.search(r'Open 24 hours', full_text, re.IGNORECASE):
                    browser.close()
                    return {
                        "hours": "Open 24 hours",
                        "is_open": True,
                        "source": "playwright_fallback"
                    }
                    
                browser.close()
        except Exception as e:
            print(f"[RestaurantScraper] Playwright error: {e}")
            
    print(f"[RestaurantScraper] Could not find hours for {restaurant_name}")
    return {"hours": "Unknown", "is_open": True, "source": "unknown"}

if __name__ == '__main__':
    import sys
    r_name = sys.argv[1] if len(sys.argv) > 1 else "Gene & Jude's"
    city = sys.argv[2] if len(sys.argv) > 2 else "River Grove, IL"
    
    print(f"Testing Scraper for: {r_name} in {city}")
    result = scrape_restaurant_hours(r_name, city)
    print(result)
