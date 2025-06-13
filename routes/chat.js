const express = require('express');
const router  = express.Router();
const chatCtrl = require('../controllers/chatController');

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/auth/login');
}

// 채팅방 목록
router.get('/', isAuthenticated, chatCtrl.listRooms);

// 채팅방 생성 폼
router.get('/create', isAuthenticated, chatCtrl.showCreateForm);

// 채팅방 생성 처리
router.post('/create', isAuthenticated, chatCtrl.createRoom);

// 채팅방 삭제
router.post('/:id/delete', isAuthenticated, chatCtrl.deleteRoom);

// 채팅방 입장
router.get('/:roomId', isAuthenticated, chatCtrl.enterRoom);

module.exports = router;
