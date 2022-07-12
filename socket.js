import SocketIO from "socket.io";

export default (server, app) => {
  const io = SocketIO(server, { path: "/socket.io" });
  app.set("io", io);
  io.on("connection", (socket) => {
    // 웹 소켓 연결 시
    const req = socket.request;
    const {
      headers: { referer },
    } = req;
    // 기본 네임스페이스 '/' 사용
    // 클라이언트 연결 시 주소로부터 roomId(경매방 아이디) 파싱
    const roomId = referer.split("/")[referer.split("/").length - 1];
    // 경매방 입장
    socket.join(roomId);
    socket.on("disconnect", () => {
      socket.leave(roomId);
    });
  });
};
