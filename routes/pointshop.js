const express = require('express');
const router = express.Router();
const pointshopController = require('../controllers/pointshopController');

// pointshop.js => /pointshop

// 포인트샵 페이지 렌더링 (GET /pointshop)
router.get('/', pointshopController.getPointshop);

// 구매하기 (POST /pointshop/buy)
router.post('/buy', pointshopController.getCoupon_1);

module.exports = router;