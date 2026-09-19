import { Header, Midi } from '@tonejs/midi'
import { Note } from '@tonejs/midi/dist/Note';
import parseTracks from './trackParser';

export interface AllNotes {
    note: Note,
    track: number
}

export interface NewMidi {
    name: string,
    header: Header,
    duration: number,
    midiTracks: any,
    tracks: AllNotes[][],
    overflowNotes: number
}

export default function parseMidi(midi: Midi, motors: number, algorithm: ("simple" | "pertrack" | "pertracksort"), excludedChords = [9]) {
    const allNotes: AllNotes[] = [];

    if (algorithm == "pertracksort") {
        throw new Error("sorry, that isn't supported.");
    }

    console.log("combining notes to one array")
    midi.tracks.forEach((track, index) => {
        console.log(track)
        if (excludedChords.includes(track.channel)) {
            console.log("pöö")
            return;
        } else {
            console.log(track.channel)
            track.notes.forEach((note) => {
                allNotes.push({note, track: index})
            })
        }
    });

    if (allNotes.length >= 10000) {
        console.warn("WARNING! This is a big midi file and may lag!")
    }

    if (algorithm == "simple") {
        console.log("sorting notes by time");
        allNotes.sort((a, b) => a.note.time - b.note.time);
    }

    const { tracks, overflowNotes } = parseTracks(allNotes, motors, algorithm);

    const newMidi: NewMidi = {
        name: midi.name,
        header: midi.header,
        duration: midi.duration,
        midiTracks: midi.tracks.map((track: any) => {
            const {notes, ...newTrack} = track;
            return newTrack;
        }),
        tracks,
        overflowNotes
    }

    console.log(newMidi)

    return newMidi;
}