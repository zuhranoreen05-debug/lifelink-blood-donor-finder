# LifeLink: Blood Donor Finder

A full stack web app that connects blood recipients with nearby donors in emergencies.

## Features
- Separate registration and login for donors and recipients
- Recipients create blood requests (blood group, units, hospital, urgency, location)
- Donors see requests and accept or reject them
- Recipients see live status: accepted, pending and rejected donors
- Real-time updates with Socket.io
- Map-based donor search (Leaflet and OpenStreetMap)
- Geospatial queries with a MongoDB 2dsphere index
- A donor's phone number is shared only after they accept

## Tech stack
Next.js, React, TypeScript, Tailwind CSS, Node.js, Express, MongoDB (Mongoose), Socket.io, Leaflet

## Run locally

1. Clone the repository

2. Backend
   cd backend
   npm install
   Create a `.env` file with:
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   npm run dev

3. Frontend (in a new terminal)
   cd frontend
   npm install
   npm run dev

4. Open http://localhost:3000

## Note
This is a demo project. Login uses a phone number only (no OTP yet).