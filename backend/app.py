# backend/app.py
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from barcode import get_latest_barcode, start_barcode_scanner, get_product_data
from recommend import get_recommendations
from risk_assessment import analyze_product
from food_recognition import (
    analyze_food_image,
    validate_food_input,
    apply_user_confirmed_food_name,
)
from admin import admin_bp
import cv2


app = Flask(__name__)
CORS(app)

app.register_blueprint(admin_bp)

camera = None


def log_recommendation(message):
    print(f"[Recommendations] {message}")

def get_camera():
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            print("Warning: Could not open camera")
            return None
        
        # Lower resolution for Raspberry Pi 4 performance
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        camera.set(cv2.CAP_PROP_FPS, 15)
        # Reduce buffer size to minimize latency
        camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return camera

# # Only start physical scanner if specifically enabled (e.g. on the Pi)
# if os.environ.get('ENABLE_PHYSICAL_SCANNER') == 'true':
#     start_barcode_scanner()

start_barcode_scanner()

def generate_frames():
    cam = get_camera()
    if cam is None:
        return
    
    while True:
        success, frame = cam.read()
        if not success:
            break
        else:
            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

        # Yield frame in MJPEG format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video')
def video():
    # This route returns the multipart stream
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

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
        # Only add recommendations if data source is OpenFoodFacts
        data_source = product_data.get('source', 'unknown')
        
        if include_recommendations and data_source == 'openfoodfacts':
            try:
                lookup_barcode = product_data.get('barcode') or product_data.get('requested_barcode') or barcode
                log_recommendation(f"Fetching recommendations for barcode={lookup_barcode} via /api/product")
                recommendations = get_recommendations(lookup_barcode, limit=9)
                product_data['recommendations'] = recommendations
                product_data['recommendations_count'] = len(recommendations)
                log_recommendation(f"Attached {len(recommendations)} recommendations to barcode={lookup_barcode}")
            except Exception as e:
                log_recommendation(f"Error getting recommendations for barcode={barcode}: {e}")
                product_data['recommendations'] = []
                product_data['recommendations_count'] = 0
                product_data['recommendations_error'] = str(e)
        elif data_source == 'appwrite':
            # Explicitly set empty recommendations for Appwrite products
            product_data['recommendations'] = []
            product_data['recommendations_count'] = 0
            product_data['recommendations_available'] = False
            product_data['message'] = 'Recommendations only available for OpenFoodFacts products'
            log_recommendation(f"Skipped barcode={barcode} because source=appwrite")
        
        return jsonify(product_data)
    return jsonify({'error': 'Product not found in Appwrite or Open Food Facts for this barcode.'}), 404


@app.route('/api/recommendations/<barcode>')
def get_product_recommendations(barcode):
    try:
        # Get limit from query parameter (default: 9)
        limit = request.args.get('limit', default=9, type=int)
        limit = min(max(1, limit), 10)  # Clamp between 1 and 10

        log_recommendation(f"Direct recommendations request barcode={barcode} limit={limit}")
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

@app.route('/api/assess/<barcode>', methods=['GET', 'POST'])
def assess_product(barcode):
    """Perform AI risk assessment on a product - supports personalized assessment"""
    try:
        product_data = get_product_data(barcode)
        
        if not product_data:
            return jsonify({'error': 'Search query limit reached. Please retry after 1 minute.'}), 404
        
        # Get user profile from POST body (for personalized assessment)
        user_profile = None
        if request.method == 'POST':
            user_profile = request.get_json()
        
        # Run AI analysis with optional user profile
        assessment = analyze_product(product_data, user_profile)
        
        return jsonify(assessment)
        
    except Exception as e:
        print(f"Error in assessment: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/analyze-food-image', methods=['POST'])
def analyze_food():
    """Analyze a food image to identify the food and get nutritional info."""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        image_data = data['image']
        user_profile = data.get('userProfile', None)
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Analyze the food image
        result = analyze_food_image(image_data, user_profile)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error analyzing food image: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/validate-food-input', methods=['POST'])
def validate_food_input_endpoint():
    """Validate a user-typed food name for the disambiguation modal."""
    try:
        data = request.get_json()
        if not data or 'food_name' not in data:
            return jsonify({'error': 'food_name required'}), 400

        food_name = str(data.get('food_name', '')).strip()
        if not food_name:
            return jsonify({'valid': False, 'reason': 'Empty input.', 'sanitized_name': ''}), 200
        if len(food_name) > 100:
            return jsonify({'valid': False, 'reason': 'Input is too long.', 'sanitized_name': ''}), 200

        context = data.get('context', {})
        result = validate_food_input(food_name, context)
        return jsonify(result)
    except Exception as e:
        print(f"Error in validate_food_input_endpoint: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/confirm-food-name', methods=['POST'])
def confirm_food_name_endpoint():
    """Apply user-confirmed food name and fetch USDA nutrition after confirmation."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400

        food_data = data.get('foodData')
        confirmed_name = str(data.get('confirmedName', '')).strip()

        if not isinstance(food_data, dict):
            return jsonify({'error': 'foodData object required'}), 400
        if not confirmed_name:
            return jsonify({'error': 'confirmedName required'}), 400

        updated_food_data = apply_user_confirmed_food_name(food_data, confirmed_name)
        return jsonify({'success': True, 'data': updated_food_data})
    except Exception as e:
        print(f"Error in confirm_food_name_endpoint: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
