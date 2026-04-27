from flask import request, jsonify

def assess_fraud_risk(req):
    """
    Analyzes device fingerprints and IP telemetry.
    Returns a risk score 0.0 (safe) to 1.0 (fraud).
    """
    score = 0.0
    
    # 1. Check for missing essential headers
    user_agent = req.headers.get('User-Agent', '')
    if not user_agent or 'curl' in user_agent.lower():
        score += 0.4
        
    # 2. IP Velocity (mocked)
    client_ip = req.remote_addr
    # In production, check Redis for request frequency from client_ip
    
    # 3. Geo-location anomalies (mocked)
    
    return score

def fraud_check_middleware(func):
    """Decorator to apply fraud check before route execution."""
    def wrapper(*args, **kwargs):
        risk = assess_fraud_risk(request)
        if risk > 0.8:
            return jsonify({"error": "High risk transaction blocked by Fraud Engine."}), 403
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper
