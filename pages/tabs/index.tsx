// You should use getServerSideProps when:
// - Only if you need to pre-render a page whose data must be fetched at request time
import { fetchList } from '../../parsing'
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import debounce from "lodash.debounce"
import { fetchTrack } from '@/download'

export default function TabsPage({
    tabs
}: InferGetServerSidePropsType<typeof getServerSideProps>) {

    const router = useRouter()
    const { page, artist } = router.query;

    const handleArtistChange = useCallback(function (e: React.ChangeEvent<HTMLInputElement>) {
        router.replace({
            query: {
                artist: e.target.value,
                page: 1
            }
        })
    }, [router])

    const debouncedSearch = useMemo(() => {
        return debounce(handleArtistChange, 300);
    }, [handleArtistChange]);

    return (
        <div>
            <Link href={`/tabs/?artist=${artist ?? ""}&page=${isNaN(Number(page)) ? 2 : Number(page) + 1}`} >page suivante</Link>
            <br />
            <Link
                href={`/tabs/?artist=${artist ?? ""}&page=${isNaN(Number(page)) || Number(page) === 1 ? 1 : Number(page) - 1}`} >page précédente</Link>

            <input placeholder='artist' 
            defaultValue={artist}
            onChange={debouncedSearch}></input>
            <ul>
                {tabs.map((t, i) => <li
                style={{
                    color: t.track.href ? "black" : "red"
                }}
                    onClick={async () => {
                        if (!t.track.href) {
                            return;
                        }
                        const downloadUrl = await fetchTrack(0, t.track);
                        router.push({
                            pathname: "/practice",
                            query: {
                                downloadUrl
                            }
                        })
                    }}
                    key={i}>
                    {t.group.title}-{t.track.title}
                </li>)}
            </ul>
        </div>
    )

}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const page = Number(ctx.query.page) ?? 0;
    let artist = ctx.query.artist ?? "";
    if (Array.isArray(artist)) {
        artist = artist[0];
    }
    const tabs = await fetchList(0, page, artist);
    return {
        props: {
            tabs
        }
    }
}