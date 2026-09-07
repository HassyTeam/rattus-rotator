import express from "express";
import basicAuth from "express-basic-auth";
import multer from "multer";
import crypto from "node:crypto"
import { logger } from "../../logger";
import { addItem, getItem, getQueue, removeItem, type QueueType } from "../queue";
import { rm, rename } from "node:fs/promises";
import path from "node:path";

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
        const { id, song, artist, reference, parsingMode, username, rating, status, statusText } = req.body;
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
                        break;
                }
            }
        }

        await removeItem(id, "pending");

        const queueObj = await addItem({
            id: origObj.id,
            name: song ?? origObj.name,
            artist: artist ?? origObj.artist,

            reference: reference ?? origObj.reference,
            parsingMode: parsingMode ?? origObj.parsingMode,
            username: username ?? origObj.username,
            rating: Number(rating) ?? origObj.rating,

            path: req.file?.path ?? origObj.path,
            fileName: req.file?.filename ?? origObj.fileName,
            status,
            statusText,
            statusChanged: new Date().toISOString(),
            addedAt: origObj.addedAt
        }, status as QueueType);

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

export default adminRouter;