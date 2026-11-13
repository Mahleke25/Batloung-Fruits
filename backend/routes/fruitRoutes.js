const express = require('express');

const router = express.Router();

const {
    getAllFruits,
    getFruitById,
    createFruit,
    updateFruit,
    deleteFruit
} = require('../controllers/fruitController');

// GET all fruits
router.get('/', getAllFruits);

// GET one fruit by ID
router.get('/:id', getFruitById);

// POST - Create a new fruit
router.post('/', createFruit);

// PUT - Update a fruit
router.put('/:id', updateFruit);

// DELETE - Delete a fruit
router.delete('/:id', deleteFruit);

module.exports = router;