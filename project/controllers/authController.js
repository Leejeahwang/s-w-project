const db = require('../db');

// 회원가입
exports.signup = (req, res) => {
  const { id, pw, name, studentId, grade } = req.body;
  if (!id || !pw || !name || !studentId || !grade) {
    return res.status(400).send('모든 필드를 입력해주세요.');
  }
  const hashedPassword = pw; // 실제 서비스에는 bcrypt 사용 권장
  db.query(
    'INSERT INTO users (username, password, name, studentId, grade) VALUES (?, ?, ?, ?, ?)',
    [id, hashedPassword, name, studentId, grade],
    (err, result) => {
      if (err) {
        console.error('회원가입 오류:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).send('이미 사용 중인 아이디입니다.');
        }
        return res.status(500).send('회원가입 중 오류가 발생했습니다.');
      }
      res.redirect('/login.html');
    }
  );
};

// 로그인
exports.login = (req, res) => {
  const { id, pw } = req.body;
  if (!id || !pw) {
    return res.status(400).send('아이디와 비밀번호를 모두 입력해주세요.');
  }
  db.query('SELECT * FROM users WHERE username = ?', [id], (err, results) => {
    if (err) {
      console.error('로그인 DB 조회 오류:', err);
      return res.status(500).send('로그인 처리 중 오류가 발생했습니다.');
    }
    if (results.length === 0 || pw !== results[0].password) {
      return res.status(401).send('<script>alert("아이디 또는 비밀번호가 일치하지 않습니다."); window.location="/login.html";</script>');
    }
    const user = results[0];
    req.session.user = {
      userId: user.id,
      username: user.username
    };
    res.redirect('/');
  });
};

// 로그아웃
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