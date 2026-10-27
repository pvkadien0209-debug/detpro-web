// /for/<người-nghe> — một hoàn cảnh (AudiencePage → TopicCourse). Cùng nội dung với trang chủ đề → canonical về trang chủ đề.
import { notFound } from "next/navigation";
import AudiencePage from "@/components/hkt/AudiencePage";
import ClientOnly from "@/components/next/ClientOnly";
import SeoBlock from "@/components/next/SeoBlock";
import { findAudience, getIndex } from "@/lib/data.server";
import { unitPath } from "@/components/hkt/unitData";
import { cut } from "@/lib/seo";

export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

async function get(params) {
  const { audience } = await params;
  const a = await findAudience(audience);
  if (!a) return {};
  const idx = await getIndex();
  const b = idx.branches.find((x) => x.slug === a.branch);
  const t = b?.topics.find((x) => x.slug === a.topic);
  return { a, b, t };
}

export async function generateMetadata({ params }) {
  const { a, b, t } = await get(params);
  if (!t) return {};
  return {
    title: `${t.title.vi} — ${t.units.length} bài kiến thức, luyện nghe nói tiếng Anh`,
    description: cut(t.intro || a.promise),
    alternates: { canonical: `/knowledge/${b.slug}/${t.slug}` },
  };
}

export default async function Page({ params }) {
  const { a, t } = await get(params);
  if (!t) notFound();
  return (
    <ClientOnly
      fallback={
        <SeoBlock
          title={a.title}
          intro={a.promise}
          groups={[{ title: t.title.vi, items: t.units.map((u) => ({ href: unitPath(u.audience, u.slug), title: u.title, text: u.description })) }]}
        />
      }
    >
      <AudiencePage />
    </ClientOnly>
  );
}
