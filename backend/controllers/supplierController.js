const db = require('../config/db');

// Get all suppliers
const getAllSuppliers = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM suppliers ORDER BY SupplierID ASC'
        );

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching suppliers:', error);

        res.status(500).json({
            message: 'Failed to fetch suppliers',
            error: error.message
        });
    }
};


// Get one supplier by ID
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM suppliers WHERE SupplierID = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error fetching supplier:', error);

        res.status(500).json({
            message: 'Failed to fetch supplier',
            error: error.message
        });
    }
};


// Create a new supplier
const createSupplier = async (req, res) => {
    try {
        const {
            SupplierName,
            Province,
            ContactPerson,
            Telephone,
            Email,
            PhysicalAddress
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO suppliers
            (SupplierName, Province, ContactPerson, Telephone, Email, PhysicalAddress)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                SupplierName,
                Province,
                ContactPerson,
                Telephone,
                Email,
                PhysicalAddress
            ]
        );

        res.status(201).json({
            message: 'Supplier created successfully',
            supplierId: result.insertId
        });

    } catch (error) {
        console.error('Error creating supplier:', error);

        res.status(500).json({
            message: 'Failed to create supplier',
            error: error.message
        });
    }
};


// Update a supplier
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            SupplierName,
            Province,
            ContactPerson,
            Telephone,
            Email,
            PhysicalAddress
        } = req.body;

        const [result] = await db.query(
            `UPDATE suppliers
             SET SupplierName = ?,
                 Province = ?,
                 ContactPerson = ?,
                 Telephone = ?,
                 Email = ?,
                 PhysicalAddress = ?
             WHERE SupplierID = ?`,
            [
                SupplierName,
                Province,
                ContactPerson,
                Telephone,
                Email,
                PhysicalAddress,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            message: 'Supplier updated successfully'
        });

    } catch (error) {
        console.error('Error updating supplier:', error);

        res.status(500).json({
            message: 'Failed to update supplier',
            error: error.message
        });
    }
};


// Delete a supplier
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM suppliers WHERE SupplierID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            message: 'Supplier deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting supplier:', error);

        res.status(500).json({
            message: 'Failed to delete supplier',
            error: error.message
        });
    }
};


// Export all controller functions
module.exports = {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
};