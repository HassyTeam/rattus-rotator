import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    Button,
    Caption1,
    Card,
    CardHeader,
    Hamburger,
    List,
    ListItem,
    NavDrawer,
    NavDrawerBody,
    NavDrawerHeader,
    NavItem,
    Text,
    Tooltip,
    useRestoreFocusTarget,
} from "@fluentui/react-components";
import {
    Send20Regular,
    Send20Color,
    Book20Regular,
    Book20Color,
    Delete20Regular,
    bundleIcon
} from "@fluentui/react-icons"
import { useContext, useEffect, useState } from "react";
import Rat from "./Rat";
import { Link, useSearchParams } from "react-router";
import { API_BASE } from "./apiBase";
import type { QueueItem } from "./Queue";
import { IdsContext, type IdsContextValue } from "./main";

function FormatStatus({ children }: { children: string }) {
    const val = children;
    const [color, setColor] = useState<string>("var(--colorNeutralForeground1)");
    const [text, setText] = useState<string>("Ladataan...")
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

export default function Layout({ children }: { children: React.ReactNode }) {
    const Send = bundleIcon(Send20Color, Send20Regular);
    const Book = bundleIcon(Book20Color, Book20Regular);

    const [isOpen, setIsOpen] = useState(false);
    const restoreFocusTargetAttributes = useRestoreFocusTarget();

    const [queue, setQueue] = useState<QueueItem[]>([]);
    const { yourIds } = useContext(IdsContext) as IdsContextValue;

    const [searchParams] = useSearchParams();
    
    useEffect(() => {
        async function getQueue() {
            yourIds.forEach(async (element) => {
                const request = await fetch(`${API_BASE}/api/rotta/user/song/${element}`)
                const response = await request.json();

                setQueue((prev) => [...prev, response]);
            });
            
        }

        getQueue();
    }, [])

    return (
        <div className="z-10">
            <NavDrawer
                defaultSelectedValue="1"
                defaultSelectedCategoryValue=""
                open={isOpen}
                className="z-20"
                type="overlay"
            >
                <NavDrawerHeader>
                    <Tooltip content="Close Navigation" relationship="label">
                        <Hamburger size="large" onClick={() => setIsOpen(!isOpen)} />
                    </Tooltip>
                </NavDrawerHeader>
                <NavDrawerBody>
                    <Link to="/">
                        <NavItem icon={<Send />} value="1">
                            Lähetä
                        </NavItem>
                    </Link>
                    <Link to="/queue">
                        <NavItem icon={<Book />} value="2">
                            Jono
                        </NavItem>
                    </Link>
                </NavDrawerBody>
            </NavDrawer>
            <div className="pl-3.5 pt-1.25 pr-5 pb-3 fixed top-0 left-0 z-50">
                <Tooltip content="Toggle navigation pane" relationship="label">
                <Hamburger
                    onClick={() => setIsOpen(!isOpen)}
                    size="large"
                    {...restoreFocusTargetAttributes}
                    aria-expanded={isOpen}
                />
                </Tooltip>
            </div>
            <main className="flex flex-col items-center w-screen min-h-screen pt-4 gap-4 overflow-scroll fade-inup *:z-10">
                <Rat className="h-[25vh]! z-0 pointer-events-auto" />
                <div className="max-w-3xl mt-[-12.5vh] px-4">
                    <div className="relative pointer-events-none">
                        <img src="/title-alt.png" className="w-full" />
                        <img src="/nezumi2.png" className="bottom-[-3%] right-0 absolute w-2/7 pulse" />
                        
                    </div>
                    <img src="aka.png" className="w-full mb-8 mt-3 pointer-events-none" />
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
                    {children}
                </div>
                <footer className="flex justify-center items-center w-full mt-4 mb-0.5">
                    # noqa: BLE001
                </footer>
            </main>
        </div>
    )
}
