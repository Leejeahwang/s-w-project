const express = require('express');
const {
  signup,
  login,
  logout,
  checkLogin
} = require('../controllers/authController');
const router = express.Router();

router.post('/signup',   signup);
router.post('/login',    login);
router.get('/logout',    logout);
router.get('/check-login', checkLogin);

module.exports = router;