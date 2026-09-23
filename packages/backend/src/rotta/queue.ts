// queue system based on the mangled version with fixes and additions
// TODO: FIX RACE CONDITION THAT SONGS ARE SKIPPED IF SUBMITTED AT SAME TIME.
// fix by removing get queue
import { file, write } from "bun";
import { logger } from "../logger";

export interface QueueItem {
    id: string,
    user: string, // note! different than username (because there is no login)
    name: string,
    artist: string,

    reference: string | null,
    parsingMode: "simple" | "pertrack",
    excludedTracks?: number[],
    username: string | null, // note! different than user (because there is no login)
    rating: number | null,

    path: string | null,
    fileName: string | null,
    status: QueueType,
    statusText: string | null,

    statusChanged?: string,
    addedAt: string;
}

export interface User {
    id: string,
    items: ListItem[]
}
export interface ListItem {
    id: string,
    list: QueueType
}

export type QueueType = "approved" | "pending" | "denied";
// Source - https://stackoverflow.com/a/77504696
// Posted by Wil Moore III, modified by community. See post 'Timeline' for change history
// Retrieved 2026-09-02, License - CC BY-SA 4.0

export type Optionalize<T, Union extends keyof T> = Omit<T, Union> & Partial<Pick<T, Union>>;


const QUEUE_PATH = "./queue.json";
const PENDING_QUEUE_PATH = "./pending-queue.json";
const DENIED_QUEUE_PATH = "./denied-queue.json";
const USERS_PATH = "./users.json";

let realQueue: QueueItem[] = [];
let pendingQueue: QueueItem[] = [];
let deniedQueue: QueueItem[] = [];
let users: User[] = [];
let loaded = false;

async function ensureLoaded() {
    if (loaded) return;
    try {
        realQueue = await file(QUEUE_PATH).json();
        pendingQueue = await file(PENDING_QUEUE_PATH).json();
        deniedQueue = await file(DENIED_QUEUE_PATH).json();
        users = await file(USERS_PATH).json();
        loaded = true;
    } catch {
        realQueue = [];
        pendingQueue = [];
        deniedQueue = [];
        users = [];
        loaded = false;
    }
}

async function persist(type: QueueType, queue2: QueueItem[]) {
    if (type === "pending") {
        pendingQueue = queue2
        await write(PENDING_QUEUE_PATH, JSON.stringify(pendingQueue, (_key, value) => (value === "") ? null : value, 2));
    } else if (type === "denied") {
        deniedQueue = queue2
        await write(DENIED_QUEUE_PATH, JSON.stringify(deniedQueue, (_key, value) => (value === "") ? null : value, 2));
    } else {
        realQueue = queue2
        await write(QUEUE_PATH, JSON.stringify(realQueue, (_key, value) => (value === "") ? null : value, 2));
    }
}

export async function getQueue(type: QueueType) {
    await ensureLoaded();

    if (type === "pending") {
        return pendingQueue
    } else if (type === "denied") {
        return deniedQueue
    } else {
        return realQueue
    }
}

async function persistUsers(users2: User[]) {
    users = users2
    await write(USERS_PATH, JSON.stringify(users, (_key, value) => (value === "") ? null : value, 2));
}

export async function getUsers() {
    await ensureLoaded();

    return users;
}

// some things

export async function listPublicQueue() {
    const queue = await getQueue("approved");

    return queue.map(({path, fileName, status, statusText, statusChanged, rating, ...rest}) => rest)
}

// queue management functions

export async function getUser(id: string) {
    const users = await getUsers();

    return users.find((i) => i.id === id);
}

export async function getDetailedUserItems(id: string) {
    const user = await getUser(id);
    if (!user) throw new Error("User not found");

    const detailedItems: QueueItem[] = [];

    for (const item of user.items) {
        const detailedItem = await getItem(item.id, item.list);
        if (detailedItem) detailedItems.push(detailedItem);
    };

    return detailedItems;
}

export async function addUser() {
    const users = await getUsers();
    const id = crypto.randomUUID();

    users.push({id, items: []});
    return id;
}

export async function getItem(id: string, queueType: QueueType) {
    const queue = await getQueue(queueType);

    return queue.find((i) => i.id === id);
}

export async function addItem(item: Optionalize<QueueItem, "id" | "addedAt">, queueType: QueueType) {
    const queue = await getQueue(queueType);
    const users = await getUsers();

    const userItemsIndex = users.findIndex((i) => i.id === item.user);
    if (users[userItemsIndex] === undefined) {
        throw new Error("User not found")
    }

    const id = item.id ?? crypto.randomUUID()

    const full: QueueItem = {
        ...item,
        id,
        addedAt: item.addedAt ?? new Date().toISOString(),
    };
    queue.push(full);
    users[userItemsIndex].items.push({id, list: queueType});

    await persist(queueType, queue);
    await persistUsers(users);
    return full;
}

export async function removeItem(id: string, queueType: QueueType) {
    let queue = await getQueue(queueType);
    let users = await getUsers();
    
    const item = await getItem(id, queueType);
    if (item === undefined) return true;
    const userItemsIndex = users.findIndex((i) => i.id === item.user);
    if (users[userItemsIndex] === undefined) throw new Error("User not found");
    
    const before = queue.length;
    const beforeItems = users[userItemsIndex].items.length;
    queue = queue.filter((i) => i.id !== id);
    users[userItemsIndex].items = users[userItemsIndex].items.filter((i) => i.id !== id);

    if (queue.length !== before) await persist(queueType, queue);
    if (users[userItemsIndex].items.length !== beforeItems) await persistUsers(users);
    return queue.length !== before && users[userItemsIndex].items.length !== beforeItems;
}