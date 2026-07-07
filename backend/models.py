import datetime
import json
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    mobile_number = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user') # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade="all, delete-orphan")
    bookings = db.relationship('Booking', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'full_name': self.full_name,
            'email': self.email,
            'mobile_number': self.mobile_number,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    profile_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, unique=True)
    profile_picture_url = db.Column(db.Text, nullable=True)
    bio = db.Column(db.Text, nullable=True)
    address = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'profile_id': self.profile_id,
            'user_id': self.user_id,
            'profile_picture_url': self.profile_picture_url,
            'bio': self.bio,
            'address': self.address
        }

class Bus(db.Model):
    __tablename__ = 'buses'
    
    bus_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    bus_name = db.Column(db.String(100), nullable=False) # e.g. SRS Travels, VRL Travels
    bus_number = db.Column(db.String(30), unique=True, nullable=False)
    bus_type = db.Column(db.String(50), nullable=False) # AC Sleeper, AC Seater, etc.
    total_seats = db.Column(db.Integer, default=36)
    amenities = db.Column(db.Text, default='[]') # JSON string of amenities e.g. ["WiFi", "Water Bottle"]
    status = db.Column(db.String(20), default='Active') # 'Active' or 'Inactive'
    
    # Relationships
    schedules = db.relationship('Schedule', backref='bus', lazy=True, cascade="all, delete-orphan")
    reviews = db.relationship('Review', backref='bus', lazy=True, cascade="all, delete-orphan")
    
    def get_amenities(self):
        try:
            return json.loads(self.amenities)
        except Exception:
            return []
            
    def set_amenities(self, amenities_list):
        self.amenities = json.dumps(amenities_list)

    def to_dict(self):
        return {
            'bus_id': self.bus_id,
            'bus_name': self.bus_name,
            'bus_number': self.bus_number,
            'bus_type': self.bus_type,
            'total_seats': self.total_seats,
            'amenities': self.get_amenities(),
            'status': self.status
        }

class Route(db.Model):
    __tablename__ = 'routes'
    
    route_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    source = db.Column(db.String(100), nullable=False, index=True)
    destination = db.Column(db.String(100), nullable=False, index=True)
    distance = db.Column(db.Float, nullable=False) # in km
    duration = db.Column(db.Integer, nullable=False) # in minutes
    
    # Relationships
    schedules = db.relationship('Schedule', backref='route', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'route_id': self.route_id,
            'source': self.source,
            'destination': self.destination,
            'distance': self.distance,
            'duration': self.duration
        }

class Schedule(db.Model):
    __tablename__ = 'schedules'
    
    schedule_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    bus_id = db.Column(db.Integer, db.ForeignKey('buses.bus_id', ondelete='CASCADE'), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('routes.route_id', ondelete='CASCADE'), nullable=False)
    departure_time = db.Column(db.String(20), nullable=False) # HH:MM
    arrival_time = db.Column(db.String(20), nullable=False) # HH:MM
    travel_date = db.Column(db.String(20), nullable=False, index=True) # YYYY-MM-DD
    fare = db.Column(db.Integer, nullable=False) # base price
    available_seats = db.Column(db.Integer, nullable=False)
    
    # Relationships
    bookings = db.relationship('Booking', backref='schedule', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'schedule_id': self.schedule_id,
            'bus_id': self.bus_id,
            'route_id': self.route_id,
            'departure_time': self.departure_time,
            'arrival_time': self.arrival_time,
            'travel_date': self.travel_date,
            'fare': self.fare,
            'available_seats': self.available_seats,
            'bus': self.bus.to_dict() if self.bus else None,
            'route': self.route.to_dict() if self.route else None
        }

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    booking_id = db.Column(db.String(50), primary_key=True) # e.g. BG9X4K2A
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedules.schedule_id', ondelete='CASCADE'), nullable=False)
    total_amount = db.Column(db.Integer, nullable=False)
    booking_status = db.Column(db.String(20), default='Pending') # Pending, Confirmed, Cancelled, Refunded
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    passengers = db.relationship('Passenger', backref='booking', lazy=True, cascade="all, delete-orphan")
    payments = db.relationship('Payment', backref='booking', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'booking_id': self.booking_id,
            'user_id': self.user_id,
            'schedule_id': self.schedule_id,
            'total_amount': self.total_amount,
            'booking_status': self.booking_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'passengers': [p.to_dict() for p in self.passengers],
            'schedule': self.schedule.to_dict() if self.schedule else None
        }

class Passenger(db.Model):
    __tablename__ = 'passengers'
    
    passenger_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_id = db.Column(db.String(50), db.ForeignKey('bookings.booking_id', ondelete='CASCADE'), nullable=False)
    passenger_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False) # M, F
    seat_number = db.Column(db.String(10), nullable=False)
    
    def to_dict(self):
        return {
            'passenger_id': self.passenger_id,
            'booking_id': self.booking_id,
            'passenger_name': self.passenger_name,
            'age': self.age,
            'gender': self.gender,
            'seat_number': self.seat_number
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    
    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_id = db.Column(db.String(50), db.ForeignKey('bookings.booking_id', ondelete='CASCADE'), nullable=False)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    payment_status = db.Column(db.String(20), default='Pending') # Pending, Success, Failed, Refunded
    payment_method = db.Column(db.String(30), nullable=False) # UPI, Card, Wallet, Net Banking
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'payment_id': self.payment_id,
            'booking_id': self.booking_id,
            'transaction_id': self.transaction_id,
            'amount': self.amount,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    
    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    bus_id = db.Column(db.Integer, db.ForeignKey('buses.bus_id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False) # 1 to 5
    review_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'review_id': self.review_id,
            'user_id': self.user_id,
            'bus_id': self.bus_id,
            'rating': self.rating,
            'review_text': self.review_text,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_name': self.user.full_name if self.user else "Anonymous"
        }
