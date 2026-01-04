from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from barcode import get_latest_barcode, start_barcode_scanner, get_product_data
from recommend import get_recommendations
from risk_assessment import analyze_product
import os
import cv2


app = Flask(__name__)
CORS(app)

camera = None

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
                recommendations = get_recommendations(barcode, limit=9)
                product_data['recommendations'] = recommendations
                product_data['recommendations_count'] = len(recommendations)
            except Exception as e:
                print(f"Error getting recommendations: {e}")
                product_data['recommendations'] = []
                product_data['recommendations_count'] = 0
                product_data['recommendations_error'] = str(e)
        elif data_source == 'appwrite':
            # Explicitly set empty recommendations for Appwrite products
            product_data['recommendations'] = []
            product_data['recommendations_count'] = 0
            product_data['recommendations_available'] = False
            product_data['message'] = 'Recommendations only available for OpenFoodFacts products'
        
        return jsonify(product_data)
    return jsonify({'error': 'Search query limit reached. Please retry after 1 minute.'}), 404


@app.route('/api/recommendations/<barcode>')
def get_product_recommendations(barcode):
    try:
        # Get limit from query parameter (default: 9)
        limit = request.args.get('limit', default=9, type=int)
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
    
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)