"""
Kayak / DuckDuckGo Flights Web Scraper
======================================
Headless Chromium scraper that extracts real-time flight data from
Kayak as a supplementary data source.

Install:
    pip install playwright
    playwright install chromium

Usage:
    from flight_scraper import scrape_google_flights
    flights = scrape_google_flights('ORD', 'ATL', '2026-04-18')
"""

import asyncio
import re
import traceback
from datetime import datetime, timedelta

# Lazy-load playwright to avoid import errors when not installed
_playwright_available = None

def _check_playwright():
    global _playwright_available
    if _playwright_available is None:
        try:
            from playwright.sync_api import sync_playwright
            _playwright_available = True
        except ImportError:
            _playwright_available = False
            print("[Scraper] playwright not installed - run: pip install playwright && playwright install chromium")
    return _playwright_available


# Airline brand colors for display
AIRLINE_COLORS = {
    "United":    "#005DAA", "American":  "#B61F23", "Delta":     "#003A70",
    "Spirit":    "#FFD200", "Frontier":  "#004225", "Alaska":    "#01426A",
    "Southwest": "#E24726", "JetBlue":   "#0033A0", "Sun Country": "#003E7E",
    "Hawaiian":  "#331661", "Allegiant": "#F7941E", "Breeze":    "#6DB3F2",
}

# Map display airline names to IATA carrier codes
AIRLINE_CODE_MAP = {
    "United":    "UA", "American":  "AA", "Delta":     "DL",
    "Spirit":    "NK", "Frontier":  "F9", "Alaska":    "AS",
    "Southwest": "WN", "JetBlue":   "B6", "Sun Country": "SY",
    "Hawaiian":  "HA", "Allegiant": "G4", "Breeze":    "MX",
}

def _parse_time_str(time_str, date_str):
    next_day = False
    clean = time_str.strip()
    if '+1' in clean:
        next_day = True
        clean = clean.replace('+1', '').strip()
    try:
        t = datetime.strptime(clean, '%I:%M %p')
        base_date = datetime.strptime(date_str, '%Y-%m-%d')
        result = base_date.replace(hour=t.hour, minute=t.minute, second=0)
        if next_day:
            result += timedelta(days=1)
        return result.strftime('%Y-%m-%dT%H:%M:%S')
    except Exception:
        return None

def _resolve_carrier_code(airline_name):
    for key, code in AIRLINE_CODE_MAP.items():
        if key.lower() in airline_name.lower():
            return code
    return airline_name[:2].upper()

def _resolve_airline_color(airline_name):
    for key, color in AIRLINE_COLORS.items():
        if key.lower() in airline_name.lower():
            return color
    return "#4ade80"


def scrape_google_flights(origin_iata, dest_iata, date_str=None):
    """
    Scrape Kayak Flights (DuckDuckGo provider) for real-time flight data.
    Runs Playwright synchronously (safe to call from Flask).
    """
    if not _check_playwright():
        return []

    if not date_str:
        date_str = datetime.now().strftime('%Y-%m-%d')

    from playwright.sync_api import sync_playwright

    url = f"https://www.kayak.com/flights/{origin_iata}-{dest_iata}/{date_str}?sort=price_a"
    flights = []

    print(f"[Scraper] Launching headless browser for flights: {origin_iata} -> {dest_iata} on {date_str}")
    print(f"[Scraper] URL: {url}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                ]
            )
            context = browser.new_context(
                viewport={'width': 1280, 'height': 900},
                user_agent=(
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) '
                    'Chrome/131.0.0.0 Safari/537.36'
                ),
                locale='en-US',
            )
            context.add_init_script('''
                Object.defineProperty(navigator, "webdriver", {get: () => undefined});
                window.navigator.chrome = { runtime: {} };
                Object.defineProperty(navigator, "plugins", {get: () => [1, 2, 3]});
                Object.defineProperty(navigator, "languages", {get: () => ["en-US", "en"]});
            ''')
            page = context.new_page()
            page.goto(url, wait_until='domcontentloaded', timeout=30000)

            try:
                page.wait_for_selector('.nrc6', timeout=15000)
            except Exception:
                print("[Scraper] Timed out waiting for flight results to render")

            page.wait_for_timeout(3000)
            flight_items = page.query_selector_all('.nrc6')
            
            print(f"[Scraper] Found {len(flight_items)} flight card elements")

            for item in flight_items[:12]:
                try:
                    text = item.inner_text()
                    lines = [l.strip() for l in text.split('\\n') if l.strip()]

                    airline_name = "Unknown Airline"
                    dep_time_str = None
                    arr_time_str = None
                    price = None
                    stops = 0
                    flight_number = None

                    # Extract Price
                    price_match = re.search(r'\$(\d[0-9,]*)', text)
                    if price_match:
                        price = float(price_match.group(1).replace(',', ''))

                    # Extract Times
                    time_match = re.search(r'(\d{1,2}:\d{2}\s*(?:am|pm))[^a-z]+(\d{1,2}:\d{2}\s*(?:am|pm)(?:\+1)?)', text, re.IGNORECASE)
                    if not time_match:
                        # Fallback for some time layouts
                        time_match = re.search(r'(\d{1,2}:\d{2}\s*(?:am|pm)).*?(\d{1,2}:\d{2}\s*(?:am|pm)(?:\+1)?)', text, re.IGNORECASE | re.DOTALL)
                    
                    if time_match:
                        dep_time_str = time_match.group(1)
                        arr_time_str = time_match.group(2)

                    # Extract Stops
                    if 'nonstop' in text.lower():
                        stops = 0
                    else:
                        stop_match = re.search(r'(\\d+)\\s*stop', text, re.IGNORECASE)
                        if stop_match:
                            stops = int(stop_match.group(1))

                    # Extract Airline
                    for known in AIRLINE_CODE_MAP:
                        if known.lower() in text.lower():
                            airline_name = known
                            break

                    if not dep_time_str or price is None:
                        continue

                    carrier_code = _resolve_carrier_code(airline_name)
                    flight_number = f"{carrier_code}{100 + len(flights)}"

                    dep_iso = _parse_time_str(dep_time_str, date_str)
                    arr_iso = _parse_time_str(arr_time_str, date_str) if arr_time_str else None

                    if not dep_iso:
                        continue

                    flights.append({
                        "airline": airline_name if airline_name != "Unknown Airline" else f"{carrier_code} Airlines",
                        "carrier_code": carrier_code,
                        "code": carrier_code,
                        "color": _resolve_airline_color(airline_name),
                        "flight_number": flight_number,
                        "flightNum": flight_number,
                        "origin": origin_iata,
                        "destination": dest_iata,
                        "departure_time": dep_iso,
                        "arrival_time": arr_iso or dep_iso,
                        "dept": dep_time_str.strip().upper(),
                        "duration": "PT2H0M",
                        "stops": stops,
                        "price": round(price, 2),
                        "price_economy": round(price, 2),
                        "currency": "USD",
                        "cabin": "ECONOMY",
                        "source": "Scraper Agent (Kayak)",
                        "bookable": False,
                    })
                    print(f"[Scraper]   -> {airline_name} {flight_number} dep {dep_time_str} @ ${price}")

                except Exception as e:
                    continue

            browser.close()

    except Exception as e:
        print(f"[Scraper] Fatal error: {e}")

    flights.sort(key=lambda f: f.get('departure_time', ''))
    print(f"[Scraper] Total flights scraped: {len(flights)}")
    return flights


if __name__ == '__main__':
    import sys
    origin = sys.argv[1] if len(sys.argv) > 1 else 'ORD'
    dest = sys.argv[2] if len(sys.argv) > 2 else 'ATL'
    date = sys.argv[3] if len(sys.argv) > 3 else datetime.now().strftime('%Y-%m-%d')

    print(f"\\n{'='*60}")
    print(f"  Flights Scraper Agent Test")
    print(f"  Route: {origin} -> {dest} on {date}")
    print(f"{'='*60}\\n")

    results = scrape_google_flights(origin, dest, date)

    if results:
        print(f"\\n--- {len(results)} Flights Found ---")
        for i, f in enumerate(results, 1):
            print(f"  {i}. {f['airline']} {f['flight_number']} | "
                  f"Dep: {f.get('dept', f['departure_time'])} | "
                  f"${f['price_economy']} | "
                  f"{'Nonstop' if f['stops'] == 0 else str(f['stops']) + ' stop(s)'} | "
                  f"Source: {f['source']}")
    else:
        print("  No flights found. Blocked or page layout changed.")
