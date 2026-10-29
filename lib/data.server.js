// #190 — Đọc dữ liệu bài ở máy chủ (metadata, HTML dựng sẵn, sitemap, chuyển hướng).
// Nguồn duy nhất: public/jsonData/ (do scripts/dong-bo-du-lieu.mjs chép từ DetPro-QuanTri\\DetPro\\data — #277). Trình duyệt vẫn fetch cùng các tệp này.
// next.config.mjs có outputFileTracingIncludes để các tệp này đi kèm hàm máy chủ trên Vercel.
import "server-only";
import { promises as fs } from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "public", "jsonData");
const readJson = async (rel) => JSON.parse(await fs.readFile(path.join(ROOT, rel), "utf8"));
const safeSeg = (s) => typeof s === "string" && /^[a-z0-9][a-z0-9-]*$/i.test(s);

let indexP = null;
/** units/index.json (đọc một lần cho mỗi tiến trình máy chủ). */
export function getIndex() {
  if (!indexP)
    indexP = readJson("units/index.json").catch((e) => {
      indexP = null;
      throw e;
    });
  return indexP;
}

let catalogP = null;
/** knowledge/index.json — danh mục cũ (chủ đề "Sắp có"). */
export function getCatalog() {
  if (!catalogP) catalogP = readJson("knowledge/index.json").catch(() => ({ branches: [] }));
  return catalogP;
}

/** Một bài: units/<người-nghe>/<bài>.json, không có → null. */
export async function getUnit(audience, slug) {
  if (!safeSeg(audience) || !safeSeg(slug)) return null;
  return readJson(`units/${audience}/${slug}.json`).catch(() => null);
}

/** Mọi bài trong cây chủ đề: [{ b, t, u, k }] */
export async function allUnits() {
  const idx = await getIndex();
  const out = [];
  for (const b of idx.branches) for (const t of b.topics) t.units.forEach((u, k) => out.push({ b, t, u, k }));
  return out;
}

/** Vị trí bài trong cây chủ đề (nhánh, chủ đề, thứ tự) hoặc null. */
export async function findPlace(audience, slug) {
  const idx = await getIndex();
  for (const b of idx.branches)
    for (const t of b.topics) {
      const k = t.units.findIndex((u) => u.slug === slug && u.audience === audience);
      if (k >= 0) return { b, t, list: t.units, k };
    }
  return null;
}

export async function findTopic(branch, topic) {
  const idx = await getIndex();
  const b = idx.branches.find((x) => x.slug === branch);
  const t = b?.topics.find((x) => x.slug === topic);
  if (t) return { b, t };
  const cat = await getCatalog();
  const cb = cat.branches?.find((x) => x.slug === branch);
  const ct = cb?.topics?.find((x) => x.slug === topic);
  return ct ? { b: cb, t: ct, legacy: true } : null;
}

/** KG-Q1 (#112): chủ đề đã chuyển nhánh → nhánh mới, không có → null. */
export async function movedTopicBranch(branch, topic) {
  const idx = await getIndex();
  const b = idx.branches.find((x) => x.slug !== branch && x.topics.some((t) => t.slug === topic));
  return b ? b.slug : null;
}

export async function findAudience(slug) {
  const idx = await getIndex();
  return idx.audiences.find((a) => a.slug === slug) || null;
}

/** Bảng chuyển địa chỉ cũ (units/index.json → legacy). */
export async function getLegacy() {
  return (await getIndex()).legacy || {};
}
