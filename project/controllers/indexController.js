const db = require('../db');

// 메인 페이지 렌더링 처리 (GET /)
exports.getIndex = async (req, res, next) => {
    try {
        const { category, subject, professor, year, semester, keyword } = req.query;

        let conditions = [];
        let params = [];

        if (category && category !== '전체') {
            conditions.push('n.category = ?');
            params.push(category);
        }
        if (subject && subject !== '전체') {
            conditions.push('n.subject = ?');
            params.push(subject);
        }
        if (professor && professor !== '전체') {
            conditions.push('n.professor = ?');
            params.push(professor);
        }
        if (year && year !== '전체') {
            conditions.push('n.year = ?');
            params.push(year);
        }
        if (semester && semester !== '전체') {
            conditions.push('n.semester = ?');
            params.push(semester);
        }
        if (keyword && keyword.trim() !== '') {
            conditions.push('(n.title LIKE ? OR n.summary LIKE ?)');
            const kw = `%${keyword.trim()}%`;
            params.push(kw, kw);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const sql = `
            SELECT n.id, n.title, n.subject, n.professor, n.category, n.year, n.semester,
                   n.summary, n.created_at, u.user_id AS authorName
            FROM notes n
            JOIN users u 
            ON n.user_id = u.user_id
            ${where}
            ORDER BY n.created_at DESC
            `;

        const [notes] = await db.promise().query(sql, params);
        const [categories] = await db.promise().query('SELECT name FROM categories');
        const [subjects] = await db.promise().query('SELECT name FROM subjects');
        const [years] = await db.promise().query('SELECT name FROM years');
        const [semesters] = await db.promise().query('SELECT name FROM semesters');
        const [professors] = await db.promise().query('SELECT DISTINCT professor AS name FROM notes');

        let userInfo = null;
        if(req.session.user) {
            const [userRow] = await db.promise().query(
                'SELECT user_id, name, point FROM users WHERE user_id = ?', [req.session.user.user_id]
            );
            userInfo = userRow[0];
        } else {
            userInfo = req.session.user;
        }

        res.render('index', {
            notes,
            categories,
            subjects,
            professors,
            years,
            semesters,
            filters : { category, subject, professor, year, semester },
            keyword: keyword || '',
            user: userInfo
        });
    } catch (err) { next(err); }
}