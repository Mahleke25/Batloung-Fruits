const db = require('../config/db');

// Get all vendors
const getAllVendors = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM streetvendors ORDER BY VendorID ASC'
        );

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching vendors:', error);

        res.status(500).json({
            message: 'Failed to fetch vendors',
            error: error.message
        });
    }
};


// Get one vendor by ID
const getVendorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM streetvendors WHERE VendorID = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Vendor not found'
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error fetching vendor:', error);

        res.status(500).json({
            message: 'Failed to fetch vendor',
            error: error.message
        });
    }
};


// Create a new vendor
const createVendor = async (req, res) => {
    try {
        const {
            VendorName,
            BusinessName,
            Telephone,
            Location,
            RegistrationDate,
            Status
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO streetvendors
            (VendorName, BusinessName, Telephone, Location, RegistrationDate, Status)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                VendorName,
                BusinessName,
                Telephone,
                Location,
                RegistrationDate,
                Status
            ]
        );

        res.status(201).json({
            message: 'Vendor created successfully',
            vendorId: result.insertId
        });

    } catch (error) {
        console.error('Error creating vendor:', error);

        res.status(500).json({
            message: 'Failed to create vendor',
            error: error.message
        });
    }
};


// Update a vendor
const updateVendor = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            VendorName,
            BusinessName,
            Telephone,
            Location,
            RegistrationDate,
            Status
        } = req.body;

        const [result] = await db.query(
            `UPDATE streetvendors
             SET VendorName = ?,
                 BusinessName = ?,
                 Telephone = ?,
                 Location = ?,
                 RegistrationDate = ?,
                 Status = ?
             WHERE VendorID = ?`,
            [
                VendorName,
                BusinessName,
                Telephone,
                Location,
                RegistrationDate,
                Status,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Vendor not found'
            });
        }

        res.status(200).json({
            message: 'Vendor updated successfully'
        });

    } catch (error) {
        console.error('Error updating vendor:', error);

        res.status(500).json({
            message: 'Failed to update vendor',
            error: error.message
        });
    }
};


// Delete a vendor
const deleteVendor = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM streetvendors WHERE VendorID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Vendor not found'
            });
        }

        res.status(200).json({
            message: 'Vendor deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting vendor:', error);

        res.status(500).json({
            message: 'Failed to delete vendor',
            error: error.message
        });
    }
};


// Export all vendor controller functions
module.exports = {
    getAllVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor
};