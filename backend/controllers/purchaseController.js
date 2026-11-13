const db = require('../config/db');

// Validate purchase input
function validatePurchase(body) {
    const { SupplierID, ProductID, Quantity, PurchasePrice } = body;

    if (
        SupplierID === undefined ||
        ProductID === undefined ||
        Quantity === undefined ||
        PurchasePrice === undefined ||
        SupplierID === '' ||
        ProductID === '' ||
        Quantity === '' ||
        PurchasePrice === ''
    ) {
        return 'Please fill in all required purchase fields.';
    }

    if (
        !Number.isInteger(Number(SupplierID)) ||
        Number(SupplierID) <= 0 ||
        !Number.isInteger(Number(ProductID)) ||
        Number(ProductID) <= 0
    ) {
        return 'Please select a valid supplier and product.';
    }

    if (!Number.isInteger(Number(Quantity)) || Number(Quantity) <= 0) {
        return 'Quantity must be a whole number greater than zero.';
    }

    if (
        !Number.isFinite(Number(PurchasePrice)) ||
        Number(PurchasePrice) < 0
    ) {
        return 'Purchase price must be zero or greater.';
    }

    return null;
}

// Get all purchases
const getAllPurchases = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                p.PurchaseID,
                p.SupplierID,
                s.SupplierName,
                s.Province,
                p.ProductID,
                f.FruitName,
                b.SizeName,
                p.Quantity,
                p.PurchasePrice,
                (p.Quantity * p.PurchasePrice) AS TotalCost,
                p.PurchaseDate
            FROM purchases p
            INNER JOIN suppliers s
                ON p.SupplierID = s.SupplierID
            INNER JOIN products pr
                ON p.ProductID = pr.ProductID
            INNER JOIN fruits f
                ON pr.FruitID = f.FruitID
            INNER JOIN boxsizes b
                ON pr.BoxSizeID = b.BoxSizeID
            ORDER BY p.PurchaseID DESC
        `);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({
            message: 'Failed to fetch purchases'
        });
    }
};

// Get one purchase
const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid purchase ID.'
            });
        }

        const [rows] = await db.query(`
            SELECT
                p.PurchaseID,
                p.SupplierID,
                s.SupplierName,
                s.Province,
                p.ProductID,
                f.FruitName,
                b.SizeName,
                p.Quantity,
                p.PurchasePrice,
                (p.Quantity * p.PurchasePrice) AS TotalCost,
                p.PurchaseDate
            FROM purchases p
            INNER JOIN suppliers s
                ON p.SupplierID = s.SupplierID
            INNER JOIN products pr
                ON p.ProductID = pr.ProductID
            INNER JOIN fruits f
                ON pr.FruitID = f.FruitID
            INNER JOIN boxsizes b
                ON pr.BoxSizeID = b.BoxSizeID
            WHERE p.PurchaseID = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Purchase not found.'
            });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching purchase:', error);
        res.status(500).json({
            message: 'Failed to fetch purchase.'
        });
    }
};

// Create a purchase
const createPurchase = async (req, res) => {
    try {
        const validationError = validatePurchase(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const {
            SupplierID,
            ProductID,
            Quantity,
            PurchasePrice,
            PurchaseDate
        } = req.body;

        let result;

        if (PurchaseDate) {
            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(PurchaseDate) ||
                Number.isNaN(Date.parse(`${PurchaseDate}T00:00:00`))
            ) {
                return res.status(400).json({
                    message: 'Please provide a valid purchase date.'
                });
            }

            [result] = await db.query(`
                INSERT INTO purchases
                    (SupplierID, ProductID, Quantity, PurchasePrice, PurchaseDate)
                VALUES (?, ?, ?, ?, ?)
            `, [
                Number(SupplierID),
                Number(ProductID),
                Number(Quantity),
                Number(PurchasePrice),
                PurchaseDate
            ]);
        } else {
            [result] = await db.query(`
                INSERT INTO purchases
                    (SupplierID, ProductID, Quantity, PurchasePrice)
                VALUES (?, ?, ?, ?)
            `, [
                Number(SupplierID),
                Number(ProductID),
                Number(Quantity),
                Number(PurchasePrice)
            ]);
        }

        res.status(201).json({
            message: 'Purchase created successfully.',
            purchaseId: result.insertId
        });
    } catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).json({
            message: 'Failed to create purchase. Check that the selected supplier and product exist.'
        });
    }
};

// Update a purchase
const updatePurchase = async (req, res) => {
    try {
        const validationError = validatePurchase(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid purchase ID.'
            });
        }

        const {
            SupplierID,
            ProductID,
            Quantity,
            PurchasePrice,
            PurchaseDate
        } = req.body;

        if (
            PurchaseDate &&
            (
                !/^\d{4}-\d{2}-\d{2}$/.test(PurchaseDate) ||
                Number.isNaN(Date.parse(`${PurchaseDate}T00:00:00`))
            )
        ) {
            return res.status(400).json({
                message: 'Please provide a valid purchase date.'
            });
        }

        const [result] = await db.query(`
            UPDATE purchases
            SET SupplierID = ?,
                ProductID = ?,
                Quantity = ?,
                PurchasePrice = ?,
                PurchaseDate = COALESCE(?, PurchaseDate)
            WHERE PurchaseID = ?
        `, [
            Number(SupplierID),
            Number(ProductID),
            Number(Quantity),
            Number(PurchasePrice),
            PurchaseDate || null,
            id
        ]);

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                'SELECT PurchaseID FROM purchases WHERE PurchaseID = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: 'Purchase not found.'
                });
            }
        }

        res.status(200).json({
            message: 'Purchase updated successfully.'
        });
    } catch (error) {
        console.error('Error updating purchase:', error);
        res.status(500).json({
            message: 'Failed to update purchase. Check that the selected supplier and product exist.'
        });
    }
};

// Delete a purchase
const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid purchase ID.'
            });
        }

        const [result] = await db.query(
            'DELETE FROM purchases WHERE PurchaseID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Purchase not found.'
            });
        }

        res.status(200).json({
            message: 'Purchase deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({
            message: 'Failed to delete purchase.'
        });
    }
};

module.exports = {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
};