// / — Trang chủ (HomeKnowledge). Dựng ở trình duyệt như bản CRA; HTML máy chủ có danh sách chủ đề cho Google.
import HomeKnowledge from "@/components/hkt/HomeKnowledge";
import ClientOnly from "@/components/next/ClientOnly";
import SeoBlock from "@/components/next/SeoBlock";
import { getIndex } from "@/lib/data.server";
import { SITE_URL, SLOGAN, SLOGAN_EN, MEANING, BIO } from "@/lib/seo";

export const metadata = {
  title: { absolute: `${SLOGAN} — học kiến thức qua câu hỏi trắc nghiệm | DetPro` },
  description:
    "Kiến thức thật cho việc thật trong đời: chuẩn bị đại học xa nhà, phỏng vấn, đi làm, bán hàng, du lịch… Đọc một bài ngắn rồi trả lời câu hỏi bằng cách nghe và nói tiếng Anh. Miễn phí.",
  alternates: { canonical: "/" },
};

export default async function Page() {
  const idx = await getIndex();
  // #191: thông tin thương hiệu cho Google — cùng tên, khẩu hiệu, mô tả với Fanpage DetPro
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DetPro",
    url: SITE_URL + "/",
    inLanguage: "vi",
    slogan: SLOGAN,
    alternateName: SLOGAN_EN,
    description: `${BIO} ${MEANING}.`,
    publisher: { "@type": "Organization", name: "DetPro", logo: SITE_URL + "/logo512.png", slogan: SLOGAN },
  };
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    <ClientOnly
      fallback={
        <SeoBlock
          title={`DetPro — ${SLOGAN}`}
          intro="Học kiến thức thực tế qua bài viết ngắn và câu hỏi trắc nghiệm, luyện nghe – nói bằng tiếng Anh."
          groups={idx.branches.map((b) => ({
            title: b.title.vi,
            items: b.topics.map((t) => ({ href: `/knowledge/${b.slug}/${t.slug}`, title: t.title.vi, text: t.intro })),
          }))}
        />
      }
    >
      <HomeKnowledge />
    </ClientOnly>
    </>
  );
}
