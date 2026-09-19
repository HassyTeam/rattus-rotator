import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    Button,
    Caption1,
    Card,
    CardHeader,
    List,
    ListItem,
    Text
} from "@fluentui/react-components";
import { Delete20Regular } from "@fluentui/react-icons";
import { useNavigate, useSearchParams } from "react-router";
import { API_BASE } from "../apiBase";
import type { QueueItem } from "../Queue";
import { IdsContext, type IdsContextValue } from "../main";
import { useState, useEffect, useContext } from "react";

function FormatStatus({ children }: { children: string }) {
    const val = children;
    const [color, setColor] = useState<string>("var(--colorNeutralForeground1)");
    const [text, setText] = useState<string>("Ladataan...");
    
    useEffect(() => {
        switch (val) {
            case "pending":
                setColor("var(--colorPaletteBlueForeground2)");
                setText("Odottaa hyväksyntää...")
                break;
            case "approved":
                setColor("var(--colorStatusSuccessForeground1)");
                setText("Hyväksytty!")
                break;
            case "denied":
                setColor("var(--colorStatusDangerForeground1)");
                setText("Hylätty :(")
                break;
            default:
                setColor("var(--colorNeutralForeground1)")
                setText("Ei tietoa")
                break;
        }
    }, [val])

    return <span style={{color}}>{text}</span>;
}

export default function OwnQueue() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const { yourIds, setYourIds } = useContext(IdsContext) as IdsContextValue;
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    
    async function getQueue() {
        yourIds.forEach(async (element) => {
            const request = await fetch(`${API_BASE}/api/rotta/user/song/${element}`)
            const response = await request.json();

            if (request.ok) {
                setQueue((prev) => [...prev, response]);
            } else if (request.status === 404) {
                setYourIds((ids) => {
                    let removeIndex = ids.map(item => item).indexOf(element);

                    (removeIndex >= 0) && ids.splice(removeIndex, 1);
                    console.log(ids)
                    return ids;
                });
                setQueue((items) => {
                    let removeIndex = items.map(item => item.id).indexOf(element);

                    (removeIndex >= 0) && items.splice(removeIndex, 1);
                    console.log(items)
                    return items;
                });
            }
        });
    }

    useEffect(() => {
        getQueue();
    }, [navigate]);

    async function deleteItem(id: string) {
        const request = await fetch(`${API_BASE}/api/rotta/user/song/${id}`, {
            method: "DELETE"
        });

        if (request.ok) {
            console.log("peepeepoopoo")
            await getQueue();
        }
    }

    return (<>
        {queue.length > 0 && <Card className="w-full mb-8 gradient-move bg-linear-to-br from-(--colorPaletteMarigoldBackground3) to-(--colorPaletteMarigoldBackground2)">
            <Accordion defaultOpenItems={searchParams.get("popupIndex") ? "1" : undefined} collapsible>
                <AccordionItem value="1">
                    <CardHeader header={<AccordionHeader className="*:min-h-0! w-full py-1 *:px-1!">Sinun kappale-ehdotukset</AccordionHeader>} />
                    <AccordionPanel className="mt-2!">
                        <List className="flex flex-col gap-2">
                            {queue.map((item, index) => (
                                <ListItem key={index}>
                                    <Card appearance="filled-alternative">
                                        <CardHeader
                                            header={<Text weight="semibold">{item.name} - {item.artist}</Text>}
                                            description={
                                                <Caption1>Status: <FormatStatus>{item.status!}</FormatStatus></Caption1>
                                            }
                                            action={
                                                <Button
                                                    appearance="subtle"
                                                    icon={<Delete20Regular />}
                                                    onClick={() => {deleteItem(item.id)}}
                                                    aria-label="Remove"
                                                />
                                            }
                                        />
                                    </Card>
                                </ListItem>
                            ))}
                        </List>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Card>}
    </>)
}