import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Bus, Schedule, Route, Booking, Passenger, User

buses_bp = Blueprint('buses', __name__)

def check_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@buses_bp.route('/search', methods=['GET'])
def search_buses():
    source = request.args.get('from', '').strip()
    destination = request.args.get('to', '').strip()
    travel_date = request.args.get('date', '').strip() # YYYY-MM-DD
    
    if not source or not destination or not travel_date:
        return jsonify({'error': 'Missing search parameters: from, to, and date are required'}), 400
        
    # Find matching schedules by querying the Schedule model, joining with Route
    query = db.session.query(Schedule).join(Route).join(Bus).filter(
        Route.source == source,
        Route.destination == destination,
        Schedule.travel_date == travel_date,
        Bus.status == 'Active'
    )
    
    # Filter by type if provided
    bus_types = request.args.getlist('types') or request.args.get('types', '').split(',')
    bus_types = [t for t in bus_types if t]
    if bus_types:
        query = query.filter(Bus.bus_type.in_(bus_types))
        
    # Filter by max price if provided
    max_price = request.args.get('max_price')
    if max_price:
        try:
            query = query.filter(Schedule.fare <= int(max_price))
        except ValueError:
            pass
            
    schedules = query.all()
    
    # Map back to a clean JSON structure that the frontend expects
    results = []
    for s in schedules:
        # Calculate live seats left by checking booked passengers
        booked_seats_count = db.session.query(Passenger).join(Booking).filter(
            Booking.schedule_id == s.schedule_id,
            Booking.booking_status.in_(['Confirmed', 'Pending'])
        ).count()
        
        seats_left = max(0, s.bus.total_seats - booked_seats_count)
        
        results.append({
            'schedule_id': s.schedule_id,
            'bus_id': s.bus.bus_id,
            'operator': s.bus.bus_name,
            'busNumber': s.bus.bus_number,
            'type': s.bus.bus_type,
            'departure': s.departure_time,
            'arrival': s.arrival_time,
            'duration': f"{s.route.duration // 60}h {s.route.duration % 60}m",
            'from': s.route.source,
            'to': s.route.destination,
            'fare': s.fare,
            'rating': 4.5, # Fixed fallback or calculated average
            'seatsLeft': seats_left,
            'totalSeats': s.bus.total_seats,
            'amenities': s.bus.get_amenities(),
            'boardingPoints': [f"{s.route.source} Terminal", f"{s.route.source} Bypass"],
            'droppingPoints': [f"{s.route.destination} Bypass", f"{s.route.destination} Center"]
        })
        
    # Sort results
    sort_by = request.args.get('sort', 'departure')
    if sort_by == 'price':
        results.sort(key=lambda x: x['fare'])
    elif sort_by == 'rating':
        results.sort(key=lambda x: x['rating'], reverse=True)
    else: # default departure sorting
        results.sort(key=lambda x: x['departure'])
        
    return jsonify(results), 200

@buses_bp.route('/<int:bus_id>', methods=['GET'])
def get_bus_details(bus_id):
    bus = Bus.query.get(bus_id)
    if not bus:
        return jsonify({'error': 'Bus not found'}), 404
    return jsonify(bus.to_dict()), 200

@buses_bp.route('/schedule/<int:schedule_id>/seats', methods=['GET'])
def get_schedule_seats(schedule_id):
    schedule = Schedule.query.get(schedule_id)
    if not schedule:
        return jsonify({'error': 'Schedule not found'}), 404
        
    bus = schedule.bus
    
    # Query all active booked seats on this schedule
    booked_passengers = db.session.query(Passenger).join(Booking).filter(
        Booking.schedule_id == schedule_id,
        Booking.booking_status.in_(['Confirmed', 'Pending'])
    ).all()
    
    booked_map = {p.seat_number: p.gender for p in booked_passengers}
    
    # Generate structured seat map (36 seat sleeper layout: 18 lower deck, 18 upper deck)
    # 6 rows, 3 columns per row (2-1 layout structure: col 1 & col 2 are together, col 3 is single across aisle)
    seats = []
    per_deck = bus.total_seats // 2
    rows = max(1, per_deck // 3)
    
    for deck in ['lower', 'upper']:
        for r in range(1, rows + 1):
            for c in range(1, 4):
                seat_id = f"{'L' if deck == 'lower' else 'U'}{r}{'S' if c == 3 else c}"
                
                # Check status
                status = 'available'
                if seat_id in booked_map:
                    status = 'booked'
                    if booked_map[seat_id] == 'F':
                        status = 'female'
                        
                seats.append({
                    'id': seat_id,
                    'row': r,
                    'col': c,
                    'deck': deck,
                    'status': status
                })
                
    return jsonify({
        'schedule_id': schedule.schedule_id,
        'bus': bus.to_dict(),
        'route': schedule.route.to_dict(),
        'fare': schedule.fare,
        'seats': seats,
        'boardingPoints': [f"{schedule.route.source} Terminal 07:00", f"{schedule.route.source} Bypass 07:30"],
        'droppingPoints': [f"{schedule.route.destination} Bypass 16:30", f"{schedule.route.destination} Center 17:00"]
    }), 200

@buses_bp.route('', methods=['GET'])
def list_all_buses():
    buses = Bus.query.all()
    return jsonify([b.to_dict() for b in buses]), 200

# ADMIN FLURRY ENDPOINTS
@buses_bp.route('', methods=['POST'])
@jwt_required()
def add_bus():
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    data = request.get_json() or {}
    bus_name = data.get('bus_name')
    bus_number = data.get('bus_number')
    bus_type = data.get('bus_type')
    total_seats = data.get('total_seats', 36)
    amenities = data.get('amenities', [])
    status = data.get('status', 'Active')
    
    if not bus_name or not bus_number or not bus_type:
        return jsonify({'error': 'Missing fields: bus_name, bus_number, and bus_type are required'}), 400
        
    if Bus.query.filter_by(bus_number=bus_number).first():
        return jsonify({'error': 'Bus number already exists'}), 400
        
    bus = Bus(
        bus_name=bus_name,
        bus_number=bus_number,
        bus_type=bus_type,
        total_seats=total_seats,
        status=status
    )
    bus.set_amenities(amenities)
    
    db.session.add(bus)
    db.session.commit()
    
    return jsonify(bus.to_dict()), 201

@buses_bp.route('/<int:bus_id>', methods=['PUT'])
@jwt_required()
def update_bus(bus_id):
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    bus = Bus.query.get(bus_id)
    if not bus:
        return jsonify({'error': 'Bus not found'}), 404
        
    data = request.get_json() or {}
    if 'bus_name' in data:
        bus.bus_name = data['bus_name']
    if 'bus_number' in data:
        # Check uniqueness
        existing = Bus.query.filter_by(bus_number=data['bus_number']).first()
        if existing and existing.bus_id != bus_id:
            return jsonify({'error': 'Bus number already exists'}), 400
        bus.bus_number = data['bus_number']
    if 'bus_type' in data:
        bus.bus_type = data['bus_type']
    if 'total_seats' in data:
        bus.total_seats = data['total_seats']
    if 'amenities' in data:
        bus.set_amenities(data['amenities'])
    if 'status' in data:
        bus.status = data['status']
        
    db.session.commit()
    return jsonify(bus.to_dict()), 200

@buses_bp.route('/<int:bus_id>', methods=['DELETE'])
@jwt_required()
def delete_bus(bus_id):
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403
        
    bus = Bus.query.get(bus_id)
    if not bus:
        return jsonify({'error': 'Bus not found'}), 404
        
    db.session.delete(bus)
    db.session.commit()
    return jsonify({'message': 'Bus deleted successfully'}), 200
