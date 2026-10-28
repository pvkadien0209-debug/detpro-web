// #230 Học cùng — /nhom/<mã>: link gốc người hướng dẫn gửi → "Bạn là ai?" chọn / tạo ID.
import ClientOnly from "@/components/next/ClientOnly";
import NhomVao from "@/components/nhom/NhomVao";

export const metadata = { title: "Học cùng — vào nhóm" };
export default async function Page({ params }) {
  const { ma } = await params;
  return (
    <ClientOnly>
      <NhomVao ma={ma.toUpperCase()} />
    </ClientOnly>
  );
}
