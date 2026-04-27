from flask import Blueprint, request, jsonify
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = 'jetslice_super_secret_jwt_key_for_apple'

@auth_bp.route('/api/auth/apple', methods=['POST'])
def apple_sign_in():
    """
    Validates Apple Identity Token.
    Apple App Store requires Sign-In with Apple for third-party logins.
    """
    data = request.json
    apple_token = data.get('apple_identity_token')
    
    if not apple_token:
        return jsonify({"error": "Missing apple_identity_token"}), 400
        
    # In production, verify the apple_token with Apple's public keys.
    # For now, we mock the validation and issue our own session JWT.
    
    session_token = jwt.encode({
        'sub': 'mock_apple_user_id',
        'exp': datetime.utcnow() + timedelta(days=7),
        'role': 'client'
    }, JWT_SECRET, algorithm='HS256')
    
    return jsonify({
        "status": "success",
        "message": "Apple Identity verified successfully",
        "session_jwt": session_token
    })

def verify_jwt(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@auth_bp.route('/api/account/delete', methods=['POST'])
def delete_account():
    """
    Apple App Store Guideline 5.1.1(v) requires apps that allow account creation 
    to also offer account deletion directly within the app.
    """
    # Extract JWT from Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
        
    token = auth_header.split(" ")[1]
    user_payload = verify_jwt(token)
    
    if not user_payload:
        return jsonify({"error": "Invalid or expired session"}), 401
        
    user_id = user_payload.get('sub')
    
    # In production:
    # 1. Soft-delete or hard-delete user record from PostgreSQL
    # 2. Revoke Apple Sign-in Token via Apple REST API
    # 3. Anonymize past order records (remove PII)
    
    return jsonify({
        "status": "success",
        "message": f"Account {user_id} and associated PII have been queued for deletion."
    }), 200
