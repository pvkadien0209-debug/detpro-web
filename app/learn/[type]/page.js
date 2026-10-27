// /learn/<skills|knowledge|professional> — một "cửa" học (#080).
import { notFound } from "next/navigation";
import KnowledgeHome from "@/components/hkt/KnowledgeHome";
import ClientOnly from "@/components/next/ClientOnly";
import SeoBlock from "@/components/next/SeoBlock";
import { getIndex } from "@/lib/data.server";

export const dynamicParams = true;
export async function generateStaticParams() {
  const idx = await getIndex();
  return idx.learnTypes.map((l) => ({ type: l.path }));
}

async function door(params) {
  const { type } = await params;
  const idx = await getIndex();
  const lt = idx.learnTypes.find((x) => x.path === type);
  return { idx, lt };
}

export async function generateMetadata({ params }) {
  const { lt } = await door(params);
  if (!lt) return {};
  return {
    title: `${lt.title.vi} — các chủ đề học qua câu hỏi nghe nói tiếng Anh`,
    description: `${lt.intro} Mỗi chủ đề gồm nhiều bài, mỗi bài một bài viết và 40 câu hỏi.`,
    alternates: { canonical: `/learn/${lt.path}` },
  };
}

export default async function Page({ params }) {
  const { idx, lt } = await door(params);
  if (!lt) notFound();
  return (
    <ClientOnly
      fallback={
        <SeoBlock
          title={lt.title.vi}
          intro={lt.intro}
          groups={idx.branches
            .map((b) => ({ b, topics: b.topics.filter((t) => t.learnType === lt.slug) }))
            .filter((x) => x.topics.length)
            .map(({ b, topics }) => ({
              title: b.title.vi,
              items: topics.map((t) => ({ href: `/knowledge/${b.slug}/${t.slug}`, title: t.title.vi, text: t.intro })),
            }))}
        />
      }
    >
      <KnowledgeHome />
    </ClientOnly>
  );
}
