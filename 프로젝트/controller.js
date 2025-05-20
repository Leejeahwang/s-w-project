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
  // 로그인 성공 시 req.session.user = { userId: user.id, username: user.username, ... } 로 저장됨
  if (req.session.user && req.session.user.userId) { // userId (DB PK) 존재 여부로 더 확실히 판단
    console.log('Check Login API - Logged In User:', req.session.user); // 서버 로그
    res.json({
      loggedIn: true,
      userId: req.session.user.userId,     // 숫자형 PK
      username: req.session.user.username  // 표시용 사용자 이름
    });
  } else {
    console.log('Check Login API - Not Logged In'); // 서버 로그
    res.json({
      loggedIn: false,
      userId: null,
      username: null
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
      if (pw === user.password) { // 실제로는 bcrypt 비교
        req.session.user = {
          userId: user.id, // users 테이블의 실제 숫자형 PK (예: user.id 또는 user.user_pk 등 컬럼명 확인)
          username: user.username, // 표시용 사용자 이름
          name: user.name
        };
      console.log('로그인 성공:', user.username);
      res.redirect('/');
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

// 새 노트 생성 (로그인 필요)
app.post('/api/notes', (req, res) => {
  if (!req.session.user || !req.session.user.userId) { // 로그인 시 세션에 DB PK (userId)를 저장했다고 가정
    return res.status(401).json({ message: '노트를 작성하려면 로그인이 필요합니다.' });
  }

  const { subject, professor, category, summary } = req.body;
  const userId = req.session.user.userId; // 실제 users 테이블의 PK를 가져와야 함

  if (!subject || !summary) {
    return res.status(400).json({ message: '교과명과 요약 내용은 필수입니다.' });
  }

  const query = 'INSERT INTO notes (user_id, subject, professor, category, summary) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [userId, subject, professor, category, summary], (err, result) => {
    if (err) {
      console.error('노트 생성 오류:', err);
      return res.status(500).json({ message: '노트 생성 중 오류가 발생했습니다.' });
    }
    // 생성된 노트 정보 반환 (또는 ID만 반환 후 클라이언트에서 상세 조회)
    res.status(201).json({ id: result.insertId, userId, subject, professor, category, summary, message: '노트가 성공적으로 생성되었습니다.' });
  });
});

// 특정 노트 조회 (댓글 기능을 위해 필요)
app.get('/api/notes/:noteId', (req, res) => {
  const noteId = req.params.noteId;

  // notes 테이블과 users 테이블을 JOIN하여 작성자 이름(username)도 함께 가져옵니다.
  const query = `
    SELECT n.id, n.subject, n.professor, n.category, n.summary, n.created_at, u.username AS authorName
    FROM notes n
    JOIN users u ON n.user_id = u.id
    WHERE n.id = ?
  `;
  db.query(query, [noteId], (err, results) => {
    if (err) {
      console.error('특정 노트 조회 오류:', err);
      return res.status(500).json({ message: '노트 정보를 불러오는 중 오류가 발생했습니다.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: '해당 ID의 노트를 찾을 수 없습니다.' });
    }
    res.json(results[0]); // 결과는 배열이므로 첫 번째 요소 반환
  });
});

// 모든 노트 목록 조회 (메인 페이지용)
app.get('/api/notes', (req, res) => {
  // 페이지네이션, 필터링, 검색 기능은 여기에 추가할 수 있습니다.
  // 여기서는 간단히 모든 노트를 가져옵니다. users 테이블과 JOIN하여 작성자 이름도 포함합니다.
  const query = `
    SELECT n.id, n.subject, n.professor, n.category, n.summary, n.created_at, u.username AS authorName
    FROM notes n
    JOIN users u ON n.user_id = u.id
    ORDER BY n.created_at DESC
  `; // 최신순으로 정렬
  db.query(query, (err, results) => {
    if (err) {
      console.error('노트 목록 조회 오류:', err);
      return res.status(500).json({ message: '노트 목록을 불러오는 중 오류가 발생했습니다.' });
    }
    res.json(results);
  });
});

// 특정 노트의 댓글 목록 조회
app.get('/api/notes/:noteId/comments', (req, res) => {
  const noteId = req.params.noteId;
  const query = `
    SELECT c.id, c.content, c.created_at, u.username AS author
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.note_id = ?
    ORDER BY c.created_at ASC
  `;
  db.query(query, [noteId], (err, results) => {
    if (err) {
      console.error('댓글 조회 오류:', err);
      return res.status(500).json({ message: '댓글을 불러오는 중 오류가 발생했습니다.' });
    }
    res.json(results);
  });
});

app.post('/api/notes/:noteId/comments', (req, res) => {
  if (!req.session.user || !req.session.user.userId) {
    return res.status(401).json({ message: '댓글을 작성하려면 로그인이 필요합니다.' });
  }

  const noteId = req.params.noteId;
  const actualUserId = req.session.user.userId; // 세션에서 가져온 숫자형 PK
  const usernameForDisplay = req.session.user.username; // 세션에서 가져온 표시용 사용자 이름
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
  }

  const insertQuery = 'INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)';
  db.query(insertQuery, [noteId, actualUserId, content.trim()], (err, result) => {
    if (err) {
      console.error('댓글 작성 오류:', err);
      return res.status(500).json({ message: '댓글 작성 중 오류가 발생했습니다.' });
    }

    const newCommentId = result.insertId;
    const fetchNewCommentQuery = `
      SELECT c.id, c.content, c.created_at, u.username AS author
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    db.query(fetchNewCommentQuery, [newCommentId], (fetchErr, fetchResults) => {
      if (fetchErr || fetchResults.length === 0) {
        console.error('새 댓글 정보 조회 오류:', fetchErr);
        // 조회 실패 시 최소한의 정보라도 반환
        return res.status(201).json({
          id: newCommentId,
          note_id: parseInt(noteId),
          user_id: actualUserId,
          content: content.trim(),
          created_at: new Date().toISOString(),
          author: usernameForDisplay // 세션에서 가져온 username 사용
        });
      }
      res.status(201).json(fetchResults[0]);
    });
  });
});

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