import os
import io
import datetime
from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import qrcode
import pandas as pd
from models import db, Booking, Passenger, Schedule, Bus, Route, User, Payment

# ReportLab Imports
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

reports_bp = Blueprint('tickets_reports', __name__)

def check_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@reports_bp.route('/tickets/<string:booking_id>/pdf', methods=['GET'])
@jwt_required()
def download_ticket_pdf(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if booking.user_id != current_user_id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized to view this ticket'}), 403
        
    # Generate QR Code image in memory
    qr_data = f"Booking ID: {booking.booking_id}\nUser ID: {booking.user_id}\nRoute: {booking.schedule.route.source} to {booking.schedule.route.destination}\nTravel Date: {booking.schedule.travel_date}\nSeats: {', '.join([p.seat_number for p in booking.passengers])}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    # Generate PDF in memory using ReportLab
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0066cc'),
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceBefore=10,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#555555')
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    banner_text = ParagraphStyle(
        'BannerText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.white,
        alignment=1 # Center
    )
    
    # Header Banner Table
    header_data = [
        [Paragraph("BusGo E-Ticket & Boarding Pass", banner_text)]
    ]
    header_table = Table(header_data, colWidths=[540])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0066cc')),
        ('PADDING', (0,0), (-1,-1), 12),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    
    # Info Section
    info_data = [
        [Paragraph("Booking Details", h2_style), Paragraph("Travel Details", h2_style)],
        [
            Paragraph(f"<b>Booking ID:</b> {booking.booking_id}<br/>"
                      f"<b>Booked By:</b> {booking.user.full_name}<br/>"
                      f"<b>Status:</b> {booking.booking_status}<br/>"
                      f"<b>Total Paid:</b> ₹{booking.total_amount}", body_style),
            Paragraph(f"<b>Bus Operator:</b> {booking.schedule.bus.bus_name}<br/>"
                      f"<b>Bus Number:</b> {booking.schedule.bus.bus_number}<br/>"
                      f"<b>Bus Type:</b> {booking.schedule.bus.bus_type}<br/>"
                      f"<b>Date:</b> {booking.schedule.travel_date}", body_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))
    
    # Routing Banner Section
    routing_data = [
        [
            Paragraph(f"<b>BOARDING POINT</b><br/><font size=14><b>{booking.schedule.departure_time}</b></font><br/>{booking.schedule.route.source}", body_style),
            Paragraph("<font size=20>&rarr;</font><br/>Direct Trip", ParagraphStyle('CenterText', parent=body_style, alignment=1)),
            Paragraph(f"<b>DROPPING POINT</b><br/><font size=14><b>{booking.schedule.arrival_time}</b></font><br/>{booking.schedule.route.destination}", ParagraphStyle('RightText', parent=body_style, alignment=2))
        ]
    ]
    routing_table = Table(routing_data, colWidths=[200, 140, 200])
    routing_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f2f8ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#ccddee')),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(routing_table)
    story.append(Spacer(1, 15))
    
    # Passengers & Seat Allocation List
    story.append(Paragraph("Passenger List", h2_style))
    passenger_rows = [[Paragraph("<b>Passenger Name</b>", body_bold), Paragraph("<b>Age</b>", body_bold), Paragraph("<b>Gender</b>", body_bold), Paragraph("<b>Seat Number</b>", body_bold)]]
    for p in booking.passengers:
        passenger_rows.append([
            Paragraph(p.passenger_name, body_style),
            Paragraph(str(p.age), body_style),
            Paragraph("Male" if p.gender == 'M' else "Female", body_style),
            Paragraph(p.seat_number, body_bold)
        ])
    passenger_table = Table(passenger_rows, colWidths=[220, 80, 100, 140])
    passenger_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e6e6e6')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cccccc')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(passenger_table)
    story.append(Spacer(1, 20))
    
    # Ticket Validation QR Code
    qr_draw = Image(qr_buffer, width=110, height=110)
    validation_data = [
        [
            Paragraph("<b>Verification Guide</b><br/>"
                      "1. Please arrive at the boarding point 15 minutes before departure.<br/>"
                      "2. Present this PDF ticket and a valid ID to the bus conductor.<br/>"
                      "3. The conductor will scan the QR code to verify details.<br/>"
                      "4. Safe travels with BusGo!", body_style),
            qr_draw
        ]
    ]
    validation_table = Table(validation_data, colWidths=[400, 140])
    validation_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e0e0e0')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fafafa')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(KeepTogether(validation_table))
    
    # Build Document
    doc.build(story)
    
    # Output PDF
    pdf_buffer.seek(0)
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"ticket_{booking.booking_id}.pdf",
        mimetype="application/pdf"
    )

@reports_bp.route('/tickets/<string:booking_id>/email', methods=['POST'])
@jwt_required()
def email_ticket(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if booking.user_id != current_user_id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    # Simulated email sending
    print(f"EMAIL SENT TO {booking.user.email} (CC: ticket verification) for booking {booking_id}")
    return jsonify({'message': f'Ticket successfully emailed to {booking.user.email}'}), 200


# PANDAS REPORT GENERATOR
@reports_bp.route('/admin/reports/revenue', methods=['GET'])
@jwt_required()
def export_revenue_report():
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized'}), 403
        
    export_format = request.args.get('format', 'excel') # 'excel' or 'csv'
    
    # Query Confirmed bookings with schedules & routes
    bookings = db.session.query(Booking).join(Schedule).join(Route).filter(
        Booking.booking_status == 'Confirmed'
    ).all()
    
    records = []
    for b in bookings:
        records.append({
            'Booking ID': b.booking_id,
            'User': b.user.full_name,
            'Email': b.user.email,
            'Route': f"{b.schedule.route.source} to {b.schedule.route.destination}",
            'Travel Date': b.schedule.travel_date,
            'Fare (INR)': b.schedule.fare,
            'Seats Booked': len(b.passengers),
            'Total Amount (INR)': b.total_amount,
            'Booking Date': b.created_at.strftime('%Y-%m-%d %H:%M') if b.created_at else ''
        })
        
    df = pd.DataFrame(records)
    
    if df.empty:
        # Create empty placeholder columns
        df = pd.DataFrame(columns=['Booking ID', 'User', 'Email', 'Route', 'Travel Date', 'Fare (INR)', 'Seats Booked', 'Total Amount (INR)', 'Booking Date'])
        
    output_buffer = io.BytesIO()
    
    if export_format == 'csv':
        df.to_csv(output_buffer, index=False)
        output_buffer.seek(0)
        return send_file(
            output_buffer,
            as_attachment=True,
            download_name=f"revenue_report_{datetime.date.today()}.csv",
            mimetype="text/csv"
        )
    else: # Excel
        with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Revenue Statistics', index=False)
        output_buffer.seek(0)
        return send_file(
            output_buffer,
            as_attachment=True,
            download_name=f"revenue_report_{datetime.date.today()}.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

@reports_bp.route('/admin/reports/occupancy', methods=['GET'])
@jwt_required()
def export_occupancy_report():
    if not check_admin(int(get_jwt_identity())):
        return jsonify({'error': 'Unauthorized'}), 403
        
    export_format = request.args.get('format', 'excel')
    
    # Query active schedules
    schedules = Schedule.query.all()
    
    records = []
    for s in schedules:
        booked_seats = db.session.query(Passenger).join(Booking).filter(
            Booking.schedule_id == s.schedule_id,
            Booking.booking_status == 'Confirmed'
        ).count()
        
        occupancy_rate = (booked_seats / s.bus.total_seats) * 100 if s.bus.total_seats > 0 else 0
        
        records.append({
            'Schedule ID': s.schedule_id,
            'Bus Name': s.bus.bus_name,
            'Bus Number': s.bus.bus_number,
            'Bus Type': s.bus.bus_type,
            'Route': f"{s.route.source} to {s.route.destination}",
            'Date': s.travel_date,
            'Time': f"{s.departure_time} - {s.arrival_time}",
            'Total Seats': s.bus.total_seats,
            'Booked Seats': booked_seats,
            'Occupancy Rate (%)': round(occupancy_rate, 2)
        })
        
    df = pd.DataFrame(records)
    
    if df.empty:
        df = pd.DataFrame(columns=['Schedule ID', 'Bus Name', 'Bus Number', 'Bus Type', 'Route', 'Date', 'Time', 'Total Seats', 'Booked Seats', 'Occupancy Rate (%)'])
        
    output_buffer = io.BytesIO()
    
    if export_format == 'csv':
        df.to_csv(output_buffer, index=False)
        output_buffer.seek(0)
        return send_file(
            output_buffer,
            as_attachment=True,
            download_name=f"occupancy_report_{datetime.date.today()}.csv",
            mimetype="text/csv"
        )
    else: # Excel
        with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Fleet Occupancy', index=False)
        output_buffer.seek(0)
        return send_file(
            output_buffer,
            as_attachment=True,
            download_name=f"occupancy_report_{datetime.date.today()}.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
