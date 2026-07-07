import random
import string
import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Booking, Passenger, Payment, Schedule, Bus, User

bookings_bp = Blueprint('bookings_payments', __name__)

def generate_booking_id():
    # BG + 6 random alphanumeric characters
    chars = string.ascii_uppercase + string.digits
    return 'BG' + ''.join(random.choices(chars, k=6))

@bookings_bp.route('/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    schedule_id = data.get('schedule_id')
    seats_list = data.get('seats', []) # List of seat IDs: e.g. ["L11", "L12"]
    passengers_info = data.get('passengers', []) # List of dict: [{'name': 'X', 'age': 25, 'gender': 'M'}]
    contact_email = data.get('email')
    contact_phone = data.get('phone')
    
    if not schedule_id or not seats_list or not passengers_info:
        return jsonify({'error': 'Missing booking details: schedule_id, seats, and passengers list are required'}), 400
        
    schedule = Schedule.query.get(schedule_id)
    if not schedule:
        return jsonify({'error': 'Schedule not found'}), 404
        
    # Check if seat lists and passenger lists align in length
    if len(seats_list) != len(passengers_info):
        return jsonify({'error': 'Passenger details must match selected seats count'}), 400
        
    # Check if seats are already occupied
    occupied_seats = db.session.query(Passenger.seat_number).join(Booking).filter(
        Booking.schedule_id == schedule_id,
        Booking.booking_status.in_(['Confirmed', 'Pending'])
    ).all()
    occupied_seats_set = {s[0] for s in occupied_seats}
    
    for seat in seats_list:
        if seat in occupied_seats_set:
            return jsonify({'error': f'Seat {seat} is already booked or locked'}), 400
            
    # Calculate price
    subtotal = len(seats_list) * schedule.fare
    tax = int(subtotal * 0.05) # 5% tax
    total_amount = subtotal + tax
    
    booking_id = generate_booking_id()
    
    # Save booking in Pending status
    booking = Booking(
        booking_id=booking_id,
        user_id=current_user_id,
        schedule_id=schedule_id,
        total_amount=total_amount,
        booking_status='Pending'
    )
    
    db.session.add(booking)
    
    # Save passengers
    for i, seat in enumerate(seats_list):
        pax_data = passengers_info[i]
        passenger = Passenger(
            booking_id=booking_id,
            passenger_name=pax_data.get('name'),
            age=int(pax_data.get('age', 25)),
            gender=pax_data.get('gender', 'M'),
            seat_number=seat
        )
        db.session.add(passenger)
        
    db.session.commit()
    
    # Return details + Razorpay Payment Order Simulator data
    # In production, we would call:
    #   razorpay_client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
    #   order = razorpay_client.order.create({'amount': total_amount * 100, 'currency': 'INR'})
    # Here, we generate simulated payment details:
    razorpay_order_id = f"order_{''.join(random.choices(string.ascii_lowercase + string.digits, k=14))}"
    
    return jsonify({
        'booking_id': booking_id,
        'total_amount': total_amount,
        'razorpay_order_id': razorpay_order_id,
        'payment_status': 'Pending'
    }), 201

@bookings_bp.route('/payments/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    data = request.get_json() or {}
    booking_id = data.get('booking_id')
    payment_method = data.get('payment_method', 'UPI')
    transaction_id = data.get('transaction_id') # If supplied by client
    status = data.get('status', 'Success') # Simulated status
    
    if not booking_id:
        return jsonify({'error': 'booking_id is required'}), 400
        
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    if booking.booking_status != 'Pending':
        return jsonify({'error': f'Booking is already in {booking.booking_status} state'}), 400
        
    if not transaction_id:
        # Generate random transaction token
        transaction_id = f"txn_{''.join(random.choices(string.ascii_lowercase + string.digits, k=18))}"
        
    if status == 'Success':
        # Update booking
        booking.booking_status = 'Confirmed'
        
        # Add payment record
        payment = Payment(
            booking_id=booking_id,
            transaction_id=transaction_id,
            amount=booking.total_amount,
            payment_status='Success',
            payment_method=payment_method
        )
        db.session.add(payment)
        
        # Deduct schedule seats dynamically
        schedule = Schedule.query.get(booking.schedule_id)
        if schedule:
            booked_count = db.session.query(Passenger).join(Booking).filter(
                Booking.schedule_id == schedule.schedule_id,
                Booking.booking_status == 'Confirmed'
            ).count()
            schedule.available_seats = max(0, schedule.bus.total_seats - booked_count)
            
        db.session.commit()
        
        # Simulated notifications logging
        print(f"NOTIFICATION: Booking Confirmation sent to user for {booking_id}!")
        
        return jsonify({
            'message': 'Payment verified and booking confirmed',
            'booking': booking.to_dict(),
            'transaction_id': transaction_id
        }), 200
    else:
        booking.booking_status = 'Cancelled'
        
        payment = Payment(
            booking_id=booking_id,
            transaction_id=transaction_id,
            amount=booking.total_amount,
            payment_status='Failed',
            payment_method=payment_method
        )
        db.session.add(payment)
        db.session.commit()
        return jsonify({'error': 'Payment failed. Booking cancelled.'}), 400

@bookings_bp.route('/bookings/my', methods=['GET'])
@jwt_required()
def my_bookings():
    current_user_id = int(get_jwt_identity())
    bookings = Booking.query.filter_by(user_id=current_user_id).order_ok = Booking.created_at.desc()
    
    # Sorting by creation date
    bookings = Booking.query.filter_by(user_id=current_user_id).order_by(Booking.created_at.desc()).all()
    
    return jsonify([b.to_dict() for b in bookings]), 200

@bookings_bp.route('/bookings/<string:booking_id>', methods=['GET'])
@jwt_required()
def get_booking_details(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    # Check permissions
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if booking.user_id != current_user_id and user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
        
    return jsonify(booking.to_dict()), 200

@bookings_bp.route('/bookings/<string:booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    if booking.user_id != current_user_id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized to cancel this booking'}), 403
        
    if booking.booking_status == 'Cancelled' or booking.booking_status == 'Refunded':
        return jsonify({'error': 'Booking is already cancelled'}), 400
        
    # Process cancellation
    booking.booking_status = 'Cancelled'
    
    # Process refund simulation
    payments = Payment.query.filter_by(booking_id=booking_id, payment_status='Success').all()
    for p in payments:
        p.payment_status = 'Refunded'
        print(f"REFUND TRIGGERED: Refunded {p.amount} to source for txn {p.transaction_id}")
        
    # Release schedule seats
    schedule = Schedule.query.get(booking.schedule_id)
    if schedule:
        booked_count = db.session.query(Passenger).join(Booking).filter(
            Booking.schedule_id == schedule.schedule_id,
            Booking.booking_status == 'Confirmed'
        ).count()
        schedule.available_seats = max(0, schedule.bus.total_seats - booked_count)
        
    db.session.commit()
    print(f"NOTIFICATION: Cancellation email sent to user for booking {booking_id}!")
    
    return jsonify({
        'message': 'Booking cancelled successfully and refund initiated',
        'booking': booking.to_dict()
    }), 200
