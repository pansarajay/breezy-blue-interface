import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Route, Schedule, Bus, User

rs_bp = Blueprint('routes_schedules', __name__)

def check_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

def calculate_route_metrics(source, destination):
    # Simulated Google Maps Geocoding/Directions API
    # If standard Google API keys were in environment variables, we would run:
    #   gmaps = googlemaps.Client(key=os.environ.get('GOOGLE_MAPS_API_KEY'))
    #   directions = gmaps.directions(source, destination)
    # Since we need a robust, self-contained development fallback:
    
    # Static database of distance approximations between key Indian cities (in km)
    city_pairs = {
        ('Bengaluru', 'Mumbai'): (980, 1020), # (distance_km, duration_mins)
        ('Delhi', 'Jaipur'): (270, 300),
        ('Hyderabad', 'Chennai'): (630, 690),
        ('Pune', 'Goa'): (440, 540),
        ('Mumbai', 'Pune'): (150, 180),
        ('Bengaluru', 'Chennai'): (350, 390),
        ('Ahmedabad', 'Mumbai'): (520, 580),
        ('Indore', 'Surat'): (450, 520),
    }
    
    pair = (source, destination)
    rev_pair = (destination, source)
    
    if pair in city_pairs:
        return city_pairs[pair]
    elif rev_pair in city_pairs:
        return city_pairs[rev_pair]
        
    # Standard math approximation fallback
    # Let's say length of name differences * 100 for random variance
    char_sum = sum(ord(c) for c in source + destination)
    distance = 150 + (char_sum % 850) # 150km to 1000km
    # Duration based on average speed of 60 km/h + 30 mins buffer
    duration = int((distance / 60) * 60) + 30
    
    return float(distance), duration

# ROUTES CRUD
@rs_bp.route('/routes', methods=['GET'])
def get_routes():
    routes = Route.query.all()
    return jsonify([r.to_dict() for r in routes]), 200

@rs_bp.route('/routes', methods=['POST'])
@jwt_required()
def add_route():
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    data = request.get_json() or {}
    source = data.get('source')
    destination = data.get('destination')
    
    if not source or not destination:
        return jsonify({'error': 'Missing required fields: source and destination'}), 400
        
    # Calculate distance/duration dynamically (simulating Google Maps Directions integration)
    distance, duration = calculate_route_metrics(source, destination)
    
    # Override with user inputs if provided
    if 'distance' in data:
        try:
            distance = float(data['distance'])
        except ValueError:
            pass
    if 'duration' in data:
        try:
            duration = int(data['duration'])
        except ValueError:
            pass
            
    route = Route(
        source=source,
        destination=destination,
        distance=distance,
        duration=duration
    )
    
    db.session.add(route)
    db.session.commit()
    return jsonify(route.to_dict()), 201

@rs_bp.route('/routes/<int:route_id>', methods=['PUT'])
@jwt_required()
def update_route(route_id):
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    route = Route.query.get(route_id)
    if not route:
        return jsonify({'error': 'Route not found'}), 404
        
    data = request.get_json() or {}
    if 'source' in data:
        route.source = data['source']
    if 'destination' in data:
        route.destination = data['destination']
        
    # Recalculate metrics if source/destination changed
    if 'source' in data or 'destination' in data:
        dist, dur = calculate_route_metrics(route.source, route.destination)
        route.distance = dist
        route.duration = dur
        
    if 'distance' in data:
        route.distance = float(data['distance'])
    if 'duration' in data:
        route.duration = int(data['duration'])
        
    db.session.commit()
    return jsonify(route.to_dict()), 200

@rs_bp.route('/routes/<int:route_id>', methods=['DELETE'])
@jwt_required()
def delete_route(route_id):
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    route = Route.query.get(route_id)
    if not route:
        return jsonify({'error': 'Route not found'}), 404
        
    db.session.delete(route)
    db.session.commit()
    return jsonify({'message': 'Route deleted successfully'}), 200


# SCHEDULES CRUD
@rs_bp.route('/schedules', methods=['GET'])
def get_schedules():
    schedules = Schedule.query.all()
    return jsonify([s.to_dict() for s in schedules]), 200

@rs_bp.route('/schedules', methods=['POST'])
@jwt_required()
def add_schedule():
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    data = request.get_json() or {}
    bus_id = data.get('bus_id')
    route_id = data.get('route_id')
    departure_time = data.get('departure_time')
    arrival_time = data.get('arrival_time')
    travel_date = data.get('travel_date') # YYYY-MM-DD
    fare = data.get('fare')
    
    if not bus_id or not route_id or not departure_time or not arrival_time or not travel_date or not fare:
        return jsonify({'error': 'Missing required fields: bus_id, route_id, departure_time, arrival_time, travel_date, fare'}), 400
        
    bus = Bus.query.get(bus_id)
    route = Route.query.get(route_id)
    if not bus or not route:
        return jsonify({'error': 'Invalid bus_id or route_id'}), 404
        
    schedule = Schedule(
        bus_id=bus_id,
        route_id=route_id,
        departure_time=departure_time,
        arrival_time=arrival_time,
        travel_date=travel_date,
        fare=fare,
        available_seats=bus.total_seats
    )
    
    db.session.add(schedule)
    db.session.commit()
    return jsonify(schedule.to_dict()), 201

@rs_bp.route('/schedules/<int:schedule_id>', methods=['PUT'])
@jwt_required()
def update_schedule(schedule_id):
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    schedule = Schedule.query.get(schedule_id)
    if not schedule:
        return jsonify({'error': 'Schedule not found'}), 404
        
    data = request.get_json() or {}
    if 'bus_id' in data:
        bus = Bus.query.get(data['bus_id'])
        if not bus:
            return jsonify({'error': 'Bus not found'}), 404
        schedule.bus_id = data['bus_id']
    if 'route_id' in data:
        route = Route.query.get(data['route_id'])
        if not route:
            return jsonify({'error': 'Route not found'}), 404
        schedule.route_id = data['route_id']
    if 'departure_time' in data:
        schedule.departure_time = data['departure_time']
    if 'arrival_time' in data:
        schedule.arrival_time = data['arrival_time']
    if 'travel_date' in data:
        schedule.travel_date = data['travel_date']
    if 'fare' in data:
        schedule.fare = int(data['fare'])
    if 'available_seats' in data:
        schedule.available_seats = int(data['available_seats'])
        
    db.session.commit()
    return jsonify(schedule.to_dict()), 200

@rs_bp.route('/schedules/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_schedule(schedule_id):
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    schedule = Schedule.query.get(schedule_id)
    if not schedule:
        return jsonify({'error': 'Schedule not found'}), 404
        
    db.session.delete(schedule)
    db.session.commit()
    return jsonify({'message': 'Schedule deleted successfully'}), 200
