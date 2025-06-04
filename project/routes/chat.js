const express = require('express');
const router = express.Router();
const db = require('../db'); // MySQL 연결 모듈 (예: mysql2/promise)

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next(); // 로그인 되어있으면 계속 진행
  } else {
    res.redirect('/login'); // 로그인 안 되어있으면 로그인 페이지로 리다이렉트
  }
}

// 채팅방 목록
router.get('/', isAuthenticated, async (req, res) => {
  const [rooms] = await db.promise().query(`
    SELECT r.*, u.user_id AS creator 
    FROM chat_rooms r 
    JOIN users u ON r.created_by = u.user_id
    ORDER BY r.created_at DESC
  `);
  res.render('chat/index', { user: req.session.user, rooms });
});

// 채팅방 생성 페이지
router.get('/create', isAuthenticated, (req, res) => {
  res.render('chat/create');
});

// 채팅방 생성 처리
router.post('/create', isAuthenticated, async (req, res) => {
  const { name } = req.body;
  const userId = req.session.user.user_id;
  await db.promise().query('INSERT INTO chat_rooms (name, created_by) VALUES (?, ?)', [name, userId]);
  res.redirect('/chat');
});

// 채팅방 삭제
// 내부 함수
async function getRoomById(roomId) {
  const [rows] = await db.promise().query('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
  return rows[0];
}

async function deleteRoomById(roomId) {
  await db.promise().query('DELETE FROM chat_rooms WHERE id = ?', [roomId]);
}

// 방 삭제 라우트
router.post('/:id/delete', async (req, res) => {
  const roomId = req.params.id;
  const currentUserId = req.session.user?.user_id;

  const room = await getRoomById(roomId);
  if (!room) {
    return res.status(404).send('존재하지 않는 방입니다.');
  }

  if (room.created_by !== currentUserId) {
    return res.status(403).send('방 생성자만 삭제할 수 있습니다.');
  }

  await deleteRoomById(roomId);
  res.redirect('/chat');
});

// 채팅방 입장
router.get('/:roomId', isAuthenticated, async (req, res) => {
  const [rooms] = await db.promise().query('SELECT * FROM chat_rooms WHERE id = ?', [req.params.roomId]);
  if (rooms.length === 0) return res.status(404).send('방을 찾을 수 없습니다.');
  res.render('chat/room', { user: req.session.user, room: rooms[0] });
});

module.exports = router;
