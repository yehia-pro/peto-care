-- 001_create_tables.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  license_number VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS pets (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id),
  name VARCHAR(200),
  species VARCHAR(100),
  breed VARCHAR(200),
  dob DATE
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  pet_id INTEGER REFERENCES pets(id),
  vet_id INTEGER REFERENCES vets(id),
  scheduled_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  pet_id INTEGER REFERENCES pets(id),
  title VARCHAR(255),
  file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
