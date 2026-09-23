import type { Server } from "http";
import { WebSocketServer, type WebSocket as WebSocket2 } from "ws";
import { getQueue, getDetailedUserItems, listPublicQueue } from "./queue";
import { ohjainBussi } from "./ohjainBussi";
import { logger } from "../logger";

const users: Map<string, WebSocket2> = new Map();

let publicWss: WebSocketServer | null = null;
let privateWss: WebSocketServer | null = null;
let userWss: WebSocketServer | null = null;

export default function initWs(server: Server) {
    publicWss = new WebSocketServer({ noServer: true });
    privateWss = new WebSocketServer({ noServer: true });
    userWss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (req, socket, head) => {
        const { pathname } = new URL(req.url!, "http://localhost");

        if (pathname === "/api/ws/public") {
            publicWss!.handleUpgrade(req, socket, head, (ws) => {
                publicWss!.emit("connection", ws, req);
            });
        } else if (pathname === "/api/ws/analytics") {
            privateWss!.handleUpgrade(req, socket, head, (ws) => {
                privateWss!.emit("connection", ws, req);
                // TODO AUTH
            });
        } else if (pathname === "/api/ws/user") {
            userWss!.handleUpgrade(req, socket, head, (ws) => {
                userWss!.emit("connection", ws, req);
            });
        } else {
            socket.destroy();
        }
    });

    userWss.on("connection", async (ws, req) => {
        const userId = new URL(req.url!, "http://localhost").searchParams.get("id");

        if (userId === null) { ws.close(1000); return };
        users.set(userId, ws);

        const items = await getDetailedUserItems(userId);
        ws.send(JSON.stringify({ type: "queue", items }));
    })
    
    privateWss.on("connection", async (ws) => {
        ws.send(JSON.stringify({ type: "controller", state: ohjainBussi.state }));
        ws.send(JSON.stringify({ type: "queue", items: await getQueue("approved") }));
        ws.send(JSON.stringify({ type: "deniedQ", items: await getQueue("denied") }));
        ws.send(JSON.stringify({ type: "pendingQ", items: await getQueue("pending") }));
        // ws.send(JSON.stringify({ type: "library", items: await listLibrary() })); // jos ehdin
    });

    publicWss.on("connection", async (ws) => {
        ws.send(JSON.stringify({ type: "controller", state: ohjainBussi.state }));
        ws.send(JSON.stringify({ type: "queue", items: await listPublicQueue() }));
    })

    ohjainBussi.on("connection", (state) => broadcast({ type: "controller", state }, [privateWss, publicWss]));
    ohjainBussi.on("message", (msg) => broadcast({ type: "controllerEvent", event: msg }, [privateWss, publicWss]));
}

export async function broadcastUserQueue(user: string) {
    broadcastUser(user, { type: "queue", items: await getDetailedUserItems(user) })
}

export async function broadcastQueue() {
    broadcast({ type: "queue", items: await getQueue("approved") }, privateWss);
    broadcast({ type: "deniedQ", items: await getQueue("denied") }, privateWss);
    broadcast({ type: "pendingQ", items: await getQueue("pending") }, privateWss);
    broadcast({ type: "queue", items: await listPublicQueue() }, publicWss)
}

function broadcastUser(user: string, payload: object) {
    const data = JSON.stringify(payload);
    const userWs = users.get(user);
    if(userWs && userWs.readyState === WebSocket.OPEN) userWs.send(data);
}

// DO ***NOT*** USE FOR USER :DDDDD
function broadcast(payload: object, wss: (WebSocketServer | null) | (WebSocketServer | null)[]) {
    if (!wss) return;
    if (wss instanceof WebSocketServer) {
        const data = JSON.stringify(payload);
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) client.send(data);
        }
    } else {
        wss.forEach((wss2) => {
            broadcast(payload, wss2)
        })
    }
}