const db = require('../db');

// 댓글 목록 조회
exports.getComments = (req, res) => {
  const noteId = req.params.noteId;
  const query = `
    SELECT c.id, c.content, c.created_at, u.username AS author
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.note_id = ?
    ORDER BY c.created_at ASC
  `;
  db.query(query, [noteId], (err, results) => {
    if (err) {
      console.error('댓글 조회 오류:', err);
      return res.status(500).json({ message: '댓글 조회 중 오류가 발생했습니다.' });
    }
    res.json(results);
  });
};

// 댓글 작성
exports.createComment = (req, res) => {
  if (!req.session.user || !req.session.user.userId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const noteId = req.params.noteId;
  const userId = req.session.user.userId;
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
  }
  const insert = 'INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)';
  db.query(insert, [noteId, userId, content.trim()], (err, result) => {
    if (err) {
      console.error('댓글 작성 오류:', err);
      return res.status(500).json({ message: '댓글 작성 중 오류가 발생했습니다.' });
    }
    const fetch = `
      SELECT c.id, c.content, c.created_at, u.username AS author
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    db.query(fetch, [result.insertId], (e, rows) => {
      if (e || rows.length === 0) {
        return res.status(201).json({ id: result.insertId, content: content.trim(), author: req.session.user.username });
      }
      res.status(201).json(rows[0]);
    });
  });
};