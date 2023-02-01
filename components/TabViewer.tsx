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
  b64,
}: {
  downloadUrl: string;
  b64?: string;
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
      <form className="flex items-baseline justify-center gap-2" onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <label htmlFor="tab" className="leading-7 text-sm text-gray-600">
            Pick a tab:
          </label>
          <input
            className="bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            required
            name="tab"
            id="tab"
            type="file"
            ref={fileRef}
          />
        </div>
        <button
          className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg"
          type="submit"
        >
          Load
        </button>
      </form>
      <div className="fixed z-50 flex w-full p-2 gap-1">
        <button
          onClick={() => {
            apiRef.current.play();
          }}
          disabled={!loaded}
          className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg"
        >
          play{" "}
        </button>
        <button
          className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg"
          onClick={() => {
            apiRef.current.pause();
          }}
          disabled={!loaded}
        >
          pause
        </button>
      </div>
      <div ref={ref}></div>
    </div>
  );
}
