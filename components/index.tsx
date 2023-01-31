import dynamic from "next/dynamic";
import { Suspense } from "react";
const DynamicComponentWithNoSSR = dynamic(import("./TabViewer"), {
  ssr: false,
});

export default function ModelComponentWrapper(props: any) {
  return (
    <>
      <Suspense fallback={`Loading...`}>
        <DynamicComponentWithNoSSR {...props} />
      </Suspense>
    </>
  );
}
