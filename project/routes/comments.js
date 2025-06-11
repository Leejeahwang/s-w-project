const express = require('express');
const commentController = require('../controllers/commentController');
const router = express.Router({ mergeParams: true });

// comments.js => /notes/:id/comments

// 1. 댓글 작성 (POST /notes/:id/comments)
router.post('/', commentController.createComment);

// 2. 댓글 수정 처리 (PUT /notes/:id/comments/:commentId)
router.put('/:commentId', commentController.updateComment);

// 3. 댓글 삭제 처리 (DELETE /notes/:id/comments/:commentId)
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;