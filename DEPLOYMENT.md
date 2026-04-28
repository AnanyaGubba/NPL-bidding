# Deployment Guide

This application is ready for deployment. Follow these steps to deploy both the frontend and backend.

## 1. Backend Deployment (e.g., Render, Railway, or Heroku)

The backend is a Flask app using SQLite. Note that SQLite data will be lost on redeploy unless you use a persistent volume.

### Steps:
1. Push your code to a GitHub repository.
2. Connect the repository to your hosting provider.
3. Set the **Build Command**: `pip install -r requirements.txt`
4. Set the **Start Command**: `gunicorn -k eventlet -w 1 app:app`
5. Ensure the environment variable `PORT` is handled by the provider (Flask/Gunicorn usually does this automatically).

## 2. Frontend Deployment (e.g., Vercel, Netlify)

### Steps:
1. In the `frontend` folder, update the API URL in `App.tsx` and the socket initialization to use your deployed backend URL instead of `localhost`.
   - Change: `axios.get('http://localhost:5000/items')` -> `axios.get('https://your-backend.com/items')`
   - Change: `io('http://localhost:5000')` -> `io('https://your-backend.com')`
2. Connect your GitHub repo to Vercel/Netlify.
3. Set **Root Directory** to `frontend`.
4. **Build Command**: `npm run build`
5. **Output Directory**: `build`

## 3. Environment Variables

- `FLASK_ENV`: set to `production`
- `SECRET_KEY`: set to a long random string
