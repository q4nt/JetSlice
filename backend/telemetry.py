import logging
import json
from datetime import datetime
from flask import request, g

class DatadogFormatter(logging.Formatter):
    """Formats logs as JSON for structured Datadog ingestion."""
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "path": getattr(g, 'path', 'N/A'),
            "method": getattr(g, 'method', 'N/A'),
            "ip": getattr(g, 'ip', 'N/A')
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def init_telemetry(app):
    """
    Initializes application performance monitoring (APM).
    Tracks crash reports and fatal errors necessary for App Store review compliance.
    """
    handler = logging.StreamHandler()
    handler.setFormatter(DatadogFormatter())
    app.logger.handlers = []
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)

    @app.before_request
    def before_request():
        g.start_time = datetime.utcnow()
        g.path = request.path
        g.method = request.method
        g.ip = request.remote_addr

    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time') and not request.path.startswith('/static'):
            duration = (datetime.utcnow() - g.start_time).total_seconds() * 1000
            app.logger.info(f"Handled {request.method} {request.path} - {response.status_code} in {duration:.2f}ms")
        return response
