const express = require('express');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');
require('dotenv').config()
const http = require('http'); // ★ 추가
const { Server } = require('socket.io'); // ★ 추가

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const notesRouter = require('./routes/notes');
const downloadRouter = require('./routes/downloads');
const commentRouter = require('./routes/comments');
const todoRouter = require('./routes/todos');
const pointshopRouter = require('./routes/pointshop');
const chatRouter = require('./routes/chat');

const app = express();
const server = http.createServer(app); // ★ Express 앱을 기반으로 HTTP 서버 생성
const io = new Server(server); // ★ socket.io 서버 생성
// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing & session
app.use(express.urlencoded({ extended: true }));
const sessionMiddleware = session({ // ⭐ 변수로 분리
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600_000 }
});

app.use(sessionMiddleware); 

app.use(methodOverride(function (req) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
  if (req.query && req.query._method) return req.query._method;
}));

// 정적 파일
app.use(express.static(path.join(__dirname, 'public')));

// 라우팅
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/notes', notesRouter);
app.use('/files', downloadRouter);
app.use('/notes/:id/comments', commentRouter);
app.use('/todo', todoRouter);
app.use('/pointshop', pointshopRouter);
app.use('/chat', chatRouter);

// 404 핸들러
app.use((req, res) => res.status(404).send('페이지를 찾을 수 없습니다.'));
// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('서버 내부 오류');
});

// ★ Socket.IO 핸들링 로직 분리해서 불러오기
const socketHandler = require('./socket'); 
socketHandler(io, sessionMiddleware); // io 인스턴스를 넘겨줌

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)); 