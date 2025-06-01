const db = require('../db');

// 좋아요 버튼: POST /notes/:id/like
exports.updateLike_log = async (req, res) => {
    // 로그인 여부 확인
    if(!req.session.user) return res.status(401).json({ message: "로그인이 필요합니다." });

    const noteId = req.params.id;
    const userId = req.session.user.user_id;

    try {
        // 좋아요 여부 확인
        const [exist] = await db.promise().query(
            'SELECT 1 FROM note_likes WHERE note_id=? AND user_id=?', [noteId, userId]
        );
        if(exist.length) return res.status(400).json({ message: "이미 좋아요를 눌렀습니다" });

        // db 업데이트
        await db.promise().query('INSERT INTO note_likes (note_id,user_id) VALUES(?,?)', [noteId, userId]);
        await db.promise().query('UPDATE notes SET like_count=like_count+1 WHERE id=?', [noteId]);

        return res.status(200).json({ message: "좋아요 처리 완료" });
    }
    catch {
        return res.status(400).json({ message: "좋아요 처리중 오류가 발생했습니다."} );
    }
}