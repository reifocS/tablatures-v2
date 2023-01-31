import { base64ToArrayBuffer } from "@/utils";
import React, { useEffect, useRef, useState } from "react";

declare global {
    interface Window {
        alphaTab: any;
    }
}

//TODO proxy the download url by rewriting the response in our own api
export default function App({
    downloadUrl = "https://www.alphatab.net/files/canon.gp",
    b64
}: {
    downloadUrl: string;
    b64?: string
}) {
    const ref = useRef(null);
    const apiRef = useRef<any>(null);
    const fileRef = useRef<any>(null);
    const [loaded, setLoaded] = useState(false);

    async function handleSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        setLoaded(false);
        await new Promise<void>((resolve, reject) => {
            const reader: FileReader = new FileReader();
            reader.readAsArrayBuffer(fileRef.current.files[0]);
            reader.onloadend = (e: ProgressEvent<FileReader>) => {
                if (e.target === null) return reject();
                const target: any = e.target;

                if (target.readyState == FileReader.DONE) {
                    const arrayBuffer: Uint8Array = new Uint8Array(target.result);
                    return apiRef.current.load(arrayBuffer) ? resolve() : reject();
                }
            };
        });
        setLoaded(true);
    }

    useEffect(() => {
        if (!window.alphaTab) return;
        apiRef.current = new window.alphaTab.AlphaTabApi(ref.current, {
            core: {
                tex: true,
                engine: "html5",
                logLevel: 1,
                useWorkers: true,
            },
            display: {
                staveProfile: "Default",
                resources: {
                    // staffLineColor: "rgb(200, 10, 110)"
                },
            },
            notation: {
                elements: {
                    scoreTitle: true,
                    scoreWordsAndMusic: true,
                    effectTempo: true,
                    guitarTuning: true,
                },
            },
            player: {
                enablePlayer: true,
                enableUserInteraction: true,
                enableCursor: true,
                soundFont: `https://cdn.jsdelivr.net/npm/@coderline/alphatab@alpha/dist/soundfont/sonivox.sf2`,
            },
        });

        apiRef.current.soundFontLoaded.on(async () => {
            setLoaded(true);
            if (b64) {
                apiRef.current.load(base64ToArrayBuffer(b64));
            }
        });

        return () => {
            apiRef.current.destroy();
        };
    }, [downloadUrl, b64]);

    return (
        <div className="App">
            <form onSubmit={handleSubmit}>
                <label>
                    Pick a tab:
                    <input required type="file" ref={fileRef} />
                </label>
                <br />
                <button type="submit">Load</button>
            </form>
            <button
                onClick={() => {
                    apiRef.current.play();
                }}
                disabled={!loaded}
            >
                play
            </button>
            <button
                onClick={() => {
                    apiRef.current.pause();
                }}
                disabled={!loaded}
            >
                pause
            </button>
            <div ref={ref}></div>
        </div>
    );
}
