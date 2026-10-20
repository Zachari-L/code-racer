/**
 * Custom server: Next.js and the realtime WebSocket endpoint share one HTTP
 * server, so production needs a single port behind HTTPS (see the ADR in
 * docs/ARCHITECTURE.md). Run with `bun run dev` / `bun run start`.
 */

import { createServer } from "node:http";
import { parse } from "node:url";
import { loadEnvConfig } from "@next/env";
import next from "next";
import { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "localhost";

async function main() {
  // Load .env before importing modules that read it (Prisma, auth secret).
  loadEnvConfig(process.cwd(), dev);
  const { RealtimeHub } = await import("./src/server/realtime/hub");
  const { REALTIME_PATH } = await import("./src/lib/realtime/protocol");

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();
  const upgradeNext = app.getUpgradeHandler();

  const hub = new RealtimeHub(process.env.TRUST_PROXY === "true");
  await hub.bootstrap();

  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
  wss.on("connection", (socket, request) => hub.handleConnection(socket, request));

  const server = createServer((req, res) => handle(req, res, parse(req.url ?? "/", true)));
  server.on("upgrade", (request, socket, head) => {
    if (parse(request.url ?? "/").pathname === REALTIME_PATH) {
      wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request));
    } else {
      // Hot module reloading and other Next.js upgrades.
      void upgradeNext(request, socket, head);
    }
  });

  server.listen(port, () => {
    console.log(`> CodeRacer ready on http://${hostname}:${port} (${dev ? "dev" : "production"})`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
