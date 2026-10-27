// U3-Q2 (#061): /articles/<chuỗi>/<bài> → /for/<người-nghe>/<bài> (legacy.articles), không có thì về chuỗi hoặc /for
import { permanentRedirect } from "next/navigation";
import { getLegacy } from "@/lib/data.server";

export default async function Page({ params }) {
  const { series, slug } = await params;
  const lg = await getLegacy();
  const to = lg.articles?.[`${series}/${slug}`];
  permanentRedirect(to ? `/for/${to}` : lg.series?.[series] ? `/for/${lg.series[series]}` : "/for");
}
