import express from "express";
import { logger } from "./logger";

import path from "node:path";
import { file, write } from "bun";

const mothRouter = express.Router();

mothRouter.get('/', async (req, res) => {
    const json = await file(path.join(__dirname, '../moth.json')).json();
    const day = (new Date().getDay() + 6) % 7;

    logger.debug(day - 3)
    logger.debug(day)
    const msg = json[day - 3][new Date().getHours()];

    if (msg == undefined || msg == null) {
        throw new Error("Moth msg is undefined")
    } else {
        res.send(msg);
    }
});

mothRouter.put('/:day/:hour', async (req, res) => {
    const hour = parseInt(req.params.hour!);
    const day = parseInt(req.params.day!);
    const msg = req.body.msg;

    if (hour >= 24 || hour < 0) {
        res.status(400).json("hour out of bounds");
        return;
    }

    /*if (day != new Date().getDay() - 4 && day != new Date().getDay() - 3) { // thursday = 0, saturday = 2, sunday = 3 (you can disable this for dev but remeber to reset the moth file)
        res.status(400).json("day out of bounds");
        return;
    };*/

    const json = await file(path.join(__dirname, '../moth.json')).json();
    logger.debug(json)
    json[day][hour] = msg;

    await write(path.join(__dirname, '../moth.json'), JSON.stringify(json, undefined, 2));
    res.status(200).json("moth set successfully");
});

export default mothRouter;