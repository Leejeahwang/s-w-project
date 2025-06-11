const express = require('express');
const router = express.Router({ mergeParams: true });
const todoController = require('../controllers/todoController');

// todo.js => /todo

// ToDo 리스트 조회 (GET /todo)
router.get('/', todoController.getToDo);

// ToDo 리스트 수정 (GET /todo/confirm)
router.post('/confirm', todoController.updateToDo);

module.exports = router;