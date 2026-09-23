// taaskin perustuu mängläykseen
import { ohjainBussi } from "./ohjainBussi";
import parseTracks from "./parseTracks";
import { requeueFront, takeFirst, setNowPlaying } from "./queue";
import { broadcastQueue } from "./websockets";

ohjainBussi.on("message", async (msg) => {
    if (msg.type !== "state" || msg.state !== "idle" || msg.reason !== "finished") return;

    setNowPlaying(null);
    const next = await takeFirst("approved");
    if (!next) {
        await broadcastQueue();
        return;
    }

    try {
        const tracks = (await parseTracks(next.path as string, next.parsingMode, next.excludedTracks)).tracks;
        ohjainBussi.play({ id: next.id, name: next.name, tracks, minVelocity: next.minVelocity || 0 });
        setNowPlaying(next);
    } catch {
        await requeueFront(next, "approved");
    }

    await broadcastQueue();
});