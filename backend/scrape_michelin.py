import requests
from bs4 import BeautifulSoup
import json
import os

def scrape_wikipedia():
    url = "https://en.wikipedia.org/wiki/List_of_Michelin_starred_restaurants_in_Chicago"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        resp = requests.get(url, headers=headers)
        soup = BeautifulSoup(resp.text, 'html.parser')
        table = soup.find('table', class_='wikitable')
        restaurants = []
        
        if table:
            for row in table.find_all('tr')[1:]:
                cols = row.find_all(['td', 'th'])
                if len(cols) > 0:
                    name = cols[0].text.strip()
                    # We will assume these are available for JetSlice carryout simulation
                    restaurants.append({
                        "name": name,
                        "location": "Chicago, IL",
                        "stars": "Michelin Starred",
                        "carryout": True,
                        "cuisine": "Fine Dining"
                    })
        
        output_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'data', 'michelin_carryout.json')
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(restaurants, f, indent=4)
            
        print(f"Saved {len(restaurants)} Michelin restaurants to {output_path}")
    except Exception as e:
        print(f"Error scraping: {e}")

if __name__ == "__main__":
    scrape_wikipedia()
