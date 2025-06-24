const db = require('../db');
const axios = require('axios');
const qs = require('querystring');

// 로그인 화면 렌더링 (GET /auth/login)
exports.login_rendering = (req, res) => {
  const alert = req.session.alertMessage;
  delete req.session.alertMessage;
  res.render('login', { user: null, error: null, alert });
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
      error: '아이디 또는 비밀번호가 일치하지 않습니다.', 
      alert: null  
    });

  } catch (e) {
    console.error('Login error:', e);
    res.render('login', { user: null, error: '로그인 중 오류가 발생했습니다.', alert: null});
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

    // await db.promise().query(
    //   'INSERT INTO todos (user_id, content) VALUES (?, ?)', [id, '']
    // );

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

// 카카오톡 토큰 얻기 (GET /auth/kakao/token?code=내 rest api값) -> 자세한건 auth.js 주석 참고
exports.getKakaoToken = async (req, res) => {
  const code = req.query.code; // URL 쿼리로 code 받기
  if (!code) return res.send('code가 없습니다.');

  try {
    const response = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID, // 내 REST API 값
        redirect_uri: 'http://localhost:3000/auth/kakao/token',  // Redirect URI
        code: code
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;

    // 콘솔에 출력하거나 화면에 표시
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);

    res.send(`
      <p>Access Token: ${accessToken}</p>
      <p>Refresh Token: ${refreshToken}</p>
      <p>.env에 저장해두세요.</p>
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Access Token 요청 실패');
  }
};

// GET /auth/forgot — 본인 인증 폼
exports.forgotRender = (req, res) => {
  res.render('forgot', { error: null });
};

// POST /auth/forgot — 인증 처리
exports.forgot = async (req, res, next) => {
  const { id, name, studentId } = req.body;
  try {
    const [[user]] = await db.promise().query(
      'SELECT user_id FROM users WHERE user_id = ? AND name = ? AND studentId = ?',
      [id, name, studentId]
    );
    if (!user) {
      return res.render('forgot', { error: '일치하는 회원 정보가 없습니다.' });
    }
    // 세션에 인증된 아이디 저장
    req.session.resetUser = user.user_id;
    return res.redirect('/auth/reset');
  } catch (err) {
    next(err);
  }
};

// GET /auth/reset — 새 비밀번호 폼
exports.resetRender = (req, res) => {
  if (!req.session.resetUser) {
    return res.redirect('/auth/forgot');
  }
  res.render('reset', { error: null });
};

// POST /auth/reset — 비밀번호 변경 처리
exports.reset = async (req, res, next) => {
  const userId        = req.session.resetUser;
  const { newPassword, confirmPassword } = req.body;

  if (!userId) {
    return res.redirect('/auth/forgot');
  }
  if (newPassword !== confirmPassword) {
    return res.render('reset', { error: '비밀번호 확인이 일치하지 않습니다.' });
  }

  try {
    await db.promise().query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [newPassword, userId]
    );
    // 세션에서 제거
    delete req.session.resetUser;
    // 완료 알림 후 로그인 페이지로
    req.session.alertMessage = '비밀번호가 성공적으로 변경되었습니다.';
    return res.redirect('/auth/login');
  } catch (err) {
    next(err);
  }
};