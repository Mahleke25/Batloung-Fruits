const express = require('express');

const router = express.Router();

const {
    getAllVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor
} = require('../controllers/vendorController');

// GET all vendors
router.get('/', getAllVendors);

// GET one vendor by ID
router.get('/:id', getVendorById);

// POST - Create a new vendor
router.post('/', createVendor);

// PUT - Update a vendor
router.put('/:id', updateVendor);

// DELETE - Delete a vendor
router.delete('/:id', deleteVendor);

module.exports = router;