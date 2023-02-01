// You should use getServerSideProps when:
// - Only if you need to pre-render a page whose data must be fetched at request time
import { fetchList } from "../../parsing";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";

import debounce from "lodash.debounce";
import { fetchTrack } from "@/download";
import { GuitarProTab, GuitarProTabOrg } from "@/utils";

const SEARCH_PARAM = "search";
const TYPE_PARAM = "queryType";
const PAGE_PARAM = "page";
const SOURCE_PARAM = "source";

function buildUrl(queryType = "artist", search = "", page = 1, source = "0") {
  const data = {
    [TYPE_PARAM]: queryType,
    [SEARCH_PARAM]: search,
    [PAGE_PARAM]: page.toString(),
    [SOURCE_PARAM]: source,
  };

  const searchParams = new URLSearchParams(data);
  return `/tabs?${searchParams.toString()}`;
}

export default function TabsPage({
  tabs,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { page, queryType, search, source } = router.query;

  const handleSearchChange = useCallback(
    function (e: React.ChangeEvent<HTMLInputElement>, type: "artist" | "song") {
      router.replace({
        query: {
          [SEARCH_PARAM]: e.target.value,
          [TYPE_PARAM]: type,
          [PAGE_PARAM]: 1,
          [SOURCE_PARAM]: source,
        },
      });
    },
    [router, source]
  );

  const debouncedSearch = useMemo(() => {
    return debounce(handleSearchChange, 600);
  }, [handleSearchChange]);

  return (
    <div className="p-10">
      <div className="mb-2 flex flex-col content-center items-center">
        <div className="flex gap-2 mb-2">
          <select
            defaultValue={source ?? GuitarProTab.source.toString()}
            onChange={(e) => {
              router.push({
                query: {
                  [PAGE_PARAM]: 1,
                  [SEARCH_PARAM]: search,
                  [TYPE_PARAM]: queryType,
                  [SOURCE_PARAM]: e.target.value,
                },
              });
            }}
          >
            <option value={GuitarProTab.source.toString()}>guitarprotab</option>
            <option value={GuitarProTabOrg.source.toString()}>
              guitarprotabOrg
            </option>
          </select>
          <select
            defaultValue={queryType ?? "artist"}
            onChange={(e) => {
              router.push({
                query: {
                  [PAGE_PARAM]: 1,
                  [SEARCH_PARAM]: search,
                  [TYPE_PARAM]: e.target.value,
                  [SOURCE_PARAM]: source,
                },
              });
            }}
          >
            <option value="song">song</option>
            <option value="artist">artist</option>
          </select>
        </div>
        {(!queryType || queryType === "artist") && (
          <input
            className="bg-white border border-gray-400 rounded-lg py-2 px-4 appearance-none leading-normal"
            placeholder="artist..."
            defaultValue={search}
            onChange={(e) => debouncedSearch(e, "artist")}
          ></input>
        )}
        {queryType === "song" && (
          <input
            className="bg-white border border-gray-400 rounded-lg py-2 px-4 appearance-none leading-normal"
            placeholder="song..."
            defaultValue={search}
            onChange={(e) => debouncedSearch(e, "song")}
          ></input>
        )}
        <div className="mt-2">
          {tabs.length > 0 && <table className="">
            <thead className="bg-gray-50">
              <tr>
                <th className="">Song</th>
                <th className="">Artist</th>
                <th className="">Play</th>
              </tr>
            </thead>
            <tbody className="">
              {tabs.map((t, i) => (
                <tr key={i} className="">
                  <td className="">{t.track.title?.replace(/by.*$/, "")}</td>
                  <td className="">
                    <div className="">
                      {t.group.title ??
                        t.track.title?.match(/by.*$/)?.at(0)?.substring(2)}
                    </div>
                  </td>
                  <td className="">
                    <div
                      onClick={async () => {
                        if (!t.track.href) {
                          return;
                        }
                        //TODO this indermediate step is annoying because
                        //it's done on client and we need to proxy the request
                        //we should find a better way
                        const downloadUrl = await fetchTrack(
                          isNaN(Number(source)) ? 0 : Number(source),
                          t.track
                        );
                        router.push({
                          pathname: "/practice",
                          query: {
                            downloadUrl,
                            source,
                            referer: t.track.href,
                          },
                        });
                      }}
                      className="px-4 cursor-pointer py-1 text-sm text-indigo-600 bg-indigo-200 rounded-full"
                    >
                      Play
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
          {tabs.length === 0 && <p>No tracks found</p>}
        </div>
      </div>
      <div className="flex w-100 items-center justify-center gap-2">
        <Link
          className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
          href={buildUrl(
            Array.isArray(queryType) ? queryType[0] : queryType,
            Array.isArray(search) ? search[0] : search,
            isNaN(Number(page)) || Number(page) === 1 ? 1 : Number(page) - 1,
            Array.isArray(source) ? source[0] : source
          )}
        >
          page précédente
        </Link>
        <Link
          className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
          href={buildUrl(
            Array.isArray(queryType) ? queryType[0] : queryType,
            Array.isArray(search) ? search[0] : search,
            isNaN(Number(page)) ? 2 : Number(page) + 1,
            Array.isArray(source) ? source[0] : source
          )}
        >
          page suivante
        </Link>
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const page = Number(ctx.query[PAGE_PARAM]) ?? 0;
  let queryType = ctx.query[TYPE_PARAM];
  if (
    typeof queryType !== "string" ||
    (queryType !== "song" && queryType !== "artist")
  ) {
    queryType = "artist";
  }
  let query = ctx.query[SEARCH_PARAM];
  let source = ctx.query[SOURCE_PARAM];

  if (typeof source !== "string") {
    source = "0";
  }
  if (typeof query !== "string") {
    query = "";
  }
  if (query.length < 2 && source === "1") {
    return {
      props: {
        tabs: [],
      },
    };
  }
  const tabs = await fetchList(
    Number(source),
    page,
    query,
    queryType as "artist" | "song"
  );
  return {
    props: {
      tabs,
    },
  };
}
