import SSE from "sse";

export default (server) => {
  const sse = new SSE(server);
  sse.on("connection", (client) => {
    // 서버센트이벤트 연결, 클라이언트와 연결할 때 어떤 동작을 취할지 정의
    setInterval(() => {
      client.send(Date.now().toString()); // 문자열만 전송 가능
    }, 1000);
  });
};
