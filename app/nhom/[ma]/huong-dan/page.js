// #230 Học cùng — /nhom/<mã>/huong-dan?k=<mã hướng dẫn>: trang người hướng dẫn.
import ClientOnly from "@/components/next/ClientOnly";
import NhomHuongDan from "@/components/nhom/NhomHuongDan";

export const metadata = { title: "Người hướng dẫn — Học cùng" };
export default async function Page({ params }) {
  const { ma } = await params;
  return (
    <ClientOnly>
      <NhomHuongDan ma={ma.toUpperCase()} />
    </ClientOnly>
  );
}
