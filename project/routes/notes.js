const express = require('express');
const db = require('../db');
const router = express.Router();

// 1) 목록 + 필터 (GET /notes)
// router.get('/', async (req, res, next) => {
//   try {
//     const { subject = '', professor = '', category = '' } = req.query;
//     let sql = `
//       SELECT n.title, n.id, n.subject, n.professor, n.category, n.summary, n.created_at,
//              n.user_id, u.user_id AS authorName, n.created_at
//       FROM notes n
//       JOIN users u ON n.user_id = u.id
//       WHERE n.subject LIKE ? AND n.professor LIKE ?
//     `;
//     const params = [`%${subject}%`, `%${professor}%`];
//     if (category) {
//       sql += ' AND n.category = ?';
//       params.push(category);
//     }
//     sql += ' ORDER BY n.created_at DESC';
//     const [notes] = await db.promise().query(sql, params);
//     res.render('index', { notes, filters: { subject, professor, category }, user: req.session.user });
//   } catch (e) { next(e); }
// });

router.get('/', async (req, res, next) => {
  try {
    const { category, subject, professor, year, semester, keyword } = req.query;

    let conditions = [];
    let params = [];

    if (category && category !== '전체') {
      conditions.push('n.category = ?');
      params.push(category);
    }
    if (subject && subject !== '전체') {
      conditions.push('n.subject = ?');
      params.push(subject);
    }
    if (professor && professor !== '전체') {
      conditions.push('n.professor = ?');
      params.push(professor);
    }
    if (year && year !== '전체') {
      conditions.push('n.year = ?');
      params.push(year);
    }
    if (semester && semester !== '전체') {
      conditions.push('n.semester = ?');
      params.push(semester);
    }
    if (keyword && keyword.trim() !== '') {
      conditions.push('(n.title LIKE ? OR n.summary LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT n.id, n.title, n.subject, n.professor, n.category, n.year, n.semester,
             n.summary, n.created_at, u.user_id AS authorName
      FROM notes n
      JOIN users u ON n.user_id = u.user_id
      ${where}
      ORDER BY n.created_at DESC
    `;
    const [notes] = await db.promise().query(sql, params);

    // 옵션값 select (카테고리, 과목, 교수 등)
    // const [categories] = await db.promise().query('SELECT DISTINCT category AS name FROM notes');
    // const [subjects] = await db.promise().query('SELECT DISTINCT subject AS name FROM notes');
    // const [years] = await db.promise().query('SELECT DISTINCT year AS name FROM notes');
    // const [semesters] = await db.promise().query('SELECT DISTINCT semester AS name FROM notes');

    const [categories] = await db.promise().query('SELECT name FROM categories');
    const [subjects] = await db.promise().query('SELECT name FROM subjects');
    const [years] = await db.promise().query('SELECT name FROM years');
    const [semesters] = await db.promise().query('SELECT name FROM semesters');
    const [professors] = await db.promise().query('SELECT DISTINCT professor AS name FROM notes');

    res.render('index', {
      notes,
      categories,
      subjects,
      professors,
      years,
      semesters,
      filters : { category, subject, professor, year, semester },
      keyword: keyword || '',
      user: req.session.user
    });
  } catch (err) {
    next(err);
  }
});




// 2) 새 노트 작성 폼 및 처리 (로그인 필요)
// router.get('/new', (req, res) => {
//   if (!req.session.user) return res.redirect('/login');
//   res.render('create', { user: req.session.user });
// });

router.get('/new', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [categories] = await db.promise().query('SELECT * FROM categories');
    const [subjects] = await db.promise().query('SELECT * FROM subjects');
    const [years] = await db.promise().query('SELECT * FROM years');
    const [semesters] = await db.promise().query('SELECT * FROM semesters');

    res.render('create', {
      categories,
      subjects,
      years,
      semesters,
      user : req.session.user
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, summary, category, subject, year, semester, professor } = req.body;
  try {
    const u = req.session.user;
    await db.promise().query(
      'INSERT INTO notes (user_id, title, summary, category, subject, year, semester, professor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [u.user_id, title, summary, category, subject, year, semester, professor]
    );
    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
});

// 4) 수정 폼 (GET /notes/:id/edit) - 작성자만
router.get('/:id/edit', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [categories] = await db.promise().query('SELECT * FROM categories');
    const [subjects] = await db.promise().query('SELECT * FROM subjects');
    const [years] = await db.promise().query('SELECT * FROM years');
    const [semesters] = await db.promise().query('SELECT * FROM semesters');
    const [[note]] = await db.promise().query(
      'SELECT id, user_id, title, summary, subject, professor, category, year, semester, created_at FROM notes WHERE id = ?',
      [req.params.id]
    );
    if (!note || note.user_id !== req.session.user.user_id) {
      return res.redirect('/notes/' + req.params.id);
    }
    res.render('edit', { 
      note, 
      categories,
      subjects,
      years,
      semesters,
      user: req.session.user });
  } catch (e) { next(e); }
});

// 4-1) 수정 처리 (POST /notes/:id/edit) - 작성자만
router.post('/:id/edit', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [[orig]] = await db.promise().query(
      'SELECT user_id FROM notes WHERE id = ?', [req.params.id]
    );
    if (!orig || orig.user_id !== req.session.user.user_id) {
      return res.redirect('/notes/' + req.params.id);
    }
    const { title, summary, category, subject, year, semester, professor } = req.body;
    await db.promise().query(
      'UPDATE notes SET title=?, summary=?, category=?, subject=?, year=?, semester=?, professor=?, created_at=NOW() WHERE id=?',
      [title, summary, category, subject, year, semester, professor, req.params.id]
    );
    res.redirect('/notes');
  } catch (e) { next(e); }
});

// 삭제 처리 (POST /notes/:id/delete)
router.post('/:id/delete', async (req, res, next) => {
  const id = req.params.id;
  try {
    await db.promise().query('DELETE FROM notes WHERE id = ?', [id]);
    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
});

// 3) 상세 조회 (GET /notes/:id)
router.get('/:id', async (req, res, next) => {
  try {
    const [[note]] = await db.promise().query(
      `SELECT n.id, n.subject, n.professor, n.category, n.summary,
              n.user_id, u.user_id AS authorName, n.created_at
       FROM notes n JOIN users u ON n.user_id = u.user_id
       WHERE n.id = ?`,
      [req.params.id]
    );
    if (!note) return res.status(404).send('노트를 찾을 수 없습니다.');

    const [comments] = await db.promise().query(
      `SELECT c.id, c.content, c.created_at, u.user_id AS author
       FROM comments c JOIN users u ON c.user_id = u.user_id
       WHERE c.note_id = ? ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.render('detail', { note, comments, user: req.session.user });
  } catch (e) { next(e); }
});

// 댓글 작성 (POST /notes/:id/comments) - 로그인 필요
router.post('/:id/comments', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const noteId = req.params.id;
    const userId = req.session.user.user_id;
    const content = req.body.content;
    await db.promise().query(
      'INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)',
      [noteId, userId, content]
    );
    res.redirect('/notes/' + noteId);
  } catch (e) { next(e); }
});

module.exports = router;