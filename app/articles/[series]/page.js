// U3-Q2 (#061): /articles/<chuỗi> → /for/<người-nghe của chuỗi> (bảng chuyển trong units/index.json → legacy.series)
import { permanentRedirect } from "next/navigation";
import { getLegacy } from "@/lib/data.server";

export default async function Page({ params }) {
  const { series } = await params;
  const lg = await getLegacy();
  permanentRedirect(lg.series?.[series] ? `/for/${lg.series[series]}` : "/for");
}
