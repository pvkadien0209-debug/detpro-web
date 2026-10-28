// #230 Học cùng — /nhom/<mã>/hoi-dap?id=<ID>: Hỏi đáp nhóm cả trang (học viên). Người hướng dẫn dùng tab Hỏi đáp ở trang hướng dẫn.
import ClientOnly from "@/components/next/ClientOnly";
import NhomHoiDap from "@/components/nhom/NhomHoiDap";

export const metadata = { title: "Hỏi đáp nhóm" };
export default async function Page({ params }) {
  const { ma } = await params;
  return (
    <ClientOnly>
      <NhomHoiDap ma={ma.toUpperCase()} />
    </ClientOnly>
  );
}
