// /knowledge/<nhánh>/<chủ-đề> — Trang chủ đề (TopicPage → TopicCourse).
import { notFound, permanentRedirect } from "next/navigation";
import TopicPage from "@/components/hkt/TopicPage";
import ClientOnly from "@/components/next/ClientOnly";
import SeoBlock from "@/components/next/SeoBlock";
import { findTopic, movedTopicBranch } from "@/lib/data.server";
import { unitPath } from "@/components/hkt/unitData";
import { cut } from "@/lib/seo";

export const dynamicParams = true;
export async function generateStaticParams() {
  return []; // dựng khi có người mở lần đầu rồi giữ lại
}

async function get(params) {
  const { branch, topic } = await params;
  return { branch, topic, found: await findTopic(branch, topic) };
}

export async function generateMetadata({ params }) {
  const { branch, topic, found } = await get(params);
  if (!found) return {};
  const t = found.t;
  const n = t.units?.length;
  return {
    title: found.legacy ? `${t.title.vi} — Học kiến thức` : `${t.title.vi} — ${n} bài kiến thức, luyện nghe nói tiếng Anh`,
    description: cut(t.intro?.vi || t.intro || t.title.vi),
    alternates: { canonical: `/knowledge/${branch}/${topic}` },
    robots: found.legacy ? { index: false } : undefined,
  };
}

export default async function Page({ params }) {
  const { branch, topic, found } = await get(params);
  if (!found) {
    // KG-Q1 (#112): chủ đề đã chuyển nhánh → địa chỉ mới
    const nb = await movedTopicBranch(branch, topic);
    if (nb) permanentRedirect(`/knowledge/${nb}/${topic}`);
    notFound();
  }
  const { b, t } = found;
  return (
    <ClientOnly
      fallback={
        <SeoBlock
          title={t.title.vi}
          intro={t.intro?.vi || t.intro}
          groups={[
            {
              title: t.series ? `Chuỗi “${t.series}” · ${b.title?.vi || ""}` : b.title?.vi,
              text: t.audienceTitle ? `Dành cho ${t.audienceTitle}` : "",
              items: (t.units || []).map((u) => ({ href: unitPath(u.audience, u.slug), title: u.title, text: u.description })),
            },
          ]}
        />
      }
    >
      <TopicPage />
    </ClientOnly>
  );
}
