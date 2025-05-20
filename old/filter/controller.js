const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// JSON 및 URL-encoded 데이터 파싱 미들웨어
app.use(express.json()); // API 요청에서 JSON 본문을 파싱하기 위해 추가할 수 있습니다.
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: 'mySecretKey123', // 실제 프로덕션에서는 더 복잡한 시크릿 키를 사용하세요.
  resave: false,
  saveUninitialized: false, // 로그인하지 않은 사용자에게도 세션을 생성할지 여부, false가 일반적
  cookie: {
    maxAge: 1000 * 60 * 60, // 1시간
    // secure: true, // HTTPS를 사용할 경우 주석 해제
    // httpOnly: true // 클라이언트 측 JavaScript에서 쿠키 접근 방지
  }
}));

// DB 연결 설정 (환경 변수 사용 권장)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'userdb'
});

db.connect(err => {
  if (err) {
    console.error('DB 연결 실패:', err);
    // 애플리케이션 실행 중단 또는 재시도 로직 추가 가능
    process.exit(1); // DB 연결 실패 시 프로세스 종료
  } else {
    console.log('DB 연결 성공!');
  }
});

// 정적 파일 제공 (HTML, CSS, 클라이언트 JS 등)
// 루트 디렉토리의 파일들 (index.html, login.html, signup.html, note_detail.html 등)
app.use(express.static(__dirname));
// public 디렉토리의 파일들 (main.js 등)
app.use('/public', express.static(path.join(__dirname, 'public')));


// --- 기본 페이지 라우트 ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/note_detail.html', (req, res) => { // /note_detail -> /note_detail.html로 변경 또는 아래와 같이 처리
  res.sendFile(path.join(__dirname, 'note_detail.html'));
});
// 이전 controller.js에서 /note_detail 로 요청을 받았으므로, 일관성을 위해 유지하거나 아래처럼 수정
app.get('/note_detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'note_detail.html'));
});


// --- 회원가입 관련 라우트 ---
app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.post('/signup', (req, res) => {
  const { id, pw, name, studentId, grade } = req.body;

  // 입력 값 유효성 검사 (간단한 예시)
  if (!id || !pw || !name || !studentId || !grade) {
    return res.status(400).send('모든 필드를 입력해주세요.');
  }

  // 비밀번호 해싱 (실제 프로덕션에서는 bcrypt와 같은 라이브러리 사용 필수)
  // 여기서는 단순 텍스트로 저장하지만, 보안상 매우 취약합니다.
  const hashedPassword = pw; // 예시: 실제로는 bcrypt.hashSync(pw, 10);

  db.query('INSERT INTO users (username, password, name, studentId, grade) VALUES (?, ?, ?, ?, ?)',
    [id, hashedPassword, name, studentId, grade],
    (err, result) => {
      if (err) {
        console.error('회원가입 오류:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).send('이미 사용 중인 아이디입니다.');
        }
        return res.status(500).send('회원가입 중 오류가 발생했습니다.');
      }
      console.log('회원가입 성공:', id);
      res.redirect('/login.html'); // 회원가입 성공 시 로그인 페이지로 리다이렉트
    }
  );
});


// --- 로그인/로그아웃 관련 라우트 ---
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// 로그인 상태 확인 API
app.get('/check-login', (req, res) => {
  if (req.session.user) {
    res.json({
      loggedIn: true,
      id: req.session.user.id // 또는 username 등 필요한 정보
    });
  } else {
    res.json({
      loggedIn: false,
      id: null
    });
  }
});

app.post('/login', (req, res) => {
  const { id, pw } = req.body;

  if (!id || !pw) {
    return res.status(400).send('아이디와 비밀번호를 모두 입력해주세요.');
  }

  db.query('SELECT * FROM users WHERE username = ?', [id], (err, results) => {
    if (err) {
      console.error('로그인 DB 조회 오류:', err);
      return res.status(500).send('로그인 처리 중 오류가 발생했습니다.');
    }

    if (results.length > 0) {
      const user = results[0];
      // 비밀번호 비교 (실제로는 bcrypt.compareSync(pw, user.password) 사용)
      if (pw === user.password) { // 여기서는 단순 비교, 보안 취약
        req.session.user = { id: user.username, name: user.name /* 필요한 사용자 정보 추가 */ };
        console.log('로그인 성공:', user.username);
        res.redirect('/'); // 로그인 성공 시 메인 페이지로 리다이렉트
      } else {
        console.log('로그인 실패 (비밀번호 불일치):', id);
        res.status(401).send('<script>alert("아이디 또는 비밀번호가 일치하지 않습니다."); window.location="/login.html";</script>');
      }
    } else {
      console.log('로그인 실패 (사용자 없음):', id);
      res.status(401).send('<script>alert("아이디 또는 비밀번호가 일치하지 않습니다."); window.location="/login.html";</script>');
    }
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('로그아웃 오류:', err);
      return res.status(500).send('로그아웃 실패');
    }
    console.log('로그아웃 성공');
    res.redirect('/'); // 로그아웃 후 메인 페이지로 리다이렉트
  });
});


// --- 노트 관련 API (향후 확장용 예시, 현재는 클라이언트 측에서만 처리) ---
// GET /api/notes - 모든 노트 가져오기
// POST /api/notes - 새 노트 생성 (로그인 사용자만)
// ...


// 404 핸들러 (모든 라우트 매칭 실패 시)
app.use((req, res, next) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

// 에러 핸들러 (전역)
app.use((err, req, res, next) => {
  console.error('서버 오류 발생:', err.stack);
  res.status(500).send('서버 내부 오류가 발생했습니다.');
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} 에서 서버 실행 중`);
});