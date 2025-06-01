const db = require('../db');

// 삭제 처리 (delete /notes/:id/delete)
exports.deleteNote = async (req, res, next) => {
    const noteId = req.params.id;
  
    try {
        await db.promise().query('DELETE FROM notes WHERE id = ?', [noteId]);
        return res.redirect('/');
    } catch (err) { 
        next(err); 
    }
}