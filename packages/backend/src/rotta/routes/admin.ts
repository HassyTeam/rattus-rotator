import express from "express";
import basicAuth from "express-basic-auth";
import multer from "multer";
import crypto from "node:crypto"
import { logger } from "../../logger";
import { addItem, getItem, getQueue, removeItem, requeueFront, setNowPlaying, takeFirst, takeItem, type QueueType } from "../queue";
import { rm, rename } from "node:fs/promises";
import path from "node:path";
import { broadcastQueue, broadcastUserQueue } from "../websockets";
import { ohjainBussi } from "../ohjainBussi";
import parseTracks from "../parseTracks";

const adminRouter = express.Router();

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './midi/')
        },
        filename: function (req, file, cb) {
            crypto.randomBytes(16, function (err, raw) {
                if (err) return cb(err,"")
                cb(null, file.fieldname + "-" + raw.toString('hex') + ".mid")
            })
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "audio/midi") {
            cb(null, true)
        } else {
            cb(null, false)
        }
    }
});

//adminRouter.use(basicAuth({ authorizer: myAuthorizer, authorizeAsync: true, challenge: true }))

async function myAuthorizer(username: string, password: string, cb: (...any: any) => void) {
    const userMatches = basicAuth.safeCompare(username, 'admin')
    const passwordMatches = await Bun.password.verify(password, process.env.AUTH_PASSWORD ?? "")

    if (userMatches && passwordMatches) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

adminRouter.post("/luvananto", upload.single("midi"), async (req, res) => {
    try {
        const { id, song, artist, reference, parsingMode, username, rating, status, statusText, excludedTracks, minVelocity, transpose } = req.body;
        // horrible hardcoding (fix pls todo :))
        if (status !== "approved" && status !== "denied" && status !== "pending") {
            res.status(400).json({ error: "invalid status (use approved, denied or pending)", status });
            return;
        }

        const origObj = await getItem(id, "pending");

        if (!origObj) {
            res.status(400).json({ error: "song not found" });
            return;
        }

        if (!req.file && !origObj.path && status === "approved") {
            res.status(400).json({ error: "missing 'midi' file field" });
            return;
        }

        if (origObj.path && origObj.fileName) {
            const lePath = path.join(import.meta.dir, "../../../", origObj.path);
            if (lePath === "/" || lePath === "") {
                // omfg
                throw new Error("what");
            }

            if (req.file) {
                await rm(lePath);
            } else {
                switch (status) {
                    case "denied":
                        await rm(lePath);
                        break;
                    case "approved":
                        logger.debug(path.join(import.meta.dir, "../../../midi/", origObj.fileName))
                        await rename(lePath, path.join(import.meta.dir, "../../../midi/", origObj.fileName));
                        origObj.path = `midi/${origObj.fileName}`
                        break;
                }
            }
        }

        await removeItem(id, "pending");

        const queueObj = await addItem({
            id: origObj.id,
            user: origObj.user,
            name: song ?? origObj.name,
            artist: artist ?? origObj.artist,

            reference: reference ?? origObj.reference,
            parsingMode: parsingMode ?? origObj.parsingMode,
            excludedTracks, minVelocity, transpose,
            username: username ?? origObj.username,
            rating: Number(rating) ?? origObj.rating,

            path: req.file?.path ?? origObj.path,
            fileName: req.file?.filename ?? origObj.fileName,
            status,
            statusText,
            statusChanged: new Date().toISOString(),
            addedAt: origObj.addedAt
        }, status as QueueType);

        await broadcastUserQueue(origObj.user);
        await broadcastQueue();
        res.json({ status: "success", id: queueObj.id });
    } catch (err) {
        res.status(500).json({ error: "error when adding to queue" });
        logger.error(err)
    }
});

adminRouter.get("/pendingqueue", async (req, res) => {
    const queue = await getQueue("pending");
    res.json(queue)
})

adminRouter.post("/play/:id", async (req, res) => {
    const next = await takeItem(req.params.id, "approved");
    if (!next) {
        res.status(404).json({ error: "not found" });
        return;
    }
    
    try {
        const tracks = (await parseTracks(next.path as string, next.parsingMode, next.excludedTracks)).tracks;

        ohjainBussi.play({ id: next.id, name: next.name, tracks, minVelocity: next.minVelocity || 0 });
        setNowPlaying(next);

        await broadcastUserQueue(next.user);
        await broadcastQueue();
        res.json({ ok: true });
    } catch (err) {
        await requeueFront(next, "approved");
        await broadcastUserQueue(next.user);
        await broadcastQueue();
        
        res.status(500).json({ error: "error playing song" });
        logger.error(err);
        return;
    }
});

adminRouter.post("/playnext", async (req, res) => {
    const next = await takeFirst("approved");
    if (!next) {
        res.status(404).json({ error: "not found" });
        return;
    }

    try {
        const tracks = (await parseTracks(next.path as string, next.parsingMode, next.excludedTracks)).tracks;

        ohjainBussi.play({ id: next.id, name: next.name, tracks, minVelocity: next.minVelocity || 0 });
        setNowPlaying(next);

        await broadcastUserQueue(next.user);
        await broadcastQueue();
        res.json({ ok: true });
    } catch (err) {
        await requeueFront(next, "approved");
        await broadcastUserQueue(next.user);
        await broadcastQueue();
        
        res.status(500).json({ error: "error playing song" });
        logger.error(err);
        return;
    }
})

adminRouter.post("/control", async (req, res) => {
    const action = req.body.action;

    try {
        switch (action) {
            case "stop":
                ohjainBussi.stop();
                break;
            case "pause":
                ohjainBussi.pause();
                break;
            case "resume":
                ohjainBussi.resume();
                break;
            default:
                res.status(400).json({ error: "unknown action, expected stop/pause/resume/skip" });
                break;
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: "error controlling machine" });
        logger.error(err)
    }
});

adminRouter.get("/song/:queue/:id", async (req, res) => {
    const next = await getItem(req.params.id, req.params.queue as QueueType)
    if (!next) {
        res.status(404).json({ error: "not found" });
        return;
    }
    res.json(next);
})

export default adminRouter;