const express = require('express');
const commentController = require('../controllers/commentController');
const {
  getComments,
  createComment
} = require('../controllers/commentController');
const router = express.Router({ mergeParams: true });

router.get('/', getComments);

// 댓글 생성
router.post('/', commentController.createComment);

// 댓글 수정 처리
router.put('/:commentId', commentController.updateComment);

// 댓글 삭제 처리
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;