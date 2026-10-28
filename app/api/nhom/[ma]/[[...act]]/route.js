// #230 Học cùng — API một nhóm (thiết kế mục 10). Học viên gửi id + pin trong thân/tiêu đề; người hướng dẫn gửi k.
//  GET  /api/nhom/<mã>                    cây/bảng (tóm tắt tiến độ mọi người) + sinh tin "Đét nhắc" khi tới mốc
//  POST /api/nhom/<mã>/vao                chọn ID (+PIN) · tạo ID mới · đặt PIN · rời nhóm
//  GET  /api/nhom/<mã>/tien-do?bai=       tiến độ đầy đủ của tôi (tiêu đề x-nhom-id, x-nhom-pin)
//  POST /api/nhom/<mã>/tien-do            ghi tiến độ một bài / vị trí đang làm → mở chặng khi cả nhóm xanh
//  POST /api/nhom/<mã>/noi                "Tôi đã gửi bài nói"
//  GET  /api/nhom/<mã>/tin?sau=           Hỏi đáp: tin mới   ·  POST …/tin (JSON chữ | form-data giọng)  ·  POST …/tin/sua
//  GET  /api/nhom/<mã>/tep/<id>           nghe một đoạn âm thanh
//  POST /api/nhom/<mã>/hdr                #232 (k) thêm hướng dẫn riêng: link / audio (form-data) / chữ  ·  POST …/hdr/xoa
//  POST /api/nhom/<mã>/nhan               #231 lời nhắn / chọc nhau trên cây (icon + câu mẫu)  ·  POST …/nhan/xoa
//  GET  /api/nhom/<mã>/huong-dan          (tiêu đề x-nhom-k) mọi thứ cho người hướng dẫn
//  POST /api/nhom/<mã>/quan-ly            { k, viec, … } cài đặt, duyệt bài nói tự do (+ nhận xét), Tạm nghỉ, PIN, xoá ID
import {
  HttpErr, xemNhom, vao, docTienDo, ghiTienDo, baoGuiNoi, docTin, guiTin, suaTin, docTep, guiNhan, xoaNhan, themHdr, xoaHdr, xemHuongDan, quanLy,
} from "@/lib/nhom.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const fail = (e) => {
  if (!e.status) console.error("nhom api:", e);
  return Response.json({ error: e.status ? e.message : "Lỗi máy chủ", ...(e.extra || {}) }, { status: e.status || 500, headers: { "Cache-Control": "no-store" } });
};
const ok = (x) => Response.json(x, { headers: { "Cache-Control": "no-store" } });
const who = (req) => ({ id: req.headers.get("x-nhom-id") || "", pin: req.headers.get("x-nhom-pin") || "", k: req.headers.get("x-nhom-k") || "" });

async function readForm(req) {
  const f = await req.formData();
  const file = f.get("audio");
  const b = {};
  for (const [k, v] of f.entries()) if (typeof v === "string") b[k] = v;
  if (b.gan) b.gan = JSON.parse(b.gan || "null");
  const audio = file && typeof file === "object" ? { buf: Buffer.from(await file.arrayBuffer()), mime: file.type } : null;
  return { b, audio };
}

export async function GET(req, { params }) {
  try {
    const { ma, act = [] } = await params;
    const u = new URL(req.url);
    const w = who(req);
    switch (act[0] || "") {
      case "":
        return ok(await xemNhom(ma));
      case "tien-do":
        return ok(await docTienDo(ma, w.id, w.pin, u.searchParams.get("bai")));
      case "tin":
        return ok(await docTin(ma, u.searchParams.get("sau")));
      case "huong-dan":
        return ok(await xemHuongDan(ma, w.k || u.searchParams.get("k"), w.id, w.pin)); // #253: người lập nhóm = id + PIN
      case "tep": {
        const t = await docTep(ma, act[1]);
        return new Response(t.data, { headers: { "Content-Type": t.mime, "Cache-Control": "private, max-age=86400" } });
      }
      default:
        throw new HttpErr(404, "Không có");
    }
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req, { params }) {
  try {
    const { ma, act = [] } = await params;
    const form = (req.headers.get("content-type") || "").startsWith("multipart/");
    const { b, audio } = form ? await readForm(req) : { b: await req.json().catch(() => ({})), audio: null };
    const w = who(req);
    const body = { ...b, id: (b.id || w.id || "").toLowerCase(), pin: b.pin || w.pin, k: b.k || w.k };
    switch (act.join("/")) {
      case "vao":
        return ok(await vao(ma, body));
      case "tien-do":
        return ok(await ghiTienDo(ma, body));
      case "noi":
        return ok(await baoGuiNoi(ma, body));
      case "tin":
        return ok(await guiTin(ma, body, audio));
      case "tin/sua":
        return ok(await suaTin(ma, body));
      case "nhan":
        return ok(await guiNhan(ma, body));
      case "nhan/xoa":
        return ok(await xoaNhan(ma, body));
      case "hdr":
        return ok(await themHdr(ma, body, audio));
      case "hdr/xoa":
        return ok(await xoaHdr(ma, body));
      case "quan-ly":
        // #253: người lập nhóm (tiêu đề x-nhom-id/pin) — b.id trong quản lý là ID học viên bị tác động, nên tách riêng
        return ok(await quanLy(ma, { ...body, id: b.id, pin: b.pin, tuId: w.id, tuPin: w.pin }));
      default:
        throw new HttpErr(404, "Không có");
    }
  } catch (e) {
    return fail(e);
  }
}
