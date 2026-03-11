# Station Map System (MVP)

A station map system — Phase 1 (MVP). Displays GNSS stations on an interactive map, allows date selection, and downloads RINEX files from AWS S3 using pre-signed URLs. All data at this stage is mock data.

## Features

- Interactive map displaying GNSS station locations across Israel
- Station details with observation records
- Date-based RINEX file downloads via pre-signed S3 URLs
- Fully containerized with Docker Compose

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, React-Leaflet |
| Backend | Node.js, Express |
| Database | MongoDB |
| Storage | AWS S3 |
| Testing | Jest, Vitest, fast-check (property-based) |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.js            # Express entry point
│   │   ├── config.js            # Environment variable validation
│   │   ├── db/connection.js     # MongoDB connection
│   │   ├── models/Station.js    # Mongoose schema
│   │   ├── routes/              # API routes
│   │   ├── services/s3.js       # Pre-signed URL generation
│   │   └── middleware/          # Input validation
│   ├── scripts/seed.js          # Mock data seeder
│   ├── __tests__/               # Backend tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── utils/dateUtils.js   # Date formatting
│   │   ├── api.js               # API client
│   │   └── __tests__/           # Frontend tests
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Docker and Docker Compose **or**
- Node.js 20+, MongoDB, and AWS credentials with S3 access

### Option 1: Docker (Recommended)

1. Create a `.env` file at the project root:

   ```env
   S3_BUCKET_NAME=your-bucket-name
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   ```

2. Start all services:

   ```bash
   docker compose up --build
   ```

3. Access the application:

   | Service | URL |
   |---------|-----|
   | Frontend | http://localhost:3000 |
   | Backend API | http://localhost:5000 |
   | MongoDB | localhost:27017 |

### Option 2: Local Development

**Backend:**

```bash
cd backend
cp .env.example .env    # Edit with your MongoDB URI, S3 bucket, and AWS region
npm install
npm run seed            # Populate mock data
npm start               # Starts on port 5000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev             # Starts on port 5173
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stations` | List all stations (id, name, location) |
| GET | `/api/stations/:id` | Full station details with observation records |
| GET | `/api/download?station=ID&date=YYYY-MM-DD` | Get a pre-signed S3 download URL |

## Testing

```bash
# Backend (Jest + fast-check)
cd backend && npm test

# Frontend (Vitest + fast-check)
cd frontend && npm test
```

## Seed Data

```bash
cd backend
npm run seed
```

Inserts 5 GNSS stations (TELA, RAMO, KABR, ELAT, MRAV) with coordinates in Israel and uploads mock RINEX files to S3.
