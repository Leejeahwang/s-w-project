const db = require('../db');

// 전체 노트 목록 조회
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

// 단일 노트 조회
exports.getNoteById = (req, res) => {
  const noteId = req.params.noteId;
  const query = `
    SELECT n.id, n.subject, n.professor, n.category, n.summary, n.created_at, u.username AS authorName
    FROM notes n
    JOIN users u ON n.user_id = u.id
    WHERE n.id = ?
  `;
  db.query(query, [noteId], (err, results) => {
    if (err) {
      console.error('특정 노트 조회 오류:', err);
      return res.status(500).json({ message: '노트 조회 중 오류가 발생했습니다.' });
    }
    if (results.length === 0) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' });
    res.json(results[0]);
  });
};

// 새 노트 생성
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