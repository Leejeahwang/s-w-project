const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const db = require('./db');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const notesRouter = require('./routes/notes');
const commentsRouter = require('./routes/comments');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
// body._method 또는 query._method 둘 다 확인해서 override
app.use(methodOverride(req => req.body._method || req.query._method));
app.use(session({
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: false
}));

// 전역 user 객체 설정
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/notes', notesRouter);
app.use('/notes/:noteId/comments', commentsRouter);

// 404 핸들러
app.use((req, res) => res.status(404).send('페이지를 찾을 수 없습니다.'));
// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('서버 내부 오류');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)); 

module.exports = app;