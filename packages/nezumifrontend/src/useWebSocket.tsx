// from https://websocket.org/guides/frameworks/react/
// :sob:

import { useRef, useCallback, useEffect } from "react";

export default function useWebSocket(url: string, options: any) {
    const { onMessage, onOpen, onClose, reconnect = true } = options;
    const wsRef = useRef<WebSocket>(null);
    const reconnectTimer = useRef<number>(null);
    const attemptRef = useRef(0);

    const connect = useCallback(() => {
        const socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = () => {
            attemptRef.current = 0;
            onOpen?.();
        };

        socket.onmessage = (event) => {
            onMessage?.(JSON.parse(event.data));
        };

        socket.onclose = (event) => {
            onClose?.(event);
            if (reconnect && event.code !== 1000) {
                scheduleReconnect();
            }
        };

        socket.onerror = () => socket.close();
    }, [url, onMessage, onOpen, onClose, reconnect]);

    const scheduleReconnect = useCallback(() => {
        const attempt = attemptRef.current;
        if (attempt >= 10) return; // stop after 10 attempts

        const baseDelay = Math.min(1000 * 2 ** attempt, 30000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        reconnectTimer.current = setTimeout(() => {
            attemptRef.current += 1;
            connect();
        }, delay);
    }, [connect]);

    useEffect(() => {
        connect();
        return () => {
            clearTimeout(reconnectTimer.current || 0);
            wsRef.current?.close(1000, "hook cleanup");
        };
    }, [connect]);

    return { wsRef };
}