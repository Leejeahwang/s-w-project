const db = require('../db');

// 전체 노트 목록 조회 -> 안쓰는듯?
exports.getAllNotes = (req, res) => {
  const query = `
    SELECT n.id, n.subject, n.professor, n.category, n.summary, n.created_at, u.username AS authorName
    FROM notes n
    JOIN users u ON n.user_id = u.id
    ORDER BY n.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('노트 목록 조회 오류:', err);
      return res.status(500).json({ message: '노트 목록 조회 중 오류가 발생했습니다.' });
    }
    res.json(results);
  });
};

// 3) 노트 상세 페이지 렌더링 (GET /notes/:id)
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

// 새 노트 생성 -> 안쓰는듯?
exports.createNote = (req, res) => {
  if (!req.session.user || !req.session.user.userId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const { subject, professor, category, summary } = req.body;
  const userId = req.session.user.userId;
  if (!subject || !summary) {
    return res.status(400).json({ message: '교과명과 요약은 필수입니다.' });
  }
  const query = 'INSERT INTO notes (user_id, subject, professor, category, summary) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [userId, subject, professor, category, summary], (err, result) => {
    if (err) {
      console.error('노트 생성 오류:', err);
      return res.status(500).json({ message: '노트 생성 중 오류가 발생했습니다.' });
    }
    res.status(201).json({ id: result.insertId, userId, subject, professor, category, summary });
  });
};