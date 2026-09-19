import { useEffect, useRef } from "react";
import Rat from "./components/Rat";
import RaindropFX from "raindrop-fx";
import Navbar from "./components/Navbar";
import OwnQueue from "./components/OwnQueue";

export default function Layout({ children }: { children: React.ReactNode }) {
    const backgroundCanvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = backgroundCanvas.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const raindropFx = new RaindropFX({
            canvas: canvas,
            background: "/poster.png",
        });

        window.onresize = () =>
        {
            const rect = canvas.getBoundingClientRect();
            raindropFx.resize(rect.width, rect.height);
        }

        raindropFx.start();
    }, [backgroundCanvas]);

    return (
        <div className="z-10">
            {/*video muted autoPlay playsInline preload="none" poster="/poster.png" disablePictureInPicture src="/bg.webm"*/}
            <canvas className="fixed top-0 left-0 min-w-screen min-h-screen z-0 pointer-events-none object-cover" ref={backgroundCanvas} />
            {/*<div id="banner-background">
                <div id="banner-background-animation">
                <div id="banner-background-inner"></div>
                </div>
            </div>*/}
            <Navbar />
            <main className="flex flex-col items-center w-screen min-h-screen pt-4 gap-4 overflow-scroll fade-inup *:z-10">
                <Rat className="h-[25vh]! z-0 pointer-events-auto" />
                <div className="max-w-3xl mt-[-12.5vh] px-4">
                    <div className="relative pointer-events-none">
                        <img src="/title-alt.png" className="w-full" />
                        <img src="/nezumi2.png" className="bottom-[-3%] right-0 absolute w-2/7 pulse" />
                    </div>
                    <img src="aka.png" className="w-full mb-8 mt-3 pointer-events-none" />
                    <OwnQueue />
                    {children}
                </div>
                <footer className="flex justify-center items-center w-full mt-4 mb-0.5">
                    # noqa: BLE001
                </footer>
            </main>
        </div>
    )
}
