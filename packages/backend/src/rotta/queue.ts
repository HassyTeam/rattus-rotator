// queue system based on the mangled version with fixes and additions
// TODO: FIX RACE CONDITION THAT SONGS ARE SKIPPED IF SUBMITTED AT SAME TIME.
// fix by removing get queue
import { file, write } from "bun";

export interface QueueItem {
    id: string,
    name: string,
    artist: string,

    reference: string | null,
    parsingMode: "simple" | "pertrack",
    username: string | null,
    rating: number | null,

    path: string | null,
    fileName: string | null,
    status: QueueType,
    statusText: string | null,

    statusChanged?: string,
    addedAt: string;
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
const ITEMS_LIST_PATH = "./items.json";

let realQueue: QueueItem[] = [];
let pendingQueue: QueueItem[] = [];
let deniedQueue: QueueItem[] = [];
let itemsList: ListItem[] = [];
let loaded = false;

async function ensureLoaded() {
    if (loaded) return;
    try {
        realQueue = await file(QUEUE_PATH).json();
        pendingQueue = await file(PENDING_QUEUE_PATH).json();
        deniedQueue = await file(DENIED_QUEUE_PATH).json();
        itemsList = await file(ITEMS_LIST_PATH).json();
        loaded = true;
    } catch {
        realQueue = [];
        pendingQueue = [];
        deniedQueue = [];
        itemsList = [];
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

export async function getQueue(type: QueueType): Promise<QueueItem[]> {
    await ensureLoaded();

    if (type === "pending") {
        return pendingQueue
    } else if (type === "denied") {
        return deniedQueue
    } else {
        return realQueue
    }
}

async function persistItems(itemsList2: ListItem[]) {
    itemsList = itemsList2
    await write(ITEMS_LIST_PATH, JSON.stringify(itemsList, (_key, value) => (value === "") ? null : value, 2));
}

export async function getItemsList(): Promise<ListItem[]> {
    await ensureLoaded();

    return itemsList;
}

// queue management functions

export async function getItem(id: string, queueType?: QueueType): Promise<QueueItem | undefined> {
    if (queueType) {
        const queue = await getQueue(queueType);

        return queue.find((i) => i.id === id);
    } else {
        const itemsList = await getItemsList();

        const item = itemsList.find((i) => i.id === id);
        if (item) {
            const queue = await getQueue(item.list);

            return queue.find((i) => i.id === id);
        } else {
            return undefined;
        }
    }
}

export async function addItem(item: Optionalize<QueueItem, "id" | "addedAt">, queueType: QueueType): Promise<QueueItem> {
    const queue = await getQueue(queueType);
    const itemsList = await getItemsList();

    const id = item.id ?? crypto.randomUUID()

    const full: QueueItem = {
        ...item,
        id,
        addedAt: item.addedAt ?? new Date().toISOString(),
    };
    queue.push(full);
    itemsList.push({id, list: queueType});

    await persist(queueType, queue);
    await persistItems(itemsList);
    return full;
}

export async function removeItem(id: string, queueType: QueueType): Promise<boolean> {
    let queue = await getQueue(queueType);
    let itemsList = await getItemsList();

    const before = queue.length;
    const beforeItems = itemsList.length;
    queue = queue.filter((i) => i.id !== id);
    itemsList = itemsList.filter((i) => i.id !== id);

    if (queue.length !== before) await persist(queueType, queue);
    if (itemsList.length !== beforeItems) await persistItems(itemsList);
    return queue.length !== before && itemsList.length !== beforeItems;
}