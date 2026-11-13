const db = require('../config/db');

// Get all box sizes
const getAllBoxSizes = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM boxsizes ORDER BY BoxSizeID ASC'
        );

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching box sizes:', error);

        res.status(500).json({
            message: 'Failed to fetch box sizes',
            error: error.message
        });
    }
};

// Get one box size by ID
const getBoxSizeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM boxsizes WHERE BoxSizeID = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Box size not found'
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error fetching box size:', error);

        res.status(500).json({
            message: 'Failed to fetch box size',
            error: error.message
        });
    }
};

// Create a new box size
const createBoxSize = async (req, res) => {
    try {
        const { SizeName } = req.body;

        const [result] = await db.query(
            'INSERT INTO boxsizes (SizeName) VALUES (?)',
            [SizeName]
        );

        res.status(201).json({
            message: 'Box size created successfully',
            boxSizeId: result.insertId
        });

    } catch (error) {
        console.error('Error creating box size:', error);

        res.status(500).json({
            message: 'Failed to create box size',
            error: error.message
        });
    }
};

// Update a box size
const updateBoxSize = async (req, res) => {
    try {
        const { id } = req.params;
        const { SizeName } = req.body;

        const [result] = await db.query(
            'UPDATE boxsizes SET SizeName = ? WHERE BoxSizeID = ?',
            [SizeName, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Box size not found'
            });
        }

        res.status(200).json({
            message: 'Box size updated successfully'
        });

    } catch (error) {
        console.error('Error updating box size:', error);

        res.status(500).json({
            message: 'Failed to update box size',
            error: error.message
        });
    }
};

// Delete a box size
const deleteBoxSize = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM boxsizes WHERE BoxSizeID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Box size not found'
            });
        }

        res.status(200).json({
            message: 'Box size deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting box size:', error);

        res.status(500).json({
            message: 'Failed to delete box size',
            error: error.message
        });
    }
};

// Export all functions
module.exports = {
    getAllBoxSizes,
    getBoxSizeById,
    createBoxSize,
    updateBoxSize,
    deleteBoxSize
};