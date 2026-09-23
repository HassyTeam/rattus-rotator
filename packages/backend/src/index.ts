import bodyParser from "body-parser";
import express from "express";
import cors from "cors";

import { createServer } from "http";
import { join } from "path";

import { ipGrabber2000, loggerMiddleware, logger } from "./logger";

import rottaRouter from "./rotta/router";
import mothRouter from "./moth";
import initWs from "./rotta/websockets";
import { existsSync } from "fs";


const app = express();
const host = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? 8080);

const FRONTEND_DIST = process.env.FRONTEND_DIST
    ?? join(import.meta.dir, "../../nezumifrontend/dist");

app.use(ipGrabber2000);
app.use(loggerMiddleware);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: true
}));

app.use("/api/rotta", rottaRouter);
app.use("/api/moth", mothRouter);

if (existsSync(FRONTEND_DIST)) {
    logger.info(`frontti: ${FRONTEND_DIST}`);
    app.use(express.static(FRONTEND_DIST));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
        res.sendFile(join(FRONTEND_DIST, "index.html"));
    });
} else {
    logger.warn(`fronttia ei löydy ${FRONTEND_DIST}; runnaa "bun run build" packages/nezumifrontend:issa.`);
}

const server = createServer(app);
initWs(server);

server.listen(port, host, () => {
    logger.info(`zhongguo http://${host}:${port}/`);
});