-- SQL script to initialize the PostgreSQL database tables
-- Create users table if it does not already exist

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    mobile_or_email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table if it does not already exist
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    price VARCHAR(50) NOT NULL,
    img_url TEXT NOT NULL, -- Will store Unsplash image URLs or Base64 uploaded images
    location VARCHAR(100) NOT NULL,
    seller VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
