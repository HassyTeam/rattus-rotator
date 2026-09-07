import type { AllNotes } from ".";

export interface ParsedTracks {
    tracks: AllNotes[][];
    overflowNotes: number;
}

function parseTracks(allNotes: AllNotes[], motors: number, algorithm: ("simple" | "pertrack" | "pertracksort")) {
    const newTracks: AllNotes[][] = [];
    let overflowNotes = 0;

    console.log("dividing into playable tracks... (this may take a while)")
    allNotes.forEach((noteObj) => {
        const result = newTracks.some((track) => {
            const last = track.at(-1);

            if (last == null) {
                console.log("this should never happen")
                track.push(noteObj);
                return true;
            }

            if (last.note.time + last.note.duration <= noteObj.note.time) {
                track.push(noteObj);
                return true;
            }

            return false;
        });

        if (result === false) {
            if (newTracks.length >= motors) {
                overflowNotes++
                console.log("Note out of motor barrier, shorting previous...");
                let lowestNumber = {index: -1, value: Infinity};

                newTracks.forEach((track, index) => {
                    if (track.at(-1)!.note.time + track.at(-1)!.note.duration < lowestNumber.value) {
                        lowestNumber = {index, value: track.at(-1)!.note.time + track.at(-1)!.note.duration}
                    }
                })

                const oldestTrack = lowestNumber.index;

                //const hula = lastNote.note.time + lastNote.note.duration;
                //const finalhula = lastNote.note.duration - (hula - noteObj.note.time);

                while (true) {
                    const lastNote = newTracks[oldestTrack!]!.at(-1)!;
                    if (!lastNote) break; // what the fuck????

                    const hulahula = (lastNote.note.time + lastNote.note.duration) - noteObj.note.time;
                    if (hulahula <= 0) break; // big hula doesn't want you to know about this

                    if (noteObj.note.time <= lastNote.note.time) {
                        newTracks[oldestTrack!]!.pop();
                    } else {
                        lastNote.note.duration -= hulahula;
                        break;
                    }
                }
                
                newTracks[oldestTrack!]!.push(noteObj);
            } else {
                newTracks.push([noteObj])
            }
        }
    });

    if (algorithm == "pertrack") {
        newTracks.forEach(track => {
            track.sort((a, b) => a.note.time - b.note.time);
        });
    }

    return { tracks: newTracks, overflowNotes };
}

export default parseTracks;