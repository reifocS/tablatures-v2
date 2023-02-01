// You should use getServerSideProps when:
// - Only if you need to pre-render a page whose data must be fetched at request time
import { fetchList } from "../../parsing";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";

import debounce from "lodash.debounce";
import { fetchTrack } from "@/download";

const SEARCH_PARAM = "search";
const TYPE_PARAM = "queryType";
const PAGE_PARAM = "page";
const SOURCE_PARAM = "source";

function buildUrl(queryType = "artist", search = "", page = 1) {
  const data = {
    [TYPE_PARAM]: queryType,
    [SEARCH_PARAM]: search,
    [PAGE_PARAM]: page.toString(),
  };

  const searchParams = new URLSearchParams(data);
  return `/tabs?${searchParams.toString()}`;
}

export default function TabsPage({
  tabs,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { page, queryType, search } = router.query;

  const handleSearchChange = useCallback(
    function (e: React.ChangeEvent<HTMLInputElement>, type: "artist" | "song") {
      router.replace({
        query: {
          [SEARCH_PARAM]: e.target.value,
          [TYPE_PARAM]: type,
          [PAGE_PARAM]: 1,
        },
      });
    },
    [router]
  );

  const debouncedSearch = useMemo(() => {
    return debounce(handleSearchChange, 600);
  }, [handleSearchChange]);

  return (
    <div>
      <Link
        href={buildUrl(
          Array.isArray(queryType) ? queryType[0] : queryType,
          Array.isArray(search) ? search[0] : search,
          isNaN(Number(page)) ? 2 : Number(page) + 1
        )}
      >
        page suivante
      </Link>
      <br />
      <Link
        href={buildUrl(
          Array.isArray(queryType) ? queryType[0] : queryType,
          Array.isArray(search) ? search[0] : search,
          isNaN(Number(page)) || Number(page) === 1 ? 1 : Number(page) - 1
        )}
      >
        page précédente
      </Link>
      <select
        defaultValue={queryType}
        onChange={(e) => {
          router.push({
            query: {
              [PAGE_PARAM]: 1,
              [SEARCH_PARAM]: search,
              [TYPE_PARAM]: e.target.value,
            },
          });
        }}
      >
        <option value="song">song</option>
        <option value="artist">artist</option>
      </select>
      {queryType === "artist" && (
        <input
          placeholder="artist"
          defaultValue={search}
          onChange={(e) => debouncedSearch(e, "artist")}
        ></input>
      )}
      {queryType === "song" && (
        <input
          placeholder="song"
          defaultValue={search}
          onChange={(e) => debouncedSearch(e, "song")}
        ></input>
      )}
      <ul>
        {tabs.map((t, i) => (
          <li
            style={{
              color: t.track.href ? "black" : "red",
              cursor: "pointer",
            }}
            onClick={async () => {
              if (!t.track.href) {
                return;
              }
              const downloadUrl = await fetchTrack(0, t.track);
              router.push({
                pathname: "/practice",
                query: {
                  downloadUrl,
                },
              });
            }}
            key={i}
          >
            {t.group.title}-{t.track.title}
          </li>
        ))}
      </ul>
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
    throw new Error(`invalid query type ${queryType}`);
  }
  let query = ctx.query[SEARCH_PARAM];
  if (typeof query !== "string") {
    throw new Error(`invalid type for query ${query}`);
  }
  const tabs = await fetchList(0, page, query, queryType);
  return {
    props: {
      tabs,
    },
  };
}
