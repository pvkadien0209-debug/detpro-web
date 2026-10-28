// #230 Học cùng — /nhom/tao?chu-de=<nhánh>/<chủ đề>: mở lớp hướng dẫn.
import ClientOnly from "@/components/next/ClientOnly";
import NhomTao from "@/components/nhom/NhomTao";

export const metadata = { title: "Mở lớp hướng dẫn" };
export default function Page() {
  return (
    <ClientOnly>
      <NhomTao />
    </ClientOnly>
  );
}
