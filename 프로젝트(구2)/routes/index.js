const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/',        (req, res) => res.sendFile(path.join(__dirname, '../views/index.html')));
router.get('/login.html',  (req, res) => res.sendFile(path.join(__dirname, '../views/login.html')));
router.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, '../views/signup.html')));
router.get('/note_detail.html', (req, res) => res.sendFile(path.join(__dirname, '../views/note_detail.html')));
// 편의상 /note_detail 도 동일하게 처리
router.get('/note_detail', (req, res) => res.sendFile(path.join(__dirname, '../views/note_detail.html')));

module.exports = router;