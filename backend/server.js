const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

// Existing routes
const fruitRoutes = require('./routes/fruitRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const boxSizeRoutes = require('./routes/boxSizeRoutes');
const productRoutes = require('./routes/productRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Existing API routes
app.use('/api/fruits', fruitRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/boxsizes', boxSizeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);

// STOCK API - registered directly in server.js
app.get('/api/stock', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                p.ProductID,
                f.FruitName,
                b.SizeName,
                p.SellingPrice,
                COALESCE(pur.TotalPurchased, 0) AS TotalPurchased,
                COALESCE(ord.TotalCommitted, 0) AS TotalCommitted,
                COALESCE(pur.TotalPurchased, 0)
                    - COALESCE(ord.TotalCommitted, 0) AS StockAvailable
            FROM products p
            INNER JOIN fruits f
                ON p.FruitID = f.FruitID
            INNER JOIN boxsizes b
                ON p.BoxSizeID = b.BoxSizeID
            LEFT JOIN (
                SELECT ProductID, SUM(Quantity) AS TotalPurchased
                FROM purchases
                GROUP BY ProductID
            ) pur ON p.ProductID = pur.ProductID
            LEFT JOIN (
                SELECT
                    oi.ProductID,
                    SUM(oi.Quantity) AS TotalCommitted
                FROM orderitems oi
                INNER JOIN orders o ON oi.OrderID = o.OrderID
                WHERE o.Status IN (
                    'Confirmed',
                    'Processing',
                    'Ready for Collection/Delivery',
                    'Completed'
                )
                GROUP BY oi.ProductID
            ) ord ON p.ProductID = ord.ProductID
            ORDER BY f.FruitName ASC, b.SizeName ASC
        `);

        return res.status(200).json(rows);
    } catch (error) {
        console.error('Stock API error:', error);
        return res.status(500).json({
            message: 'Failed to fetch stock',
            error: error.message
        });
    }
});

// Home route
app.get('/', (req, res) => {
    res.send('Batloung Fruits API is running!');
});

// Database connection test
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 AS result');
        res.json({
            message: 'MySQL connection successful!',
            result: rows
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            message: 'MySQL connection failed',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});