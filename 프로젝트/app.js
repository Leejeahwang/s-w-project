const express = require('express');
const session = require('express-session');
const path = require('path');

const indexRouter    = require('./routes/index');
const authRouter     = require('./routes/auth');
const notesRouter    = require('./routes/notes');

const app = express();

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing & session
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600_000 }
}));

// 정적 파일
app.use(express.static(path.join(__dirname, 'public')));

// 라우팅
app.use('/', indexRouter);
app.use('/', authRouter);

app.use('/notes', notesRouter);

// 404 핸들러
app.use((req, res) => res.status(404).send('페이지를 찾을 수 없습니다.'));
// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('서버 내부 오류');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));