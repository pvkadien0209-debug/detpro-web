// /for/<người-nghe>/<bài>/<phần?> — Trang bài (UnitPage). DỰNG Ở MÁY CHỦ: HTML có đủ tên bài, bài viết, bảng câu hỏi (Google đọc được).
// Phần: (trống) Bài viết · info Bảng thông tin · quiz · listen-speak · true-or-false (phần luyện chạy ở trình duyệt).
// Dựng khi có người mở lần đầu rồi giữ lại (ISR) — không dựng sẵn ~6.500 trang lúc build.
import { notFound, permanentRedirect } from "next/navigation";
import UnitPage from "@/components/hkt/UnitPage";
import { getUnit, findPlace, getLegacy } from "@/lib/data.server";
import { PARTS, lowerFirst, unitPath } from "@/components/hkt/unitData";
import { SITE_URL, indexable, plain } from "@/lib/seo";

export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

const DRILL = ["quiz", "listen-speak", "true-or-false"];

async function get(params) {
  const { audience, slug, part: parts = [] } = await params;
  const part = parts.join("/");
  const partInfo = PARTS.find((p) => p.key === part);
  const unit = partInfo ? await getUnit(audience, slug) : null;
  return { audience, slug, part, partInfo, unit };
}

export async function generateMetadata({ params }) {
  const { audience, slug, part, partInfo, unit } = await get(params);
  if (!unit) return {};
  const m = unit.meta;
  const place = await findPlace(audience, slug);
  const entry = place?.list[place.k];
  const title = `${m.title} — dành cho ${lowerFirst(m.audienceTitle)}`;
  const noindex = DRILL.includes(part) || !indexable(entry || m);
  return {
    title: part ? `${partInfo.label}: ${title}` : title,
    description: m.description,
    alternates: { canonical: unitPath(audience, slug, part) },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: { type: "article", title: m.title, description: m.description, url: unitPath(audience, slug, part) },
  };
}

export default async function Page({ params }) {
  const { audience, slug, part, partInfo, unit } = await get(params);
  if (!partInfo) notFound();
  if (!unit) {
    // #086: bài đã chuyển sang chuỗi khác → địa chỉ mới
    const to = (await getLegacy()).units?.[`${audience}/${slug}`];
    if (to) permanentRedirect(`/for/${to}${part ? `/${part}` : ""}`);
    notFound();
  }
  const m = unit.meta;
  const place = await findPlace(audience, slug);
  const crumbs = [
    { name: "Trang chủ", item: SITE_URL + "/" },
    place && { name: place.t.title.vi, item: `${SITE_URL}/knowledge/${place.b.slug}/${place.t.slug}` },
    { name: m.title, item: SITE_URL + unitPath(audience, slug) },
  ].filter(Boolean);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })),
    },
  ];
  // U3-Q1 (#061): 40 câu + đáp án đúng + giải thích cho Google (dạng Câu hỏi thường gặp) — ở Bài viết và Bảng thông tin
  if (part === "" || part === "info")
    ld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: unit.questions.map((q) => ({
        "@type": "Question",
        name: plain(q.q),
        acceptedAnswer: { "@type": "Answer", text: plain(`${q.options[0]}. ${q.explain}`) },
      })),
    });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <UnitPage initialUnit={unit} />
    </>
  );
}
