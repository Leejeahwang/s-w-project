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


// notes.js => /notes
// 여기서부터 보면 됩니다.
const noteController = require('../controllers/noteController');
const noteCreateController = require('../controllers/noteCreateController');
const noteEditController = require('../controllers/noteEditController');
const noteDeleteController = require('../controllers/noteDeleteController');
const downloadController = require('../controllers/downloadController');
const likeController = require('../controllers/likeController');

// 2. 새 노트 작성 페이지 랜더링 처리 (GET /notes/new)
router.get('/new', noteCreateController.createNote);

// 3. 새 노트 업로드 (POST /notes/upload)
router.post('/upload', upload.single('file'), noteCreateController.uploadNote);

// 1. 노트 상세 조회 (GET /notes/:id)
router.get('/:id', noteController.getNoteById);

// 4. 노트 수정 페이지 랜더링 처리 (GET /notes/:id/edit)
router.get('/:id/edit', noteEditController.edit_redering);

// 5. 노트 수정 처리 (PUT /notes/:id/edit) - 작성자만
router.put('/:id/edit', noteEditController.editNote);

// 6. 노트 삭제 처리 (POST /notes/:id/delete)
router.delete('/:id/delete', noteDeleteController.deleteNote);

// 7. 다운로드 카운팅 & 파일 다운로드
router.post('/files/download-log/:id', downloadController.updateDownload_log);

// 8. 좋아요 카운팅 (POST /notes/:id/like)
router.post('/:id/like', likeController.updateLike_log);

module.exports = router;