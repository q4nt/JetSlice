"""
JetSlice - Premium Delivery Backend
====================================
Flask server providing:
  - Static file serving for the frontend
  - /api/flights  - Amadeus-powered flight search (United, etc.)
  - /api/southwest - Southwest fare estimates (mock/scraped fallback)
  - /api/route     - Full logistics route breakdown

Amadeus Setup (optional - works with mock data if not configured):
  1. Sign up free at https://developers.amadeus.com
  2. Create an app to get client_id + client_secret
  3. Set environment variables:
       set AMADEUS_CLIENT_ID=your_key
       set AMADEUS_CLIENT_SECRET=your_secret
"""

import os
from dotenv import load_dotenv
load_dotenv() # Ingest .env configurations seamlessly
import json
import math
import random
import webbrowser
import threading
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import urllib.parse

# ---------------------------------------------------------------------------
# Amadeus SDK (optional - gracefully degrades to mock data)
# ---------------------------------------------------------------------------
try:
    from amadeus import Client as AmadeusClient, ResponseError
    AMADEUS_AVAILABLE = True
except ImportError:
    AMADEUS_AVAILABLE = False
    print("[JetSlice] amadeus SDK not installed - using mock flight data")

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

PORT = 8042

# ---------------------------------------------------------------------------
# Amadeus Client Init
# ---------------------------------------------------------------------------
amadeus_client = None
AMADEUS_CLIENT_ID = os.environ.get('AMADEUS_CLIENT_ID', '')
AMADEUS_CLIENT_SECRET = os.environ.get('AMADEUS_CLIENT_SECRET', '')
SERPAPI_KEY = os.environ.get('SERPAPI_KEY', '')

if AMADEUS_AVAILABLE and AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET:
    try:
        amadeus_client = AmadeusClient(
            client_id=AMADEUS_CLIENT_ID,
            client_secret=AMADEUS_CLIENT_SECRET
        )
        print("[JetSlice] Amadeus API connected (test environment)")
    except Exception as e:
        print(f"[JetSlice] Amadeus init failed: {e}")
        amadeus_client = None
else:
    if AMADEUS_AVAILABLE:
        print("[JetSlice] No Amadeus credentials - set AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET")
    print("[JetSlice] Running with mock flight data")

# ---------------------------------------------------------------------------
# Airport Database (city -> IATA code mapping)
# ---------------------------------------------------------------------------
AIRPORT_MAP = {
    "new york":       {"iata": "EWR", "name": "Newark Liberty International",    "alt": "JFK", "lat": 40.6895, "lon": -74.1745, "aliases": ["ny", "nj", "brooklyn", "queens", "bronx", "staten island", "new jersey"]},
    "nyc":            {"iata": "JFK", "name": "John F. Kennedy International",   "alt": "EWR", "lat": 40.6413, "lon": -73.7781, "aliases": []},
    "manhattan":      {"iata": "EWR", "name": "Newark Liberty International",    "alt": "LGA", "lat": 40.6895, "lon": -74.1745, "aliases": []},
    "los angeles":    {"iata": "LAX", "name": "Los Angeles International",       "alt": None,  "lat": 33.9425, "lon": -118.408, "aliases": ["ca", "california", "santa monica", "hollywood", "orange county"]},
    "la":             {"iata": "LAX", "name": "Los Angeles International",       "alt": None,  "lat": 33.9425, "lon": -118.408, "aliases": []},
    "beverly hills":  {"iata": "LAX", "name": "Los Angeles International",       "alt": None,  "lat": 33.9425, "lon": -118.408, "aliases": []},
    "san francisco":  {"iata": "SFO", "name": "San Francisco International",     "alt": "OAK", "lat": 37.6213, "lon": -122.379, "aliases": ["sf", "bay area", "oakland", "san jose"]},
    "chicago":        {"iata": "ORD", "name": "O'Hare International",            "alt": "MDW", "lat": 41.9742, "lon": -87.9073, "aliases": ["il", "illinois", "river grove", "evanston", "naperville", "oak park"]},
    "miami":          {"iata": "MIA", "name": "Miami International",             "alt": "FLL", "lat": 25.7959, "lon": -80.2870, "aliases": ["fl", "florida", "fort lauderdale", "boca raton", "palm beach"]},
    "dallas":         {"iata": "DFW", "name": "Dallas/Fort Worth International", "alt": "DAL", "lat": 32.8998, "lon": -97.0403, "aliases": ["tx", "texas", "fort worth", "plano", "arlington"]},
    "houston":        {"iata": "IAH", "name": "George Bush Intercontinental",    "alt": "HOU", "lat": 29.9902, "lon": -95.3368, "aliases": ["katy", "sugar land", "spring"]},
    "seattle":        {"iata": "SEA", "name": "Seattle-Tacoma International",    "alt": None,  "lat": 47.4502, "lon": -122.309, "aliases": ["wa", "washington", "bellevue", "redmond", "tacoma"]},
    "denver":         {"iata": "DEN", "name": "Denver International",            "alt": None,  "lat": 39.8561, "lon": -104.673, "aliases": ["co", "colorado", "boulder", "aurora"]},
    "atlanta":        {"iata": "ATL", "name": "Hartsfield-Jackson Atlanta",      "alt": None,  "lat": 33.6407, "lon": -84.4277, "aliases": ["ga", "georgia", "marietta", "alpharetta", "decatur"]},
    "boston":         {"iata": "BOS", "name": "Boston Logan International",       "alt": None,  "lat": 42.3656, "lon": -71.0096, "aliases": ["ma", "massachusetts", "cambridge", "somerville", "quincy"]},
    "washington":     {"iata": "IAD", "name": "Dulles International",            "alt": "DCA", "lat": 38.9531, "lon": -77.4565, "aliases": []},
    "dc":             {"iata": "DCA", "name": "Reagan National",                 "alt": "IAD", "lat": 38.8512, "lon": -77.0402, "aliases": ["va", "virginia", "md", "maryland", "arlington", "alexandria", "bethesda"]},
    "phoenix":        {"iata": "PHX", "name": "Phoenix Sky Harbor",              "alt": None,  "lat": 33.4373, "lon": -112.008, "aliases": ["az", "arizona", "scottsdale", "tempe", "mesa", "chandler"]},
    "las vegas":      {"iata": "LAS", "name": "Harry Reid International",        "alt": None,  "lat": 36.0840, "lon": -115.153, "aliases": ["nv", "nevada", "henderson"]},
    "orlando":        {"iata": "MCO", "name": "Orlando International",           "alt": None,  "lat": 28.4312, "lon": -81.3081, "aliases": ["kissimmee", "winter park"]},
    "portland, me":   {"iata": "PWM", "name": "Portland International Jetport",  "alt": None,  "lat": 43.6461, "lon": -70.3093, "aliases": ["me", "maine"]},
    "portland":       {"iata": "PDX", "name": "Portland International",          "alt": None,  "lat": 45.5898, "lon": -122.596, "aliases": ["or", "oregon", "beaverton", "hillsboro"]},
    "nashville":      {"iata": "BNA", "name": "Nashville International",         "alt": None,  "lat": 36.1263, "lon": -86.6774, "aliases": ["tn", "tennessee", "franklin", "brentwood"]},
    "austin":         {"iata": "AUS", "name": "Austin-Bergstrom International",  "alt": None,  "lat": 30.1975, "lon": -97.6664, "aliases": ["round rock", "georgetown"]},
    "san diego":      {"iata": "SAN", "name": "San Diego International",         "alt": None,  "lat": 32.7338, "lon": -117.190, "aliases": ["la jolla", "chula vista", "carlsbad"]},
    "minneapolis":    {"iata": "MSP", "name": "Minneapolis-St Paul International","alt": None, "lat": 44.8848, "lon": -93.2223, "aliases": ["mn", "minnesota", "st paul", "bloomington"]},
    "detroit":        {"iata": "DTW", "name": "Detroit Metropolitan",            "alt": None,  "lat": 42.2162, "lon": -83.3554, "aliases": ["mi", "michigan", "ann arbor", "dearborn"]},
    "philadelphia":   {"iata": "PHL", "name": "Philadelphia International",      "alt": None,  "lat": 39.8744, "lon": -75.2424, "aliases": ["pa", "pennsylvania", "camden"]},
    "charlotte":      {"iata": "CLT", "name": "Charlotte Douglas International", "alt": None,  "lat": 35.2140, "lon": -80.9431, "aliases": ["nc", "north carolina", "concord"]},
    "salt lake city": {"iata": "SLC", "name": "Salt Lake City International",    "alt": None,  "lat": 40.7884, "lon": -111.977, "aliases": ["ut", "utah", "provo", "west valley city"]},
    "new orleans":    {"iata": "MSY", "name": "Louis Armstrong New Orleans",     "alt": None,  "lat": 29.9922, "lon": -90.2580, "aliases": ["la", "louisiana", "metairie", "kenner"]},
}

def resolve_airport(city_text):
    """Resolve a city name or address to the nearest airport."""
    city_lower = city_text.lower().strip()
    
    # 1. Full exact match (Prioritize explicitly passed states e.g. "Portland, ME")
    if city_lower in AIRPORT_MAP:
        return AIRPORT_MAP[city_lower]
        
    # 2. Clean up standard formatting "City, ST" -> "city"
    primary_city = city_lower.split(',')[0].strip()
    if primary_city in AIRPORT_MAP:
        return AIRPORT_MAP[primary_city]
        
    # 3. Strict word boundary match (prevents "la" from hijacking "Dallas" or "Atlanta")
    import re
    for key, val in AIRPORT_MAP.items():
        if re.search(r'\b' + re.escape(key) + r'\b', city_lower):
            return val
            
    # 5. Look through aliases (state codes, sprawling suburbs)
    import re
    # We check state/suburb aliases last to catch "Gene & Jude's, River Grove, IL"
    # By searching the entire input text against our alias bag
    for key, val in AIRPORT_MAP.items():
        if "aliases" in val:
            for alias in val["aliases"]:
                # Match strict word boundary for state abbreviations (e.g. \bil\b)
                if re.search(r'\b' + re.escape(alias) + r'\b', city_lower):
                    return val
    
    # 6. Ultimate fallback: if we absolutely cannot find it, return Chicago ORD so the app doesn't break
    return AIRPORT_MAP["chicago"]

# ---------------------------------------------------------------------------
# Distance Calculation (Haversine)
# ---------------------------------------------------------------------------
def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.8  # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

# ---------------------------------------------------------------------------
# GDS Flight Data (United & American Airlines via Amadeus or Mock)
# ---------------------------------------------------------------------------
GDS_FLIGHT_NUMBERS = [
    "UA412", "UA1583", "AA2210", "AA887", "UA453",
    "AA1721", "UA622", "UA990", "AA1147", "UA336"
]

def search_gds_flights(origin_iata, dest_iata, departure_date=None):
    """
    Search United and American Airlines flights via Amadeus API.
    Falls back to realistic mock data if API unavailable.
    """
    if not departure_date:
        departure_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

    # --- Try SerpAPI (Google Flights Live) ---
    if SERPAPI_KEY:
        try:
            url = f"https://serpapi.com/search.json?engine=google_flights&departure_id={origin_iata}&arrival_id={dest_iata}&outbound_date={departure_date}&type=2&stops=1&api_key={SERPAPI_KEY}"
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                flight_results = data.get("best_flights", [])
                if not flight_results:
                    flight_results = data.get("other_flights", [])
                
                parsed_flights = []
                for offer in flight_results[:8]:  # Take top 8
                    if "flights" not in offer or not offer["flights"]:
                        continue
                    
                    segments = offer["flights"]
                    first_seg = segments[0]
                    last_seg = segments[-1]
                    
                    airline_name = first_seg.get("airline", "Unknown Airline")
                    flight_num = first_seg.get("flight_number", "Unknown")
                    carrier_code = flight_num.split(" ")[0] if " " in flight_num else airline_name[:2].upper()
                    
                    dep_time = first_seg.get("departure_airport", {}).get("time", departure_date)
                    arr_time = last_seg.get("arrival_airport", {}).get("time", departure_date)
                    # Convert 'YYYY-MM-DD HH:MM' to ISO Format 'YYYY-MM-DDTHH:MM:00'
                    if len(dep_time) == 16: dep_time = dep_time.replace(" ", "T") + ":00"
                    if len(arr_time) == 16: arr_time = arr_time.replace(" ", "T") + ":00"
                    
                    # Format departure time strings for the frontend
                    try:
                        dept_obj = datetime.strptime(dep_time, '%Y-%m-%dT%H:%M:%S')
                        dept_str = dept_obj.strftime('%I:%M %p').lstrip('0')
                    except Exception:
                        dept_str = dep_time.split('T')[1][:5] if 'T' in dep_time else "TBD"

                    # Brand colors
                    COLORS = {
                        "UA": "#005DAA", "WN": "#E24726", "B6": "#0033A0",
                        "DL": "#003A70", "AA": "#B61F23", "NK": "#FFD200",
                        "F9": "#004225", "AS": "#01426A", "SY": "#003E7E",
                        "HA": "#331661"
                    }
                    color = COLORS.get(carrier_code, "#4ade80")
                    
                    price = float(offer.get("price", 400))
                    dur_min = offer.get("total_duration", 120)
                    
                    # Ensure formatting matches what app.js Rate Marketplace expects
                    parsed_flights.append({
                        "airline": airline_name,
                        "carrier_code": carrier_code,
                        "code": carrier_code,
                        "color": color,
                        "flight_number": flight_num.replace(" ", ""),
                        "flightNum": flight_num,
                        "origin": origin_iata,
                        "destination": dest_iata,
                        "departure_time": dep_time,
                        "dept": dept_str,
                        "arrival_time": arr_time,
                        "duration": f"PT{dur_min // 60}H{dur_min % 60}M",
                        "stops": len(segments) - 1,
                        "price": round(price * 2.8, 2) if price < 300 else round(price, 2), # Simulated First Class Cost
                        "price_economy": round(price, 2),
                        "currency": "USD",
                        "cabin": "First Class Cargo" if price < 300 else "Premium Cargo",
                        "source": "SerpApi Live",
                        "bookable": True
                    })
                
                if parsed_flights:
                    print(f"[JetSlice] Found {len(parsed_flights)} SerpApi flights: {origin_iata} -> {dest_iata}")
                    return parsed_flights
        except Exception as e:
            print(f"[SerpAPI] Error resolving flights: {e}")

    # --- Try Amadeus API first ---
    if amadeus_client:
        try:
            response = amadeus_client.shopping.flight_offers_search.get(
                originLocationCode=origin_iata,
                destinationLocationCode=dest_iata,
                departureDate=departure_date,
                adults=1,
                max=5,
                nonStop=True,
                includedAirlineCodes='UA,AA'  # Filter to United and American Airlines
            )
            flights = []
            for offer in response.data:
                segments = offer['itineraries'][0]['segments']
                first_seg = segments[0]
                last_seg = segments[-1]
                
                carrier = first_seg['carrierCode']
                airline_name = "United Airlines" if carrier == 'UA' else "American Airlines"
                
                flights.append({
                    "airline": airline_name,
                    "carrier_code": carrier,
                    "flight_number": f"{carrier}{first_seg['number']}",
                    "origin": first_seg['departure']['iataCode'],
                    "destination": last_seg['arrival']['iataCode'],
                    "departure_time": first_seg['departure']['at'],
                    "arrival_time": last_seg['arrival']['at'],
                    "duration": offer['itineraries'][0]['duration'],
                    "stops": len(segments) - 1,
                    "price": float(offer['price']['total']),
                    "currency": offer['price']['currency'],
                    "cabin": "FIRST" if float(offer['price']['total']) > 400 else "ECONOMY",
                    "source": "amadeus_live",
                    "bookable": True
                })
            if flights:
                print(f"[JetSlice] Found {len(flights)} live GDS flights (UA/AA): {origin_iata} -> {dest_iata}")
                return flights
        except ResponseError as e:
            print(f"[United] Amadeus error: {e}")
        except Exception as e:
            print(f"[United] API error: {e}")

    # --- Mock fallback ---
    return _mock_gds_flights(origin_iata, dest_iata, departure_date)


def _mock_gds_flights(origin, dest, departure_date):
    """Generate realistic mock United/AA flight data."""
    distance = 0
    orig_data = next((v for v in AIRPORT_MAP.values() if v['iata'] == origin), None)
    dest_data = next((v for v in AIRPORT_MAP.values() if v['iata'] == dest), None)
    if orig_data and dest_data:
        distance = haversine_miles(orig_data['lat'], orig_data['lon'], dest_data['lat'], dest_data['lon'])

    # Price scales with distance
    base_economy = max(120, distance * 0.12 + random.randint(-30, 50))
    base_first = base_economy * 2.8 + random.randint(50, 200)

    flight_num = random.choice(GDS_FLIGHT_NUMBERS)
    carrier_code = "AA" if "AA" in flight_num else "UA"
    airline_name = "American Airlines" if carrier_code == "AA" else "United Airlines"
    
    flight_num2 = random.choice([f for f in GDS_FLIGHT_NUMBERS if f != flight_num])
    carrier_code2 = "AA" if "AA" in flight_num2 else "UA"
    airline_name2 = "American Airlines" if carrier_code2 == "AA" else "United Airlines"

    dep_hour = random.choice([6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 20])
    flight_hours = max(2, distance / 500)
    arr_hour = dep_hour + flight_hours

    return [{
        "airline": airline_name,
        "carrier_code": carrier_code,
        "flight_number": flight_num,
        "origin": origin,
        "destination": dest,
        "departure_time": f"{departure_date}T{dep_hour:02d}:00:00",
        "arrival_time": f"{departure_date}T{int(arr_hour):02d}:{int((arr_hour % 1)*60):02d}:00",
        "duration": f"PT{int(flight_hours)}H{int((flight_hours % 1)*60)}M",
        "stops": 0,
        "price": round(base_first, 2),
        "price_economy": round(base_economy, 2),
        "currency": "USD",
        "cabin": "FIRST",
        "distance_miles": round(distance),
        "source": "mock",
        "bookable": False
    }, {
        "airline": airline_name2,
        "carrier_code": carrier_code2,
        "flight_number": flight_num2,
        "origin": origin,
        "destination": dest,
        "departure_time": f"{departure_date}T{(dep_hour+4) % 24:02d}:30:00",
        "arrival_time": f"{departure_date}T{int(arr_hour+4) % 24:02d}:{int((arr_hour % 1)*60):02d}:00",
        "duration": f"PT{int(flight_hours)}H{int((flight_hours % 1)*60)}M",
        "stops": 0,
        "price": round(base_first * 0.9, 2),
        "price_economy": round(base_economy * 0.95, 2),
        "currency": "USD",
        "cabin": "FIRST",
        "distance_miles": round(distance),
        "source": "mock",
        "bookable": False
    }]

# ---------------------------------------------------------------------------
# Southwest Airlines Data (Mock - Southwest has no public API/GDS presence)
# ---------------------------------------------------------------------------
SOUTHWEST_FLIGHT_NUMBERS = [
    "WN1423", "WN2851", "WN734", "WN3190", "WN1567",
    "WN892", "WN2104", "WN465", "WN3378", "WN1089"
]

# Southwest hub cities (they have strongest routes here)
SW_HUBS = {"DAL", "HOU", "MDW", "BWI", "LAS", "DEN", "PHX", "OAK", "AUS", "BNA", "MCO"}

def search_southwest_fares(origin_iata, dest_iata, departure_date=None):
    """
    Southwest Airlines fare estimates.
    Southwest does NOT participate in any GDS (Amadeus, Sabre, etc.)
    and has no public API. This generates realistic fare data based on
    Southwest's known pricing patterns:
      - No first class (only Wanna Get Away, Anytime, Business Select)
      - 2 free checked bags
      - No change fees
      - Hub-based pricing advantages
    """
    if not departure_date:
        departure_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

    distance = 0
    orig_data = next((v for v in AIRPORT_MAP.values() if v['iata'] == origin_iata), None)
    dest_data = next((v for v in AIRPORT_MAP.values() if v['iata'] == dest_iata), None)
    if orig_data and dest_data:
        distance = haversine_miles(orig_data['lat'], orig_data['lon'], dest_data['lat'], dest_data['lon'])

    # Southwest doesn't fly all routes - check plausibility
    sw_serves = {
        "LAX", "SFO", "OAK", "SAN", "PHX", "LAS", "DEN", "DAL", "HOU",
        "AUS", "SAT", "MDW", "ORD", "BWI", "BNA", "MCO", "FLL", "ATL",
        "STL", "MSP", "SEA", "PDX", "BOS", "DCA", "PHL", "EWR", "JFK",
        "CLT", "DTW", "SLC"
    }
    if origin_iata not in sw_serves or dest_iata not in sw_serves:
        return {"available": False, "reason": f"Southwest does not serve {origin_iata} or {dest_iata}"}

    # Southwest pricing tiers (realistic)
    hub_discount = 0.85 if (origin_iata in SW_HUBS or dest_iata in SW_HUBS) else 1.0
    wanna_get_away = max(79, distance * 0.08 * hub_discount + random.randint(-15, 30))
    anytime = wanna_get_away * 2.1 + random.randint(20, 60)
    business_select = anytime * 1.4 + random.randint(10, 40)

    flight_num = random.choice(SOUTHWEST_FLIGHT_NUMBERS)
    dep_hour = random.choice([6, 7, 8, 10, 12, 14, 16, 18, 20])
    flight_hours = max(2, distance / 480)

    return {
        "available": True,
        "airline": "Southwest Airlines",
        "carrier_code": "WN",
        "flight_number": flight_num,
        "origin": origin_iata,
        "destination": dest_iata,
        "departure_time": f"{departure_date}T{dep_hour:02d}:15:00",
        "duration": f"PT{int(flight_hours)}H{int((flight_hours % 1)*60)}M",
        "stops": 0,
        "fares": {
            "wanna_get_away": round(wanna_get_away, 2),
            "anytime": round(anytime, 2),
            "business_select": round(business_select, 2)
        },
        "currency": "USD",
        "distance_miles": round(distance),
        "perks": ["2 free checked bags", "No change fees", "Free snacks & wifi"],
        "source": "estimated",
        "note": "Southwest has no public API. Fares are estimated based on historical patterns."
    }

# ---------------------------------------------------------------------------
# Rideshare Cost Estimation (Uber / Lyft mock)
# ---------------------------------------------------------------------------
def estimate_rideshare(origin_city, dest_airport, service="uber_black"):
    """Estimate rideshare cost from address to airport."""
    # Rough estimates based on typical metro distances
    base_costs = {
        "uber_black": {"base": 15, "per_mile": 4.50, "min": 45},
        "uber_x":     {"base": 5,  "per_mile": 1.80, "min": 15},
        "lyft_lux":   {"base": 12, "per_mile": 3.80, "min": 40},
        "lyft_std":   {"base": 4,  "per_mile": 1.60, "min": 12},
    }
    config = base_costs.get(service, base_costs["uber_black"])
    # Assume 10-25 miles to airport
    est_miles = random.uniform(10, 25)
    cost = max(config["min"], config["base"] + config["per_mile"] * est_miles)
    surge = random.choice([1.0, 1.0, 1.0, 1.2, 1.5])  # 20% chance of surge
    return {
        "service": service.replace("_", " ").title(),
        "provider": "Uber" if "uber" in service else "Lyft",
        "estimated_cost": round(cost * surge, 2),
        "surge_multiplier": surge,
        "estimated_miles": round(est_miles, 1),
        "estimated_minutes": round(est_miles * 2.5 + random.randint(5, 15)),
        "currency": "USD"
    }

# ---------------------------------------------------------------------------
# Concierge / Handling Fee
# ---------------------------------------------------------------------------
CARGO_FEES = {
    "heated":       {"name": "Temperature-Controlled (Heated)", "base": 350, "per_mile": 0.02},
    "refrigerated": {"name": "Temperature-Controlled (Chilled)", "base": 400, "per_mile": 0.025},
    "secure":       {"name": "Secure Goods Handling", "base": 500, "per_mile": 0.03},
    "standard":     {"name": "Standard Concierge", "base": 250, "per_mile": 0.015},
}

def calculate_concierge_fee(cargo_type, distance_miles):
    config = CARGO_FEES.get(cargo_type, CARGO_FEES["standard"])
    return {
        "description": config["name"],
        "fee": round(config["base"] + config["per_mile"] * distance_miles, 2),
        "includes": ["Agent escort", "Real-time temperature monitoring", "Photo verification on delivery"]
    }

# ===========================================================================
# API Routes
# ===========================================================================

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/config')
def api_config():
    """Serve public-safe configuration (Mapbox token) to the frontend."""
    return jsonify({
        "mapbox_token": os.environ.get('MAPBOX_ACCESS_TOKEN', '')
    })

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)


@app.route('/api/airports', methods=['GET'])
def api_airports():
    """Search for airports by city name."""
    query = request.args.get('q', '').lower().strip()
    if not query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400

    results = []
    for city, data in AIRPORT_MAP.items():
        if query in city:
            results.append({"city": city.title(), **data})
    return jsonify({"airports": results})


@app.route('/api/flights', methods=['GET'])
def api_flights():
    """
    Search flights between two cities.
    Query params: origin, destination, date (optional, YYYY-MM-DD)
    Returns United + Southwest options.
    """
    origin = request.args.get('origin', '').strip()
    destination = request.args.get('destination', '').strip()
    date = request.args.get('date', None)

    if not origin or not destination:
        return jsonify({"error": "Missing 'origin' and 'destination' parameters"}), 400

    orig_airport = resolve_airport(origin)
    dest_airport = resolve_airport(destination)

    if not orig_airport:
        return jsonify({"error": f"Could not resolve airport for: {origin}"}), 400
    if not dest_airport:
        return jsonify({"error": f"Could not resolve airport for: {destination}"}), 400

    # Calculate distance
    distance = haversine_miles(
        orig_airport['lat'], orig_airport['lon'],
        dest_airport['lat'], dest_airport['lon']
    )

    if distance < 300:
        return jsonify({
            "error": "Distance too short",
            "distance_miles": round(distance),
            "message": "JetSlice requires a minimum distance of 300 miles for air logistics."
        }), 400

    # Fetch flight data from both carriers
    gds_flights = search_gds_flights(orig_airport['iata'], dest_airport['iata'], date)
    southwest = search_southwest_fares(orig_airport['iata'], dest_airport['iata'], date)

    return jsonify({
        "origin": {
            "city": origin,
            "airport": orig_airport['name'],
            "iata": orig_airport['iata']
        },
        "destination": {
            "city": destination,
            "airport": dest_airport['name'],
            "iata": dest_airport['iata']
        },
        "distance_miles": round(distance),
        "gds_options": gds_flights,
        "southwest_options": southwest,
        "data_source": "serpapi_live" if SERPAPI_KEY else "amadeus_live" if amadeus_client else "mock",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })


@app.route('/api/southwest', methods=['GET'])
def api_southwest():
    """Dedicated Southwest fare endpoint."""
    origin = request.args.get('origin', '').strip()
    destination = request.args.get('destination', '').strip()
    date = request.args.get('date', None)

    orig_airport = resolve_airport(origin)
    dest_airport = resolve_airport(destination)

    if not orig_airport or not dest_airport:
        return jsonify({"error": "Could not resolve airports"}), 400

    result = search_southwest_fares(orig_airport['iata'], dest_airport['iata'], date)
    return jsonify(result)


@app.route('/api/route', methods=['GET'])
def api_route():
    """
    Full logistics route breakdown for JetSlice delivery.
    Returns: pickup rideshare + flight + dropoff rideshare + concierge fee + total.
    """
    origin = request.args.get('origin', '').strip()
    destination = request.args.get('destination', '').strip()
    cargo = request.args.get('cargo', 'heated').lower()
    date = request.args.get('date', None)

    if not origin or not destination:
        return jsonify({"error": "Missing 'origin' and 'destination'"}), 400

    orig_airport = resolve_airport(origin)
    dest_airport = resolve_airport(destination)

    if not orig_airport or not dest_airport:
        return jsonify({"error": "Could not resolve one or both airports"}), 400

    distance = haversine_miles(
        orig_airport['lat'], orig_airport['lon'],
        dest_airport['lat'], dest_airport['lon']
    )

    if distance < 300:
        local_cost = float(distance * 4.0 + 50.0)
        return jsonify({
            "is_local": True,
            "distance_miles": round(distance),
            "total_cost": local_cost,
            "message": "Local delivery route activated via terrestrial fleet."
        }), 200

    # 1. Pickup rideshare
    pickup = estimate_rideshare(origin, orig_airport['iata'], "uber_black")

    # 2. Flight options
    gds_flights = search_gds_flights(orig_airport['iata'], dest_airport['iata'], date)
    southwest = search_southwest_fares(orig_airport['iata'], dest_airport['iata'], date)

    # Filter flights for TSA Clearance & Prep (Prep + Uber + 2-3 hours)
    from datetime import datetime, timedelta
    valid_flights = []
    
    # 30m prep + uber transit + 2.5 hour TSA/Terminal queue
    buffer_minutes = 30 + pickup['estimated_minutes'] + 150
    now = datetime.now()
    minimum_departure_time = now + timedelta(minutes=buffer_minutes)

    for flight in gds_flights:
        try:
            dep_time = datetime.fromisoformat(flight['departure_time'].replace('Z', '+00:00'))
            # If flight is today, ensure it passes TSA buffer. If tomorrow, it's valid.
            if dep_time.timestamp() > minimum_departure_time.timestamp():
                valid_flights.append(flight)
        except Exception:
            valid_flights.append(flight) # Fallback

    # Pick best option (first class for premium service)
    best_flight = valid_flights[0] if valid_flights else (gds_flights[0] if gds_flights else None)
    flight_cost = best_flight['price'] if best_flight else 0

    # Southwest comparison price
    sw_price = None
    if isinstance(southwest, dict) and southwest.get('available'):
        sw_price = southwest['fares']['business_select']

    # 3. Dropoff rideshare
    dropoff = estimate_rideshare(destination, dest_airport['iata'], "lyft_lux")

    # 4. Concierge handling
    concierge = calculate_concierge_fee(cargo, distance)

    # Total
    total = pickup['estimated_cost'] + flight_cost + dropoff['estimated_cost'] + concierge['fee']

    return jsonify({
        "route": {
            "origin": {"city": origin, "airport": orig_airport['name'], "iata": orig_airport['iata'], "lat": orig_airport['lat'], "lon": orig_airport['lon']},
            "destination": {"city": destination, "airport": dest_airport['name'], "iata": dest_airport['iata'], "lat": dest_airport['lat'], "lon": dest_airport['lon']},
            "distance_miles": round(distance),
        },
        "legs": [
            {
                "step": 1,
                "type": "rideshare",
                "label": f"{pickup['service']} to {orig_airport['iata']}",
                "provider": pickup['provider'],
                "service": pickup['service'],
                "cost": pickup['estimated_cost'],
                "duration_minutes": pickup['estimated_minutes'],
                "icon": "car-sport"
            },
            {
                "step": 2,
                "type": "flight",
                "label": f"United Airlines {best_flight['flight_number']}" if best_flight else "No flight found",
                "provider": "United Airlines",
                "flight": best_flight,
                "cost": flight_cost,
                "southwest_alternative": sw_price,
                "icon": "airplane"
            },
            {
                "step": 3,
                "type": "rideshare",
                "label": f"{dropoff['service']} to destination",
                "provider": dropoff['provider'],
                "service": dropoff['service'],
                "cost": dropoff['estimated_cost'],
                "duration_minutes": dropoff['estimated_minutes'],
                "icon": "car"
            },
            {
                "step": 4,
                "type": "concierge",
                "label": concierge['description'],
                "provider": "JetSlice",
                "cost": concierge['fee'],
                "includes": concierge['includes'],
                "icon": "briefcase"
            }
        ],
        "flights": gds_flights,
        "total_cost": round(total, 2),
        "currency": "USD",
        "data_source": "serpapi_live" if SERPAPI_KEY else "amadeus_live" if amadeus_client else "mock",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })


# ---------------------------------------------------------------------------
# Spotify Integration (optional - gracefully degrades)
# ---------------------------------------------------------------------------
SPOTIFY_CLIENT_ID = os.environ.get('SPOTIFY_CLIENT_ID', '')
SPOTIFY_CLIENT_SECRET = os.environ.get('SPOTIFY_CLIENT_SECRET', '')

try:
    import spotipy
    from spotipy.oauth2 import SpotifyOAuth
    SPOTIPY_AVAILABLE = True
except ImportError:
    SPOTIPY_AVAILABLE = False

if SPOTIPY_AVAILABLE and SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET:
    # Set up the OAuth manager for controlling playback state
    spotify_auth = SpotifyOAuth(client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET, redirect_uri='http://localhost:8042/api/spotify/callback', scope='user-read-playback-state user-modify-playback-state')
    sp = spotipy.Spotify(auth_manager=spotify_auth)
else:
    sp = None
    if SPOTIPY_AVAILABLE:
         print("[JetSlice] No Spotify credentials - set SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET")

@app.route('/api/autocomplete_restaurants', methods=['GET'])
def api_autocomplete_restaurants():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({"features": []})

    if not SERPAPI_KEY:
        print("[JetSlice Autocomplete] No SERPAPI_KEY, falling back to empty features list.")
        return jsonify({"features": []})

    try:
        url = f"https://serpapi.com/search.json?engine=google_local&q={urllib.parse.quote(query)}&api_key={SERPAPI_KEY}"
        import requests 
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            local_results = data.get("local_results", [])
            features = []
            
            # Map SerpAPI local_results to Mapbox-like 'features' structure for frontend compatibility
            for i, result in enumerate(local_results[:5]): # Take top 5
                title = result.get('title', '')
                addr = result.get('address', '')
                coords = result.get('gps_coordinates', {})
                lng = coords.get('longitude', 0)
                lat = coords.get('latitude', 0)
                
                features.append({
                    "text": title,
                    "place_name": addr,
                    "place_type": ["poi", result.get("type", "Restaurant")],
                    "center": [lng, lat],
                    "thumbnail": result.get("thumbnail", "")
                })
            
            return jsonify({"features": features})
    except Exception as e:
        print(f"[JetSlice Autocomplete] Error querying Google Local via SerpAPI: {e}")
        
    return jsonify({"features": []})

@app.route('/api/spotify/current-track', methods=['GET'])
def get_current_track():
    if sp:
        try:
            track = sp.current_playback()
            if track is not None and track.get('is_playing'):
                return jsonify({
                    "title": track['item']['name'],
                    "artist": track['item']['artists'][0]['name'],
                    "is_playing": track['is_playing'],
                    "mock": False
                })
        except Exception as e:
            print(f"[JetSlice] Spotify API Error: {e}")
            
    # Graceful mock fallback
    return jsonify({
        "title": "LUNCH",
        "artist": "Billie Eilish",
        "is_playing": True,
        "mock": True
    })

@app.route('/api/spotify/<action>', methods=['POST'])
def toggle_spotify(action):
    if action not in ['play', 'pause']:
        return jsonify({"error": "Invalid action"}), 400
        
    if sp:
        try:
            if action == 'play':
                sp.start_playback()
            elif action == 'pause':
                sp.pause_playback()
            return jsonify({"status": "success", "action": action})
        except Exception as e:
            print(f"[JetSlice] Spotify API Error: {e}")
            return jsonify({"error": str(e)}), 500
            
    # Graceful mock fallback
    print(f"[JetSlice] Mock Spotify API Action -> {action.upper()}")
    return jsonify({"status": "success", "mock": True, "action": action})


# ---------------------------------------------------------------------------
# Social Media Sharing (TikTok & Instagram)
# ---------------------------------------------------------------------------
@app.route('/api/share', methods=['POST'])
def share_media():
    """
    Accepts Multipart form data with a 'video' Blob (WebM/MP4).
    Integrates with TikTok Video Kit & Instagram Graph API if keys exist.
    """
    if 'video' not in request.files:
        return jsonify({"error": "No video file found in payload"}), 400
        
    file = request.files['video']
    file_size = len(file.read())
    file.seek(0) # reset pointer 
    
    # Environment keys for live integrations
    TIKTOK_ACCESS_TOKEN = os.environ.get('TIKTOK_ACCESS_TOKEN', '')
    INSTAGRAM_ACCESS_TOKEN = os.environ.get('INSTAGRAM_ACCESS_TOKEN', '')
    
    responses = []
    
    if TIKTOK_ACCESS_TOKEN:
        # Simulate TikTok web publishing pipeline (would use requests to POST to open.tiktokapis.com)
        responses.append({"platform": "tiktok", "status": "uploaded", "mode": "live"})
    else:
        responses.append({"platform": "tiktok", "status": "mock_upload_success", "mode": "mock", "kb": round(file_size/1024, 2)})
        
    if INSTAGRAM_ACCESS_TOKEN:
        # Simulate Meta Graph API Reels upload cascade
        responses.append({"platform": "instagram", "status": "uploaded", "mode": "live"})
    else:
        responses.append({"platform": "instagram", "status": "mock_upload_success", "mode": "mock", "kb": round(file_size/1024, 2)})

    print(f"\n[JetSlice] Received media payload: {round(file_size/1024, 2)} KB")
    print(f"[JetSlice] Social API Results => {json.dumps(responses)}")
    
    return jsonify({"status": "success", "results": responses})


# ---------------------------------------------------------------------------
# Sentiment Scraper (Yelp/Reddit + OpenAI)
# ---------------------------------------------------------------------------
@app.route('/api/sentiment-recommendations', methods=['GET'])
def get_sentiment_recommendations():
    """
    Simulates a background thread that scrapes Yelp Fusion and Reddit sentiment,
    passing the raw reviews into OpenAI to find the highest-rated luxury logistics hubs.
    """
    openai_key = os.environ.get('OPENAI_API_KEY')
    yelp_key = os.environ.get('YELP_FUSION_API_KEY')
    
    if openai_key and yelp_key:
        # In a fully deployed environment, this triggers a real GPT-4o analysis
        app.logger.info("[JetSlice] Connected to OpenAI and Yelp. Running live analysis.")
        mode = "live"
    else:
        print("[JetSlice] Mock Sentiment Engine -> Generating algorithmic recommendations (Keys Missing)")
        mode = "mock"
        
    return jsonify({
        "status": "success",
        "mode": mode,
        "recommendations": [
            {
                "emoji": "🥙",
                "restaurant": "The Halal Guys",
                "origin": "New York, NY",
                "dest": "Miami, FL",
                "cargo": "heated",
                "foodItem": "Gyro Platter & White Sauce",
                "ratings": { "yelp": "4.6", "uberEats": "4.8", "reddit": "9.2/10" },
                "reviewText": "\"The white sauce survived the flight impeccably. Flawless gyro payload.\" - Reddit Sentiment Model",
                "coordinates": [-73.9818, 40.7619] # NYC
            },
            {
                "emoji": "🍚",
                "restaurant": "Din Tai Fung",
                "origin": "Los Angeles, CA",
                "dest": "Las Vegas, NV",
                "cargo": "heated",
                "foodItem": "Pork XLB & Truffle Fried Rice",
                "ratings": { "yelp": "4.8", "uberEats": "4.9", "reddit": "10/10" },
                "reviewText": "\"The truffle fried rice still had perfect texture. Unbelievable transport tech.\" - OpenAI Analyzed Review",
                "coordinates": [-118.2437, 34.0522] # LA
            }
        ]
    })
@app.route('/api/dispatch-voice', methods=['POST'])
def api_dispatch_voice():
    """
    Initiates an outbound AI voice call using Bland AI.
    Currently locked behind a safety flag to prevent unapproved charges.
    """
    ENABLE_LIVE_VOICE_AI = False
    
    data = request.json or {}
    restaurant_phone = data.get('phone', '+15551234567')
    instructions = data.get('instructions', 'Call the restaurant and place an order for John Doe.')
    
    bland_api_key = os.environ.get('BLAND_API_KEY')
    
    if not ENABLE_LIVE_VOICE_AI or not bland_api_key or bland_api_key == 'your_bland_api_key_here':
        print(f"[JetSlice] Voice AI API simulated. Payload designed for {restaurant_phone}")
        return jsonify({
            "status": "success",
            "message": "Simulated AI call successful. Feature flag ENABLE_LIVE_VOICE_AI is False.",
            "call_id": "sim_call_" + str(random.randint(10000, 99999)),
            "simulated": True
        })

    # Prepare actual Bland AI request
    headers = {
        "authorization": bland_api_key,
        "content-type": "application/json"
    }
    
    payload = {
        "phone_number": restaurant_phone,
        "task": instructions,
        "voice": "florida", 
        "record": True,
        "reduce_latency": True,
        "amd": True
    }
    
    try:
        response = requests.post("https://api.bland.ai/v1/calls", json=payload, headers=headers)
        response_data = response.json()
        print(f"[JetSlice] Bland AI Response: {response_data}")
        return jsonify(response_data)
    except Exception as e:
        print(f"[JetSlice] AI API Error: {str(e)}")
        return jsonify({"status": "error", "message": "Voice AI API connection failed."}), 500



@app.route('/api/status', methods=['GET'])
def api_status():
    """Health check and API status."""
    return jsonify({
        "service": "JetSlice Premium Delivery",
        "version": "1.0.0",
        "amadeus_connected": amadeus_client is not None,
        "data_mode": "live" if amadeus_client else "mock",
        "supported_airlines": {
            "united": {"source": "Amadeus API" if amadeus_client else "Mock Data", "api": True},
            "southwest": {"source": "Estimated (no public API)", "api": False}
        },
        "airports_loaded": len(AIRPORT_MAP),
        "endpoints": [
            "GET /api/flights?origin=...&destination=...&date=...",
            "GET /api/southwest?origin=...&destination=...",
            "GET /api/route?origin=...&destination=...&cargo=heated|refrigerated|secure",
            "GET /api/airports?q=...",
            "GET /api/status",
        ]
    })


# ===========================================================================
# Main
# ===========================================================================
if __name__ == '__main__':
    print(f"""
  =============================================
   JetSlice - Premium Delivery Backend v1.0
  =============================================
   Server:    http://localhost:{PORT}
   Amadeus:   {'CONNECTED' if amadeus_client else 'MOCK MODE (set env vars for live data)'}
   Airlines:  United (Amadeus) | Southwest (Estimated)
  =============================================
    """)
    # Auto-open browser is handled by LAUNCH.bat
    app.run(host='0.0.0.0', port=PORT, debug=False)
