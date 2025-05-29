const express = require('express');
const db = require('../db');  // db 설정
const router = express.Router();

// 파일 저장 위치, 이름등 설정
const multer = require('multer');
const path = require('path');

// 저장 위치 및 파일명 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'files'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// 1) 목록 + 필터 (GET /notes)
// router.get('/', async (req, res, next) => {
//   try {
//     const { subject = '', professor = '', category = '' } = req.query;
//     let sql = `
//       SELECT n.title, n.id, n.subject, n.professor, n.category, n.summary, n.created_at,
//              n.user_id, u.user_id AS authorName, n.created_at
//       FROM notes n
//       JOIN users u ON n.user_id = u.id
//       WHERE n.subject LIKE ? AND n.professor LIKE ?
//     `;
//     const params = [`%${subject}%`, `%${professor}%`];
//     if (category) {
//       sql += ' AND n.category = ?';
//       params.push(category);
//     }
//     sql += ' ORDER BY n.created_at DESC';
//     const [notes] = await db.promise().query(sql, params);
//     res.render('index', { notes, filters: { subject, professor, category }, user: req.session.user });
//   } catch (e) { next(e); }
// });
router.post('/:id/like', async (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ message: '로그인이 필요합니다.' });
  const noteId = req.params.id, userId = req.session.user.user_id;
  try {
    const [exist] = await db.promise().query(
      'SELECT 1 FROM note_likes WHERE note_id=? AND user_id=?', [noteId, userId]
    );
    if (exist.length) return res.status(400).json({ message: '이미 눌렀습니다.' });
    await db.promise().query('INSERT INTO note_likes (note_id,user_id) VALUES(?,?)', [noteId, userId]);
    await db.promise().query('UPDATE notes SET like_count=like_count+1 WHERE id=?', [noteId]);
    res.json({ message: '좋아요 완료' });
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const { category, subject, professor, year, semester, keyword } = req.query;

    let conditions = [];
    let params = [];

    if (category && category !== '전체') {
      conditions.push('n.category = ?');
      params.push(category);
    }
    if (subject && subject !== '전체') {
      conditions.push('n.subject = ?');
      params.push(subject);
    }
    if (professor && professor !== '전체') {
      conditions.push('n.professor = ?');
      params.push(professor);
    }
    if (year && year !== '전체') {
      conditions.push('n.year = ?');
      params.push(year);
    }
    if (semester && semester !== '전체') {
      conditions.push('n.semester = ?');
      params.push(semester);
    }
    if (keyword && keyword.trim() !== '') {
      conditions.push('(n.title LIKE ? OR n.summary LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT n.id, n.title, n.subject, n.professor, n.category, n.year, n.semester,
             n.summary, n.created_at, u.user_id AS authorName
      FROM notes n
      JOIN users u ON n.user_id = u.user_id
      ${where}
      ORDER BY n.created_at DESC
    `;
    const [notes] = await db.promise().query(sql, params);

    // 옵션값 select (카테고리, 과목, 교수 등)
    // const [categories] = await db.promise().query('SELECT DISTINCT category AS name FROM notes');
    // const [subjects] = await db.promise().query('SELECT DISTINCT subject AS name FROM notes');
    // const [years] = await db.promise().query('SELECT DISTINCT year AS name FROM notes');
    // const [semesters] = await db.promise().query('SELECT DISTINCT semester AS name FROM notes');

    const [categories] = await db.promise().query('SELECT name FROM categories');
    const [subjects] = await db.promise().query('SELECT name FROM subjects');
    const [years] = await db.promise().query('SELECT name FROM years');
    const [semesters] = await db.promise().query('SELECT name FROM semesters');
    const [professors] = await db.promise().query('SELECT DISTINCT professor AS name FROM notes');

    res.render('index', {
      notes,
      categories,
      subjects,
      professors,
      years,
      semesters,
      filters : { category, subject, professor, year, semester },
      keyword: keyword || '',
      user: req.session.user
    });
  } catch (err) {
    next(err);
  }
});




// 2) 새 노트 작성 폼 및 처리 (로그인 필요)
// router.get('/new', (req, res) => {
//   if (!req.session.user) return res.redirect('/login');
//   res.render('create', { user: req.session.user });
// });

router.get('/new', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [categories] = await db.promise().query('SELECT * FROM categories');
    const [subjects] = await db.promise().query('SELECT * FROM subjects');
    const [years] = await db.promise().query('SELECT * FROM years');
    const [semesters] = await db.promise().query('SELECT * FROM semesters');

    res.render('create', {
      categories,
      subjects,
      years,
      semesters,
      user : req.session.user
    });
  } catch (err) {
    next(err);
  }
});

// 노트 작성 (POST /notes)
router.post('/', upload.single('file'), async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');

  // console.log("original name:", req.file.originalname);
  // console.log("filename:", req.file.filename);
  // console.log("size:", req.file.size);

  const { title, summary, category, subject, year, semester, professor, file } = req.body;
  const uploadedFile = req.file; // multer가 채워줌

  try {
    const u = req.session.user;

    // notes 테이블에 삽입
    const [noteResult] = await db.promise().query(
      'INSERT INTO notes (user_id, title, summary, category, subject, year, semester, professor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [u.user_id, title, summary, category, subject, year, semester, professor]
    );
    const noteId = noteResult.insertId;

    // files 테이블에 삽입
    if (uploadedFile) {
      await db.promise().query(
        `INSERT INTO files (note_id, file_name, file_path, file_size, uploaded_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [noteId, uploadedFile.originalname, '/files/' + uploadedFile.filename, uploadedFile.size]
      );
    }

    // 리다이렉트
    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
});

// 4) 수정 폼 (GET /notes/:id/edit) - 작성자만
router.get('/:id/edit', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [categories] = await db.promise().query('SELECT * FROM categories');
    const [subjects] = await db.promise().query('SELECT * FROM subjects');
    const [years] = await db.promise().query('SELECT * FROM years');
    const [semesters] = await db.promise().query('SELECT * FROM semesters');
    const [[note]] = await db.promise().query(
      'SELECT id, user_id, title, summary, subject, professor, category, year, semester, created_at FROM notes WHERE id = ?',
      [req.params.id]
    );
    if (!note || note.user_id !== req.session.user.user_id) {
      return res.redirect('/notes/' + req.params.id);
    }
    res.render('edit', { 
      note, 
      categories,
      subjects,
      years,
      semesters,
      user: req.session.user });
  } catch (e) { next(e); }
});

// 4-1) 수정 처리 (POST /notes/:id/edit) - 작성자만
router.post('/:id/edit', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [[orig]] = await db.promise().query(
      'SELECT user_id FROM notes WHERE id = ?', [req.params.id]
    );
    if (!orig || orig.user_id !== req.session.user.user_id) {
      return res.redirect('/notes/' + req.params.id);
    }
    const { title, summary, category, subject, year, semester, professor } = req.body;
    await db.promise().query(
      'UPDATE notes SET title=?, summary=?, category=?, subject=?, year=?, semester=?, professor=?, created_at=NOW() WHERE id=?',
      [title, summary, category, subject, year, semester, professor, req.params.id]
    );
    res.redirect('/notes');
  } catch (e) { next(e); }
});

// 삭제 처리 (POST /notes/:id/delete)
router.post('/:id/delete', async (req, res, next) => {
  const id = req.params.id;
  try {
    await db.promise().query('DELETE FROM notes WHERE id = ?', [id]);
    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
});
// 좋아요 (POST /notes/:id/like) - 로그인 필요
router.post('/:id/like', async (req, res, next) => {
  // 1. 로그인 여부 확인
  // 2. note_likes 테이블에 기록 있는지 확인
  // 3. 없으면 INSERT + UPDATE
  if (!req.session.user) {
    res.status(401).json({ message: '로그인이 필요합니다.' });
    return res.redirect('/login');
  }
  const noteId = req.params.id;
  const userId = req.session.user.user_id;
  try {
    const [rows] = await db.promise().query( // 이미 좋아요 했는지 확인
      'SELECT * FROM note_likes WHERE note_id = ? AND user_id = ?',
      [noteId, userId]
    );
    if (rows.length > 0) { // 이미 좋아요를 했다면
      return res.status(400).json({ message: '이미 좋아요를 눌렀습니다.' });
    }
    await db.promise().query( // 좋아요 기록 추가
      'INSERT INTO note_likes (note_id, user_id) VALUES (?, ?)',
      [noteId, userId]
    );
    await db.promise().query( // 좋아요 수 증가
      'UPDATE notes SET like_count = like_count + 1 WHERE id = ?',
      [noteId]
    );
    res.json({ message: '좋아요 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});
// 3) 상세 조회 (GET /notes/:id)
router.get('/:id', async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const editCommentId = parseInt(req.query.editCommentId, 10) || null;
    const [[note]] = await db.promise().query(
      `SELECT n.id, n.title, n.subject, n.professor, n.category, n.summary, n.like_count, n.download_count,
              n.user_id, u.user_id AS authorName, n.created_at
       FROM notes n 
       JOIN users u 
       ON n.user_id = u.user_id
       WHERE n.id = ?`,
      [req.params.id]
    );
    if (!note) return res.status(404).send('노트를 찾을 수 없습니다.');

    const [[file]] = await db.promise().query(
      `SELECT f.file_name, f.file_path, f.file_size
       FROM files f
       JOIN notes n
       ON n.id = f.note_id
       WHERE n.id = ?`,
       [req.params.id]
    )

    const [comments] = await db.promise().query(
      `SELECT c.id, c.content, c.created_at, c.user_id, u.user_id AS author
       FROM comments c 
       JOIN users u 
       ON c.user_id = u.user_id
       WHERE c.note_id = ? 
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    // 파일 사이즈 포맷팅 함수
    const formatBytes = size => {
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    };

    res.render('detail', { note, 
                           comments,
                           editCommentId,
                           file: {
                              file_name: file.file_name,
                              file_path: file.file_path,
                              file_size: formatBytes(file.file_size)
                          },
                            user: req.session.user });
  } catch (e) { next(e); }
});

// 댓글 작성 (POST /notes/:id/comments) - 로그인 필요
router.post('/:id/comments', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const noteId = req.params.id;
    const userId = req.session.user.user_id;
    const content = req.body.content;
    await db.promise().query(
      'INSERT INTO comments (note_id, user_id, content) VALUES (?, ?, ?)',
      [noteId, userId, content]
    );
    res.redirect('/notes/' + noteId);
  } catch (e) { next(e); }
});

// 다운로드 라우터 (GET /files:/filename)
router.get('/files/:filename', async (req, res, next) => {
  // 로그인 여부 확인
  if(!req.session.user) {
    return res.send(`
      <script>
        alert("다운로드는 로그인 시 가능합니다.");
        window.location.href = "/login";
      </script>
      `);
  }

  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'public', 'files', filename);
  try{
    res.download(filePath, filename, async err => {
      // 에러 처리
      if(err) {
        console.error("파일 다운로드 오류: ", err);
        return res.status(404).send("파일을 찾을 수 없습니다");
      }

      // 1. notes 테이블에서 note_id 조회
      const [rows] = await db.promise().query(
        `SELECT note_id FROM files WHERE file_name = ?`, [filename]
      );

      if(rows.length === 0) {
        console.warn("해당 파일에 연결된 노트를 찾을 수 없습니다");
        return;
      }

      const noteId = rows[0].note_id;
      const userId = req.session.user.user_id;

      // 2. notes 테이블의 다운로드 수 +1
      await db.promise().query(
          'UPDATE notes SET download_count = download_count + 1 WHERE id = ?',
          [noteId]
        );

      // 3. note_downloads 테이블에 기록 추가
      await db.promise().query(
        'INSERT INTO note_downloads (note_id, user_id, downloaded_at) VALUES (?, ?, NOW())',
        [noteId, userId]
      );
    });
  } catch(err) {
    console.error("다운로드 처리 중 오류: ". err);
    res.status(500).send("서버 오류");
  }
});
router.get('/:id/download', async (req, res, next) => {
  try {
    const noteId = req.params.id;
    // 1) 파일 경로 조회
    const [[file]] = await db.promise().query(
      'SELECT file_path, file_name FROM files WHERE note_id = ?',
      [noteId]
    );
    if (!file) return res.status(404).send('파일이 없습니다.');

    // 2) 다운로드 수 증가
    await db.promise().query(
      'UPDATE notes SET download_count = download_count + 1 WHERE id = ?',
      [noteId]
    );

    // 3) 파일 전송
    const fullPath = path.join(__dirname, '..', 'public', file.file_path);
    res.download(fullPath, file.file_name);
  } catch (err) {
    next(err);
  }
});

module.exports = router;