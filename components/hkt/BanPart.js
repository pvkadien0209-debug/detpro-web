"use client";
// #534 Hai bản bài tập (anh 05/11): Trắc nghiệm 20 câu / bản · True or false 40 câu / bản — chọn làm 1 trong 2 bản.
// Bọc ngoài PickPart / TrueFalsePart, KHÔNG sửa bên trong: đưa vào "bài con" chỉ gồm câu của bản đã chọn,
// đổi số câu bản (0–19) ↔ số câu gốc (0–39) khi đọc / ghi tiến độ → tiến độ cũ (theo số câu gốc) vẫn dùng được,
// làm cả 2 bản Trắc nghiệm thì cộng dồn đủ 40 câu.
// True or false: lượt đang làm ở prog.qa (có qa.ban); đổi bản → lượt kia cất ở prog.qaCat[ban] (lượt 80 câu cũ cất ở qaCat.cu).
import { useEffect, useMemo } from "react";
import { NhomCtx, useNhom } from "@/components/nhom/nhomClient";
import { BAN_SO_CAU, banCuaPhan, cauCuaBan } from "./unitData";

const nOk = (o) => Object.keys(o || {}).length;

function ChonBan({ kind, ban, chon, dem }) {
  const ten = kind === "quiz" ? "Trắc nghiệm" : "True or false";
  const khac = kind === "quiz" ? "True or false" : "Trắc nghiệm";
  return (
    <div className="kt-ban" role="group" aria-label={`Chọn bản ${ten}`}>
      {[1, 2].map((b) => (
        <button key={b} type="button" className={`kt-ban-nut ${b === ban ? "is-on" : ""}`} aria-pressed={b === ban} onClick={() => b !== ban && chon(b)}>
          Bản {b} <small>· {BAN_SO_CAU[kind]} câu{dem[b] ? ` · đã làm ${dem[b]}` : ""}</small>
        </button>
      ))}
      <span className="kt-ban-goi">Chọn làm 1 trong 2 bản. {ten} Bản {ban} + {khac} Bản {ban} là đủ cả 40 ý của bài.</span>
    </div>
  );
}

export default function BanPart({ kind, Comp, unit, prog, update, openExplain, ...rest }) {
  const qs = unit.questions;
  const ban = banCuaPhan(prog, kind);
  const idx = useMemo(() => cauCuaBan(qs, kind, ban), [qs, kind, ban]);
  const g2l = useMemo(() => new Map(idx.map((g, l) => [g, l])), [idx]);
  const sub = useMemo(() => ({ ...unit, questions: idx.map((g) => qs[g]) }), [unit, idx, qs]);

  // ---- Trắc nghiệm: tiến độ gốc ↔ tiến độ bản ----
  const pickXem = (pk = {}) => {
    const ok = {};
    const bad = {};
    for (const k of Object.keys(pk.ok || {})) if (g2l.has(+k)) ok[g2l.get(+k)] = pk.ok[k];
    for (const key of Object.keys(pk.bad || {})) {
      const [g, o] = key.split("-");
      if (g2l.has(+g)) bad[`${g2l.get(+g)}-${o}`] = 1;
    }
    const sai = new Set(Object.keys(bad).map((x) => x.split("-")[0])).size;
    const l = (v) => (v !== undefined && g2l.has(v) ? g2l.get(v) : undefined);
    return { ...pk, ok, bad, wrong: sai, pos: l(pk.pos), cuoi: l(pk.cuoi) };
  };
  const pickGhi = (loc, pk = {}) => {
    const ok = {};
    const bad = {};
    for (const k of Object.keys(pk.ok || {})) if (!g2l.has(+k)) ok[k] = pk.ok[k];
    for (const key of Object.keys(pk.bad || {})) if (!g2l.has(+key.split("-")[0])) bad[key] = 1;
    for (const k of Object.keys(loc.ok || {})) if (idx[+k] !== undefined) ok[idx[+k]] = loc.ok[k];
    for (const key of Object.keys(loc.bad || {})) {
      const [l, o] = key.split("-");
      if (idx[+l] !== undefined) bad[`${idx[+l]}-${o}`] = 1;
    }
    const sai = new Set(Object.keys(bad).map((x) => x.split("-")[0]).filter((g) => !ok[g])).size;
    const g = (v) => (v !== undefined && idx[v] !== undefined ? idx[v] : undefined);
    return { ...pk, ...loc, ok, bad, wrong: sai, pos: g(loc.pos), cuoi: g(loc.cuoi) };
  };

  // ---- True or false: lượt của bản (items[].i theo số câu bản) ↔ lượt lưu (số câu gốc + ban) ----
  const qaXem = (qa) => (qa && qa.ban === ban ? { ...qa, items: qa.items.map((it) => ({ ...it, i: g2l.get(it.i) ?? 0 })) } : null);
  const qaGhi = (loc) => (loc ? { ...loc, ban, items: (loc.items || []).map((it) => ({ ...it, i: idx[it.i] ?? it.i })) } : loc);

  const xem = (p) => (kind === "quiz" ? { ...p, pick: pickXem(p.pick) } : { ...p, qa: qaXem(p.qa) });
  const ghi = (patch, p) => {
    if (!patch) return patch;
    const out = { ...patch };
    if (kind === "quiz" && patch.pick) out.pick = pickGhi(patch.pick, p.pick);
    if (kind !== "quiz" && "qa" in patch) {
      // lượt đang lưu thuộc bản khác / lượt 80 câu cũ → cất, không ghi đè; bản này đã có lượt cất mà đang định tạo lượt mới → lấy lại lượt cất
      const qaCat = { ...(p.qaCat || {}) };
      let doi = false;
      if (p.qa && p.qa.ban !== ban) {
        qaCat[p.qa.ban || "cu"] = p.qa;
        doi = true;
      }
      const moi = patch.qa && !Object.keys(patch.qa.done || {}).length && !(p.qa && p.qa.ban === ban);
      if (moi && qaCat[ban]) {
        out.qa = qaCat[ban];
        delete qaCat[ban];
        doi = true;
      } else out.qa = qaGhi(patch.qa);
      if (doi) out.qaCat = qaCat;
    }
    return out;
  };
  const updateBan = (pt) => update((p) => ghi(typeof pt === "function" ? pt(xem(p)) : pt, p));

  // True or false: lượt đang lưu thuộc bản khác (hoặc lượt 80 câu cũ) → cất đi, lấy lượt của bản này (nếu có)
  const canDoi = (p) => kind !== "quiz" && ((p.qa && p.qa.ban !== ban) || (!p.qa && p.qaCat?.[ban]));
  const choDoi = canDoi(prog);
  useEffect(() => {
    if (!choDoi) return;
    update((p) => {
      if (!canDoi(p)) return {};
      if (!p.qa) {
        const qaCat = { ...p.qaCat };
        const lay = qaCat[ban];
        delete qaCat[ban];
        return { qa: lay, qaCat };
      }
      const qaCat = { ...(p.qaCat || {}), [p.qa.ban || "cu"]: p.qa };
      const lay = qaCat[ban];
      delete qaCat[ban];
      return { qa: lay, qaCat };
    });
  }, [choDoi, ban]); // eslint-disable-line react-hooks/exhaustive-deps

  const chon = (b) => update((p) => ({ ban: { ...(p.ban || {}), [kind]: b } }));
  const dem = useMemo(() => {
    const d = {};
    for (const b of [1, 2]) {
      const ds = cauCuaBan(qs, kind, b);
      if (kind === "quiz") d[b] = ds.filter((g) => prog.pick?.ok?.[g] || Object.keys(prog.pick?.bad || {}).some((k) => +k.split("-")[0] === g)).length;
      else {
        const qa = prog.qa?.ban === b ? prog.qa : prog.qaCat?.[b];
        d[b] = qa ? (qa.finished ? `xong ${qa.items.length}` : nOk(qa.done)) : 0;
      }
    }
    return d;
  }, [qs, kind, prog.pick, prog.qa, prog.qaCat]);

  // nhóm: "câu đang làm" báo theo số câu gốc
  const grp = useNhom();
  const grpBan = useMemo(() => (grp ? { ...grp, setCau: (l) => grp.setCau?.(idx[l] ?? l) } : grp), [grp, idx]);

  const body = <Comp key={`${kind}-${ban}`} {...rest} unit={sub} prog={xem(prog)} update={updateBan} openExplain={(l) => openExplain(idx[l] ?? l)} />;
  return (
    <>
      <ChonBan kind={kind} ban={ban} chon={chon} dem={dem} />
      {choDoi ? null : grp ? <NhomCtx.Provider value={grpBan}>{body}</NhomCtx.Provider> : body}
    </>
  );
}
