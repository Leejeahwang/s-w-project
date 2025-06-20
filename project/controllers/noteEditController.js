const db = require('../db');
const path = require('path');
const { exec } = require('child_process');
const { rejects } = require('assert');

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
    const uploadedFile = req.file;

    console.log(uploadedFile);

    if (!req.session.user) return res.redirect('/login');

    try {
        const [[orig]] = await db.promise().query('SELECT user_id FROM notes WHERE id = ?', [req.params.id]);
        
        if (!orig || orig.user_id !== req.session.user.user_id) return res.redirect('/notes/' + noteId);

        const { title, summary, category, subject, year, semester, professor } = req.body;
    
        await db.promise().query(
            'UPDATE notes SET title=?, summary=?, category=?, subject=?, year=?, semester=?, professor=?, created_at=NOW() WHERE id=?',
            [title, summary, category, subject, year, semester, professor, noteId]);

        // 수정할 파일이 있으면
        if (uploadedFile) {
            // 파일검사
            const windowPath = uploadedFile.path;
            const wslPath = '/mnt/' + windowPath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => drive.toLowerCase());

            await new Promise((resolve, rejects) => {
                exec(`wsl clamscan "${wslPath}"`, (error, stdout, stderr) => {
                    if(error) {
                        console.error("ClamAV 검사 오류: ", stderr || stdout);
                        return rejects(new Error("ClamAV 검사 중 오류 발생 또는 감염 파일입니다."));
                    }

                    if(stdout.includes('Infected files: 0')) {
                        console.log("안전한 파일입니다.");
                        resolve();
                    }
                    else {
                        console.warn('악성 파일이 탐지되었습니다:', stdout);
                        return reject(new Error('악성 코드가 포함된 파일입니다.'));
                    }
                });
            });

            await db.promise().query(
                `UPDATE files 
                SET file_name=?, stored_name=?, file_path=?, file_size=?, uploaded_at=NOW() 
                WHERE note_id=?`,
                [uploadedFile.originalname, uploadedFile.filename, '/files/' + uploadedFile.filename, uploadedFile.size, noteId]
            );
        }

        return res.redirect('/notes/' + noteId);
    } 
    catch (e) { next(e); }
}