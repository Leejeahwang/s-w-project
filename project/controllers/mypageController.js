const db = require('../db');

// GET /mypage
exports.showMyPage = async (req, res, next) => {
  try {
    const userId = req.session.user.user_id;
    // 회원정보
    const [[user]] = await db.promise().query(
      `SELECT user_id, name, studentId, grade, point
       FROM users WHERE user_id = ?`, [userId]
    );
    // 게시한 노트 개수
    const [[{ noteCount }]] = await db.promise().query(
      'SELECT COUNT(*) AS noteCount FROM notes WHERE user_id = ?', [userId]
    );
    // 작성한 댓글 개수
    const [[{ commentCount }]] = await db.promise().query(
      'SELECT COUNT(*) AS commentCount FROM comments WHERE user_id = ?', [userId]
    );
    const alertMessage = req.session.alertMessage || null;
    delete req.session.alertMessage;

    // 뷰에 alertMessage까지 모두 전달
    res.render('mypage', {
      user,
      stats: { noteCount, commentCount },
      alertMessage
    });
  } catch (err) {
    next(err);
  }
};

// PUT /mypage
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.session.user.user_id;
    const { currentPassword, newPassword, newName, grade } = req.body;

    // 1) 현재 비밀번호 확인
    const [[record]] = await db.promise().query(
      'SELECT password FROM users WHERE user_id = ?', [userId]
    );
    if (!record || record.password !== currentPassword) {
      req.session.alertMessage = '현재 비밀번호가 올바르지 않습니다.';
      return res.redirect('/mypage');
    }

    // 2) 업데이트할 필드 준비
    const fields = [];
    const params = [];
    if (newName && newName.trim()) {
      fields.push('name = ?');
      params.push(newName);
      req.session.user.name = newName;
    }
    if (newPassword && newPassword.trim()) {
      fields.push('password = ?');
      params.push(newPassword);
    }
    // 학년은 항상 업데이트
    fields.push('grade = ?');
    params.push(grade);

    params.push(userId);

    if (fields.length) {
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
      await db.promise().query(sql, params);
      req.session.user.grade = grade;
    }

    req.session.alertMessage = '회원 정보가 성공적으로 수정되었습니다.';
    res.redirect('/mypage');
  } catch (err) {
    next(err);
  }
};

// DELETE /mypage
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.session.user.user_id;
    const { currentPassword } = req.body;
    // 1) 비밀번호 검증
    const [[userRecord]] = await db.promise().query(
      'SELECT password FROM users WHERE user_id = ?', [userId]
    );
    if (!userRecord || userRecord.password !== currentPassword) {
      req.session.alertMessage = '현재 비밀번호가 올바르지 않습니다.';
      return res.redirect('/mypage');
    }
    // 2) 종속 데이터 삭제
    await db.promise().query('DELETE FROM chat_rooms WHERE created_by = ?', [userId]);
    await db.promise().query('DELETE FROM comments WHERE user_id = ?', [userId]);
    await db.promise().query('DELETE FROM note_likes WHERE user_id = ?', [userId]);
    await db.promise().query('DELETE FROM note_downloads WHERE user_id = ?', [userId]);
    await db.promise().query(
      'DELETE FROM files WHERE note_id IN (SELECT id FROM notes WHERE user_id = ?)',
      [userId]
    );
    await db.promise().query('DELETE FROM notes WHERE user_id = ?', [userId]);
    await db.promise().query('DELETE FROM users WHERE user_id = ?', [userId]);
    // 3) 세션 파괴
    req.session.destroy(err => {
      if (err) return next(err);
      res.redirect('/');
    });
  } catch (err) { next(err); }
};