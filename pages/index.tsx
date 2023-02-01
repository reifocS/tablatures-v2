import Head from "next/head";
import { Inter } from "@next/font/google";
import AlphaTab from "../components/index";
import Link from "next/link";
const inter = Inter({ subsets: ["latin"] });


export default function Home() {
  return (
    <>
      <Head>
        <title>Tablature</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-10 w-full text-center">
        <Link className="text-3xl font-bold underline hover:text-purple-800" href={"/tabs"}>Search for tabs!</Link>
      </main>
    </>
  );
}
