from flask import Flask, jsonify, request, render_template
import requests
from flask_cors import CORS
import base64
import time

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# eBay API Configuration
EBAY_CLIENT_ID = "AdityaSi-SecondHa-PRD-db036a7ea-c33585df"  # Your App ID
EBAY_CLIENT_SECRET = "PRD-b036a7eaa174-87b4-4cef-906c-ed95"  # Your Cert ID
EBAY_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"
EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope"

# Cache token to avoid frequent requests
access_token = None
token_expiry = 0

def get_ebay_access_token():
    global access_token, token_expiry
    current_time = time.time()

    # Reuse token if still valid (expires after 7200 seconds)
    if access_token and current_time < token_expiry - 60:
        return access_token

    # Encode credentials for Basic Auth
    credentials = f"{EBAY_CLIENT_ID}:{EBAY_CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {encoded_credentials}"
    }
    data = {
        "grant_type": "client_credentials",
        "scope": EBAY_SCOPE
    }

    try:
        response = requests.post(EBAY_TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        token_data = response.json()
        access_token = token_data["access_token"]
        token_expiry = current_time + token_data["expires_in"]
        return access_token
    except requests.exceptions.RequestException as e:
        print(f"Token request error: {e}")
        return None

def fetch_ebay_products(query, page=1, category="", brand="", condition=""):
    token = get_ebay_access_token()
    if not token:
        return {"error": "Failed to authenticate with eBay"}

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # Map categories to eBay category IDs
    category_map = {
        "jewellery": "31387",  # Jewelry
        "handbags": "169291",  # Handbags
        "watches": "260324",   # Watches
        "clothing": "15724"    # Designer Clothing
    }

    # Map conditions to eBay condition IDs (pre-owned only)
    condition_map = {
        "excellent": "2500",  # Very Good
        "good": "3000",       # Used
        "fair": "4000"        # Acceptable
    }

    params = {
        "q": query,
        "limit": 20,
        "offset": (page - 1) * 20,
        "condition": condition_map.get(condition, "2500|3000|4000")  # Default to all pre-owned conditions
    }

    # Add category filter
    if category and category in category_map:
        params["category_ids"] = category_map[category]

    # Add brand filter
    if brand:
        params["q"] = f"{params['q']} {brand}"

    try:
        response = requests.get(EBAY_API_URL, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API request error: {e}")
        return {"error": "Failed to fetch products"}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    category = request.args.get('category', '')
    brand = request.args.get('brand', '')
    condition = request.args.get('condition', '')

    if not query and not category and not brand:
        return jsonify({"error": "No search query or filters provided"}), 400

    products = fetch_ebay_products(query, page, category, brand, condition)
    return jsonify(products)

if __name__ == '__main__':
    app.run(debug=True)
