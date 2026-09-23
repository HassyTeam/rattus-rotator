import { List, ListItem, Card, CardHeader, Caption1, Text } from "@fluentui/react-components"
import { useEffect, useState } from "react";
import { WS_BASE } from "./apiBase";
import useWebSocket from "./useWebSocket";

export interface QueueItem {
    id: string,
    name: string,
    artist: string,

    reference: string | null,
    parsingMode: "simple" | "pertrack",
    username: string | null,
    rating: number | null,

    addedAt: string,
    status?: string,
    statusText?: string
}

export default function Queue() {
    const [queue, setQueue] = useState<QueueItem[]>();

    useWebSocket(`${WS_BASE}/api/ws/public`, {
        onMessage: (data: any) => {
            console.log(data.type)
            if (data.type === "queue") {
                console.log("mitä vittua")
                setQueue(data.items)
            }
        }
    });

    useEffect(() => {
        console.log("ass", queue)
    }, [queue])

    return (
        <div className="text-left items-start flex flex-col gap-4 w-full *:w-full">
            <Text align="start" weight="bold" size={600}>Kappalejono:</Text>
            <List className="flex flex-col gap-2">
                {queue ? queue.length > 0 ? queue.map((item, index) => (
                    <ListItem key={index}>
                        <Card>
                            <CardHeader
                                header={<Text weight="semibold">{item.name} - {item.artist}</Text>}
                                description={
                                    <Caption1>Ehdottanut {item.username}</Caption1>
                                }
                            />
                        </Card>
                    </ListItem>
                )) : <Text align="center" weight="bold" size={600}>Jono on tyhjä</Text> : <Text align="center" weight="bold" size={600}>Ladataan...</Text>}
            </List>
        </div>
    )
}