from flask import Flask, jsonify, request, render_template
import requests
from flask_cors import CORS

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# RapidAPI Configuration d09e00c35bmshb99b41afe6090fdp1be307jsn66f579f65e2b
RAPIDAPI_KEY = "f5a56de4d2msh22fcc0f676c38f9p10db89jsnf82dd0be877f"  
RAPIDAPI_HOST = "vestiaire-collective.p.rapidapi.com"
RAPIDAPI_URL = "https://vestiaire-collective.p.rapidapi.com/search"


def fetch_rapidapi_products(query):
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    params = {"query": query, "country": "US"}

    response = requests.get(RAPIDAPI_URL, headers=headers, params=params)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.text)

    try:
        response_data = response.json()
        if isinstance(response_data, dict):  # If the response is not a list
            return response_data.get("data", [])  # Extract list of products
        return response_data
    except ValueError:
        return {"error": "Invalid JSON response"}



@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify({"error": "No search query provided"}), 400
    
    products = fetch_rapidapi_products(query)
    return jsonify(products)

if __name__ == '__main__':
    app.run(debug=True)
