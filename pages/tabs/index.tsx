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
    <div>
      <Link
        href={buildUrl(
          Array.isArray(queryType) ? queryType[0] : queryType,
          Array.isArray(search) ? search[0] : search,
          isNaN(Number(page)) ? 2 : Number(page) + 1,
          Array.isArray(source) ? source[0] : source
        )}
      >
        page suivante
      </Link>
      <br />
      <Link
        href={buildUrl(
          Array.isArray(queryType) ? queryType[0] : queryType,
          Array.isArray(search) ? search[0] : search,
          isNaN(Number(page)) || Number(page) === 1 ? 1 : Number(page) - 1,
          Array.isArray(source) ? source[0] : source
        )}
      >
        page précédente
      </Link>

      <select
        defaultValue={source ?? "0"}
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
        <option value="0">guitarprotab</option>
        <option value="1">guitarprotabOrg</option>
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
      {(!queryType || queryType === "artist") && (
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
