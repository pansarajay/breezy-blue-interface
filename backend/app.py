import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from models import db

bcrypt = Bcrypt()
jwt = JWTManager()

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    
    # Configuration
    # Fallback to local sqlite database for local development.
    # Can override using DATABASE_URL environment variable.
    db_url = os.environ.get('DATABASE_URL')
    if db_url and db_url.startswith('postgres://'):
        # Fix dialect for modern SQLAlchemy if deployed on Heroku/Render/etc
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'busgo-super-secret-key-123'),
        SQLALCHEMY_DATABASE_URI=db_url or 'sqlite:///' + os.path.join(app.root_path, 'bus_booking.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'jwt-super-secret-key-321'),
        JWT_ACCESS_TOKEN_EXPIRES=86400, # 24 hours
        UPLOAD_FOLDER=os.path.join(app.root_path, 'static', 'uploads'),
    )
    
    if test_config:
        app.config.from_mapping(test_config)

    # Make upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Error Handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired', 'sub': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Signature verification failed', 'sub': 'invalid_token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization header is missing', 'sub': 'unauthorized'}), 401

    # Register blueprints
    from routes.auth import auth_bp
    from routes.buses import buses_bp
    from routes.routes_schedules import rs_bp
    from routes.bookings_payments import bookings_bp
    from routes.tickets_reports import reports_bp
    from routes.admin import admin_bp
    from routes.reviews import reviews_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(buses_bp, url_prefix='/api/buses')
    app.register_blueprint(rs_bp, url_prefix='/api')
    app.register_blueprint(bookings_bp, url_prefix='/api')
    app.register_blueprint(reports_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(reviews_bp, url_prefix='/api')

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy', 'database': app.config['SQLALCHEMY_DATABASE_URI'].split('://')[0]})

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
