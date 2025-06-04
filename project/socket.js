const sharedSession = require('express-socket.io-session');

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

    socket.on('chat message', (msg) => {
      console.log(`${user.user_id} 님이 보낸 메시지:`, msg);
      io.emit('chat message', { user: user.user_id, message: msg }); // 사용자 이름이 포함한 메세지 전송
    });

    socket.on('disconnect', () => {
      console.log('사용자 퇴장:', user, socket.id);
    });
  });
};
