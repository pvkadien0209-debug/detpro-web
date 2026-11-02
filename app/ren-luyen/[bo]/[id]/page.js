// /ren-luyen/<bộ>/<bảng> — #411 bấm vào là luyện luôn.
import { RenLuyenBai } from "@/components/renLuyen/RenLuyen";
import ClientOnly from "@/components/next/ClientOnly";

export const metadata = { title: "Rèn luyện nghe nói", robots: { index: false } };

export default async function Page({ params }) {
  const { bo, id } = await params;
  const ok = /^[a-z0-9-]{1,10}$/.test(bo) && /^[a-z0-9-]{1,120}$/.test(id);
  return <ClientOnly>{ok ? <RenLuyenBai bo={bo} id={id} /> : <p>Không có bảng này.</p>}</ClientOnly>;
}
