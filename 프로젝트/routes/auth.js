const express = require('express');
const db = require('../db');
const router = express.Router();

// 로그인 폼
router.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, error: null });
});
// 로그인 처리
router.post('/login', async (req, res) => {
  const { id, pw } = req.body;
  try {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE username=?', [id]);
    if (rows.length && rows[0].password === pw) {
      req.session.user = { userId: rows[0].id, username: rows[0].username };
      return res.redirect('/notes');
    }
    return res.render('login', { user: null, error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
  } catch (e) {
    console.error('Login error:', e);
    res.render('login', { user: null, error: '로그인 중 오류가 발생했습니다.' });
  }
});

// 회원가입 폼
router.get('/signup', (req, res) => {
  res.render('signup', { user: req.session.user, error: null });
});
// 회원가입 처리
router.post('/signup', async (req, res) => {
  const { id, pw, name, studentId, grade } = req.body;
  try {
    await db.promise().query(
      'INSERT INTO users (username,password,name,studentId,grade) VALUES (?,?,?,?,?)',
      [id, pw, name, studentId, grade]
    );
    res.redirect('/login');
  } catch (e) {
    console.error('Signup error:', e);
    res.render('signup', { user: null, error: '가입 실패: 이미 존재하는 아이디일 수 있습니다.' });
  }
});

// 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/notes')); // 로그아웃 후 메인 페이지로 이동
});

module.exports = router;