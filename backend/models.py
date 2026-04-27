from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from backend.encryption import encrypt_pii, decrypt_pii

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    apple_id = db.Column(db.String(120), unique=True, nullable=True)
    _email_encrypted = db.Column('email_encrypted', db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def email(self):
        return decrypt_pii(self._email_encrypted)

    @email.setter
    def email(self, value):
        self._email_encrypted = encrypt_pii(value)

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(50), default='pending')
    total_cents = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Telemetry relationships can be added here
    
class TelemetryLog(db.Model):
    """Data Lake table for dispatch tracking and SLA auditing."""
    __tablename__ = 'telemetry_logs'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    event_type = db.Column(db.String(100), nullable=False)
    payload_json = db.Column(db.JSON, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

def init_db(app):
    """Initialize database with the Flask app."""
    # Use SQLite for local development; swap to postgresql:// for production
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///jetslice_datalake.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()
