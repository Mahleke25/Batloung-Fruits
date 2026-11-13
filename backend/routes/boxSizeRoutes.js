const express = require('express');

const router = express.Router();

const {
    getAllBoxSizes,
    getBoxSizeById,
    createBoxSize,
    updateBoxSize,
    deleteBoxSize
} = require('../controllers/boxSizeController');

// GET all box sizes
router.get('/', getAllBoxSizes);

// GET one box size by ID
router.get('/:id', getBoxSizeById);

// POST - Create a new box size
router.post('/', createBoxSize);

// PUT - Update a box size
router.put('/:id', updateBoxSize);

// DELETE - Delete a box size
router.delete('/:id', deleteBoxSize);

module.exports = router;