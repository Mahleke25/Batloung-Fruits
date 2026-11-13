const db = require('../config/db');

// Get all fruits
const getAllFruits = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM fruits ORDER BY FruitID ASC'
        );

        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching fruits:', error);

        return res.status(500).json({
            message: 'Failed to fetch fruits',
            error: error.message
        });
    }
};


// Get one fruit by ID
const getFruitById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM fruits WHERE FruitID = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Fruit not found'
            });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching fruit:', error);

        return res.status(500).json({
            message: 'Failed to fetch fruit',
            error: error.message
        });
    }
};


// Create a new fruit
const createFruit = async (req, res) => {
    try {
        const { FruitName } = req.body;
        const Status = req.body.Status || 'Active';

        if (!FruitName || !FruitName.trim()) {
            return res.status(400).json({
                message: 'Fruit name is required'
            });
        }

        const [result] = await db.query(
            'INSERT INTO fruits (FruitName, Status) VALUES (?, ?)',
            [FruitName.trim(), Status]
        );

        return res.status(201).json({
            message: 'Fruit created successfully',
            fruitId: result.insertId
        });
    } catch (error) {
        console.error('Error creating fruit:', error);

        return res.status(500).json({
            message: 'Failed to create fruit',
            error: error.message
        });
    }
};


// Update a fruit name, status, or both
const updateFruit = async (req, res) => {
    try {
        const { id } = req.params;
        const { FruitName, Status } = req.body;

        // Build the update from fields actually supplied.
        const fields = [];
        const values = [];

        if (FruitName !== undefined) {
            if (
                typeof FruitName !== 'string' ||
                !FruitName.trim()
            ) {
                return res.status(400).json({
                    message: 'Fruit name cannot be empty'
                });
            }

            fields.push('FruitName = ?');
            values.push(FruitName.trim());
        }

        if (Status !== undefined) {
            const normalizedStatus = String(Status).trim();

            if (!['Active', 'Inactive'].includes(normalizedStatus)) {
                return res.status(400).json({
                    message: 'Status must be Active or Inactive'
                });
            }

            fields.push('Status = ?');
            values.push(normalizedStatus);
        }

        if (fields.length === 0) {
            return res.status(400).json({
                message: 'Provide a fruit name or status to update'
            });
        }

        values.push(id);

        const [result] = await db.query(
            `UPDATE fruits SET ${fields.join(', ')} WHERE FruitID = ?`,
            values
        );

        // affectedRows can be zero when the requested values are
        // identical to the values already stored, so check existence.
        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                'SELECT FruitID FROM fruits WHERE FruitID = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: 'Fruit not found'
                });
            }
        }

        return res.status(200).json({
            message: 'Fruit updated successfully'
        });
    } catch (error) {
        console.error('Error updating fruit:', error);

        return res.status(500).json({
            message: 'Failed to update fruit',
            error: error.message
        });
    }
};


// Delete a fruit
const deleteFruit = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM fruits WHERE FruitID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Fruit not found'
            });
        }

        return res.status(200).json({
            message: 'Fruit deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting fruit:', error);

        return res.status(500).json({
            message: 'Failed to delete fruit',
            error: error.message
        });
    }
};


// Export controller functions
module.exports = {
    getAllFruits,
    getFruitById,
    createFruit,
    updateFruit,
    deleteFruit
};