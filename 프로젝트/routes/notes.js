const express = require('express');
const db = require('../db');
const router = express.Router();

// 1) 목록 + 필터 (GET /notes)
router.get('/', async (req, res, next) => {
  try {
    const { subject = '', professor = '', category = '' } = req.query;
    let sql = `
      SELECT n.id, n.subject, n.professor, n.category, n.summary, n.created_at,
             n.user_id, u.username AS authorName, n.created_at
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.subject LIKE ? AND n.professor LIKE ?
    `;
    const params = [`%${subject}%`, `%${professor}%`];
    if (category) {
      sql += ' AND n.category = ?';
      params.push(category);
    }
    sql += ' ORDER BY n.created_at DESC';
    const [notes] = await db.promise().query(sql, params);
    res.render('index', { notes, filters: { subject, professor, category }, user: req.session.user });
  } catch (e) { next(e); }
});

// 2) 새 노트 작성 폼 및 처리 (로그인 필요)
router.get('/new', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('create', { user: req.session.user });
});
router.post('/', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const u = req.session.user;
    await db.promise().query(
      'INSERT INTO notes (user_id,subject,professor,category,summary) VALUES (?,?,?,?,?)',
      [u.userId, req.body.subject, req.body.professor, req.body.category, req.body.summary]
    );
    res.redirect('/notes');
  } catch (e) { next(e); }
});

// 3) 상세 조회 (GET /notes/:id)
router.get('/:id', async (req, res, next) => {
  try {
    const [[note]] = await db.promise().query(
      `SELECT n.id, n.subject, n.professor, n.category, n.summary,
              n.user_id, u.username AS authorName, n.created_at
       FROM notes n JOIN users u ON n.user_id = u.id
       WHERE n.id = ?`,
      [req.params.id]
    );
    if (!note) return res.status(404).send('노트를 찾을 수 없습니다.');

    const [comments] = await db.promise().query(
      `SELECT c.id, c.content, c.created_at, u.username AS author
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.note_id = ? ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.render('detail', { note, comments, user: req.session.user });
  } catch (e) { next(e); }
});

// 4) 수정 폼 (GET /notes/:id/edit) - 작성자만
router.get('/:id/edit', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [[note]] = await db.promise().query(
      'SELECT id, user_id, subject, professor, category, summary, created_at FROM notes WHERE id = ?',
      [req.params.id]
    );
    if (!note || note.user_id !== req.session.user.userId) {
      return res.redirect('/notes/' + req.params.id);
    }
    res.render('edit', { note, user: req.session.user });
  } catch (e) { next(e); }
});

// 4-1) 수정 처리 (POST /notes/:id/edit) - 작성자만
router.post('/:id/edit', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [[orig]] = await db.promise().query(
      'SELECT user_id FROM notes WHERE id = ?', [req.params.id]
    );
    if (!orig || orig.user_id !== req.session.user.userId) {
      return res.redirect('/notes/' + req.params.id);
    }
    const { subject, professor, category, summary } = req.body;
    await db.promise().query(
      'UPDATE notes SET subject=?, professor=?, category=?, summary=?, created_at=NOW() WHERE id=?',
      [subject, professor, category, summary, req.params.id]
    );
    res.redirect('/notes');
  } catch (e) { next(e); }
});

// 댓글 작성 (POST /notes/:id/comments) - 로그인 필요
router.post('/:id/comments', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const noteId = req.params.id;
    const userId = req.session.user.userId;
    const content = req.body.content;
    await db.promise().query(
      'INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)',
      [noteId, userId, content]
    );
    res.redirect('/notes/' + noteId);
  } catch (e) { next(e); }
});

module.exports = router;