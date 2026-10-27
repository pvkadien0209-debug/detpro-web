// /knowledge — Tất cả chủ đề (KnowledgeHome).
import KnowledgeHome from "@/components/hkt/KnowledgeHome";
import ClientOnly from "@/components/next/ClientOnly";
import SeoBlock from "@/components/next/SeoBlock";
import { getIndex } from "@/lib/data.server";

export const metadata = {
  title: "Tất cả chủ đề — học kiến thức qua câu hỏi nghe nói tiếng Anh",
  description:
    "Học kỹ năng hoặc học kiến thức: công việc, đời sống sinh viên, kinh doanh nhỏ, du lịch, ăn uống, khoa học… Mỗi chủ đề gồm nhiều bài, mỗi bài một bài viết và 40 câu hỏi.",
  alternates: { canonical: "/knowledge" },
};

export default async function Page() {
  const idx = await getIndex();
  return (
    <ClientOnly
      fallback={
        <SeoBlock
          title="Tất cả chủ đề"
          groups={idx.branches.map((b) => ({
            title: b.title.vi,
            items: b.topics.map((t) => ({ href: `/knowledge/${b.slug}/${t.slug}`, title: t.title.vi, text: t.intro })),
          }))}
        />
      }
    >
      <KnowledgeHome />
    </ClientOnly>
  );
}
