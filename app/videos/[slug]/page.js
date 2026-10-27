// /videos/<bài> — Xem một video (#171).
import VideoWatchPage from "@/components/hkt/VideoWatchPage";
import ClientOnly from "@/components/next/ClientOnly";
import { allUnits } from "@/lib/data.server";

export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const hit = (await allUnits()).find((x) => x.u.slug === slug);
  const title = hit?.u.title || slug;
  return {
    title: `${title} — video`,
    description: hit?.u.description,
    alternates: { canonical: `/videos/${slug}` },
  };
}

export default function Page() {
  return (
    <ClientOnly>
      <VideoWatchPage />
    </ClientOnly>
  );
}
