from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

iot_bp = Blueprint('iot', __name__)

# In-memory store for dev. In prod, use Redis or Postgres.
cargo_telemetry = {}

@iot_bp.route('/api/iot/ingest', methods=['POST'])
def ingest_telemetry():
    """
    Real-time telemetry measuring courier temperature and cargo integrity for luxury food delivery.
    """
    data = request.json
    courier_id = data.get('courier_id')
    temp_celsius = data.get('temperature_c')
    
    if not courier_id or temp_celsius is None:
        return jsonify({"error": "Missing required telemetry data"}), 400
        
    if temp_celsius < 0 or temp_celsius > 85:
        logging.warning(f"IoT Alert: Abnormal cargo temperature detected for courier {courier_id} ({temp_celsius}C)")
        # Fire off notification to driver and support
        
    cargo_telemetry[courier_id] = {
        "temperature_c": temp_celsius,
        "last_updated": datetime.utcnow().isoformat()
    }
    
    return jsonify({"status": "success", "message": "Telemetry recorded"})
