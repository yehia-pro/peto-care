-- Veterinary Database Setup Script
-- This script creates all necessary tables for the veterinary platform

-- Create database (run this separately if needed)
-- CREATE DATABASE veterinary_db;

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'vet', 'admin')),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vet Profiles table
CREATE TABLE IF NOT EXISTS "vet_profile" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID UNIQUE NOT NULL,
    "licenseNumber" VARCHAR(100) NOT NULL,
    "clinicName" VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL,
    education VARCHAR(500) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE IF NOT EXISTS "appointment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "vetId" UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "scheduledTime" TIMESTAMP NOT NULL,
    duration INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    price DECIMAL(10,2) DEFAULT 0.00,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_vet FOREIGN KEY ("vetId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- Pet Records table
CREATE TABLE IF NOT EXISTS "pet_record" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "petName" VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL,
    breed VARCHAR(255),
    age INTEGER,
    weight DECIMAL(5,2),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unknown')),
    color VARCHAR(100),
    "microchipId" VARCHAR(100),
    description TEXT,
    "medicalHistory" TEXT,
    "vaccinationRecords" TEXT,
    "allergies" TEXT,
    "currentMedications" TEXT,
    "emergencyContact" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS "review" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "vetId" UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_vet FOREIGN KEY ("vetId") REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_vet UNIQUE ("userId", "vetId")
);

-- File Assets table (for uploads)
CREATE TABLE IF NOT EXISTS "file_asset" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    path VARCHAR(500) NOT NULL,
    "uploadType" VARCHAR(50) NOT NULL CHECK ("uploadType" IN ('profile', 'pet', 'document', 'report')),
    "relatedId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS "payment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "appointmentId" UUID,
    "stripePaymentId" VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    description TEXT,
    "paymentMethod" VARCHAR(50),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment FOREIGN KEY ("appointmentId") REFERENCES "appointment"(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"(role);
CREATE INDEX IF NOT EXISTS idx_vet_profile_user_id ON "vet_profile"("userId");
CREATE INDEX IF NOT EXISTS idx_vet_profile_verified ON "vet_profile"(verified);
CREATE INDEX IF NOT EXISTS idx_vet_profile_country ON "vet_profile"(country);
CREATE INDEX IF NOT EXISTS idx_appointment_user_id ON "appointment"("userId");
CREATE INDEX IF NOT EXISTS idx_appointment_vet_id ON "appointment"("vetId");
CREATE INDEX IF NOT EXISTS idx_appointment_scheduled_time ON "appointment"("scheduledTime");
CREATE INDEX IF NOT EXISTS idx_appointment_status ON "appointment"(status);
CREATE INDEX IF NOT EXISTS idx_pet_record_user_id ON "pet_record"("userId");
CREATE INDEX IF NOT EXISTS idx_pet_record_species ON "pet_record"(species);
CREATE INDEX IF NOT EXISTS idx_review_user_id ON "review"("userId");
CREATE INDEX IF NOT EXISTS idx_review_vet_id ON "review"("vetId");
CREATE INDEX IF NOT EXISTS idx_review_rating ON "review"(rating);
CREATE INDEX IF NOT EXISTS idx_file_asset_user_id ON "file_asset"("userId");
CREATE INDEX IF NOT EXISTS idx_file_asset_upload_type ON "file_asset"("uploadType");
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON "payment"("userId");
CREATE INDEX IF NOT EXISTS idx_payment_status ON "payment"(status);
CREATE INDEX IF NOT EXISTS idx_payment_stripe_id ON "payment"("stripePaymentId");

-- Insert sample data
INSERT INTO "user" (email, "passwordHash", "fullName", role) VALUES
('admin@veterinarynetwork.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..G', 'System Administrator', 'admin'),
('demo@user.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..G', 'Demo User', 'user');

INSERT INTO "vet_profile" ("userId", "licenseNumber", "clinicName", specialization, "yearsOfExperience", education, country, phone, verified) VALUES
((SELECT id FROM "user" WHERE email = 'admin@veterinarynetwork.com'), 'ADMIN-001', 'Veterinary Network HQ', 'System Administration', 10, 'Computer Science', 'USA', '+1-555-0000', true);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_postgres_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_postgres_user;