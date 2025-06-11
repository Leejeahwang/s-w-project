const db = require('../db');

// ToDo 리스트 조회 (GET /todo)
exports.getToDo = async (req, res) => {
    try {
        const userId = req.session.user.user_id;

        const [content] = await db.promise().query(
            'SELECT content FROM todos WHERE user_id = ?', [userId]
        );
        
    } catch {

    }
}

// ToDo 리스트 수정 (POST /todo/confirm)
exports.updateToDo = async (req, res) => {

}