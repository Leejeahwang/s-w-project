const express = require('express');
const downloadController = require('../controllers/downloadController');
const router = express.Router({ mergeParams: true });

// 다운로드 기록 및 카운트 증가 (POST /files/download-log/:noteId)
router.post('/download-log/:noteId', downloadController.updateDownload_log);

// 파일 다운로드 (GET /files/download/:stored_name)
router.get('/download/:stored_name', downloadController.getFile);

module.exports = router;