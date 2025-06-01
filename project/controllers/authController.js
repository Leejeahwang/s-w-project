const db = require('../db');

// 로그인 화면 렌더링 (GET /auth/login)
exports.login_rendering = (req, res) => {
  res.render('login', { user: req.session.user, error: null });
}

// 로그인 처리 (POST /auth/login)
exports.login = async (req, res) => {
  const { id, pw } = req.body;

  try {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE user_id=?', [id]);

    if (rows.length && rows[0].password === pw) {
      req.session.user = { 
        userId: rows[0].id,
        user_id: rows[0].user_id
      };
      return res.redirect('/');
    }

    return res.render('login', { 
      user: null, 
      error: '아이디 또는 비밀번호가 일치하지 않습니다.' 
    });

  } catch (e) {
    console.error('Login error:', e);
    res.render('login', { user: null, error: '로그인 중 오류가 발생했습니다.' });
  }
};

// 회원가입 화면 렌더링 (GET /auth/singup)
exports.signup_rendering = (req, res) => {
  res.render('signup', { user: req.session.user, error: null });
}

// 회원가입 (POST /auth/singup)
exports.signup = async (req, res) => {
  const { id, pw, name, studentId, grade } = req.body;
  try {
    await db.promise().query(
      'INSERT INTO users (user_id, password, name, studentId, grade, point) VALUES (?, ?, ?, ?, ?, ?)',
      [id, pw, name, studentId, grade, 100]
    );
    res.redirect('/auth/login');
  } catch (e) {
    console.error('Signup error:', e);
    res.render('signup', { user: null, error: '가입 실패: 이미 존재하는 아이디일 수 있습니다.' });
  }
};

// 로그아웃 (GET /auth/logout)
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('로그아웃 오류:', err);
      return res.status(500).send('로그아웃 실패');
    }
    res.redirect('/');
  });
};

// 로그인 상태 확인
exports.checkLogin = (req, res) => {
  if (req.session.user && req.session.user.userId) {
    res.json({ loggedIn: true, userId: req.session.user.userId, username: req.session.user.username });
  } else {
    res.json({ loggedIn: false, userId: null, username: null });
  }
};