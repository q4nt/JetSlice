"""
Google Flights Web Scraper
==========================
Headless Chromium scraper that extracts real-time flight data from
Google Flights as a supplementary data source alongside SerpAPI.

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


def _build_google_flights_url(origin, dest, date_str):
    """
    Build a Google Flights search URL using the text-based query format.
    Google interprets natural language flight queries reliably.
    """
    # Google Flights text search URL - reliable and doesn't require protobuf encoding
    query = f"flights from {origin} to {dest} on {date_str} one way"
    encoded = query.replace(" ", "+")
    return f"https://www.google.com/travel/flights?q={encoded}&curr=USD&hl=en&gl=us"


def _parse_time_str(time_str, date_str):
    """
    Parse Google Flights time format like '6:47 PM' or '10:39 PM+1'
    into an ISO datetime string. The '+1' suffix means next day.
    """
    next_day = False
    clean = time_str.strip()

    # Handle +1 (next day) indicator
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
        # Fallback: try 24hr format
        try:
            t = datetime.strptime(clean, '%H:%M')
            base_date = datetime.strptime(date_str, '%Y-%m-%d')
            result = base_date.replace(hour=t.hour, minute=t.minute, second=0)
            if next_day:
                result += timedelta(days=1)
            return result.strftime('%Y-%m-%dT%H:%M:%S')
        except Exception:
            return None


def _parse_price_str(price_str):
    """Parse '$123' or '$1,234' into a float."""
    try:
        return float(price_str.replace('$', '').replace(',', '').strip())
    except Exception:
        return None


def _parse_duration_str(dur_str):
    """Parse '2 hr 15 min' or '3 hr' into total minutes."""
    try:
        hours = 0
        minutes = 0
        h_match = re.search(r'(\d+)\s*hr', dur_str)
        m_match = re.search(r'(\d+)\s*min', dur_str)
        if h_match:
            hours = int(h_match.group(1))
        if m_match:
            minutes = int(m_match.group(1))
        return hours * 60 + minutes
    except Exception:
        return 120  # Default 2 hours


def _resolve_carrier_code(airline_name):
    """Resolve a display airline name to its IATA code."""
    for key, code in AIRLINE_CODE_MAP.items():
        if key.lower() in airline_name.lower():
            return code
    # Fallback: take first 2 chars uppercase
    return airline_name[:2].upper()


def _resolve_airline_color(airline_name):
    """Get brand color for an airline."""
    for key, color in AIRLINE_COLORS.items():
        if key.lower() in airline_name.lower():
            return color
    return "#4ade80"


def scrape_google_flights(origin_iata, dest_iata, date_str=None):
    """
    Scrape Google Flights for real-time flight data.
    Runs Playwright synchronously (safe to call from Flask).

    Args:
        origin_iata: Origin airport IATA code (e.g., 'ORD')
        dest_iata:   Destination airport IATA code (e.g., 'ATL')
        date_str:    Date string 'YYYY-MM-DD' (defaults to today)

    Returns:
        List of flight dicts in the standard GDS format, or empty list on failure.
    """
    if not _check_playwright():
        return []

    if not date_str:
        date_str = datetime.now().strftime('%Y-%m-%d')

    from playwright.sync_api import sync_playwright

    url = _build_google_flights_url(origin_iata, dest_iata, date_str)
    flights = []

    print(f"[Scraper] Launching headless browser for Google Flights: {origin_iata} -> {dest_iata} on {date_str}")
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
            page = context.new_page()

            # Navigate to Google Flights search
            page.goto(url, wait_until='domcontentloaded', timeout=30000)

            # Wait for flight results to render (Google Flights loads async)
            # The main flight list container uses role="list" with flight items
            try:
                page.wait_for_selector('li.pIav2d, div[data-ved] ul[role="list"] li, div.yR1fYc', timeout=15000)
            except Exception:
                # Try alternate: wait for any price element as a signal results loaded
                try:
                    page.wait_for_selector('span[data-gs] span, span.YMlIz', timeout=10000)
                except Exception:
                    print("[Scraper] Timed out waiting for flight results to render")

            # Extra settle time for dynamic content
            page.wait_for_timeout(3000)

            # --- Strategy 1: Parse structured flight list items ---
            # Google Flights renders each flight as a list item with nested spans
            # containing airline, times, duration, stops, and price
            flight_items = page.query_selector_all('li.pIav2d')
            if not flight_items:
                # Alternate selector for different Google Flights layouts
                flight_items = page.query_selector_all('div.yR1fYc')
            if not flight_items:
                flight_items = page.query_selector_all('ul[role="list"] > li')

            print(f"[Scraper] Found {len(flight_items)} flight card elements")

            for item in flight_items[:12]:  # Cap at 12 results
                try:
                    text = item.inner_text()
                    lines = [l.strip() for l in text.split('\n') if l.strip()]

                    if len(lines) < 3:
                        continue

                    # --- Extract data from the text block ---
                    airline_name = None
                    dep_time_str = None
                    arr_time_str = None
                    price = None
                    duration_str = None
                    stops = 0
                    flight_number = None

                    for line in lines:
                        # Price detection: starts with $
                        if line.startswith('$') and not price:
                            price = _parse_price_str(line)
                            continue

                        # Time pattern: "6:47 PM - 10:39 PM" or similar
                        time_match = re.search(
                            r'(\d{1,2}:\d{2}\s*(?:AM|PM)(?:\+\d)?)\s*[-\u2013]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)(?:\+\d)?)',
                            line, re.IGNORECASE
                        )
                        if time_match and not dep_time_str:
                            dep_time_str = time_match.group(1)
                            arr_time_str = time_match.group(2)
                            continue

                        # Duration: "2 hr 15 min" or "3 hr"
                        dur_match = re.search(r'\d+\s*hr(?:\s*\d+\s*min)?', line, re.IGNORECASE)
                        if dur_match and not duration_str:
                            duration_str = dur_match.group(0)
                            continue

                        # Stops: "Nonstop" or "1 stop" or "2 stops"
                        if 'nonstop' in line.lower():
                            stops = 0
                            continue
                        stop_match = re.search(r'(\d+)\s*stop', line, re.IGNORECASE)
                        if stop_match:
                            stops = int(stop_match.group(1))
                            continue

                        # Airline name: look for known carriers or multi-word names
                        for known in AIRLINE_CODE_MAP:
                            if known.lower() in line.lower() and not airline_name:
                                airline_name = known
                                break

                        # Flight number pattern: "AA 1234" or "UA1583"
                        fn_match = re.search(r'\b([A-Z]{2})\s*(\d{1,4})\b', line)
                        if fn_match and not flight_number:
                            flight_number = fn_match.group(1) + fn_match.group(2)

                    # Skip if we couldn't extract minimum viable data
                    if not dep_time_str or price is None:
                        continue

                    # Build the flight record
                    if not airline_name:
                        airline_name = "Unknown Airline"

                    carrier_code = _resolve_carrier_code(airline_name)

                    if not flight_number:
                        flight_number = f"{carrier_code}{100 + len(flights)}"

                    dep_iso = _parse_time_str(dep_time_str, date_str)
                    arr_iso = _parse_time_str(arr_time_str, date_str) if arr_time_str else None

                    if not dep_iso:
                        continue

                    dur_minutes = _parse_duration_str(duration_str) if duration_str else 120

                    flight_record = {
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
                        "dept": dep_time_str.strip(),
                        "duration": f"PT{dur_minutes // 60}H{dur_minutes % 60}M",
                        "stops": stops,
                        "price": round(price, 2),
                        "price_economy": round(price, 2),  # Google shows economy by default
                        "currency": "USD",
                        "cabin": "ECONOMY",
                        "distance_miles": 0,  # Not available from scrape
                        "source": "google_flights_scraper",
                        "bookable": False,
                    }
                    flights.append(flight_record)
                    print(f"[Scraper]   -> {flight_record['airline']} {flight_record['flight_number']} "
                          f"dep {dep_time_str} @ ${price}")

                except Exception as e:
                    # Skip individual flight parse errors
                    continue

            # --- Strategy 2: Fallback full-page text extraction ---
            if not flights:
                print("[Scraper] Strategy 1 failed, attempting full-page text extraction...")
                full_text = page.inner_text('body')
                # Find all time-pair + price patterns in the page text
                # Pattern: time range on one line, airline nearby, price nearby
                time_pairs = re.findall(
                    r'(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-\u2013]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)(?:\+\d)?)',
                    full_text, re.IGNORECASE
                )
                prices = re.findall(r'\$(\d[\d,]*)', full_text)

                if time_pairs and prices:
                    print(f"[Scraper] Fallback found {len(time_pairs)} time pairs and {len(prices)} prices")
                    for i, (dep, arr) in enumerate(time_pairs[:min(len(prices), 8)]):
                        try:
                            p_val = float(prices[i].replace(',', ''))
                            dep_iso = _parse_time_str(dep, date_str)
                            arr_iso = _parse_time_str(arr, date_str)
                            if dep_iso and p_val > 20:  # Filter out non-flight prices
                                flights.append({
                                    "airline": "Scraped Flight",
                                    "carrier_code": "XX",
                                    "code": "XX",
                                    "color": "#4ade80",
                                    "flight_number": f"GF{100 + i}",
                                    "flightNum": f"GF{100 + i}",
                                    "origin": origin_iata,
                                    "destination": dest_iata,
                                    "departure_time": dep_iso,
                                    "arrival_time": arr_iso or dep_iso,
                                    "dept": dep.strip(),
                                    "duration": "PT2H0M",
                                    "stops": 0,
                                    "price": p_val,
                                    "price_economy": p_val,
                                    "currency": "USD",
                                    "cabin": "ECONOMY",
                                    "source": "google_flights_scraper_fallback",
                                    "bookable": False,
                                })
                        except Exception:
                            continue

            browser.close()

    except Exception as e:
        print(f"[Scraper] Fatal error: {e}")
        traceback.print_exc()

    # Sort by departure time
    flights.sort(key=lambda f: f.get('departure_time', ''))
    print(f"[Scraper] Total flights scraped: {len(flights)}")
    return flights


# ---------------------------------------------------------------------------
# CLI test mode
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    import sys
    origin = sys.argv[1] if len(sys.argv) > 1 else 'ORD'
    dest = sys.argv[2] if len(sys.argv) > 2 else 'ATL'
    date = sys.argv[3] if len(sys.argv) > 3 else datetime.now().strftime('%Y-%m-%d')

    print(f"\n{'='*60}")
    print(f"  Google Flights Scraper Test")
    print(f"  Route: {origin} -> {dest} on {date}")
    print(f"{'='*60}\n")

    results = scrape_google_flights(origin, dest, date)

    if results:
        print(f"\n--- {len(results)} Flights Found ---")
        for i, f in enumerate(results, 1):
            print(f"  {i}. {f['airline']} {f['flight_number']} | "
                  f"Dep: {f.get('dept', f['departure_time'])} | "
                  f"${f['price_economy']} | "
                  f"{'Nonstop' if f['stops'] == 0 else str(f['stops']) + ' stop(s)'} | "
                  f"Source: {f['source']}")
    else:
        print("  No flights found. Google may have blocked the scrape or the page layout changed.")
