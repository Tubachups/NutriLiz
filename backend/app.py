from flask import Flask, jsonify, request
from flask_cors import CORS
from barcode import get_latest_barcode, start_barcode_scanner, get_product_data, get_recommendations

app = Flask(__name__)
CORS(app)

start_barcode_scanner()

@app.route('/api/latest-barcode')
def api_get_latest_barcode():
    barcode = get_latest_barcode()
    return jsonify({'barcode': barcode})

@app.route('/api/product/<barcode>')
def get_product(barcode):
    # Get query parameter to control whether to include recommendations
    include_recommendations = request.args.get('recommendations', 'true').lower() == 'true'
    
    product_data = get_product_data(barcode)
    if product_data:
        # Add recommendations to the response
        if include_recommendations:
            recommendations = get_recommendations(barcode, limit=5)
            product_data['recommendations'] = recommendations
            product_data['recommendations_count'] = len(recommendations)
        
        return jsonify(product_data)
    return jsonify({'error': 'Product not found'}), 404

@app.route('/api/recommendations/<barcode>')
def get_product_recommendations(barcode):
    try:
        # Get limit from query parameter (default: 3)
        limit = request.args.get('limit', default=5, type=int)
        limit = min(max(1, limit), 10)  # Clamp between 1 and 10
        
        recommendations = get_recommendations(barcode, limit=limit)
        
        if recommendations:
            return jsonify({
                'barcode': barcode,
                'count': len(recommendations),
                'recommendations': recommendations
            })
        else:
            return jsonify({
                'barcode': barcode,
                'count': 0,
                'recommendations': [],
                'message': 'No similar products found'
            }), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)