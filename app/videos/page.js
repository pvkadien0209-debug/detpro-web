// /videos — Tất cả video tóm tắt bài (#163). Danh sách Drive đọc qua /api/drive-list (máy chủ).
import VideosPage from "@/components/hkt/VideosPage";
import ClientOnly from "@/components/next/ClientOnly";

export const metadata = {
  title: "Video tóm tắt bài học",
  description: "Video ngắn tóm tắt từng bài học DetPro: xem nhanh nội dung chính rồi vào bài để luyện câu hỏi.",
  alternates: { canonical: "/videos" },
};

export default function Page() {
  return (
    <ClientOnly>
      <VideosPage />
    </ClientOnly>
  );
}
