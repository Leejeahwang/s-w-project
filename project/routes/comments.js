const express = require('express');
const {
  getComments,
  createComment
} = require('../controllers/commentController');
const router = express.Router({ mergeParams: true });

router.get('/',    getComments);
router.post('/',   createComment);

module.exports = router;