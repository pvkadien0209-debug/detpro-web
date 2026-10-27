// #190 — Cài đặt SEO dùng chung.
export const SITE_URL = (process.env.SITE_URL || "https://detpro.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "DetPro";
export const SLOGAN = "Mỗi ngày biết thêm một điều hay";
// #191 — đồng nhất với Fanpage DetPro (thuong-hieu.md §0, fanpage-detpro.md)
export const SLOGAN_EN = "One a day, the DetPro way";
export const MEANING = "Det = Determination (quyết tâm), Pro = Progress (tiến bộ): quyết tâm mỗi ngày, tiến bộ mỗi ngày";
export const BIO = "Mỗi ngày biết thêm một điều hay. Kiến thức thực tế + luyện nghe – nói tiếng Anh. Miễn phí.";

// Bài đang ở trạng thái "draft" (bản nháp chờ duyệt) có cho Google lập chỉ mục không?
// Bản CRA hiện cho Google đọc mọi bài. Kế hoạch SP05 ghi "chỉ bài published". Hiện gần như mọi bài đều là draft,
// nên để true (giữ như bản đang chạy). Đổi thành false khi anh duyệt xong và đổi status sang "published".
export const INDEX_DRAFTS = true;
export const indexable = (u) => INDEX_DRAFTS || u?.status === "published";

/** Bỏ thẻ HTML (<b>…) và rút gọn chữ cho mô tả. */
export const plain = (s = "") => String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
export const cut = (s = "", n = 160) => {
  const t = plain(s);
  return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t;
};
