const express = require('express');
const router = express.Router();

// 홈으로 접속 시 /notes 로 리디렉트
router.get('/', (req, res) => {
  res.redirect('/notes');
});

// // 로그인 확인 미들웨어
// function isLoggedIn(req, res, next) {
//   if (req.session.user) {
//     next(); // 로그인 되어있으면 계속 진행
//   } else {
//     res.redirect('/login'); // 로그인 안 되어있으면 로그인 페이지로 리다이렉트
//   }
// }

// router.get('/chat', isLoggedIn, (req, res) => {
//   res.render('chat', { user: req.session.user });
// });

// /chat 페이지 렌더링
// router.get('/chat', (req, res) => {
//   res.render('chat');  // views/chat.ejs 파일이 있어야 함
// });

module.exports = router;