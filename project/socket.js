const sharedSession = require('express-socket.io-session');
const db = require('./db');  // mysql2 promise 모듈로 연결된 db 객체
const roomUsers = {};        // roomId → Set(user_id)
const rooms = {};            // roomId → { ownerId }
const userSocketMap = {};    // user_id → socket.id

module.exports = (io, sessionMiddleware) => {
  io.use(sharedSession(sessionMiddleware, { autoSave: true }));

  io.on('connection', (socket) => {
    const user = socket.handshake.session.user;
    if (!user) {
      console.log('로그인 안된 사용자 소켓 연결 차단:', socket.id);
      socket.disconnect();
      return;
    }

    console.log('로그인 사용자 접속:', user.user_id, socket.id);
    socket.userId = user.user_id;
    userSocketMap[user.user_id] = socket.id;

    socket.on('joinRoom', async (roomId) => {
      socket.userId = user.user_id;
      socket.join(roomId);

      if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
      roomUsers[roomId].add(user.user_id);

      if (!rooms[roomId]) {
        try {
          const [roomRows] = await db.promise().query(
            'SELECT owner_id FROM chat_rooms WHERE id = ?',
            [roomId]
          );
          if (roomRows.length > 0) {
            rooms[roomId] = { ownerId: roomRows[0].owner_id };
          }
        } catch (err) {
          console.error('DB에서 방 정보 조회 실패:', err);
        }
      }

      io.to(roomId).emit("updateUserList", Array.from(roomUsers[roomId]));

      // 캔버스 기록 초기화 전송
      try {
        const [rows] = await db.promise().query(
          'SELECT event_data FROM canvas_history WHERE room_id = ? ORDER BY created_at ASC',
          [roomId]
        );
        const history = rows.map(r => r.event_data);
        socket.emit('initDrawing', history);
      } catch (err) {
        console.error('DB에서 캔버스 히스토리 조회 실패:', err);
      }
    });

    // 방 삭제 요청
    socket.on("deleteRoom", (roomId) => {
      if (rooms[roomId] && rooms[roomId].ownerId === socket.userId) {
        io.to(roomId).emit("roomDeleted");
        // 방 데이터 삭제 (DB 및 메모리)
        delete rooms[roomId];
        delete roomUsers[roomId];
        // TODO: DB에서 방 삭제도 필요하면 추가
      }
    });

    // 강퇴 요청
    socket.on("kickUser", ({ roomId, targetUser }) => {
      if (rooms[roomId] && rooms[roomId].ownerId === socket.userId) {
        const targetSocketId = userSocketMap[targetUser];
        if (targetSocketId) {
          io.to(targetSocketId).emit("kicked");
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.leave(roomId);
          }
          // 방 참여자 목록에서 제거
          if (roomUsers[roomId]) {
            roomUsers[roomId].delete(targetUser);
            io.to(roomId).emit("updateUserList", Array.from(roomUsers[roomId]));
          }
        }
      }
    });

    // 클라이언트에서 강퇴 이벤트 받는 경우는 없음, 서버가 보냄.

    // 드로잉 이벤트 저장 및 브로드캐스트
    socket.on('drawing', async (data) => {
      const roomId = data.roomId;
      if (roomId) {
        try {
          await db.promise().query(
            'INSERT INTO canvas_history (room_id, event_data) VALUES (?, ?)',
            [roomId, JSON.stringify(data)]
          );
        } catch (err) {
          console.error('DB에 드로잉 이벤트 저장 중 오류:', err);
        }
        socket.to(roomId).emit('drawing', data);
      }
    });

    // 채팅 메시지 브로드캐스트
    socket.on('chat message', (msg) => {
      console.log(`${user.user_id} 님이 보낸 메시지:`, msg);
      io.to(msg.roomId).emit('chat message', { user: user.user_id, message: msg });
    });

    // 연결 종료 시
    socket.on('disconnect', () => {
      delete userSocketMap[user.user_id];
      for (const [roomId, users] of Object.entries(roomUsers)) {
        if (users.has(user.user_id)) {
          users.delete(user.user_id);
          io.to(roomId).emit("updateUserList", Array.from(users));
        }
      }
      console.log('사용자 퇴장:', user.user_id, socket.id);
    });
  });
};
