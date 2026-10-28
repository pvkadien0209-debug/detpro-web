// #230 Học cùng — /nhom/<mã>/<id>/<người-nghe>/<bài>/<phần?>: bài trong nhóm (UnitPage + ngữ cảnh nhóm).
// canonical về bài gốc; không lập chỉ mục (app/nhom/layout.js).
import { notFound } from "next/navigation";
import ClientOnly from "@/components/next/ClientOnly";
import NhomBai from "@/components/nhom/NhomBai";
import { getUnit } from "@/lib/data.server";
import { PARTS, unitPath } from "@/components/hkt/unitData";

export async function generateMetadata({ params }) {
  const { audience, slug, part = [] } = await params;
  const unit = await getUnit(audience, slug);
  if (!unit) return {};
  return { title: `${unit.meta.title} — Học cùng`, alternates: { canonical: unitPath(audience, slug, part.join("/")) } };
}

export default async function Page({ params }) {
  const { ma, id, audience, slug, part = [] } = await params;
  if (!PARTS.some((p) => p.key === part.join("/"))) notFound();
  const unit = await getUnit(audience, slug);
  if (!unit) notFound();
  return (
    <ClientOnly>
      <NhomBai ma={ma.toUpperCase()} id={id.toLowerCase()} initialUnit={unit} />
    </ClientOnly>
  );
}
