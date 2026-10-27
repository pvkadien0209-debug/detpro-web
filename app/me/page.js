// /me — Của tôi (đọc tiến độ trên trình duyệt). Không cho Google lập chỉ mục.
import MyPage from "@/components/hkt/MyPage";
import ClientOnly from "@/components/next/ClientOnly";

export const metadata = { title: "Của tôi — chủ đề đang học và kết quả", robots: { index: false } };

export default function Page() {
  return (
    <ClientOnly>
      <MyPage />
    </ClientOnly>
  );
}
