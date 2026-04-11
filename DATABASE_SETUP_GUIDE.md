# 🏥 Veterinary Network - Database Setup Guide

## 📋 Prerequisites

Before setting up the databases, ensure you have the following installed:

### PostgreSQL
- **Version**: 12 or higher
- **Download**: https://www.postgresql.org/download/
- **Default credentials**: postgres/password (change in production)

### MongoDB
- **Version**: 4.4 or higher
- **Download**: https://www.mongodb.com/try/download/community
- **Default URI**: mongodb://localhost:27017

### Redis (Optional but recommended)
- **Version**: 6.0 or higher
- **Download**: https://redis.io/download
- **Default URL**: redis://localhost:6379

## 🗄️ Database Setup Steps

### 1. PostgreSQL Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE veterinary_db;

# Exit PostgreSQL
\q

# Run the setup script
psql -U postgres -d veterinary_db -f database-setup.sql
```

### 2. MongoDB Setup

```bash
# Start MongoDB (if not running)
mongod

# Run the setup script in a new terminal
mongo mongodb-setup.js
```

### 3. Environment Configuration

The `.env` files are already configured with default values. Update them with your actual credentials:

#### Frontend (.env)
- `VITE_FIREBASE_*` - Your Firebase configuration
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

#### Backend (server/.env)
- `POSTGRES_URL` - Your PostgreSQL connection string
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Generate a strong random key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `SMTP_*` - Your email service credentials

### 4. Database Migration Commands

```bash
# Install dependencies
cd server
npm install

# Run TypeORM migrations (if needed)
npm run typeorm migration:run

# Start the backend server
npm run dev
```

## 🔧 Database Schema Overview

### PostgreSQL Tables

#### Users
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email
- `passwordHash` (VARCHAR) - Encrypted password
- `fullName` (VARCHAR) - User full name
- `role` (VARCHAR) - user/vet/admin
- `createdAt` (TIMESTAMP) - Creation date

#### Vet Profiles
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key to users
- `licenseNumber` (VARCHAR) - Veterinary license
- `clinicName` (VARCHAR) - Clinic name
- `specialization` (VARCHAR) - Vet specialization
- `yearsOfExperience` (INTEGER) - Experience years
- `education` (VARCHAR) - Educational background
- `country` (VARCHAR) - Country of practice
- `phone` (VARCHAR) - Contact phone
- `verified` (BOOLEAN) - Verification status

#### Appointments
- `id` (UUID) - Primary key
- `userId` (UUID) - Customer ID
- `vetId` (UUID) - Veterinarian ID
- `title` (VARCHAR) - Appointment title
- `description` (TEXT) - Detailed description
- `scheduledTime` (TIMESTAMP) - Scheduled time
- `duration` (INTEGER) - Duration in minutes
- `status` (VARCHAR) - pending/confirmed/cancelled/completed
- `price` (DECIMAL) - Appointment price

#### Pet Records
- `id` (UUID) - Primary key
- `userId` (UUID) - Owner ID
- `petName` (VARCHAR) - Pet name
- `species` (VARCHAR) - Pet species
- `breed` (VARCHAR) - Pet breed
- `age` (INTEGER) - Pet age
- `weight` (DECIMAL) - Pet weight
- `gender` (VARCHAR) - male/female/unknown
- `medicalHistory` (TEXT) - Medical history
- `vaccinationRecords` (TEXT) - Vaccination records
- `allergies` (TEXT) - Known allergies
- `currentMedications` (TEXT) - Current medications

#### Reviews
- `id` (UUID) - Primary key
- `userId` (UUID) - Reviewer ID
- `vetId` (UUID) - Veterinarian ID
- `rating` (INTEGER) - 1-5 star rating
- `title` (VARCHAR) - Review title
- `comment` (TEXT) - Review comment

#### Payments
- `id` (UUID) - Primary key
- `userId` (UUID) - Payer ID
- `appointmentId` (UUID) - Related appointment
- `stripePaymentId` (VARCHAR) - Stripe payment ID
- `amount` (DECIMAL) - Payment amount
- `currency` (VARCHAR) - Payment currency
- `status` (VARCHAR) - Payment status

#### File Assets
- `id` (UUID) - Primary key
- `userId` (UUID) - Uploader ID
- `filename` (VARCHAR) - Stored filename
- `originalName` (VARCHAR) - Original filename
- `mimetype` (VARCHAR) - File type
- `size` (BIGINT) - File size
- `path` (VARCHAR) - File path
- `uploadType` (VARCHAR) - profile/pet/document/report

### MongoDB Collections

#### messages
- Direct messages between users
- Group chat messages
- System notifications

#### conversations
- Private conversations
- Group conversations
- Last message tracking

#### notifications
- User notifications
- System alerts
- Appointment reminders

#### chatRooms
- Group chat rooms
- Veterinary discussion forums
- Emergency alert channels

## 🔍 Database Maintenance

### Regular Tasks

```bash
# PostgreSQL maintenance
psql -U postgres -d veterinary_db -c "VACUUM ANALYZE;"

# MongoDB maintenance
mongo --eval "db.runCommand({compact: 'messages'})"
```

### Backup Strategy

```bash
# PostgreSQL backup
pg_dump -U postgres veterinary_db > backup_$(date +%Y%m%d_%H%M%S).sql

# MongoDB backup
mongodump --db veterinary_chat --out backup_$(date +%Y%m%d_%H%M%S)
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused**: Check if PostgreSQL/MongoDB services are running
2. **Authentication failed**: Verify credentials in .env files
3. **Table not found**: Run database setup scripts again
4. **Port conflicts**: Ensure ports 5432 (PostgreSQL) and 27017 (MongoDB) are available

### Support

If you encounter any issues:
1. Check the server logs in `server/logs/`
2. Verify database connections
3. Ensure all environment variables are set correctly
4. Check firewall settings for database ports

## 📊 Performance Optimization

- All tables have proper indexes for common queries
- Foreign key constraints ensure data integrity
- Database connections are pooled for efficiency
- Redis caching is implemented for frequently accessed data

---

**Note**: This is a development setup. For production deployment, ensure you:
- Use strong passwords
- Enable SSL/TLS encryption
- Set up proper firewall rules
- Configure regular backups
- Monitor database performance