const db = require('../db');

exports.listRooms = async (req, res, next) => {
  try {
    const [rooms] = await db.promise().query(`
      SELECT r.*, u.user_id AS creator
      FROM chat_rooms r
      JOIN users u ON r.created_by = u.user_id
      ORDER BY r.created_at DESC
    `);
    res.render('chat/index', { user: req.session.user, rooms });
  } catch (err) {
    next(err);
  }
};

exports.showCreateForm = (req, res) => {
  res.render('chat/create');
};

exports.createRoom = async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.session.user.user_id;
    await db.promise().query(
      'INSERT INTO chat_rooms (name, created_by) VALUES (?, ?)',
      [name, userId]
    );
    res.redirect('/chat');
  } catch (err) {
    next(err);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const roomId       = req.params.id;
    const currentUser  = req.session.user.user_id;
    const [[room]]     = await db.promise().query(
      'SELECT * FROM chat_rooms WHERE id = ?', [roomId]
    );
    if (!room) return res.status(404).send('존재하지 않는 방입니다.');
    if (room.created_by !== currentUser) {
      return res.status(403).send('방 생성자만 삭제할 수 있습니다.');
    }
    await db.promise().query('DELETE FROM chat_rooms WHERE id = ?', [roomId]);
    res.redirect('/chat');
  } catch (err) {
    next(err);
  }
};

exports.enterRoom = async (req, res, next) => {
  try {
    const roomId       = req.params.roomId;
    const [rows]       = await db.promise().query(
      'SELECT * FROM chat_rooms WHERE id = ?', [roomId]
    );
    if (rows.length === 0) return res.status(404).send('방을 찾을 수 없습니다.');
    res.render('chat/room', { user: req.session.user, room: rows[0] });
  } catch (err) {
    next(err);
  }
};
