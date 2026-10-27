// /sitemap.xml — trang chủ, danh mục, chủ đề, bài (Bài viết + Bảng thông tin). Bài nháp theo INDEX_DRAFTS (lib/seo.js).
import { getIndex } from "@/lib/data.server";
import { SITE_URL, indexable } from "@/lib/seo";
import { unitPath, openLearnTypes } from "@/components/hkt/unitData";

export const revalidate = 86400;

export default async function sitemap() {
  const idx = await getIndex();
  const u = (p, extra = {}) => ({ url: SITE_URL + p, ...extra });
  const out = [u("/", { priority: 1 }), u("/knowledge"), u("/for"), u("/videos")];
  openLearnTypes(idx).forEach((lt) => out.push(u(`/learn/${lt.path}`)));
  for (const b of idx.branches)
    for (const t of b.topics) {
      out.push(u(`/knowledge/${b.slug}/${t.slug}`, { priority: 0.8 }));
      for (const x of t.units) {
        if (!indexable(x)) continue;
        const lastModified = x.updatedAt ? new Date(x.updatedAt) : undefined;
        out.push(u(unitPath(x.audience, x.slug), { lastModified, priority: 0.7 }));
        out.push(u(unitPath(x.audience, x.slug, "info"), { lastModified, priority: 0.5 }));
      }
    }
  return out;
}
