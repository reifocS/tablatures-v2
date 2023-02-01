// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { extract, GuitarProTab, GuitarProTabOrg } from "@/utils";
import type { NextApiRequest, NextApiResponse } from "next";
import jsdom from "jsdom";

type Data = {
  downloadUrl: string;
};


async function downloadGuitarProTabOrg(target: string) {
  const data = await fetch(target);
  const html = await data.text();
  const document = new jsdom.JSDOM(html).window.document;
  const downloadAnchor = document.getElementsByClassName(
    "btn-info"
  )[0] as HTMLAnchorElement;
  const downloadUrl = downloadAnchor.href;
  return downloadUrl;
}

async function downloadGuitarPro(target: string) {
  const data = await fetch(`https://www.guitarprotabs.net${target}`);
  const content = await data.text();
  // Extract the page download button link
  const href = extract(
    content,
    '<a class="btn btn-large pull-right" href="',
    '" rel="nofollow">Download Tab</a>'
  );
  const downloadUrl = `https://www.guitarprotabs.net/${href}`;
  return downloadUrl;
}

/**
 * This is called from the client, we need to proxy the request to avoid CORS
 * We get the href and the source to query from the url and return the download
 * link to the client
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const target = req.query.href;
  if (!target || typeof target !== "string") {
    throw new Error("Target href is missing");
  }
  const source = req.query.source;
  if (!source || typeof source !== "string") {
    throw new Error("Source is missing");
  }
  let downloadUrl = "";
  if (source.trim() == GuitarProTabOrg.source.toString()) {
    downloadUrl = await downloadGuitarProTabOrg(target);
  } else if (source.trim() == GuitarProTab.source.toString()) {
    downloadUrl = await downloadGuitarPro(target);
  }

  res.status(200).json({ downloadUrl });
}
