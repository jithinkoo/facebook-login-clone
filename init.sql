-- SQL script to initialize the PostgreSQL database table
-- Create users table if it does not already exist

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    mobile_or_email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
