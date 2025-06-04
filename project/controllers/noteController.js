const db = require('../db');

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
                              stored_name: file.stored_name,
                              file_path: file.file_path,
                              file_size: formatBytes(file.file_size)},
                            user: req.session.user,
                            alertMessage });
  } catch (e) { next(e); }
}