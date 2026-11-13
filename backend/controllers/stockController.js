const db = require('../config/db');

// Get available stock for every product
const getStock = async (req, res) => {
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
                SELECT
                    ProductID,
                    SUM(Quantity) AS TotalPurchased
                FROM purchases
                GROUP BY ProductID
            ) pur
                ON p.ProductID = pur.ProductID

            LEFT JOIN (
                SELECT
                    oi.ProductID,
                    SUM(oi.Quantity) AS TotalCommitted
                FROM orderitems oi
                INNER JOIN orders o
                    ON oi.OrderID = o.OrderID
                WHERE o.Status IN (
                    'Confirmed',
                    'Processing',
                    'Ready for Collection/Delivery',
                    'Completed'
                )
                GROUP BY oi.ProductID
            ) ord
                ON p.ProductID = ord.ProductID

            ORDER BY f.FruitName ASC, b.SizeName ASC
        `);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching stock:', error);

        res.status(500).json({
            message: 'Failed to fetch stock',
            error: error.message
        });
    }
};

module.exports = {
    getStock
};