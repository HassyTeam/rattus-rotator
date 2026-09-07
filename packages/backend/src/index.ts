import bodyParser from "body-parser";
import express from "express";
import cors from "cors";

import { ipGrabber2000, loggerMiddleware, logger } from "./logger";

import rottaRouter from "./rotta/router";
import mothRouter from "./moth";

const app = express();
const port = 8080;

app.use(ipGrabber2000);
app.use(loggerMiddleware);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: true
}));

app.use("/api/rotta", rottaRouter)
app.use("/api/moth", mothRouter)

app.listen(port, () => {
    logger.info(`zhongguo http://localhost:${port}/`);
});