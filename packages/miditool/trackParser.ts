import type { AllNotes } from ".";

function parseTracks(allNotes: AllNotes[], motors: number) {
    const newTracks: AllNotes[][] = [];

    console.log("dividing into playable tracks... (this may take a while)")
    allNotes.forEach((noteObj) => {
        const result = newTracks.some((track) => {
            if (track.at(-1) == undefined) {
                return false
            }

            const trackLastNoteStop = track.at(-1).note.time + track.at(-1).note.duration;
            const currentNoteStart = noteObj.note.time;

            if (trackLastNoteStop <= currentNoteStart) {
                track.push(noteObj);
                return true;
            } else {
                return false;
            }
        });

        if (result === false) {
            if (newTracks.length >= motors) {
                console.log("Note out of motor barrier, shorting previous...");
                let lowestNumber = {index: -1, value: Infinity};

                newTracks.forEach((track, index) => {
                    if (track.at(-1)!.note.time + track.at(-1)!.note.duration < lowestNumber.value) {
                        lowestNumber = {index, value: track.at(-1)!.note.time + track.at(-1)!.note.duration}
                    }
                })

                const oldestTrack = lowestNumber.index;
                
                const hula = newTracks[oldestTrack!]!.at(-1)!.note.time + newTracks[oldestTrack!]!.at(-1)!.note.duration;
                const finalhula = newTracks[oldestTrack!]!.at(-1)!.note.duration - (hula - noteObj.note.time);

                if (newTracks[oldestTrack!]!.at(-1)!.note.time + finalhula <= 0) {
                    newTracks[oldestTrack!]!.pop();
                }

                newTracks[oldestTrack!]!.at(-1)!.note.duration = finalhula;

                newTracks[oldestTrack!]!.push(noteObj);
            } else {
                newTracks.push([noteObj])
            }
        }
    });

    return newTracks;
}

export default parseTracks;