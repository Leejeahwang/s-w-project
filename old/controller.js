const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1시간
}));

// DB 연결
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'userdb'
});

db.connect(err => {
  if (err) console.error('DB 연결 실패:', err);
  else console.log('DB 연결 성공!');
});

// 정적 파일 제공
app.use(express.static(__dirname));

// 메인
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 회원가입 GET
app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// 회원가입 POST
app.post('/signup', (req, res) => {
  const { id, pw, name, studentId, grade } = req.body;

  db.query('INSERT INTO users (username, password, name, studentId, grade) VALUES (?, ?, ?, ?, ?)',
    [id, pw, name, studentId, grade],
    (err) => {
      if (err) {
        console.error('회원가입 오류:', err);
        return res.status(500).send('회원가입 실패');
      }
      res.redirect('/login.html');
    }
  );
});

// 로그인 GET
app.get('/check-login', (req, res) => {
  res.json({
    loggedIn: !!req.session.user,
    id: req.session.user?.id || null
  });
});


// 로그인 POST
app.post('/login', (req, res) => {
  const { id, pw } = req.body;

  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [id, pw], (err, results) => {
    if (err) return res.status(500).send('로그인 오류');

    if (results.length > 0) {
      req.session.user = { id };
      res.redirect('/');
    } else {
      res.send('<script>alert("로그인 실패"); window.location="/login.html";</script>');
    }
  });
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/check-login', (req, res) => {
  res.json({ loggedIn: !!req.session.user });
});

// 서버 실행
app.listen(3000, () => {
  console.log('http://localhost:3000 에서 실행 중');
});
