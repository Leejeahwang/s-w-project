// socket.js
module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log('사용자 접속:', socket.id);
  
      socket.on('chat message', (msg) => {
        console.log('받은 메시지:', msg);
        io.emit('chat message', msg); // 모든 클라이언트에 전송
      });
  
      socket.on('disconnect', () => {
        console.log('사용자 퇴장:', socket.id);
      });
    });
  };
  