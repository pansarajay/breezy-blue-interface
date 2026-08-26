import secrets
import time
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, UserProfile
from app import bcrypt

auth_bp = Blueprint('auth', __name__)

PASSWORD_RESET_OTP_TTL_SECONDS = 600
_password_reset_otps = {}

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    email = data.get('email')
    full_name = data.get('full_name')
    mobile_number = data.get('mobile_number')
    password = data.get('password')
    
    if not email or not full_name or not mobile_number or not password:
        return jsonify({'error': 'Please provide all required fields: email, full_name, mobile_number, password'}), 400

    # Check if duplicate email
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 400
        
    # Password validation
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
    # Create user
    hashed_pwd = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(
        full_name=full_name,
        email=email,
        mobile_number=mobile_number,
        password_hash=hashed_pwd,
        role='user'
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Initialize User Profile
    profile = UserProfile(user_id=user.user_id)
    db.session.add(profile)
    db.session.commit()
    
    # Generate Access Token
    access_token = create_access_token(identity=str(user.user_id))
    
    return jsonify({
        'message': 'Registration successful',
        'token': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Please provide both email and password'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401
        
    access_token = create_access_token(identity=str(user.user_id))
    
    return jsonify({
        'message': 'Login successful',
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    profile = UserProfile.query.filter_by(user_id=user.user_id).first()
    profile_data = profile.to_dict() if profile else {}
    
    return jsonify({
        'user': user.to_dict(),
        'profile': profile_data
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json() or {}
    
    # Update user base fields
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'mobile_number' in data:
        user.mobile_number = data['mobile_number']
        
    # Update profile fields
    profile = UserProfile.query.filter_by(user_id=user.user_id).first()
    if not profile:
        profile = UserProfile(user_id=user.user_id)
        db.session.add(profile)
        
    if 'bio' in data:
        profile.bio = data['bio']
    if 'address' in data:
        profile.address = data['address']
    if 'profile_picture_url' in data:
        profile.profile_picture_url = data['profile_picture_url']
        
    # Handle password change if requested
    if 'current_password' in data and 'new_password' in data:
        current_pwd = data['current_password']
        new_pwd = data['new_password']
        if not bcrypt.check_password_hash(user.password_hash, current_pwd):
            return jsonify({'error': 'Current password verification failed'}), 400
        if len(new_pwd) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400
        user.password_hash = bcrypt.generate_password_hash(new_pwd).decode('utf-8')
        
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict(),
        'profile': profile.to_dict()
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    # Simple simulated OTP/verification password reset flow
    data = request.get_json() or {}
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        # Avoid user enumeration by saying check email
        return jsonify({'message': 'If the email exists, a reset code was sent'}), 200
        
    if not otp:
        # Stage 1: Request reset OTP
        # In production, send email with OTP. Here, we return successful notification.
        otp_code = f"{secrets.randbelow(1000000):06d}"
        _password_reset_otps[email] = (otp_code, time.time() + PASSWORD_RESET_OTP_TTL_SECONDS)
        print(f"PASSWORD RESET REQUESTED FOR: {email}. Simulated OTP code: {otp_code} (valid for {PASSWORD_RESET_OTP_TTL_SECONDS // 60} minutes)")
        return jsonify({'message': 'Verification OTP sent to email', 'otp_sent': True}), 200
        
    # Stage 2: Verify OTP and set password
    record = _password_reset_otps.get(email)
    if (
        not record
        or time.time() > record[1]
        or otp is None
        or not secrets.compare_digest(str(otp), record[0])
    ):
        _password_reset_otps.pop(email, None)
        return jsonify({'error': 'Invalid or expired OTP verification code'}), 400
        
    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'Please provide a valid new password (min 6 characters)'}), 400
        
    _password_reset_otps.pop(email, None)
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    
    return jsonify({'message': 'Password reset successful'}), 200
