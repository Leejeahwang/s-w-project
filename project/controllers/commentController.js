const db = require('../db');

// 댓글 목록 조회 (GET )
exports.getComments = (req, res) => {
  const noteId = req.params.noteId;
  const query = `
    SELECT c.id, c.content, c.created_at, u.user_id AS author
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

// 댓글 작성 (POST /notes/:id/comments)
exports.createComment = async (req, res) => {
  if (!req.session.user || !req.session.user.userId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const noteId = req.params.id;
  const userId = req.session.user.user_id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
  }

  try {
    const [insertResult] = await db.promise().query(
      'INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)',
      [noteId, userId, content.trim()]
    );

    const [rows] = await db.promise().query(`
      SELECT c.id, c.content, c.created_at, u.user_id AS author
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`, [insertResult.insertId]);

    return res.redirect(`/notes/${noteId}`);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "댓글 작성 중 오류가 발생했습니다" });
  }
};

// 댓글 수정 (PUT /notes/:id/comments/:commentId)
exports.updateComment = async (req, res, next) => {
  const noteId = req.params.id;
  const commentId = req.params.commentId;
  const { content } = req.body;
  const userId = req.session.user.user_id;

  if(!content || !content.trim()) return res.status(400).json({ message: '수정할 내용을 입력해주세요.' });
  
  try {
    await db.promise().query(
      'UPDATE comments SET content = ? WHERE id = ? AND user_id = ?',
      [content, commentId, userId]
    );

    return res.redirect(`/notes/${noteId}`);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "댓글 수정 중 오류가 발생했습니다" });
  }
};

// 댓글 삭제 (DELETE /notes/:id/comments/:commentId)
exports.deleteComment = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const commentId = req.params.commentId;
    const userId = req.session.user.user_id;

    await db.promise().query(
      'DELETE FROM comments WHERE id = ? AND user_id = ?',
      [commentId, userId]
    );
    res.redirect(`/notes/${noteId}`);
  } catch (e) {
    next(e);
  }
};