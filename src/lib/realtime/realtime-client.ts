import { SCHEMA_VERSION, type ClientMessage, type ServerMessage } from "@/contracts/realtime";

type Options = {
  url: string;
  onMessage: (message: ServerMessage) => void;
  onStatus: (status: "connecting" | "open" | "reconnecting" | "idle") => void;
};

export class RealtimeClient {
  private socket?: WebSocket;
  private reconnectAttempt = 0;
  private heartbeat?: ReturnType<typeof setInterval>;
  private stopped = false;

  constructor(private readonly options: Options) {}

  connect() {
    this.stopped = false;
    this.options.onStatus(this.reconnectAttempt ? "reconnecting" : "connecting");
    this.socket = new WebSocket(this.options.url);
    this.socket.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      this.options.onStatus("open");
      this.heartbeat = setInterval(
        () =>
          this.send({ type: "connection.heartbeat", schema_version: SCHEMA_VERSION, payload: {} }),
        20_000
      );
    });
    this.socket.addEventListener("message", (event) =>
      this.options.onMessage(JSON.parse(event.data) as ServerMessage)
    );
    this.socket.addEventListener("close", () => this.scheduleReconnect());
  }

  send(message: ClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  disconnect() {
    this.stopped = true;
    clearInterval(this.heartbeat);
    this.socket?.close();
    this.options.onStatus("idle");
  }

  private scheduleReconnect() {
    clearInterval(this.heartbeat);
    if (this.stopped) return;
    this.reconnectAttempt += 1;
    this.options.onStatus("reconnecting");
    const delay = Math.min(1000 * 2 ** (this.reconnectAttempt - 1), 30_000) + Math.random() * 500;
    setTimeout(() => this.connect(), delay);
  }
}
