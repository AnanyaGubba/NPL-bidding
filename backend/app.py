from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret!'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///npl_bidding.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    skill_set = db.Column(db.String(100)) # Added skill_set (Batting, Bowling, or both)
    base_price = db.Column(db.Float, nullable=False)
    current_bid = db.Column(db.Float, default=0.0)
    highest_bidder = db.Column(db.String(100))
    status = db.Column(db.String(20), default='available') # available, pending_acceptance, sold
    assigned_team = db.Column(db.String(100)) # The team that won the player

class Bid(db.Model):

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    bidder_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)

@app.route('/items', methods=['GET'])
def get_items():
    items = Item.query.all()
    return jsonify([{
        'id': i.id,
        'name': i.name,
        'skill_set': i.skill_set,
        'base_price': i.base_price,
        'current_bid': i.current_bid,
        'highest_bidder': i.highest_bidder,
        'status': i.status,
        'assigned_team': i.assigned_team
    } for i in items])

@app.route('/bid', methods=['POST'])
def place_bid():
    data = request.json
    item_id = data.get('item_id')
    bidder_name = data.get('bidder_name')
    amount = data.get('amount')

    item = Item.query.get(item_id)
    if not item or item.status != 'available':
        return jsonify({'error': 'Item not available for bidding'}), 400

    if amount <= item.current_bid or amount < item.base_price:
        return jsonify({'error': 'Bid must be higher than current bid and base price'}), 400

    item.current_bid = amount
    item.highest_bidder = bidder_name
    
    new_bid = Bid(item_id=item_id, bidder_name=bidder_name, amount=amount)
    db.session.add(new_bid)
    db.session.commit()

    socketio.emit('new_bid', {
        'item_id': item_id,
        'current_bid': amount,
        'highest_bidder': bidder_name,
        'status': item.status
    })

    return jsonify({'message': 'Bid placed successfully'})

@app.route('/accept-bid', methods=['POST'])
def accept_bid():
    data = request.json
    item_id = data.get('item_id')
    
    item = Item.query.get(item_id)
    if not item or not item.highest_bidder:
        return jsonify({'error': 'No bid to accept'}), 400
    
    item.status = 'sold'
    item.assigned_team = item.highest_bidder
    db.session.commit()
    
    socketio.emit('bid_accepted', {
        'item_id': item_id,
        'assigned_team': item.assigned_team
    })
    
    return jsonify({'message': f'Player {item.name} sold to {item.assigned_team}'})


@app.route('/reject-bid', methods=['POST'])
def reject_bid():
    data = request.json
    item_id = data.get('item_id')
    
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
        
    item.current_bid = item.base_price
    item.highest_bidder = None
    db.session.commit()
    
    socketio.emit('bid_rejected', {
        'item_id': item_id,
        'current_bid': item.base_price,
        'highest_bidder': None
    })
    
    return jsonify({'message': 'Bid rejected'})

if __name__ == '__main__':
    with app.app_context():
        db.drop_all() # Reset for fresh schema
        db.create_all()
        # Seed data with required fields
        seed_data = [
            Item(name="Sandeep Lamichhane", skill_set="Bowling (Leg-spin)", base_price=500.0, current_bid=500.0),
            Item(name="Dipendra Singh Airee", skill_set="All-rounder", base_price=450.0, current_bid=450.0),
            Item(name="Kushal Bhurtel", skill_set="Batting strength", base_price=300.0, current_bid=300.0),
            Item(name="Sompal Kami", skill_set="Bowling strength (Fast)", base_price=400.0, current_bid=400.0),
            Item(name="Aasif Sheikh", skill_set="Batting strength", base_price=250.0, current_bid=250.0),
        ]
        db.session.bulk_save_objects(seed_data)
        db.session.commit()
    socketio.run(app, debug=True, port=5000)

