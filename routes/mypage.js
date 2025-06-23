const express = require('express');
const router  = express.Router();
const mpCtrl  = require('../controllers/myPageController');

// 로그인 여부 확인용 간단 함수
function ensureLoggedIn(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/auth/login');
}

// 마이페이지 조회
router.get('/', ensureLoggedIn, mpCtrl.showMyPage);

// 정보 수정 (이름, studentId 제외)
router.put('/', ensureLoggedIn, mpCtrl.updateProfile);

// 회원 탈퇴
router.delete('/', ensureLoggedIn, mpCtrl.deleteAccount);

module.exports = router;