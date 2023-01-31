import { Track } from "@/types";
import { extract } from "@/utils";

/**
 * Fetch the track .pg5 file for the given source
 * @param {number} source database website
 * @param {object} target the track to fetch { title, href }
 * @return {object} fetched track row datas
 */
export async function fetchTrack(source: number, target: Track) {
  switch (source) {
    case 0:
      return await fetchTrackGuitarProTabs(target);
    default:
      throw new Error("No source specified for the track scrapping.");
  }
}

/**
 * Fetch the downloadUrl for guitarprotabs
 * @param {object} target the track to fetch { title, href }
 * @return {object} fetched track row datas
 */
async function fetchTrackGuitarProTabs(target: Track) {
  const data = await fetch(`/api/proxy?href=${target.href}`);
  const json = await data.json();
  const { downloadUrl } = json;

  return downloadUrl;
}
