const db = require('../config/db');

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                p.ProductID,
                p.FruitID,
                f.FruitName,
                p.BoxSizeID,
                b.SizeName,
                p.SellingPrice,
                p.Status
            FROM products p
            INNER JOIN fruits f ON p.FruitID = f.FruitID
            INNER JOIN boxsizes b ON p.BoxSizeID = b.BoxSizeID
            ORDER BY p.ProductID ASC
        `);

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching products:', error);

        res.status(500).json({
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

// Get one product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                p.ProductID,
                p.FruitID,
                f.FruitName,
                p.BoxSizeID,
                b.SizeName,
                p.SellingPrice,
                p.Status
            FROM products p
            INNER JOIN fruits f ON p.FruitID = f.FruitID
            INNER JOIN boxsizes b ON p.BoxSizeID = b.BoxSizeID
            WHERE p.ProductID = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error fetching product:', error);

        res.status(500).json({
            message: 'Failed to fetch product',
            error: error.message
        });
    }
};

// Create a new product
const createProduct = async (req, res) => {
    try {
        const {
            FruitID,
            BoxSizeID,
            SellingPrice,
            Status
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO products
            (FruitID, BoxSizeID, SellingPrice, Status)
            VALUES (?, ?, ?, ?)
        `, [
            FruitID,
            BoxSizeID,
            SellingPrice,
            Status
        ]);

        res.status(201).json({
            message: 'Product created successfully',
            productId: result.insertId
        });

    } catch (error) {
        console.error('Error creating product:', error);

        res.status(500).json({
            message: 'Failed to create product',
            error: error.message
        });
    }
};

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            FruitID,
            BoxSizeID,
            SellingPrice,
            Status
        } = req.body;

        const [result] = await db.query(`
            UPDATE products
            SET FruitID = ?,
                BoxSizeID = ?,
                SellingPrice = ?,
                Status = ?
            WHERE ProductID = ?
        `, [
            FruitID,
            BoxSizeID,
            SellingPrice,
            Status,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.status(200).json({
            message: 'Product updated successfully'
        });

    } catch (error) {
        console.error('Error updating product:', error);

        res.status(500).json({
            message: 'Failed to update product',
            error: error.message
        });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM products WHERE ProductID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.status(200).json({
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting product:', error);

        res.status(500).json({
            message: 'Product deleted successfully'
        });
    }
};

// Export all functions
module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};