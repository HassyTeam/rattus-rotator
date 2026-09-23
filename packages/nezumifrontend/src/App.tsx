import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, Divider, Dropdown, Field, InfoLabel, Input, Rating, Text, Option, type LabelProps } from "@fluentui/react-components";
import { Send20Regular } from "@fluentui/react-icons";
import { Midi } from "@tonejs/midi";
import type { AllNotes } from "midiparser";
import parseMidi from "midiparser";
import { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";
import { API_BASE } from "./apiBase";
import { useNavigate } from "react-router";
import { UserIdContext, type UserIdContextValue } from "./main";

function midiToFreq(midiNote: number): number {
    return 440 * 2 ** ((midiNote - 69) / 12);
}

interface TrackState {
    id: number;
    name: string;
    currentNote: string;
}

export default function App() {
    // chatgpt ass states
    const [song, setSong] = useState<string | null>(null);
    const [artist, setArtist] = useState<string | null>(null);
    const [reference, setReference] = useState<string | null>(null);
    const [midi, setMidi] = useState<File | null>(null);

    const [username, setUsername] = useState<string | null>(null);
    const [rating, setRating] = useState<number | null>(null);

    const [parsingMode, setParsingMode] = useState<"simple" | "pertrack">("pertrack")
    const [previewTracks, setPreviewTracks] = useState<AllNotes[][] | null>(null);
    const [overflowNotes, setOverflowNotes] = useState<number | null>(null);
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const [trackStates, setTrackStates] = useState<TrackState[]>([]);
    const synthsRef = useRef<Tone.Synth[]>([]);
    const partsRef = useRef<Tone.Part[]>([]);

    const { userId, setUserId } = useContext(UserIdContext) as UserIdContextValue;
    const navigate = useNavigate();

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        // en oo varma et toimiiko se formi oikeesti nii teen nyt vaa prevent default ja noilla stateilla. (ei toimi; kokeilin)
        const data = new FormData()
        data.append("song", song ?? "");
        data.append("artist", artist ?? "");
        data.append("reference", reference ?? "");

        data.append("midi", midi ?? "");
        data.append("parsingMode", parsingMode)
        
        data.append("username", username ?? "");
        data.append("rating", rating ? rating.toString() : "");
        console.log(data)

        let id = userId;

        if (id === "") {
            const request = await fetch(`${API_BASE}/api/rotta/user/account`, {
                method: "POST"
            });

            if (request.ok) {
                id = (await request.json()).id;
                setUserId(id);
            }
        }

        data.append("user", id);

        const request = await fetch(`${API_BASE}/api/rotta/user/ehdotus`, {
            body: data, method: "POST"
        });

        if (request.ok) {
            const response = await request.json();
            navigate(`/queue?popupIndex=${response.id}`)
        }
    };

    function previewParse(midi: File | null) {
        if (midi) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const midi = new Midi(e.target!.result as ArrayBuffer);
                const parsedMidi = parseMidi(midi, 20, parsingMode);
                setPreviewTracks(parsedMidi.tracks);
                setOverflowNotes(parsedMidi.overflowNotes)
                setTrackStates([]);
            };
            reader.readAsArrayBuffer(midi);
        }
    }
    useEffect(() => {
        previewParse(midi);
    }, [parsingMode])

    const maxStepFreq = 1445;

    useEffect(() => {
        const transport = Tone.getTransport();
        const draw = Tone.getDraw();

        if (previewPlaying && previewTracks) {
            const initialStates = previewTracks.map((_track, i) => ({
                id: i,
                name: `Moottori ${i + 1} (Jari ${Math.floor(Math.random() * 142)})`,
                currentNote: "Lomailee",
            }));
            setTrackStates(initialStates);

            synthsRef.current.forEach((s) => s.dispose());
            partsRef.current.forEach((p) => p.dispose());
            synthsRef.current = [];
            partsRef.current = [];

            previewTracks.forEach((track, trackIndex) => {
                const synth = new Tone.Synth({
                    envelope: { attack: 0.02, decay: 0.5, sustain: 0.25, release: 0.002 },
                    volume: -10
                }).toDestination();
                synthsRef.current.push(synth);

                const playable = maxStepFreq > 0
                    ? track.filter(({ note }) => midiToFreq(note.midi) <= maxStepFreq)
                    : track;
                const formattedEvents = playable.map((item) => ({ time: item.note.time, ...item }));

                const part = new Tone.Part((time, event: AllNotes) => {
                    const noteName = event.note.name;
                    const noteDuration = event.note.duration;
                    const noteVelocity = event.note.velocity

                    console.log(trackIndex, noteDuration, event.note.ticks)
                    synth.triggerAttackRelease(noteName, noteDuration, time, noteVelocity);

                    draw.schedule(() => {
                        setTrackStates((prev) =>
                            prev.map((t) => (t.id === trackIndex ? { ...t, currentNote: noteName } : t))
                        );
                    }, time);

                    const releaseTime = time + Tone.Time(noteDuration).toSeconds();
                    draw.schedule(() => {
                        setTrackStates((prev) =>
                            prev.map((t) =>
                                t.id === trackIndex && t.currentNote === noteName ? { ...t, currentNote: "Lomailee" } : t
                            )
                        );
                    }, releaseTime);
                }, formattedEvents as any).start(1);

                partsRef.current.push(part);
            });

            transport.start();
        } else {
            transport.stop();
            transport.cancel();
            synthsRef.current.forEach((s) => s.dispose());
            partsRef.current.forEach((p) => p.dispose());
            synthsRef.current = [];
            partsRef.current = [];
            setTrackStates([]);
        }

        return () => {
            transport.stop();
            synthsRef.current.forEach((s) => s.dispose());
            partsRef.current.forEach((p) => p.dispose());
        };
    }, [previewPlaying, previewTracks, maxStepFreq]);

    const previewExcludedCount = previewTracks && maxStepFreq > 0
        ? previewTracks.flat().filter(({ note }) => midiToFreq(note.midi) > maxStepFreq).length
        : 0;


    return (
        <form className="text-left items-start flex flex-col gap-4 w-full *:w-full" onSubmit={handleSubmit}>
            <Text align="start" weight="bold" size={600} className="mb-4">Lähetä kappale-ehdotus:</Text>
            <Field
                label="Kappaleen nimi"
                size="large"
                required
            >
                <Input placeholder="Elävä Mandariini" value={song ?? ""} onChange={(e) => {setSong(e.target.value)}} />
            </Field>
            <Field
                label="Artisti"
                size="large"
                required
            >
                <Input placeholder="Nokodevo" value={artist ?? ""} onChange={(e) => {setArtist(e.target.value)}} />
            </Field>
            <Field
                size="large"
                label={{
                // Setting children to a render function allows you to replace the entire slot.
                // The first param is the component for the slot (Label), which we're ignoring to use InfoLabel instead.
                // The second param are the props for the slot, which need to be passed to the InfoLabel.
                children: (_: unknown, slotProps: LabelProps) => (
                    <InfoLabel {...slotProps} info="Mikäli kappale ei löydy suoraan MIDI:nä; jos laitat tähän esim. Youtube tai Spotify linkin se auttaa oikean MIDI:n etsimisessä.">
                    Referenssi
                    </InfoLabel>
                ),
                }}
            >
                <Input placeholder="https://www.youtube.com/watch?v=cQ5IwGZkQwI" value={reference ?? ""} onChange={(e) => {setReference(e.target.value)}} />
            </Field>
            <Field
                size="large"
                label={{
                // Setting children to a render function allows you to replace the entire slot.
                // The first param is the component for the slot (Label), which we're ignoring to use InfoLabel instead.
                // The second param are the props for the slot, which need to be passed to the InfoLabel.
                children: (_: unknown, slotProps: LabelProps) => (
                    <InfoLabel {...slotProps} info="Jos sinulla on jo tietty MIDI tiedosto minkä haluat laitteen soittavan, liitä se tähän. Valmis MIDI tiedosto lisää ehdotusken mahdollisuutta tulla hyväksytyksi.">
                    MIDI Tiedosto
                    </InfoLabel>
                ),
                }}
            >
                <div className="inline-flex items-center justify-between w-full">
                    <input 
                        className="w-min" name="midi"
                        type="file"
                        accept="audio/midi,.mid,.midi"
                        onChange={(e) => setMidi(e.target.files?.[0] ?? null)}
                    />
                    <Dialog onOpenChange={() => {setPreviewPlaying(false)}}>
                        <DialogTrigger disableButtonEnhancement>
                            <Button disabled={midi ? false : true} onClick={() => previewParse(midi)}>Esikuuntele</Button>
                        </DialogTrigger>
                        <DialogSurface>
                            <DialogBody>
                                <DialogTitle>Esikuuntelu</DialogTitle>
                                <DialogContent className="flex flex-col gap-3">
                                    {previewTracks && (
                                        <>
                                        {(previewExcludedCount > 0 || (overflowNotes && overflowNotes > 0)) ? (
                                            <Text size={200}>
                                                {previewExcludedCount > 0 ? `${previewExcludedCount} nuotti(a) pyörisivät nopeammin kuin on sallittu` : null}
                                                {(previewExcludedCount > 0 && (overflowNotes && overflowNotes > 0)) ? " ja " : null}
                                                {overflowNotes && overflowNotes > 0 ? `${overflowNotes} nuotti(a) lyhennettiin moottoreiden määrän vuoksi` : null}, joten ne ei kuulu tässäkään esikuuntelussa.
                                            </Text>
                                        ) : ""}
                                        <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                                            {trackStates.map((track) => (
                                                <div key={track.id} className="p-2 border rounded-(--borderRadiusLarge) bg-(--colorNeutralBackground1) border-(--colorNeutralStroke1) text-center">
                                                    <Text size={200} weight="bold" className="truncate">{track.name}</Text><br />
                                                    <Text size={200} className={track.currentNote !== "Lomailee" ? "text-green-400 font-bold" : "text-gray-400"}>
                                                        {track.currentNote}
                                                    </Text>
                                                </div>
                                            ))}
                                        </div>
                                        </>
                                    )}
                                </DialogContent>
                                <DialogActions fluid={true}>
                                    <Dropdown className="mr-auto truncate w-full md:w-auto" placeholder="Valitse parsausmoodi" defaultValue={parsingMode == "simple" ? "Simppeli" : "Track-pohjaisesti (Suositeltu)"} defaultSelectedOptions={[parsingMode]} onOptionSelect={(_e, d) => {console.log(d.optionValue); setParsingMode(d.optionValue as ("simple" | "pertrack"))}}>
                                        <Option value="pertrack">
                                            Track-pohjaisesti (Suositeltu)
                                        </Option>
                                        <Option value="simple">
                                            Simppeli
                                        </Option>
                                    </Dropdown>
                                    <Button appearance="primary" onClick={() => setPreviewPlaying((p) => !p)}>{previewPlaying ? "Lopeta" : "Soita"}</Button>
                                    <DialogTrigger disableButtonEnhancement>
                                        <Button appearance="secondary">Sulje</Button>
                                    </DialogTrigger>
                            </DialogActions>
                            </DialogBody>
                        </DialogSurface>
                    </Dialog>
                </div>
            </Field>
            <Divider appearance="subtle" />
            <Field
                label="Sinun käyttäjänimi (jos haluat)"
                size="large"
            >
                <Input placeholder={"Rouva Költ"} value={username ?? ""} onChange={(e) => {setUsername(e.target.value)}} />
            </Field>
            <Field
                label="Arvio? :D"
                className="text-right"
                size="large"
            >
                <Rating value={rating ?? 0} onChange={(_, data) => setRating(data.value)} />
            </Field>
            <Button appearance="primary" type="submit" className="flex gap-1.5">
                <Send20Regular /> 
                Lähetä
            </Button>
        </form>
    )
}