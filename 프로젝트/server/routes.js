const express = require('express');
const router = express.Router();
const db = require('./db');

// 좋아요 증가
router.post('/like/:id', (req, res) => {
  const noteId = req.params.id;
  db.query('UPDATE notes SET like_count = like_count + 1 WHERE id = ?', [noteId], err => {
    if (err) return res.status(500).send('DB Error');
    res.send('Liked');
  });
});

// 다운로드 수 증가
router.post('/download/:id', (req, res) => {
  const noteId = req.params.id;
  db.query('UPDATE notes SET download_count = download_count + 1 WHERE id = ?', [noteId], err => {
    if (err) return res.status(500).send('DB Error');
    res.send('Downloaded');
  });
});

// 현재 수 가져오기
router.get('/stats/:id', (req, res) => {
  const noteId = req.params.id;
  db.query('SELECT like_count, download_count FROM notes WHERE id = ?', [noteId], (err, result) => {
    if (err) return res.status(500).send('DB Error');
    res.json(result[0]);
  });
});

module.exports = router;
