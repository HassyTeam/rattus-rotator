import { Button, Card, CardHeader, List, ListItem, Text } from "@fluentui/react-components";
import useWebSocket from "./useWebSocket";
import { API_BASE, WS_BASE } from "./apiBase";
import { useEffect, useState } from "react";
import type { QueueItem } from "./Queue";
import { useParams, Link } from "react-router";

export function Control() {
    const [queue, setQueue] = useState<QueueItem[]>();
    const [pQueue, setPQueue] = useState<QueueItem[]>();
    const [dQueue, setDQueue] = useState<QueueItem[]>();
    
    useWebSocket(`${WS_BASE}/api/ws/analytics`, {
        onMessage: (data: any) => {
            console.log(data.type)
            if (data.type === "queue") {
                setQueue(data.items)
            }
            if (data.type === "deniedQ") {
                setDQueue(data.items)
            }
            if (data.type === "pendingQ") {
                setPQueue(data.items)
            }
        }
    });
        
    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <Button>Play first on queue</Button>
                <Button>Pause</Button>
                <Button>Resume</Button>
            </div>
            <div className="flex gap-2">
                <Button>Stop</Button>
                <Button>Skip</Button>
            </div>
            <Text weight="bold" size={600}>pending</Text>
            <List className="flex flex-col gap-2">
                {pQueue ? pQueue.length > 0 ? pQueue.map((item, index) => (
                    <ListItem key={index}>
                        <Card>
                            <CardHeader
                                header={<Text weight="semibold">{item.name} - {item.artist}</Text>}
                                description={
                                    <Text><pre>{JSON.stringify(item, undefined, 2)}</pre></Text>
                                }
                            />
                            <Link to={`/control/pending/${item.id}`}><Button>Manage</Button></Link>
                        </Card>
                    </ListItem>
                )) : <Text align="center" weight="bold" size={600}>Jono on tyhjä</Text> : <Text align="center" weight="bold" size={600}>Ladataan...</Text>}
            </List>
            <Text weight="bold" size={600}>Oikee</Text>
            <List className="flex flex-col gap-2">
                {queue ? queue.length > 0 ? queue.map((item, index) => (
                    <ListItem key={index}>
                        <Card>
                            <CardHeader
                                header={<Text weight="semibold">{item.name} - {item.artist}</Text>}
                                description={
                                    <Text><pre>{JSON.stringify(item, undefined, 2)}</pre></Text>
                                }
                            />
                            <Link to={`/control/approved/${item.id}`}><Button>Manage</Button></Link>
                        </Card>
                    </ListItem>
                )) : <Text align="center" weight="bold" size={600}>Jono on tyhjä</Text> : <Text align="center" weight="bold" size={600}>Ladataan...</Text>}
            </List>
            <Text weight="bold" size={600}>kieli</Text>
            <List className="flex flex-col gap-2">
                {dQueue ? dQueue.length > 0 ? dQueue.map((item, index) => (
                    <ListItem key={index}>
                        <Card>
                            <CardHeader
                                header={<Text weight="semibold">{item.name} - {item.artist}</Text>}
                                description={
                                    <Text><pre>{JSON.stringify(item, undefined, 2)}</pre></Text>
                                }
                            />
                            <Link to={`/control/denied/${item.id}`}><Button>Manage</Button></Link>
                        </Card>
                    </ListItem>
                )) : <Text align="center" weight="bold" size={600}>Jono on tyhjä</Text> : <Text align="center" weight="bold" size={600}>Ladataan...</Text>}
            </List>
        </div>
    )
}

export function ControlId() {
    let { id, queue } = useParams();
    const [next, setNext] = useState();

    useEffect(() => {
        async function getNext() {
            const request = await fetch(`${API_BASE}/api/rotta/admin/song/${queue}/${id}`);
            const response = await request.json();
            console.log(response)

            setNext(response);
        }

        getNext();
    }, [])

    return (
        <>
        <pre>{JSON.stringify(next, undefined, 2)}</pre>
        <form>
            {/* can you pls do a form basically exactly like the one in app.tsx but it sends it to luvananto and defaults to the values in next. i'll do it if i can */}
        </form>
        </>
    )
}