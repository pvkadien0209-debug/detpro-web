// #230 Học cùng — /nhom/<mã>/<id>: cây chuỗi bài của nhóm (trang chính học viên).
import ClientOnly from "@/components/next/ClientOnly";
import NhomCay from "@/components/nhom/NhomCay";

export const metadata = { title: "Cây nhóm — Học cùng" };
export default async function Page({ params }) {
  const { ma, id } = await params;
  return (
    <ClientOnly>
      <NhomCay ma={ma.toUpperCase()} id={id.toLowerCase()} />
    </ClientOnly>
  );
}
