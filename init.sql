-- SQL script to initialize the PostgreSQL database tables
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

-- Create videos table to store YouTube embeds
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    youtube_id VARCHAR(50) NOT NULL, -- e.g., "dQw4w9WgXcQ"
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
