import express, { type NextFunction, type Request, type Response } from "express";
import { rateLimit } from 'express-rate-limit'
import multer from "multer";
import crypto from "node:crypto"
import { logger } from "../../logger";
import { addItem, getItem, getQueue } from "../queue";
import { LRUCache } from "lru-cache";

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
  
  const currentRequestSignature = JSON.stringify({
    method: req.method,
    url: req.originalUrl,
    body: req.body
  });

  const previousRequestSignature = requestCache.get(userId);

  if (previousRequestSignature === currentRequestSignature) {
    return res.status(409).json({ error: 'dingdong :(' });
  }

  requestCache.set(userId, currentRequestSignature);
  next();
};

const userRouter = express.Router();

userRouter.post("/ehdotus", limiter, preventDuplicateRequests, upload.single("midi"), async (req, res) => {
    if (!req.body.song || !req.body.artist) {
        res.status(400).json({ error: "missing song or artist" })
        return;
    }
    
    try {
        const { song, artist, reference, parsingMode, username, rating } = req.body;

        const queueObj = await addItem({
            name: song, artist, reference,
            parsingMode, username,

            rating: Number(rating),
            path: req.file?.path ?? null,
            fileName: req.file?.filename ?? null,
            status: "pending",
            statusText: null
        }, "pending")

        res.json({ status: "success", id: queueObj.id })
    } catch (err) {
        res.status(500).json({ error: "error when adding to queue" });
        logger.error(err)
    }
});

userRouter.get("/queue", async (req, res) => {
    const queue = await getQueue("approved");
    res.json(queue.map(({path, fileName, status, statusText, statusChanged, rating, id, ...rest}) => rest))
})

userRouter.get("/song/:song", async (req, res) => {
    const id = req.params.song;

    const item = await getItem(id);
    if (item) {
        const {path, fileName, ...rest} = item;
        res.json(rest)
    } else {
        res.status(404).json({ error: "song not found" })
    }
})

export default userRouter;