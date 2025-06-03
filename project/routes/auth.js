const express = require('express');
const db = require('../db');
const router = express.Router();
const authController = require('../controllers/authController');

// auth.js => /auth

// 로그인 폼 (GET /auth/login)
router.get('/login', authController.login_rendering);

// 로그인 처리 (POST /auth/login)
router.post('/login', authController.login);

// 회원가입 폼 (GET /auth/signup)
router.get('/signup', authController.signup_rendering);

// 회원가입 처리 (POST /auth/signup)
router.post('/signup', authController.signup);

// 로그아웃 (GET /auth/logout)
router.get('/logout', authController.logout);

module.exports = router;