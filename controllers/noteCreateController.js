// create.ejs
const db = require('../db');
const path = require('path');
const { exec } = require('child_process');
const { rejects } = require('assert');

// 새 노트 작성 페이지 랜더링 처리 (GET /notes/new)
exports.createNote = async (req, res, next) => {
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
        res.status(500).json({ message: "노트 작성 페이지 렌더링 실패" });
        next(err);
    }
}

// 노트 상세 페이지 렌더링 (GET /notes/:id)
exports.getNoteById = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const editCommentId = parseInt(req.query.editCommentId, 10) || null;
    const alertMessage = req.session.alertMessage;
    delete req.session.alertMessage;

    const [[note]] = await db.promise().query(
      `SELECT n.id, n.title, n.subject, n.professor, n.category, n.summary, n.like_count, n.download_count,
              n.user_id, u.user_id AS authorName, n.created_at
       FROM notes n 
       JOIN users u 
       ON n.user_id = u.user_id
       WHERE n.id = ?`,
      [noteId]
    );
    if (!note) return res.status(404).send('노트를 찾을 수 없습니다.');

    const [[file]] = await db.promise().query(
      `SELECT f.file_name, f.stored_name, f.file_path, f.file_size
       FROM files f
       JOIN notes n
       ON n.id = f.note_id
       WHERE n.id = ?`,
       [req.params.id]
    )

    const [comments] = await db.promise().query(
      `SELECT c.id, c.content, c.created_at, c.user_id, c.parent_id, u.user_id AS author
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
                              stored_name: file.stored_name,
                              file_path: file.file_path,
                              file_size: formatBytes(file.file_size)},
                            user: req.session.user,
                            alertMessage });
  } catch (e) { next(e); }
}

exports.uploadNote = async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, summary, category, subject, year, semester, professor } = req.body;
  const uploadedFile = req.file;
  try {
    const u = req.session.user;

        // 바이러스 검사 (clamscan.exe 사용)
        // WSL 활용
        // X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H* (EICAR 문자열)
        const windowPath = uploadedFile.path;
        const wslPath = '/mnt/' + windowPath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => drive.toLowerCase());

        await new Promise((resolve, rejects) => {
            exec(`wsl clamscan "${wslPath}"`, (error, stdout, stderr) => {
                if(error) {
                    console.error("ClamAV 검사 오류: ", stderr || stdout);
                    return rejects(new Error("ClamAV 검사 중 오류 발생 또는 감염 파일입니다."));
                }

                if(stdout.includes('Infected files: 0')) {
                    console.log("안전한 파일입니다.");
                    resolve();
                }
                else {
                    console.warn('악성 파일이 탐지되었습니다:', stdout);
                    return reject(new Error('악성 코드가 포함된 파일입니다.'));
                }
            });
        });    

    // ───────────────────────────────────────────────────
    // 1) 과목(subject) 자동 추가 로직
    const subj = subject.trim();
    const [[exists]] = await db.promise().query(
      'SELECT 1 FROM subjects WHERE name = ?',
      [subj]
    );
    if (!exists) {
      await db.promise().query(
        'INSERT INTO subjects (name) VALUES (?)',
        [subj]
      );
    }
    // ───────────────────────────────────────────────────

    // 2) notes 테이블에 삽입
    const [noteResult] = await db.promise().query(
      `INSERT INTO notes 
         (user_id, title, summary, category, subject, year, semester, professor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.user_id, title, summary, category, subj, year, semester, professor]
    );
    const noteId = noteResult.insertId;

    // 3) files 테이블에 삽입 (기존 로직)
    if (uploadedFile) {
      await db.promise().query(
        `INSERT INTO files 
           (note_id, file_name, stored_name, file_path, file_size, uploaded_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          noteId,
          uploadedFile.originalname,
          uploadedFile.filename,
          '/files/' + uploadedFile.filename,
          uploadedFile.size
        ]
      );
    }

    // 4) 포인트 적립 및 리다이렉트
    await db.promise().query(
      'UPDATE users SET point = point + 100 WHERE user_id = ?',
      [u.user_id]
    );
    req.session.alertMessage = '100P가 적립되었습니다!';
    res.redirect('/');
  } catch (err) {
    next(err);
  }
};