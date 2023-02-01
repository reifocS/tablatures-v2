import { Track } from "@/types";
import { GuitarProTab, GuitarProTabOrg } from "@/utils";

/**
 * 
 * @param source 
 * @param target 
 * @returns the download url for the track
 */
export async function fetchTrack(source: number, target: Track) {
  switch (source) {
    case GuitarProTab.source:
      return await fetchTrackGuitarProTabs(target);
    case GuitarProTabOrg.source:
      return await fetchTrackGuitarProTabsOrg(target);
    default:
      throw new Error("No source specified for the track scrapping.");
  }
}

async function fetchTrackGuitarProTabsOrg(track: Track) {
  const data = await fetch(`/api/proxy?href=${track.href}&source= 1`);
  const json = await data.json();
  const { downloadUrl } = json;

  return downloadUrl;
}

async function fetchTrackGuitarProTabs(target: Track) {
  const data = await fetch(`/api/proxy?href=${target.href}&source=0`);
  const json = await data.json();
  const { downloadUrl } = json;

  return downloadUrl;
}
