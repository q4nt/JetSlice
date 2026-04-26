"""
JetSlice - Restaurant Menu Scraper Agent
==========================================
Multi-strategy agent for retrieving restaurant menu items and prices.

Strategy Layers (cascading fallback):
  1. SerpAPI Google Maps Place Details (structured menu data)
  2. SerpAPI Google Search (knowledge panel menu extraction)
  3. Playwright Headless Browser (scrape restaurant website directly)
  4. OpenAI GPT Extraction (parse unstructured text into menu items)

Each strategy feeds extracted data into a normalized schema:
  { name: str, price: float|None, description: str, category: str }

Caching: In-memory TTL cache (1 hour) keyed by restaurant name + city.
"""

import os
import re
import json
import time
import hashlib
import traceback
import requests
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv('SERPAPI_KEY', '')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

# ---------------------------------------------------------------------------
# In-Memory Cache (TTL = 1 hour)
# ---------------------------------------------------------------------------
_menu_cache = {}
CACHE_TTL_SECONDS = 3600

def _cache_key(restaurant_name, city):
    raw = f"{restaurant_name.lower().strip()}|{city.lower().strip()}"
    return hashlib.md5(raw.encode()).hexdigest()

def _get_cached(restaurant_name, city):
    key = _cache_key(restaurant_name, city)
    entry = _menu_cache.get(key)
    if entry and (time.time() - entry['ts'] < CACHE_TTL_SECONDS):
        print(f"[MenuScraper] Cache HIT for {restaurant_name}")
        return entry['data']
    return None

def _set_cached(restaurant_name, city, data):
    key = _cache_key(restaurant_name, city)
    _menu_cache[key] = {'data': data, 'ts': time.time()}

# ---------------------------------------------------------------------------
# Utility: Parse price strings into float
# ---------------------------------------------------------------------------
def _parse_price(price_str):
    """Extract numeric price from strings like '$12.99', '12.99 USD', '12', etc."""
    if not price_str:
        return None
    if isinstance(price_str, (int, float)):
        return round(float(price_str), 2)
    cleaned = re.sub(r'[^\d.]', '', str(price_str))
    if cleaned:
        try:
            return round(float(cleaned), 2)
        except ValueError:
            pass
    return None

def _normalize_items(raw_items, source_label):
    """Normalize menu items into the standard JetSlice schema."""
    normalized = []
    seen_names = set()
    for item in raw_items:
        name = item.get('name', '').strip()
        if not name or name.lower() in seen_names:
            continue
        seen_names.add(name.lower())
        normalized.append({
            'name': name,
            'price': _parse_price(item.get('price')),
            'description': item.get('description', '').strip(),
            'category': item.get('category', 'General').strip(),
            'source': source_label
        })
    return normalized

# ---------------------------------------------------------------------------
# Strategy 1: SerpAPI Google Maps Place Details
# ---------------------------------------------------------------------------
def _scrape_serpapi_maps(restaurant_name, city):
    """
    Query SerpAPI Google Maps for place details.
    Google Maps sometimes exposes structured menu data via the 'menu' field
    in place_results, or through the 'popular_items' field.
    """
    if not SERPAPI_KEY:
        return None

    query = f"{restaurant_name} {city} restaurant"
    try:
        # Step 1: Search for the place to get data_id / place_id
        search_url = (
            f"https://serpapi.com/search.json?engine=google_maps"
            f"&q={quote_plus(query)}&api_key={SERPAPI_KEY}"
        )
        print(f"[MenuScraper:SerpAPI-Maps] Searching: {query}")
        resp = requests.get(search_url, timeout=12)
        if resp.status_code != 200:
            print(f"[MenuScraper:SerpAPI-Maps] HTTP {resp.status_code}")
            return None

        data = resp.json()

        # Check place_results first (direct match)
        place = data.get('place_results', {})
        local_results = data.get('local_results', [])

        # If no direct place_results, use first local result's data_id
        data_id = None
        place_name = restaurant_name
        if place and place.get('data_id'):
            data_id = place['data_id']
            place_name = place.get('title', restaurant_name)
        elif local_results:
            first = local_results[0]
            data_id = first.get('data_id')
            place_name = first.get('title', restaurant_name)

        items = []

        # Check if place_results has menu/popular items inline
        if place:
            # Google Maps sometimes nests menu items under 'menu'
            menu_data = place.get('menu', {})
            if isinstance(menu_data, dict):
                for category, cat_items in menu_data.items():
                    if isinstance(cat_items, list):
                        for mi in cat_items:
                            items.append({
                                'name': mi.get('name', mi.get('title', '')),
                                'price': mi.get('price'),
                                'description': mi.get('description', ''),
                                'category': category
                            })
                    elif isinstance(cat_items, dict):
                        items.append({
                            'name': cat_items.get('name', cat_items.get('title', '')),
                            'price': cat_items.get('price'),
                            'description': cat_items.get('description', ''),
                            'category': category
                        })

            # Also check 'popular_times' and other fields
            popular = place.get('popular_items', [])
            if isinstance(popular, list):
                for pi in popular:
                    items.append({
                        'name': pi.get('name', pi.get('title', '')),
                        'price': pi.get('price'),
                        'description': pi.get('description', ''),
                        'category': 'Popular'
                    })

        # Step 2: If we have a data_id, do a place detail request for richer data
        if data_id and not items:
            detail_url = (
                f"https://serpapi.com/search.json?engine=google_maps"
                f"&type=place&data_id={data_id}&api_key={SERPAPI_KEY}"
            )
            print(f"[MenuScraper:SerpAPI-Maps] Fetching place details: {data_id}")
            detail_resp = requests.get(detail_url, timeout=12)
            if detail_resp.status_code == 200:
                detail_data = detail_resp.json()
                place_detail = detail_data.get('place_results', {})

                # Check for menu in details
                menu_data = place_detail.get('menu', {})
                if isinstance(menu_data, dict):
                    for category, cat_items in menu_data.items():
                        if isinstance(cat_items, list):
                            for mi in cat_items:
                                items.append({
                                    'name': mi.get('name', mi.get('title', '')),
                                    'price': mi.get('price'),
                                    'description': mi.get('description', ''),
                                    'category': category
                                })

                # Check popular items
                popular = place_detail.get('popular_items', [])
                if isinstance(popular, list):
                    for pi in popular:
                        items.append({
                            'name': pi.get('name', pi.get('title', '')),
                            'price': pi.get('price'),
                            'description': pi.get('description', ''),
                            'category': 'Popular'
                        })

                # Check reviews for food mentions (bonus intelligence)
                reviews = place_detail.get('reviews', [])
                if reviews and not items:
                    # Extract commonly mentioned food items from reviews
                    food_mentions = _extract_food_from_reviews(reviews, place_name)
                    if food_mentions:
                        items.extend(food_mentions)

        if items:
            normalized = _normalize_items(items, 'serpapi_maps')
            if normalized:
                print(f"[MenuScraper:SerpAPI-Maps] Found {len(normalized)} menu items")
                return {
                    'restaurant': place_name,
                    'items': normalized,
                    'source': 'serpapi_maps',
                    'item_count': len(normalized)
                }

    except Exception as e:
        print(f"[MenuScraper:SerpAPI-Maps] Error: {e}")
        traceback.print_exc()

    return None

def _extract_food_from_reviews(reviews, restaurant_name):
    """Parse review text for commonly mentioned food items."""
    food_items = []
    food_mentions = {}

    for review in reviews[:20]:  # Top 20 reviews
        text = review.get('snippet', review.get('text', ''))
        if not text:
            continue
        # Look for patterns like "the [food item] was/is/are"
        patterns = [
            r'(?:the|their|get the|try the|order the|had the|ordered)\s+([A-Z][a-zA-Z\s&\'-]{2,25})',
            r'([A-Z][a-zA-Z\s&\'-]{3,20})\s+(?:is|was|are|were)\s+(?:amazing|great|good|excellent|delicious|incredible|fantastic|perfect)',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                clean = match.strip().rstrip('.')
                # Skip common non-food words
                skip_words = {'This', 'That', 'They', 'The', 'Their', 'Here', 'Place',
                              'Service', 'Staff', 'Restaurant', 'Food', 'Everything',
                              'It', 'We', 'My', 'Our', 'Very', 'Really', 'Super',
                              'Just', 'Also', 'Even', 'Only', 'Best', 'Great'}
                if clean in skip_words or len(clean) < 3:
                    continue
                food_mentions[clean] = food_mentions.get(clean, 0) + 1

    # Take items mentioned 2+ times, or top 5 if fewer
    ranked = sorted(food_mentions.items(), key=lambda x: -x[1])
    for name, count in ranked[:8]:
        food_items.append({
            'name': name,
            'price': None,
            'description': f'Frequently mentioned in reviews ({count}x)',
            'category': 'Customer Favorites'
        })

    return food_items

# ---------------------------------------------------------------------------
# Strategy 2: SerpAPI Google Search (Knowledge Panel)
# ---------------------------------------------------------------------------
def _scrape_serpapi_search(restaurant_name, city):
    """
    Use SerpAPI Google Search to extract menu data from the knowledge panel,
    rich snippets, or linked menu pages.
    """
    if not SERPAPI_KEY:
        return None

    query = f"{restaurant_name} {city} menu prices"
    try:
        url = (
            f"https://serpapi.com/search.json?engine=google"
            f"&q={quote_plus(query)}&api_key={SERPAPI_KEY}"
        )
        print(f"[MenuScraper:SerpAPI-Search] Searching: {query}")
        resp = requests.get(url, timeout=12)
        if resp.status_code != 200:
            return None

        data = resp.json()
        items = []

        # Check knowledge_graph for menu
        kg = data.get('knowledge_graph', {})
        if kg:
            # Sometimes Google puts menu items in a structured format
            menu_items = kg.get('menu', [])
            if isinstance(menu_items, list):
                for mi in menu_items:
                    items.append({
                        'name': mi.get('name', ''),
                        'price': mi.get('price'),
                        'description': mi.get('description', ''),
                        'category': mi.get('category', 'Menu')
                    })

            # Check 'popular_dishes' or similar
            popular = kg.get('popular_dishes', kg.get('dishes', []))
            if isinstance(popular, list):
                for dish in popular:
                    if isinstance(dish, str):
                        items.append({
                            'name': dish,
                            'price': None,
                            'description': '',
                            'category': 'Popular Dishes'
                        })
                    elif isinstance(dish, dict):
                        items.append({
                            'name': dish.get('name', dish.get('title', '')),
                            'price': dish.get('price'),
                            'description': dish.get('description', ''),
                            'category': 'Popular Dishes'
                        })

        # Check organic results for menu-related pages
        menu_url = None
        organic = data.get('organic_results', [])
        for result in organic[:5]:
            title = result.get('title', '').lower()
            link = result.get('link', '')
            snippet = result.get('snippet', '')

            if any(kw in title for kw in ['menu', 'price', 'food']):
                menu_url = link
                # Try to extract prices from snippet
                price_matches = re.findall(
                    r'([A-Z][a-zA-Z\s&\'-]{2,30})\s*[\$]\s*(\d+\.?\d{0,2})',
                    snippet
                )
                for name, price in price_matches:
                    items.append({
                        'name': name.strip(),
                        'price': price,
                        'description': '',
                        'category': 'Menu'
                    })
                break

        # If we found a menu URL but no items yet, try to fetch and parse it
        if menu_url and not items:
            fetched = _fetch_menu_from_url(menu_url)
            if fetched:
                items.extend(fetched)

        if items:
            normalized = _normalize_items(items, 'serpapi_search')
            if normalized:
                print(f"[MenuScraper:SerpAPI-Search] Found {len(normalized)} menu items")
                return {
                    'restaurant': restaurant_name,
                    'items': normalized,
                    'source': 'serpapi_search',
                    'menu_url': menu_url,
                    'item_count': len(normalized)
                }

    except Exception as e:
        print(f"[MenuScraper:SerpAPI-Search] Error: {e}")

    return None

# ---------------------------------------------------------------------------
# Strategy 3: Direct URL Fetch + Parse
# ---------------------------------------------------------------------------
def _fetch_menu_from_url(url):
    """Fetch a menu page and extract items with prices using regex/heuristics."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            return None

        text = resp.text
        items = []

        # Try BeautifulSoup if available
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(text, 'html.parser')

            # Remove script and style elements
            for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
                tag.decompose()

            body_text = soup.get_text(separator='\n')
        except ImportError:
            # Fallback: strip HTML tags manually
            body_text = re.sub(r'<[^>]+>', '\n', text)
            body_text = re.sub(r'\s+', ' ', body_text)

        # Pattern 1: "Item Name ... $XX.XX"
        pattern1 = re.findall(
            r'([A-Z][a-zA-Z\s&\',.-]{3,40})\s*[\$]\s*(\d{1,3}\.?\d{0,2})',
            body_text
        )
        for name, price in pattern1[:30]:
            items.append({
                'name': name.strip().rstrip('.'),
                'price': price,
                'description': '',
                'category': 'Menu'
            })

        # Pattern 2: "$XX.XX Item Name"
        pattern2 = re.findall(
            r'[\$]\s*(\d{1,3}\.\d{2})\s+([A-Z][a-zA-Z\s&\',.-]{3,40})',
            body_text
        )
        for price, name in pattern2[:30]:
            items.append({
                'name': name.strip().rstrip('.'),
                'price': price,
                'description': '',
                'category': 'Menu'
            })

        return items if items else None

    except Exception as e:
        print(f"[MenuScraper:URLFetch] Error fetching {url}: {e}")
        return None

# ---------------------------------------------------------------------------
# Strategy 4: Playwright Headless Browser Scraping
# ---------------------------------------------------------------------------
def _scrape_playwright(restaurant_name, city):
    """
    Use Playwright to headless-browse Google for menu items.
    Falls back to this when API strategies are exhausted.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[MenuScraper:Playwright] playwright not installed, skipping")
        return None

    query = f"{restaurant_name} {city} menu prices"
    try:
        print(f"[MenuScraper:Playwright] Launching headless browser for: {query}")
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-blink-features=AutomationControlled']
            )
            context = browser.new_context(
                viewport={'width': 1280, 'height': 900},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                           '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            )
            page = context.new_page()
            search_url = f"https://www.google.com/search?q={quote_plus(query)}"
            page.goto(search_url, wait_until='domcontentloaded', timeout=15000)

            try:
                page.wait_for_selector('div, span', timeout=5000)
            except Exception:
                pass

            full_text = page.inner_text('body')
            browser.close()

        items = []

        # Extract price patterns from Google results page
        # Pattern: "ItemName $XX.XX" or "$XX.XX ItemName"
        price_patterns = re.findall(
            r'([A-Z][a-zA-Z\s&\',.-]{3,35})\s*[\$]\s*(\d{1,3}\.?\d{0,2})',
            full_text
        )
        for name, price in price_patterns[:25]:
            clean_name = name.strip().rstrip('.')
            skip = {'View Menu', 'Order Now', 'See Menu', 'Full Menu',
                    'Menu Item', 'Starting At', 'From', 'About',
                    'Delivery Fee', 'Service Fee'}
            if clean_name in skip or len(clean_name) < 3:
                continue
            items.append({
                'name': clean_name,
                'price': price,
                'description': '',
                'category': 'Menu'
            })

        # Also try reverse pattern
        reverse_patterns = re.findall(
            r'[\$]\s*(\d{1,3}\.\d{2})\s+([A-Z][a-zA-Z\s&\',.-]{3,35})',
            full_text
        )
        for price, name in reverse_patterns[:25]:
            clean_name = name.strip().rstrip('.')
            if len(clean_name) >= 3:
                items.append({
                    'name': clean_name,
                    'price': price,
                    'description': '',
                    'category': 'Menu'
                })

        if items:
            normalized = _normalize_items(items, 'playwright_scrape')
            if normalized:
                print(f"[MenuScraper:Playwright] Found {len(normalized)} menu items")
                return {
                    'restaurant': restaurant_name,
                    'items': normalized,
                    'source': 'playwright_scrape',
                    'item_count': len(normalized)
                }

    except Exception as e:
        print(f"[MenuScraper:Playwright] Error: {e}")
        traceback.print_exc()

    return None

# ---------------------------------------------------------------------------
# Strategy 5: OpenAI GPT Extraction (last resort for unstructured data)
# ---------------------------------------------------------------------------
def _extract_with_openai(restaurant_name, city, raw_text=None):
    """
    Use OpenAI to extract structured menu data from unstructured text,
    or generate best-known menu items for famous restaurants.
    """
    if not OPENAI_API_KEY:
        return None

    try:
        headers = {
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }

        if raw_text:
            prompt = (
                f"Extract menu items and prices from this restaurant page text. "
                f"Restaurant: {restaurant_name} in {city}.\n\n"
                f"Text:\n{raw_text[:3000]}\n\n"
                f"Return a JSON array of objects with: name, price (number or null), "
                f"description (brief), category. Only include actual food/drink items. "
                f"Return ONLY the JSON array, no markdown."
            )
        else:
            prompt = (
                f"List the most popular and well-known menu items with approximate prices "
                f"for {restaurant_name} in {city}. Include 8-15 items.\n\n"
                f"Return a JSON array of objects with: name, price (number or null if unknown), "
                f"description (brief 5-10 words), category (e.g. Entrees, Sides, Drinks, Desserts). "
                f"Use realistic current market prices. Return ONLY the JSON array, no markdown."
            )

        payload = {
            'model': 'gpt-4o-mini',
            'messages': [
                {'role': 'system', 'content': 'You are a restaurant data extraction assistant. Return only valid JSON arrays.'},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.3,
            'max_tokens': 2000
        }

        print(f"[MenuScraper:OpenAI] Requesting menu extraction for: {restaurant_name}")
        resp = requests.post('https://api.openai.com/v1/chat/completions',
                             headers=headers, json=payload, timeout=30)

        if resp.status_code == 200:
            content = resp.json()['choices'][0]['message']['content'].strip()
            # Clean potential markdown wrapping
            content = content.strip('`')
            if content.startswith('json'):
                content = content[4:].strip()

            items = json.loads(content)
            if isinstance(items, list) and items:
                source = 'openai_extraction' if raw_text else 'openai_knowledge'
                normalized = _normalize_items(items, source)
                if normalized:
                    print(f"[MenuScraper:OpenAI] Extracted {len(normalized)} menu items")
                    return {
                        'restaurant': restaurant_name,
                        'items': normalized,
                        'source': source,
                        'item_count': len(normalized)
                    }

    except json.JSONDecodeError as e:
        print(f"[MenuScraper:OpenAI] JSON parse error: {e}")
    except Exception as e:
        print(f"[MenuScraper:OpenAI] Error: {e}")

    return None

# ===========================================================================
# Main Agent Entry Point
# ===========================================================================
def scrape_restaurant_menu(restaurant_name, city):
    """
    Main entry point: Scrape menu items and prices for a restaurant.

    Cascading strategy:
      1. SerpAPI Google Maps (structured data)
      2. SerpAPI Google Search (knowledge panel + organic results)
      3. Playwright headless browser (direct scraping)
      4. OpenAI GPT knowledge (last resort)

    Returns:
      dict with keys: restaurant, items[], source, item_count
      Each item: { name, price, description, category, source }
    """
    if not restaurant_name or restaurant_name == 'Target Restaurant':
        return {
            'restaurant': restaurant_name or 'Unknown',
            'items': [],
            'source': 'none',
            'item_count': 0,
            'error': 'No restaurant specified'
        }

    # Check cache first
    cached = _get_cached(restaurant_name, city)
    if cached:
        return cached

    print(f"\n[MenuScraper] === Starting menu scrape for: {restaurant_name} ({city}) ===")

    # Strategy 1: SerpAPI Google Maps
    result = _scrape_serpapi_maps(restaurant_name, city)
    if result and result.get('items'):
        # If we got items but no prices, try OpenAI to enrich
        has_prices = any(item.get('price') is not None for item in result['items'])
        if not has_prices and OPENAI_API_KEY:
            print("[MenuScraper] Items found but no prices - enriching with OpenAI")
            enriched = _extract_with_openai(restaurant_name, city)
            if enriched and enriched.get('items'):
                # Merge: keep original names, add prices from OpenAI
                openai_prices = {i['name'].lower(): i['price'] for i in enriched['items'] if i.get('price')}
                for item in result['items']:
                    if item['price'] is None:
                        item['price'] = openai_prices.get(item['name'].lower())
                result['source'] = 'serpapi_maps+openai_enriched'
        _set_cached(restaurant_name, city, result)
        return result

    # Strategy 2: SerpAPI Google Search
    result = _scrape_serpapi_search(restaurant_name, city)
    if result and result.get('items'):
        _set_cached(restaurant_name, city, result)
        return result

    # Strategy 3: Playwright headless scraping
    result = _scrape_playwright(restaurant_name, city)
    if result and result.get('items'):
        _set_cached(restaurant_name, city, result)
        return result

    # Strategy 4: OpenAI Knowledge (last resort)
    result = _extract_with_openai(restaurant_name, city)
    if result and result.get('items'):
        _set_cached(restaurant_name, city, result)
        return result

    # All strategies exhausted
    fallback = {
        'restaurant': restaurant_name,
        'items': [],
        'source': 'none',
        'item_count': 0,
        'error': 'Could not retrieve menu data from any source'
    }
    _set_cached(restaurant_name, city, fallback)
    return fallback


# ===========================================================================
# CLI Test
# ===========================================================================
if __name__ == '__main__':
    import sys
    r_name = sys.argv[1] if len(sys.argv) > 1 else "Gene & Jude's"
    city = sys.argv[2] if len(sys.argv) > 2 else "River Grove, IL"

    print(f"Testing Menu Scraper for: {r_name} in {city}")
    print("=" * 60)
    result = scrape_restaurant_menu(r_name, city)
    print(f"\nSource: {result.get('source')}")
    print(f"Items Found: {result.get('item_count', 0)}")
    print("-" * 60)
    for item in result.get('items', []):
        price_str = f"${item['price']:.2f}" if item.get('price') else "N/A"
        print(f"  {item['name']:40s} {price_str:>10s}  [{item['category']}]")
