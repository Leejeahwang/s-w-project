const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// index.js => /

router.get('/', indexController.getIndex);

module.exports = router;