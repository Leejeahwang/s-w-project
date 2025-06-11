const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');

// 다운로드 기록 및 카운트 증가 (POST /files/download-log/:noteId)
router.post('/download-log/:noteId', async (req, res, next) => {
  // 로그인 여부 확인
  if(!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const noteId = req.params.noteId;
  const userId = req.session.user.user_id;

  console.log(noteId);
  console.log(userId);

  try {
    const [rows] = await db.promise().query(`SELECT note_id FROM files WHERE note_id = ?`, [noteId]);
    
    if(rows.length === 0) {
        return res.status(404);
    }

    await db.promise().query('INSERT INTO note_downloads (note_id, user_id, downloaded_at) VALUES (?, ?, NOW())',[noteId, userId]);
    await db.promise().query('UPDATE notes SET download_count = download_count + 1 WHERE id = ?', [noteId]);
    
    res.json({ message: "다운로드 기록 완료" });
  }
  catch (err) {
    console.log("catch에 걸림: ", err);
    res.status(500).json({ message: "다운로드 기록 오류" });
  }
});

// 실제 파일 다운로드 (GET /files/:stored_name)
router.get('/:stored_name', (req, res) => {
  const stored_name = req.params.stored_name;
  const filePath = path.join(__dirname, '..', 'public', 'files', stored_name);

  console.log(stored_name);
  console.log(filePath);

  res.download(filePath, stored_name, err => {
    if(err) {
      console.error("파일 다운로드 오류: ", err);
      res.status(404).send("파일을 찾을 수 없습니다.");
    }
  });
});

module.exports = router;