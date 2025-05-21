const express = require('express');
const path = require('path');
const postRouter = require('./routes/post');

const app = express();

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 요청 Body 파싱
app.use(express.urlencoded({ extended: false }));

// 라우터 연결
app.use('/posts', postRouter);
app.get('/', (req, res) => res.redirect('/posts'));

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('서버 오류 발생');
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
