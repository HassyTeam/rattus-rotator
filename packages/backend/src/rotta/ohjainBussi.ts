// vruum vruum
// based on the mangled version but I (hassu) actually understand what's going on.
import { EventEmitter } from "node:events";
import WebSocket from "ws";
import { logger } from "../logger";
import type { NewMidi } from "midiparser";

const CONTROLLER_URL = process.env.ROTTA_CONTROLLER_URL ?? "ws://localhost:8765";
const RECONNECT_DELAY_MS = 2000;

export interface ControllerState {
    connected: boolean;
    motors: number;
    boardsConnected: number;
    boardsTotal: number;
    dryRun: boolean;
    maxStepFreq: number;
    estop: boolean;
    playback: "idle" | "playing" | "paused";
    jobId: string | null;
    jobName: string | null;
}

export interface PlayJob {
    id: string;
    name: string;
    tracks: NewMidi["tracks"];
    /* Notes below this MIDI velocity (0-1) are not played. */
    minVelocity: number;
}

class ControllerBus extends EventEmitter {
    private ws: WebSocket | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    state: ControllerState = {
        connected: false,
        motors: 0,
        boardsConnected: 0,
        boardsTotal: 0,
        dryRun: false,
        maxStepFreq: 0,
        estop: false,
        playback: "idle",
        jobId: null,
        jobName: null,
    };

    constructor() {
        super();
        this.connect();
    }

    private connect() {
        let ws: WebSocket;
        try {
            ws = new WebSocket(CONTROLLER_URL);
        } catch (err) {
            logger.error(`Failed to start connection to rotta-controller: ${(err as Error).message}`);
            this.scheduleReconnect();
            return;
        }
        this.ws = ws;

        ws.on("open", () => {
            logger.info(`Connected to rotta-controller at ${CONTROLLER_URL}`);
            this.state.connected = true;
            this.emit("connection", this.state);
        });

        ws.on("message", (raw) => {
            let msg: any;
            try {
                msg = JSON.parse(raw.toString());
            } catch {
                return;
            }

            switch (msg.type) {
                case "hello":
                    this.state.motors = msg.motors;
                    this.state.boardsConnected = msg.boardsConnected;
                    this.state.boardsTotal = msg.boardsTotal;
                    this.state.dryRun = msg.dryRun;
                    this.state.maxStepFreq = msg.maxStepFreq ?? 0;
                    this.state.estop = Boolean(msg.estop);
                    this.emit("connection", this.state);
                    break;
                case "state":
                    this.state.playback = msg.state;
                    this.state.jobId = msg.job ?? null;
                    this.state.jobName = msg.name ?? null;
                    this.emit("connection", this.state);
                    break;
                case "estop":
                    this.state.estop = Boolean(msg.active);
                    this.emit("connection", this.state);
                    break;
            }

            this.emit("message", msg);
        });

        ws.on("close", () => {
            if (this.state.connected) logger.warn("Lost connection to rotta-controller");
            this.state.connected = false;
            this.emit("connection", this.state);
            this.scheduleReconnect();
        });

        ws.on("error", (err) => {
            logger.debug(`rotta-controller connection error: ${err.message}`);
        });
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, RECONNECT_DELAY_MS);
    }

    private send(payload: object) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            throw new Error("not connected to rotta-controller");
        }
        this.ws.send(JSON.stringify(payload));
    }

    play(job: PlayJob) {
        this.send({ type: "play", ...job });
    }

    stop() {
        this.send({ type: "stop" });
    }

    pause() {
        this.send({ type: "pause" });
    }

    resume() {
        this.send({ type: "resume" });
    }

    testNote(motor: number, freq: number, duration: number) {
        this.send({ type: "test_note", motor, freq, duration });
    }

    reconnectBoards() {
        this.send({ type: "reconnect_boards" });
    }
}

export const ohjainBussi = new ControllerBus();
