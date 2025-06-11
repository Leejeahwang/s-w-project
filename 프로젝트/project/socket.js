const sharedSession = require('express-socket.io-session');
const db = require('./db');

module.exports = (io, sessionMiddleware) => {
  // 세션 미들웨어 공유 설정
  io.use(sharedSession(sessionMiddleware, {
    autoSave: true
  }));

  io.on('connection', (socket) => {
    const user = socket.handshake.session.user;
    if (!user) {
      console.log('로그인 안된 사용자 소켓 연결 차단:', socket.id);
      socket.disconnect();
      return;
    }

    console.log('로그인 사용자 접속:', user, socket.id);

    socket.on('joinRoom', async (roomId) => {
      socket.join(roomId);
      // DB에서 roomId에 해당하는 모든 event_data를 시간 순으로 가져오기
      const [rows] = await db.promise().query(
        'SELECT event_data FROM canvas_history WHERE room_id = ? ORDER BY created_at ASC',
        [roomId]
      );
      // 각각 JSON.parse 해서 배열로 넘겨 주기
      const history = rows.map(r => r.event_data);
      socket.emit('initDrawing', history);
    });

    // 2) 클라이언트가 드로잉 이벤트를 보낼 때
    //    drawingData 예시: { x0, y0, x1, y1, color, lineWidth, mode: 'draw' | 'text', textData? }
    socket.on('drawing', async (data) => {
      const roomId = data.roomId;
      if (roomId) {
        try {
          // DB에 저장
          await db.promise().query(
            'INSERT INTO canvas_history (room_id, event_data) VALUES (?, ?)',
            [roomId, JSON.stringify(data)]
          );
        } catch (err) {
          console.error('DB에 드로잉 이벤트 저장 중 오류:', err);
        }
      }
      // 같은 방에 속한 다른 클라이언트에게 브로드캐스트
      socket.to(roomId).emit('drawing', data);
    });

    socket.on('chat message', (msg) => {
      console.log(`${user.user_id} 님이 보낸 메시지:`, msg);
      io.emit('chat message', { user: user.user_id, message: msg }); // 사용자 이름이 포함한 메세지 전송
    });

    socket.on('disconnect', () => {
      console.log('사용자 퇴장:', user, socket.id);
    });
  });
};
