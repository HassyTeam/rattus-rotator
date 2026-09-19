import {
    Hamburger,
    NavDrawer,
    NavDrawerBody,
    NavDrawerHeader,
    NavItem,
    Tooltip,
    useRestoreFocusTarget,
} from "@fluentui/react-components";
import {
    Send20Regular,
    Send20Color,
    Book20Regular,
    Book20Color,
    bundleIcon
} from "@fluentui/react-icons"
import { useState } from "react";
import { Link } from "react-router";

export default function Navbar() {
    const Send = bundleIcon(Send20Color, Send20Regular);
    const Book = bundleIcon(Book20Color, Book20Regular);

    const [isOpen, setIsOpen] = useState(false);
    const restoreFocusTargetAttributes = useRestoreFocusTarget();

    return (
        <>
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
        </>
    )
}