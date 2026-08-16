#!/usr/bin/env python3
"""
Fetches rating + review count from Google Places API and writes to data/reviews.json.
Required env var: GOOGLE_PLACES_API_KEY
"""
import json
import os
import sys
import urllib.request

API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
if not API_KEY:
    print("Error: GOOGLE_PLACES_API_KEY not set", file=sys.stderr)
    sys.exit(1)

PLACE_ID = "ChIJyd3AfHANkEcRRAQbaNBhp7Y"  # Ruay Thai Noodle, Dietikon

url = (
    "https://maps.googleapis.com/maps/api/place/details/json"
    f"?place_id={PLACE_ID}"
    "&fields=rating,user_ratings_total"
    f"&key={API_KEY}"
)

with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read())

result = data.get("result", {})
rating = result.get("rating")
count = result.get("user_ratings_total")

if rating is None or count is None:
    print(f"Unexpected API response: {data}", file=sys.stderr)
    sys.exit(1)

out = {"rating": str(rating), "count": count}
path = os.path.join(os.path.dirname(__file__), "..", "data", "reviews.json")
with open(path, "w") as f:
    json.dump(out, f)

print(f"Updated: {rating} stars, {count} reviews")
