from flask import Blueprint, request, jsonify
import uuid
from backend.models import db, Order, TelemetryLog

payments_bp = Blueprint('payments', __name__)

@payments_bp.route('/api/payments/intent', methods=['POST'])
def create_payment_intent():
    """
    Creates a Stripe PaymentIntent or Apple Pay session.
    Apple requires secure tokenization for physical goods transactions.
    """
    data = request.json
    amount_cents = data.get('amount', 0)
    
    if amount_cents <= 0:
        return jsonify({"error": "Invalid amount"}), 400
        
    # In production:
    # intent = stripe.PaymentIntent.create(amount=amount_cents, currency='usd')
    # return jsonify({"client_secret": intent.client_secret})
    
    mock_intent_id = f"pi_{uuid.uuid4().hex[:24]}"
    mock_client_secret = f"{mock_intent_id}_secret_{uuid.uuid4().hex[:24]}"
    
    return jsonify({
        "status": "success",
        "payment_method": "Apple Pay Tokenization Ready",
        "client_secret": mock_client_secret,
        "amount": amount_cents
    })

@payments_bp.route('/api/orders', methods=['POST'])
def create_order():
    """Saves the completed transaction to the Data Lake (PostgreSQL)."""
    data = request.json
    try:
        new_order = Order(
            user_id=1, # Mock authenticated user ID since we mock auth
            status='paid',
            total_cents=data.get('amount_cents', 0)
        )
        db.session.add(new_order)
        db.session.commit()
        
        # Log to telemetry
        log = TelemetryLog(
            order_id=new_order.id,
            event_type='order_created',
            payload_json=data
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({"status": "success", "order_id": new_order.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@payments_bp.route('/api/orders', methods=['GET'])
def get_orders():
    """Fetches all past deliveries for the current user."""
    try:
        orders = Order.query.filter_by(user_id=1).order_by(Order.created_at.desc()).all()
        result = []
        for o in orders:
            telemetry = TelemetryLog.query.filter_by(order_id=o.id, event_type='order_created').first()
            item_name = "Premium Package"
            emoji = "📦"
            if telemetry and telemetry.payload_json:
                item_name = telemetry.payload_json.get('food_item', item_name)
                emoji = telemetry.payload_json.get('emoji', emoji)
                
            result.append({
                "id": o.id,
                "status": o.status,
                "total_cents": o.total_cents,
                "created_at": o.created_at.isoformat() + "Z",
                "item_name": item_name,
                "emoji": emoji
            })
            
        return jsonify({"status": "success", "orders": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
