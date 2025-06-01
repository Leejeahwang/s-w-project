const express = require('express');
const router = express.Router();

// 홈으로 접속 시 /notes 로 리디렉트
router.get('/', (req, res) => {
  res.redirect('/notes');
});

// /chat 페이지 렌더링
router.get('/chat', (req, res) => {
  res.render('chat', { user: req.session.user });
});

module.exports = router;