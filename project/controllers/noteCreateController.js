// create.ejs
const db = require('../db');

// 새 노트 작성 페이지 랜더링 처리 (GET /notes/new)
exports.createNote = async (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');

    try {
        const [categories] = await db.promise().query('SELECT * FROM categories');
        const [subjects] = await db.promise().query('SELECT * FROM subjects');
        const [years] = await db.promise().query('SELECT * FROM years');
        const [semesters] = await db.promise().query('SELECT * FROM semesters');
        
        res.render('create', {
            categories,
            subjects,
            years,
            semesters,
            user : req.session.user
        });
    } catch (err) {
        res.status(500).json({ message: "노트 작성 페이지 렌더링 실패" });
        next(err);
    }
}

// 새 노트 업로드  (POST /notes/upload)
exports.uploadNote = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { title, summary, category, subject, year, semester, professor } = req.body;
    const uploadedFile = req.file;

    try {
        const u = req.session.user;
        
        // notes 테이블에 INSERT
        const [noteResult] = await db.promise().query(
            'INSERT INTO notes (user_id, title, summary, category, subject, year, semester, professor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [u.user_id, title, summary, category, subject, year, semester, professor]
        );
        const noteId = noteResult.insertId;

        // files 테이블에 INSERT
        if(uploadedFile) {
            await db.promise().query(
                `INSERT INTO files (note_id, file_name, stored_name, file_path, file_size, uploaded_at)
                VALUES (?, ?, ?, ?, ?, NOW())`,
                [noteId, uploadedFile.originalname, uploadedFile.filename, '/files/' + uploadedFile.filename, uploadedFile.size]
            );
        }

        // 노트 업로드시 100P 적립
        await db.promise().query(
            `UPDATE users SET point = point + 100 WHERE user_id = ?`, [u.user_id]
        );
        req.session.alertMessage = `100P가 적립되었습니다!`;
        
        res.redirect('/');
    } catch {
        return res.status(400).json({ message: "파일 업로드중 오류" });
    }
}