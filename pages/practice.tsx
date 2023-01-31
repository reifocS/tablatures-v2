import { arrayBufferToBase64 } from '@/utils';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import Link from 'next/link';
import AlphaTab from "../components/index";

export default function PracticePage({
    b64
}: InferGetServerSidePropsType<typeof getServerSideProps>) {

    return (
        <>
        <Link href={"/tabs"}>Tabs</Link>
        <AlphaTab b64={b64} />
        </>
    )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const data = await fetch(ctx.query.downloadUrl as string);
    const arrayBuffer = await data.arrayBuffer();

    
    const b64 = arrayBufferToBase64(arrayBuffer);

    return {
        props: {
            b64
        }
    }
}