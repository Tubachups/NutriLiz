from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
from barcode import get_latest_barcode, start_barcode_scanner, get_product_data

app = Flask(__name__)
CORS(app)

start_barcode_scanner()

# API Routes
@app.route('/api/latest-barcode')
def api_get_latest_barcode():
    barcode = get_latest_barcode()
    return jsonify({'barcode': barcode})

@app.route('/api/product/<barcode>')
def get_product(barcode):
    product_data = get_product_data(barcode)
    if product_data:
        return jsonify(product_data)
    return jsonify({'error': 'Product not found'}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)