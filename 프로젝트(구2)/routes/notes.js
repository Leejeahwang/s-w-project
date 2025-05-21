const express = require('express');
const {
  getAllNotes,
  getNoteById,
  createNote
} = require('../controllers/noteController');
const router = express.Router();

router.get('/',          getAllNotes);
router.get('/:noteId',   getNoteById);
router.post('/',         createNote);

module.exports = router;