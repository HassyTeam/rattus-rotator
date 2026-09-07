import { Midi } from '@tonejs/midi'
import { Note } from '@tonejs/midi/dist/Note';
import parseTracks from './trackParser';

export interface AllNotes {
    note: Note,
    track: number
}

const file = Bun.file(Bun.argv[2]!);

const buffer = await file.arrayBuffer();

const midi = new Midi(buffer);
const motors = 20;

const allNotes: AllNotes[] = [];

console.log("combining notes to one array")
midi.tracks.forEach((track, index) => {
    track.notes.forEach((note) => {
        allNotes.push({note, track: index})
    })
});

if (allNotes.length >= 10000) {
    console.warn("WARNING! This is a big midi file and may lag!")
}

console.log("sorting notes by time");
allNotes.sort((a, b) => {
    if (a.note.time < b.note.time) {
        return -1;
    } else {
        return 1;
    }
});

const newMidi = {
    name: midi.name,
    header: midi.header,
    duration: midi.duration,
    midiTracks: midi.tracks.map((track: any) => {
        const {notes, ...newTrack} = track;
        return newTrack;
    }),
    tracks: parseTracks(allNotes, motors),
}

console.log("Writing...")
await Bun.write("midi.json", JSON.stringify(newMidi, undefined, 2));
console.log("Success!")