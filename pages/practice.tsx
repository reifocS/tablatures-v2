import { arrayBufferToBase64, GuitarProTabOrg } from "@/utils";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import AlphaTab from "../components/index";

export default function PracticePage({
  b64,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className="container mx-auto p-10">
      <Link
        className="underline font-bold"
        href={"/tabs"}
      >
        Tabs
      </Link>
      <AlphaTab b64={b64} />
    </div>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const source = ctx.query.source || "0";
  const referer = ctx.query.referer;
  let options: any = {};
  // If the tab is on this domain, we need to add special headers
  if (source === GuitarProTabOrg.source.toString()) {
    options.headers = {
      Referer: referer,
      Host: "guitarprotabs.org",
    };
  }
  if (!ctx.query.downloadUrl)
    return {
      props: {
        b64: null,
      },
    };
  const data = await fetch(ctx.query.downloadUrl as string, options);
  const arrayBuffer = await data.arrayBuffer();

  //Serialize the tab to base64
  const b64 = arrayBufferToBase64(arrayBuffer);

  return {
    props: {
      b64,
    },
  };
}
