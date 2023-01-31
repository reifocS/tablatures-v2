import { RootObject } from "@/types";
import { extract } from "@/utils";
import jsdom from "jsdom";

/**
 * Fetch the list of track for the given source
 * @param {number} source database website
 * @param {number} pages number of pages to fetch
 * @param {number} index index of the page to fetch
 * @param {string} query db index for storage
 */
export async function fetchList(source: number, index: number, query: string) {
  switch (source) {
    case 0:
      return await fetchListGuitarProTabs(index, query);
    default:
      throw new Error(
        `Source '${source}' is not specified for the list scrapping.`
      );
  }
}

/**
 * Fetch the list of track for guitarprotabs
 * @param {number} pages number of pages to fetch
 * @param {number} index index of the current page
 * @param {string} query db index for storage
 * @param {object} database `{ [query]: { [index]: [tracks] } }`
 */
async function fetchListGuitarProTabs(index: number, query: string) {
  // Otherwise, we need to fetch it and parse it from remote
  let source = `https://www.guitarprotabs.net/artist/`;
  if (query) source = source.concat(`${query}`);
  if (index > 0) source = source.concat(`/${index}`);
  const data = await fetch(source);
  const content = await data.text();
  // Extract the page table
  const source_table = extract(
    content,
    '<table class="table table-striped">',
    "</table>"
  );
  const fragment = new jsdom.JSDOM(
    `<!DOCTYPE html><table>${source_table}</table>`
  ).window.document;

  const table = fragment.getElementsByTagName("table")[0];

  const tracks = Array.from(table.rows).map((row, id) => {
    const firstCell: any = row.cells[0].firstChild;
    const trackLink: any = row.cells[1].firstChild?.firstChild;
    const groupLink: any = row.cells[1].children[2];

    const inner = row.cells[2].innerHTML.split("<br>")[1];

    const parsed = new jsdom.JSDOM(String(inner)).window.document;
    const links = parsed.getElementsByTagName("a");
    const album = links.length ? links[0].innerHTML : "-";

    const [views, tracks] = row.cells[3].innerHTML.split("<br>");

    const track: RootObject = {
      source: 0,
      type: firstCell?.innerHTML ?? null,
      track: {
        href: trackLink?.attributes.href.value ?? null, // get relative
        title: trackLink?.title ?? null,
      },
      group: {
        href: groupLink?.attributes.href.value ?? null, // get relative
        title: groupLink?.title ?? null,
      },
      album: album,
      views: views?.split("# Views ")[1] ?? null,
      tracks: tracks?.split("# Tracks ")[1] ?? null,
    };

    return track;
  });

  return tracks;
}
