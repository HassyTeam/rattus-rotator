import express, { type NextFunction, type Request, type Response } from "express";
import { rateLimit } from 'express-rate-limit'
import multer from "multer";
import crypto from "node:crypto"
import { logger } from "../../logger";
import { addItem, addUser, getUser, removeItem } from "../queue";
import { LRUCache } from "lru-cache";
import { broadcastQueue, broadcastUserQueue } from "../websockets";

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './tmpmidi/')
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

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 15, // Limit each IP to 15 requests per `window` (here, per 5 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
});

const requestCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 10, 
});

const preventDuplicateRequests = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.ip || crypto.randomUUID(); // ip or not worki 
  
  const currentRequestSignature = {
    method: req.method,
    url: req.originalUrl,
    body: req.body
  };

  const previousRequestSignatureRaw = requestCache.get(userId);
  if (!previousRequestSignatureRaw) { next(); return };
  const previousRequestSignature = JSON.parse(previousRequestSignatureRaw.toString());
  const prevStatus = previousRequestSignature.status;
  delete previousRequestSignature.status;

  if (JSON.stringify(previousRequestSignature) === JSON.stringify(currentRequestSignature) && prevStatus === 200) {
    return res.status(409).json({ error: 'teit saman pyynnön uudelleen. älä :)' });
  }

  requestCache.set(userId, JSON.stringify(currentRequestSignature));
  next();
  res.on('finish', () => {
    requestCache.set(userId, JSON.stringify({...currentRequestSignature, status: res.status}));
  });
};

const userRouter = express.Router();

userRouter.post("/ehdotus", limiter, preventDuplicateRequests, upload.single("midi"), async (req, res) => {
    if (!req.body.song || !req.body.artist) {
        res.status(400).json({ error: "missing song or artist" })
        return;
    }
    
    try {
        const { user, song, artist, reference, parsingMode, username, rating } = req.body;

        const queueObj = await addItem({
            user,
            name: song, artist, reference,
            parsingMode, username,

            rating: Number(rating),
            path: req.file?.path ?? null,
            fileName: req.file?.filename ?? null,
            status: "pending",
            statusText: null
        }, "pending")

        await broadcastUserQueue(user);
        res.json({ status: "success", id: queueObj.id })
    } catch (err) {
        res.status(500).json({ error: "error when adding to queue" });
        logger.error(err)
    }
});

userRouter.post("/account", limiter, async (req, res) => {
    try {
        const userId = await addUser();
        
        res.json({ status: "success", id: userId })
    } catch (err) {
        res.status(500).json({ error: "error adding account" });
        logger.error(err)
    }
})

userRouter.delete("/song/:user/:song", async (req, res) => {
    const userId = req.params.user;
    const id = req.params.song;

    const user = await getUser(userId);
    if (user !== undefined && user.items.find((i) => i.id === id) !== undefined) {
        await removeItem(id, user.items.find((i) => i.id === id)!.list);
        await broadcastUserQueue(userId);
        await broadcastQueue();
        res.json({ status: "success" })
    } else {
        res.status(404).json({ error: "song not found" })
    };
})

export default userRouter;