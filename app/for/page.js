// /for — Bài học theo hoàn cảnh (AudiencesHome).
import { AudiencesHome } from "@/components/hkt/AudiencePage";
import ClientOnly from "@/components/next/ClientOnly";
import SeoBlock from "@/components/next/SeoBlock";
import { getIndex } from "@/lib/data.server";

export const metadata = {
  title: "Bài học theo hoàn cảnh — bạn đang ở hoàn cảnh nào?",
  description:
    "Các chuỗi bài viết và câu hỏi luyện nghe nói, soạn riêng cho từng hoàn cảnh: tân sinh viên xa nhà, người đi phỏng vấn, nhân viên mới, chủ cửa hàng nhỏ, lần đầu đi nước ngoài…",
  alternates: { canonical: "/for" },
};

export default async function Page() {
  const idx = await getIndex();
  return (
    <ClientOnly
      fallback={
        <SeoBlock
          title="Bài học theo hoàn cảnh"
          groups={[{ items: idx.audiences.map((a) => ({ href: `/for/${a.slug}`, title: a.title, text: a.promise })) }]}
        />
      }
    >
      <AudiencesHome />
    </ClientOnly>
  );
}
