import datetime
from app import create_app, bcrypt
from models import db, User, UserProfile, Bus, Route, Schedule, Review

def seed_database():
    app = create_app()
    with app.app_context():
        print("Recreating database tables...")
        db.drop_all()
        db.create_all()
        
        # 1. Seed Users
        print("Seeding users...")
        admin_pwd = bcrypt.generate_password_hash('admin123').decode('utf-8')
        user_pwd = bcrypt.generate_password_hash('user123').decode('utf-8')
        
        admin = User(
            full_name="System Administrator",
            email="admin@busgo.com",
            mobile_number="9876543210",
            password_hash=admin_pwd,
            role="admin"
        )
        db.session.add(admin)
        
        user1 = User(
            full_name="John Doe",
            email="user@busgo.com",
            mobile_number="9876543211",
            password_hash=user_pwd,
            role="user"
        )
        db.session.add(user1)
        
        user2 = User(
            full_name="Aarav Sharma",
            email="aarav@example.com",
            mobile_number="9988776655",
            password_hash=user_pwd,
            role="user"
        )
        db.session.add(user2)
        
        db.session.commit()
        
        # Initialize profiles
        db.session.add(UserProfile(user_id=admin.user_id, bio="Core administrator."))
        db.session.add(UserProfile(user_id=user1.user_id, bio="Avid traveler."))
        db.session.add(UserProfile(user_id=user2.user_id, bio="Weekend commuter."))
        db.session.commit()
        
        # 2. Seed Buses
        print("Seeding buses...")
        buses = [
            Bus(bus_name="VRL Travels", bus_number="KA-01-3456", bus_type="AC Sleeper", total_seats=36, amenities='["WiFi", "Charging Point", "Water Bottle", "Blanket"]', status="Active"),
            Bus(bus_name="SRS Travels", bus_number="TN-09-7821", bus_type="AC Seater", total_seats=40, amenities='["WiFi", "Charging Point", "Water Bottle"]', status="Active"),
            Bus(bus_name="Orange Tours", bus_number="MH-12-9988", bus_type="Luxury Coach", total_seats=30, amenities='["WiFi", "Charging Point", "Snacks", "Blanket", "Entertainment"]', status="Active"),
            Bus(bus_name="RedBus Express", bus_number="AP-05-2244", bus_type="Non-AC Sleeper", total_seats=36, amenities='["Charging Point", "Water Bottle"]', status="Active"),
            Bus(bus_name="Neeta Tours", bus_number="MH-04-7711", bus_type="AC Sleeper", total_seats=36, amenities='["WiFi", "Charging Point", "Blanket", "Water Bottle"]', status="Active")
        ]
        for b in buses:
            db.session.add(b)
        db.session.commit()
        
        # 3. Seed Routes
        print("Seeding routes...")
        routes = [
            Route(source="Bengaluru", destination="Mumbai", distance=980.0, duration=840),
            Route(source="Delhi", destination="Jaipur", distance=270.0, duration=300),
            Route(source="Pune", destination="Goa", distance=440.0, duration=540),
            Route(source="Hyderabad", destination="Chennai", distance=630.0, duration=690)
        ]
        for r in routes:
            db.session.add(r)
        db.session.commit()
        
        # 4. Seed Schedules
        print("Seeding schedules for the next 15 days...")
        # Get active dates
        base_date = datetime.date.today()
        dates = [base_date + datetime.timedelta(days=i) for i in range(-2, 14)]
        
        # Schedule setups: (bus_index, route_index, dep_time, arr_time, fare)
        schedule_templates = [
            (0, 0, "21:30", "06:45", 1499), # VRL Travels Bengaluru-Mumbai
            (1, 0, "22:15", "08:00", 999),  # SRS Travels Bengaluru-Mumbai
            (2, 0, "19:00", "04:30", 1899), # Orange Travels Bengaluru-Mumbai
            (3, 0, "23:00", "09:30", 749),  # RedBus Express Bengaluru-Mumbai
            (4, 0, "20:45", "07:15", 1599), # Neeta Travels Bengaluru-Mumbai
            
            (3, 1, "07:00", "12:00", 399),  # RedBus Express Delhi-Jaipur
            (1, 1, "14:00", "19:00", 499),  # SRS Travels Delhi-Jaipur
            
            (2, 2, "20:00", "05:00", 1199), # Orange Tours Pune-Goa
            (0, 2, "22:00", "07:00", 999),  # VRL Travels Pune-Goa
            
            (1, 3, "23:00", "10:30", 899),  # SRS Travels Hyderabad-Chennai
            (4, 3, "21:00", "08:30", 1299)  # Neeta Tours Hyderabad-Chennai
        ]
        
        for date in dates:
            date_str = date.strftime('%Y-%m-%d')
            for bus_idx, route_idx, dep_time, arr_time, fare in schedule_templates:
                db_bus = buses[bus_idx]
                db_route = routes[route_idx]
                
                # Add schedule
                schedule = Schedule(
                    bus_id=db_bus.bus_id,
                    route_id=db_route.route_id,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    travel_date=date_str,
                    fare=fare,
                    available_seats=db_bus.total_seats
                )
                db.session.add(schedule)
                
        db.session.commit()
        
        # 5. Seed Reviews
        print("Seeding reviews...")
        reviews = [
            Review(user_id=user1.user_id, bus_id=buses[0].bus_id, rating=5, review_text="Excellent travel experience. Highly recommended AC Sleeper! Clean seats and punctual timing."),
            Review(user_id=user2.user_id, bus_id=buses[0].bus_id, rating=4, review_text="Good service. The driving was smooth, blanket provided was clean."),
            Review(user_id=user1.user_id, bus_id=buses[1].bus_id, rating=4, review_text="Comfortable seating. Value for money seater bus option."),
            Review(user_id=user2.user_id, bus_id=buses[2].bus_id, rating=5, review_text="Orange Tours Luxury Coach is a premium experience. WiFi and snacks included!")
        ]
        for rev in reviews:
            db.session.add(rev)
            
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database()
