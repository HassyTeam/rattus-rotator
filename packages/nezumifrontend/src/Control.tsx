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

export interface QueueItem2 {
    id: string,
    user: string, // note! different than username (because there is no login)
    name: string,
    artist: string,

    reference: string | null,
    parsingMode: "simple" | "pertrack",
    excludedTracks?: number[],
    minVelocity?: number,
    transpose?: number,
    username: string | null, // note! different than user (because there is no login)
    rating: number | null,

    path: string | null,
    fileName: string | null,
    status: "approved" | "denied" | "pending",
    statusText: string | null,

    statusChanged?: string,
    addedAt: string;
}

export function ControlId() {
    let { id, queue } = useParams();
    const [next, setNext] = useState<QueueItem2>();

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
        {next ? (
            <>
            <pre>{JSON.stringify(next, undefined, 2)}</pre>
            <form action={`${API_BASE}/api/rotta/admin/luvananto`} method="POST" encType="multipart/form-data">
                <input type="hidden" name="returnTo" value={window.location.href} />
                <input type="hidden" name="id" value={next.id} />
                <input type="hidden" name="name" value={next.name} />
                <label>name:</label>
                <input className="border border-gray-600 p-0.5 rounded-sm" placeholder="name" name="name" defaultValue={next.name} />
                <br className="my-2"/><label>artist:</label>
                <input className="border border-gray-600 p-0.5 rounded-sm" placeholder="artist" name="artist" defaultValue={next.artist} />
                <br className="my-2"/><label>reference:</label>
                <input className="border border-gray-600 p-0.5 rounded-sm" placeholder="reference" name="reference" defaultValue={next.reference || ""} />
                <br className="my-2"/><label>parsing mode:</label>
                <select name="parsingMode" className="border border-gray-600 p-0.5 rounded-sm" defaultValue={next.parsingMode}>
                    <option value="simple">simple</option>
                    <option value="pertrack">pertrack</option>
                </select>
                <br className="my-2"/><label>excluded tracks:</label>
                <input className="border border-gray-600 p-0.5 rounded-sm" placeholder="excludedTracks" name="excludedTracks" defaultValue={JSON.stringify(next.excludedTracks) || "[9]"} />
                <br className="my-2"/><label>min velocity:</label>
                <input className="border border-gray-600 p-0.5 rounded-sm" type="number" placeholder="minVelocity" name="minVelocity" defaultValue={next.minVelocity || "0"} />
                <br className="my-2"/><label>transpose:</label>
                <input className="border border-gray-600 p-0.5 rounded-sm" type="number" placeholder="transpose" name="transpose" defaultValue={next.transpose || "0"} />

                <br className="my-2"/><label>username:</label>
                <input className="border border-gray-600 p-0.5 rounded-sm" placeholder="username" name="username" defaultValue={next.username || ""} />
                <br className="my-2"/><label>midi:</label>
                <input className="border border-gray-600 p-0.5 rounded-sm" name="midi"
                    type="file"
                    accept="audio/midi,.mid,.midi"
                />
                <br />
                <input type="hidden" name="oldStatus" value={next.status} />
                <br className="my-2"/><label>status:</label>
                <select name="status" className="border border-gray-600 p-0.5 rounded-sm" defaultValue={next.status}>
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="denied">denied</option>
                </select>
                <br className="my-2"/>
                <input className="border border-gray-600 p-0.5 rounded-sm" placeholder="statusText" name="statusText" defaultValue={next.statusText || ""} />
                <br className="my-2"/>
                <input className="border border-gray-600 p-0.5 rounded-sm" type="submit" />
            </form>
            </>
        ) : <Text align="center" weight="bold" size={600}>Ladataan...</Text>}
        </>
    )
}