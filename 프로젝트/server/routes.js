// 클라이언트가 요청한 URL에 맞는 처리 실행
// URL => GET, POST, PUT, DELETE

const express = require('express');
const router = express.Router();
const db = require('./db');

// 좋아요, 다운로드 수 가져오기
router.get('/stats/:id', async (req, res) => {
  const noteId = req.params.id;
  try {
    const [rows] = await db.pool.query(
      "SELECT like_count, download_count FROM notes WHERE notesId = ?",
      [noteId]
    );
    if(rows.length === 0) return res.status(404).send("Note not Found");
    res.json(rows[0]);
  }
  catch(err) {
    console.error(err);
    res.status(500).send("DB 오류");
  }
});

// 좋아요 증가
router.post('/like/:id/like', async (req, res) => {
  const noteId = req.params.id;
  try {
    await db.pool.query(
      "UPDATE notes SET like_count = like_count+1 WHERE noteId = ?",
      [noteId]
    );
    res.json({ success: true });
  }
  catch(err) {
    console.error(err);
    res.status(500).send("DB 에러");
  }
})

// 다운로드 수 증가
router.post('/download/:id', async (req, res) => {
  const noteId = req.params.id;
  try {
    await db.pool.query(
      "UPDATE notes SET like_count = like_count+1 WHERE noteId = ?",
      [noteId]
    );
    res.json({ success: true });
  }
  catch(err) {
    console.error(err);
    res.status(500).send("DB 에러");
  }
});

// 댓글 등록 라우터가 있어야 함
router.post('/comments', async (req, res) => {
  const { noteId, content } = req.body;
  const userId = 1; // (임시) 실제로는 로그인 세션에서 받아야 함

  if (!noteId || !content) {
    return res.status(400).json({ message: 'noteId와 content는 필수입니다' });
  }

  try {
    await db.pool.query(
      'INSERT INTO comments (noteId, userId, content) VALUES (?, ?, ?)',
      [noteId, userId, content]
    );

    // 작성자 이름 가져오기 (선택)
    const [userRows] = await db.pool.query('SELECT name FROM users WHERE userId = ?', [userId]);
    const username = userRows[0]?.name || '익명';

    res.json({ success: true, username, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'DB 오류' });
  }
});


module.exports = router;
