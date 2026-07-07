import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Bus, Route, Booking, Schedule, Passenger

admin_bp = Blueprint('admin', __name__)

def check_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    total_users = User.query.filter(User.role == 'user').count()
    total_buses = Bus.query.count()
    total_routes = Route.query.count()
    total_bookings = Booking.query.count()
    
    # Calculate revenue
    total_revenue = db.session.query(db.func.sum(Booking.total_amount)).filter(
        Booking.booking_status == 'Confirmed'
    ).scalar() or 0
    
    return jsonify({
        'totalUsers': total_users,
        'totalBuses': total_buses,
        'totalRoutes': total_routes,
        'totalBookings': total_bookings,
        'totalRevenue': total_revenue
    }), 200

@admin_bp.route('/charts', methods=['GET'])
@jwt_required()
def get_charts():
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    # 1. Weekly Bookings / Revenue Trend (last 7 days)
    today = datetime.datetime.utcnow().date()
    daily_stats = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.strftime('%a') # Mon, Tue, etc
        
        bookings_count = Booking.query.filter(
            db.func.date(Booking.created_at) == day
        ).count()
        
        revenue_sum = db.session.query(db.func.sum(Booking.total_amount)).filter(
            db.func.date(Booking.created_at) == day,
            Booking.booking_status == 'Confirmed'
        ).scalar() or 0
        
        daily_stats.append({
            'day': day_str,
            'bookings': bookings_count,
            'revenue': int(revenue_sum)
        })
        
    # 2. Most Popular Routes
    popular_routes_query = db.session.query(
        Route.source, Route.destination, db.func.count(Booking.booking_id).label('bookings_count')
    ).join(Schedule, Schedule.route_id == Route.route_id)\
     .join(Booking, Booking.schedule_id == Schedule.schedule_id)\
     .group_by(Route.route_id)\
     .order_by(db.desc('bookings_count'))\
     .limit(4).all()
     
    popular_routes = []
    max_bookings = max([r[2] for r in popular_routes_query]) if popular_routes_query else 1
    
    for r in popular_routes_query:
        # Calculate percentage occupancy weight
        occupancy_weight = int((r[2] / max_bookings) * 100)
        popular_routes.append({
            'route': f"{r[0]} → {r[1]}",
            'percentage': max(10, occupancy_weight), # Ensure a visual bar height of at least 10%
            'count': r[2]
        })
        
    # If popular_routes is empty, supply seeds
    if not popular_routes:
        popular_routes = [
            {'route': 'Bengaluru → Mumbai', 'percentage': 92, 'count': 142},
            {'route': 'Delhi → Jaipur', 'percentage': 78, 'count': 118},
            {'route': 'Pune → Goa', 'percentage': 65, 'count': 82},
            {'route': 'Hyderabad → Chennai', 'percentage': 54, 'count': 64}
        ]
        
    return jsonify({
        'dailyStats': daily_stats,
        'popularRoutes': popular_routes
    }), 200
