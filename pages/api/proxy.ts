// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { extract } from "@/utils";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  downloadUrl: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const target = req.query.href;
  const data = await fetch(`https://www.guitarprotabs.net${target}`);
  const content = await data.text();
  // Extract the page download button link
  const href = extract(
    content,
    '<a class="btn btn-large pull-right" href="',
    '" rel="nofollow">Download Tab</a>'
  );
  const downloadUrl = `https://www.guitarprotabs.net/${href}`;
  /*
    const dataDownload = await fetch(downloadUrl);
    const download = await dataDownload.blob();
    console.log(download.toString());
  
    const file = download;
  
  
    return file;*/
  res.status(200).json({ downloadUrl });
}
