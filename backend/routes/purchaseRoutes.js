const express = require('express');

const router = express.Router();

const {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
} = require('../controllers/purchaseController');

// GET all purchases
router.get('/', getAllPurchases);

// GET one purchase by ID
router.get('/:id', getPurchaseById);

// POST - Create a new purchase
router.post('/', createPurchase);

// PUT - Update a purchase
router.put('/:id', updatePurchase);

// DELETE - Delete a purchase
router.delete('/:id', deletePurchase);

module.exports = router;