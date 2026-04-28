# NPL Bidding Application

A real-time bidding application for the Nepal Premier League (NPL) built with React, Python (Flask), and SQLite.

## Features
- Real-time bidding updates via Socket.IO
- Responsive design for Mobile, Tablet, and Desktop
- RESTful API with Flask
- Lightweight SQLite database

## Prerequisites
- Node.js (v16+)
- Python (v3.9+)

## Installation

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. `pip install -r requirements.txt`
5. `python app.py`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm start`

## Deployment
The application can be deployed to platforms like Render, Heroku, or AWS.
- **Frontend**: Deploy `frontend` folder to Vercel/Netlify.
- **Backend**: Deploy `backend` folder to Render/Heroku with a persistent disk for `npl_bidding.db`.
