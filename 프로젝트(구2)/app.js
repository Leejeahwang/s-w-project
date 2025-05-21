const express = require('express');
const session = require('express-session');
const path = require('path');

const indexRouter    = require('./routes/index');
const authRouter     = require('./routes/auth');
const notesRouter    = require('./routes/notes');
const commentsRouter = require('./routes/comments');

const app = express();

// Body parsing & session
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

// Static assets
app.use('/public', express.static(path.join(__dirname, 'public')));

// 뷰 라우팅
app.use('/', indexRouter);
// 인증 관련 라우팅 (signup, login, logout, check-login)
app.use('/', authRouter);

// 노트 API
app.use('/api/notes', notesRouter);
// /api/notes/:noteId/comments
notesRouter.use('/:noteId/comments', commentsRouter);

// 404 처리
app.use((req, res) => res.status(404).send('페이지를 찾을 수 없습니다.'));

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('서버 내부 오류');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));