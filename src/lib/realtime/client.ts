"use client";

/**
 * Browser side of the realtime protocol: one WebSocket with automatic
 * reconnection (COURSE-08), authentication by ticket and clock
 * synchronisation so countdowns line up across players (COURSE-03).
 */

import * as React from "react";
import { getRealtimeTicket } from "@/server/actions/realtime";
import { REALTIME_PATH, type ClientMessage, type ServerMessage } from "./protocol";

type Listener = (message: ServerMessage) => void;
export type ConnectionStatus = "connecting" | "open" | "reconnecting";

const MAX_BACKOFF_MS = 8000;
const PING_SAMPLES = 4;

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private ready = false;
  private outbox: ClientMessage[] = [];
  private attempts = 0;
  private disposed = false;
  private bestRtt = Infinity;
  private offset = 0;
  status: ConnectionStatus = "connecting";

  connect() {
    this.disposed = false;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}${REALTIME_PATH}`);
    this.socket = socket;

    socket.onopen = async () => {
      const result = await getRealtimeTicket().catch(() => null);
      const ticket = result?.success ? result.ticket : null;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "auth", ticket } satisfies ClientMessage));
      }
    };
    socket.onmessage = (event) => {
      let message: ServerMessage;
      try {
        message = JSON.parse(String(event.data)) as ServerMessage;
      } catch {
        return;
      }
      if (message.type === "hello") this.onHello(message.serverNow);
      if (message.type === "pong") this.onPong(message.t, message.serverNow);
      this.listeners.forEach((listener) => listener(message));
    };
    socket.onclose = () => {
      // Ignore sockets replaced by a newer connection (e.g. React Strict Mode remounts).
      if (this.socket !== socket) return;
      this.ready = false;
      if (this.disposed) return;
      this.setStatus("reconnecting");
      const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** this.attempts++);
      setTimeout(() => this.connect(), delay);
    };
  }

  private onHello(serverNow: number) {
    this.ready = true;
    this.attempts = 0;
    if (this.bestRtt === Infinity) this.offset = serverNow - Date.now();
    for (let i = 0; i < PING_SAMPLES; i++) {
      setTimeout(() => this.rawSend({ type: "ping", t: Date.now() }), i * 150);
    }
    const pending = this.outbox;
    this.outbox = [];
    pending.forEach((message) => this.rawSend(message));
    this.setStatus("open");
  }

  /** Keeps the sample with the smallest round trip: the most precise offset. */
  private onPong(sentAt: number, serverNow: number) {
    const rtt = Date.now() - sentAt;
    if (rtt < this.bestRtt) {
      this.bestRtt = rtt;
      this.offset = serverNow + rtt / 2 - Date.now();
    }
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private rawSend(message: ClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  /** Sends now if authenticated, else as soon as the connection is ready. */
  send(message: ClientMessage) {
    if (this.ready) this.rawSend(message);
    else this.outbox.push(message);
  }

  /** Current time on the server clock. */
  serverNow(): number {
    return Date.now() + this.offset;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  dispose() {
    this.disposed = true;
    this.ready = false;
    this.socket?.close();
  }
}

/**
 * Opens a connection for the lifetime of the component. `onMessage` always
 * sees the latest props thanks to a ref.
 */
export function useRealtime(onMessage: (message: ServerMessage, client: RealtimeClient) => void) {
  const [client] = React.useState(() => new RealtimeClient());
  const [status, setStatus] = React.useState<ConnectionStatus>("connecting");
  const handler = React.useRef(onMessage);

  React.useEffect(() => {
    handler.current = onMessage;
  });

  React.useEffect(() => {
    const unsubscribe = client.subscribe((message) => handler.current(message, client));
    const unwatch = client.onStatus(setStatus);
    client.connect();
    return () => {
      unsubscribe();
      unwatch();
      client.dispose();
    };
  }, [client]);

  return { client, status };
}
