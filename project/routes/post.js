const express = require('express');
const router = express.Router();
const pool = require('../db');

// 게시글 목록 및 필터 처리 (GET /posts)
// GET /posts - 게시글 목록 + 필터 + 검색
router.get('/', async (req, res, next) => {
  try {
    const { category, subject, year, semester, keyword } = req.query;

    let conditions = [];
    let params = [];

    if (category && category !== '전체') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (subject && subject !== '전체') {
      conditions.push('subject = ?');
      params.push(subject);
    }
    if (year && year !== '전체') {
      conditions.push('year = ?');
      params.push(year);
    }
    if (semester && semester !== '전체') {
      conditions.push('semester = ?');
      params.push(semester);
    }

    if (keyword && keyword.trim() !== '') {
      conditions.push('title LIKE ?');
      params.push(`%${keyword.trim()}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT * FROM posts ${where} ORDER BY created_at DESC`;
    const [posts] = await pool.query(sql, params);

    // 기존 카테고리 등 옵션도 가져오기
    const [categories] = await pool.query('SELECT name FROM categories');
    const [subjects] = await pool.query('SELECT name FROM subjects');
    const [years] = await pool.query('SELECT name FROM years');
    const [semesters] = await pool.query('SELECT name FROM semesters');

    res.render('index', {
      posts,
      categories,
      subjects,
      years,
      semesters,
      selected: { category, subject, year, semester },
      keyword: keyword || ''
    });
  } catch (err) {
    next(err);
  }
});


// 작성 폼 (GET /posts/create)
router.get('/create', async (req, res, next) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    const [subjects] = await pool.query('SELECT * FROM subjects');
    const [years] = await pool.query('SELECT * FROM years');
    const [semesters] = await pool.query('SELECT * FROM semesters');

    res.render('create', {
      categories,
      subjects,
      years,
      semesters
    });
  } catch (err) {
    next(err);
  }
});

// 작성 처리 (POST /posts/create)
router.post('/create', async (req, res, next) => {
  const { title, content, category, subject, year, semester } = req.body;
  try {
    await pool.query(
      'INSERT INTO posts (title, content, category, subject, year, semester) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, category, subject, year, semester]
    );
    res.redirect('/posts');
  } catch (err) {
    next(err);
  }
});

// 수정 폼 (GET /posts/edit/:id)
router.get('/edit/:id', async (req, res, next) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('게시글이 없습니다.');
    res.render('edit', { post: rows[0] });
  } catch (err) {
    next(err);
  }
});

// 수정 처리 (POST /posts/edit/:id)
router.post('/edit/:id', async (req, res, next) => {
  const id = req.params.id;
  const { title, content } = req.body;
  try {
    await pool.query('UPDATE posts SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    res.redirect('/posts');
  } catch (err) {
    next(err);
  }
});

// 삭제 처리 (POST /posts/delete/:id)
router.post('/delete/:id', async (req, res, next) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    res.redirect('/posts');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
