from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Review, User, Bus

reviews_bp = Blueprint('reviews', __name__)

def check_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@reviews_bp.route('/buses/<int:bus_id>/reviews', methods=['POST'])
@jwt_required()
def add_review(bus_id):
    current_user_id = int(get_jwt_identity())
    
    bus = Bus.query.get(bus_id)
    if not bus:
        return jsonify({'error': 'Bus not found'}), 404
        
    data = request.get_json() or {}
    rating = data.get('rating')
    review_text = data.get('review_text', '')
    
    if not rating or not (1 <= rating <= 5):
        return jsonify({'error': 'Rating is required and must be between 1 and 5'}), 400
        
    review = Review(
        user_id=current_user_id,
        bus_id=bus_id,
        rating=rating,
        review_text=review_text
    )
    
    db.session.add(review)
    db.session.commit()
    
    return jsonify(review.to_dict()), 201

@reviews_bp.route('/buses/<int:bus_id>/reviews', methods=['GET'])
def get_reviews(bus_id):
    bus = Bus.query.get(bus_id)
    if not bus:
        return jsonify({'error': 'Bus not found'}), 404
        
    reviews = Review.query.filter_by(bus_id=bus_id).order_by(Review.created_at.desc()).all()
    
    # Calculate average rating
    avg_rating = 0.0
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
        
    return jsonify({
        'average_rating': round(avg_rating, 1),
        'total_reviews': len(reviews),
        'reviews': [r.to_dict() for r in reviews]
    }), 200

@reviews_bp.route('/admin/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
        
    db.session.delete(review)
    db.session.commit()
    
    return jsonify({'message': 'Review moderated and removed'}), 200
