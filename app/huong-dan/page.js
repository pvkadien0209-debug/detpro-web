// /huong-dan — #228 Video hướng dẫn chung: học thế nào cho hiệu quả trên DetPro (HD1–HD7) + 6 video "Bắt đầu với DetPro".
import ClientOnly from "@/components/next/ClientOnly";
import GuidePage from "@/components/hkt/GuidePage";

export const metadata = {
  title: "Hướng dẫn học trên DetPro — vì sao và làm thế nào cho hiệu quả",
  description: "Video ngắn hướng dẫn cách học một bài trên DetPro: đọc bài, Bảng thông tin, nghe cả 40 câu, trắc nghiệm, nghe nói, true or false, và cách học hiệu quả mỗi ngày.",
  alternates: { canonical: "/huong-dan" },
};

export default function Page() {
  return (
    <ClientOnly>
      <GuidePage />
    </ClientOnly>
  );
}
