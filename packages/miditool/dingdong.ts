import { Midi } from '@tonejs/midi'
import parseMidi from 'midiparser'

const motors = Number(Bun.argv[3] ?? 20);
const algorithm = (Bun.argv[4] as "simple" | "pertrack" | "pertracksort" | undefined) ?? "simple";

const inputPath = Bun.argv[2];
if (!inputPath) {
    console.error("usage: bun run index.ts <file.mid> [motors] [algorithm]");
    process.exit(1);
}

const buffer = await Bun.file(inputPath).arrayBuffer();
const midi = new Midi(buffer);

const newMidi = parseMidi(midi, motors, algorithm);

console.log("Writing...")
await Bun.write("midi.json", JSON.stringify(newMidi, undefined, 2));
console.log("Success!")