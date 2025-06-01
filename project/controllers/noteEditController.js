const db = require('../db');

// 노트 수정 페이지 랜더링 처리 (GET /notes/:id/edit)
exports.edit_redering = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    const noteId = req.params.id;

    try {
        const [categories] = await db.promise().query('SELECT * FROM categories');
        const [subjects] = await db.promise().query('SELECT * FROM subjects');
        const [years] = await db.promise().query('SELECT * FROM years');
        const [semesters] = await db.promise().query('SELECT * FROM semesters');
        const [[note]] = await db.promise().query('SELECT id, user_id, title, summary, subject, professor, category, year, semester, created_at FROM notes WHERE id = ?',
                                                   [noteId]);

        if (!note || note.user_id !== req.session.user.user_id) return res.redirect('/notes/' + req.params.id);
    
        res.render('edit', { 
            note, 
        categories,
        subjects,
        years,
        semesters,
        user: req.session.user 
        });

    } catch (e) { 
        res.status(400).json({ message: "노트 수정 페이지 랜더링 실패" });
        next(e);
    }
}

// 노트 수정 처리 (PUT /notes/:id/edit)
exports.editNote = async (req, res, next) => {
    const noteId = req.params.id;

    if (!req.session.user) return res.redirect('/login');

    try {
        const [[orig]] = await db.promise().query('SELECT user_id FROM notes WHERE id = ?', [req.params.id]);
        
        if (!orig || orig.user_id !== req.session.user.user_id) return res.redirect('/notes/' + noteId);

        const { title, summary, category, subject, year, semester, professor } = req.body;
    
        await db.promise().query(
            'UPDATE notes SET title=?, summary=?, category=?, subject=?, year=?, semester=?, professor=?, created_at=NOW() WHERE id=?',
            [title, summary, category, subject, year, semester, professor, noteId]);

        return res.redirect('/notes/' + noteId);
    } 
    catch (e) { next(e); }
}