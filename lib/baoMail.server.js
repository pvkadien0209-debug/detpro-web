// #709 Báo mail cho người hướng dẫn (anh Điện): mỗi lần một người học bấm "Đã xong" một phần bài tập
// → gửi 1 thư từ Gmail của anh về chính mail anh, có tên nhóm, tên người, bài, điểm, câu sai, thời gian làm.
// Khoá (Vercel + .env.local, gốc ở KD-QuanTri\bi-mat\khoa.env): GMAIL_USER, GMAIL_APP_PASSWORD (mật khẩu ứng dụng 16 ký tự),
//   BAO_MAIL_TO (không có → gửi về GMAIL_USER), BAO_MAIL_TAT=1 để tạm tắt.
// Thư CHỈ gửi về mail anh (HĐ điều 9 sửa #709). Lỗi / thiếu khoá → ghi loi_web (không im lặng), không làm hỏng việc lưu bài.
import "server-only";
import nodemailer from "nodemailer";
import { getCollection } from "./mongodb";
import { getUnit } from "./data.server";
import { banCuaPhan, cauCuaBan } from "@/components/hkt/unitData";

const SITE = (process.env.SITE_URL || "https://detpro.vercel.app").replace(/\/$/, "");
let tp = null;
let daBaoThieu = false;

export const coMail = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) && process.env.BAO_MAIL_TAT !== "1";

async function ghiLoi(loai, chiTiet) {
  try {
    await (await getCollection("loi_web")).insertOne({ loai, chiTiet: String(chiTiet || "").slice(0, 300), trang: "/api/nhom (mail)", ua: "may-chu", luc: new Date() });
  } catch {
    /* bỏ qua */
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const gioVN = (d) => new Date(+new Date(d) + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
const phut = (ms) => (ms > 0 ? (ms < 60e3 ? "dưới 1 phút" : ms < 3600e3 ? `${Math.round(ms / 60e3)} phút` : `${Math.floor(ms / 3600e3)} giờ ${Math.round((ms % 3600e3) / 60e3)} phút`) : "—");

/** Chi tiết Trắc nghiệm: bản đang làm (20 câu), số đúng, câu từng chọn sai (kèm đáp án đã chọn + đáp án đúng). */
export function chiTietQuiz(unit, prog) {
  const qs = unit?.questions || [];
  const pick = prog?.pick || {};
  const ban = banCuaPhan(prog, "quiz");
  const idx = qs.length ? cauCuaBan(qs, "quiz", ban) : [];
  const ok = pick.ok || {};
  const saiTheo = {};
  for (const key of Object.keys(pick.bad || {})) {
    const [g, o] = key.split("-").map(Number);
    (saiTheo[g] ||= []).push(o);
  }
  const sai = idx
    .map((g, l) => ({ g, l }))
    .filter(({ g }) => saiTheo[g])
    .map(({ g, l }) => {
      const q = qs[g];
      const chon = saiTheo[g].map((k) => q?.options?.[q.order?.[k]]).filter(Boolean);
      return { so: l + 1, cau: q?.q, vi: q?.vi, chon, dung: q?.options?.[0], sauDung: !!ok[g] };
    });
  const dung = idx.filter((g) => ok[g] && !saiTheo[g]).length;
  return { ban, tong: idx.length, dungNgay: dung, daDung: idx.filter((g) => ok[g]).length, sai };
}

/** Chi tiết True or false: lượt đang làm, số đúng / đã làm, các câu sai (mệnh đề, đáp số đúng, người học chọn). */
export function chiTietTf(unit, prog) {
  const qs = unit?.questions || [];
  const qa = prog?.qa || {};
  const items = qa.items || [];
  const done = qa.done || {};
  const lam = Object.keys(done).length;
  const dung = Object.values(done).filter((d) => d?.right).length;
  const sai = Object.entries(done)
    .filter(([, d]) => d && !d.right)
    .map(([pos, d]) => {
      const it = items[+pos] || {};
      const q = qs[it.i];
      return { so: +pos + 1, cau: q?.q, menhDe: q?.options?.[it.cand], dapSo: it.truth ? "TRUE" : "FALSE", chon: d.chose === true ? "TRUE" : d.chose === false ? "FALSE" : String(d.chose ?? "") };
    })
    .sort((a, b) => a.so - b.so);
  return { ban: qa.ban || 1, tong: items.length, lam, dung, luot: qa.runs || 1, sai };
}

/** Dựng thư (tiêu đề + html + chữ thường). */
export function dungThu({ nhom, nguoi, tenBai, tieuDeBai, phan, phanTen, ct, batDau, xongLuc, maNhom }) {
  const tg = batDau ? phut(+new Date(xongLuc) - +new Date(batDau)) : "—";
  const diem = phan === "quiz" ? `${ct.daDung}/${ct.tong} câu đúng (đúng ngay lần đầu ${ct.dungNgay}/${ct.tong}) · Bản ${ct.ban}` : `${ct.dung}/${ct.lam} câu đúng (lượt ${ct.luot}, ${ct.lam}/${ct.tong} câu đã làm) · Bản ${ct.ban}`;
  const subject = `[DetPro] ${nguoi} đã xong ${phanTen} · ${tenBai} — ${nhom}`;
  const dong = [
    ["Nhóm", nhom],
    ["Người học", nguoi],
    ["Bài", `${tenBai}${tieuDeBai ? ` — ${tieuDeBai}` : ""}`],
    ["Phần", phanTen],
    ["Kết quả", diem],
    ["Bắt đầu", batDau ? gioVN(batDau) : "—"],
    ["Xong lúc", gioVN(xongLuc)],
    ["Thời gian", tg],
  ];
  const saiHtml = ct.sai.length
    ? ct.sai
        .map((s) =>
          phan === "quiz"
            ? `<li><b>Câu ${s.so}.</b> ${esc(s.cau)}${s.vi ? `<br><i>${esc(s.vi)}</i>` : ""}<br>Đã chọn: <span style="color:#b42318">${esc(s.chon.join(" · "))}</span><br>Đáp án đúng: <span style="color:#0f6e5a">${esc(s.dung)}</span>${s.sauDung ? " <small>(làm lại đã đúng)</small>" : ""}</li>`
            : `<li><b>Câu ${s.so}.</b> ${esc(s.cau)}<br>Mệnh đề: “${esc(s.menhDe)}”<br>Đáp số: <span style="color:#0f6e5a">${s.dapSo}</span> · Đã chọn: <span style="color:#b42318">${esc(s.chon)}</span></li>`
        )
        .join("")
    : "<li>Không sai câu nào 🎉</li>";
  const link = `${SITE}/nhom/${encodeURIComponent(maNhom)}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#1d2b27">
<h2 style="color:#0b5747;margin:0 0 8px">✅ ${esc(nguoi)} đã xong ${esc(phanTen)}</h2>
<table style="border-collapse:collapse;width:100%;font-size:14px">${dong.map(([k, v]) => `<tr><td style="padding:4px 8px;background:#eef7f3;width:110px"><b>${k}</b></td><td style="padding:4px 8px;border-bottom:1px solid #cfe9e1">${esc(v)}</td></tr>`).join("")}</table>
<h3 style="color:#0b5747;margin:16px 0 6px">Câu sai (${ct.sai.length})</h3>
<ol style="padding-left:20px;font-size:14px;line-height:1.5">${saiHtml}</ol>
<p><a href="${link}" style="background:#0f6e5a;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Mở cây nhóm</a></p>
<p style="color:#6b7c77;font-size:12px">Thư tự động từ web DetPro — chỉ gửi về mail người hướng dẫn.</p></div>`;
  const text = `${dong.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nCâu sai (${ct.sai.length}):\n${ct.sai.map((s) => (phan === "quiz" ? `- Câu ${s.so}: ${s.cau} | chọn: ${s.chon.join(" · ")} | đúng: ${s.dung}` : `- Câu ${s.so}: ${s.menhDe} | đáp số ${s.dapSo}, chọn ${s.chon}`)).join("\n") || "- không"}\n\n${link}`;
  return { subject, html, text };
}

export async function guiThu({ subject, html, text }) {
  if (!coMail()) {
    if (!daBaoThieu && process.env.BAO_MAIL_TAT !== "1") {
      daBaoThieu = true;
      await ghiLoi("mail-thieu-khoa", "Chưa có GMAIL_USER / GMAIL_APP_PASSWORD trên máy chủ — thư báo xong bài chưa gửi");
    }
    return false;
  }
  try {
    tp ||= process.env.BAO_MAIL_THU_HOST // chỉ để chạy thử ở máy (hộp thư giả), web thật không đặt biến này
      ? nodemailer.createTransport({ host: process.env.BAO_MAIL_THU_HOST, port: +process.env.BAO_MAIL_THU_PORT || 2525, secure: false, ignoreTLS: true })
      : nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, "") } });
    await tp.sendMail({ from: `"DetPro báo bài" <${process.env.GMAIL_USER}>`, to: process.env.BAO_MAIL_TO || process.env.GMAIL_USER, subject, html, text });
    return true;
  } catch (e) {
    tp = null;
    await ghiLoi("mail-loi", `${e?.code || ""} ${e?.responseCode || ""} ${String(e?.message || "").slice(0, 160)}`);
    return false;
  }
}

/** Gọi sau khi lưu: dựng + gửi thư cho một phần vừa "Đã xong". Không ném lỗi. */
export async function baoXongPhan({ g, m, bai, phan, phanTen, tenBai, prog, batDau }) {
  try {
    const u = g.chuoi.bai.find((x) => `${x.audience}/${x.slug}` === bai);
    const unit = u ? await getUnit(u.audience, u.slug) : null;
    const ct = phan === "quiz" ? chiTietQuiz(unit, prog) : chiTietTf(unit, prog);
    const thu = dungThu({ nhom: g.ten || g._id, nguoi: m.ten || m.id, tenBai, tieuDeBai: unit?.meta?.title || u?.title, phan, phanTen, ct, batDau, xongLuc: new Date(), maNhom: g._id });
    return await guiThu(thu);
  } catch (e) {
    await ghiLoi("mail-loi", `dung thu: ${String(e?.message || "").slice(0, 160)}`);
    return false;
  }
}
