import { Midi } from "@tonejs/midi";
import parseMidi from "midiparser";
import { join } from "path";
import { ohjainBussi } from "./ohjainBussi";

export default async function parseTracks(path: string, parsingMode: "simple" | "pertrack", excludedTracks?: number[]) {
    const midiPath = join(import.meta.dir, "../../", path);

    const buffer = await Bun.file(midiPath).arrayBuffer();
    const midi = new Midi(buffer);

    return parseMidi(midi, ohjainBussi.state.motors, parsingMode, excludedTracks);
}