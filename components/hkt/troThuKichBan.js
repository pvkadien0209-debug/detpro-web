// #269 Đét trợ thủ — KỊCH BẢN hướng dẫn "Tôi cần làm gì?".
// Mỗi nút: { id, det: lời Đét (chuỗi hoặc hàm ctx → chuỗi), chon: [{ t: chữ nút, toi: nút tiếp, lam: (ctx) => việc }] }.
// goiY(ctx) = câu mở đầu theo đúng chỗ bạn đang đứng (bài nào, phần nào, đã làm tới đâu). Sửa lời ở đây là đổi lời Đét.

const PHAN = { "": "Bài viết", info: "Bảng thông tin", quiz: "Trắc nghiệm", "listen-speak": "Nghe nói", "true-or-false": "True or false" };
const di = (k) => (c) => c?.go?.(k); // đi tới một phần của bài đang mở

/** Câu mở đầu + 1 nút làm ngay, theo ngữ cảnh. */
export function goiY(c) {
  if (!c) return { text: "Chào bạn! Mình là Đét. Chọn một chủ đề rồi bấm “Học tiếp” — mỗi bài có 5 phần: đọc, xem bảng, trắc nghiệm, nghe nói, true or false." };
  // #318 trang bên ngoài (chưa vào bài, chưa vào nhóm): lời theo từng trang + nút "Học tiếp" nếu có bài đang dở
  if (c.loai === "ngoai") {
    const hoc = c.last ? { t: "Học tiếp bài đang dở", lam: (x) => x.nav?.(x.lastHref) } : null;
    const T = {
      chu: "Chào bạn! Mình là Đét. Chọn một chủ đề bạn thích bên dưới, mở bài 1 rồi làm lần lượt 5 phần — mỗi ngày một bài khoảng 20–30 phút là đủ.",
      "doi-tuong": "Đây là các chủ đề dành riêng cho nhóm người học này. Chọn một chủ đề → bấm bài đầu tiên để bắt đầu.",
      "chu-de": "Chọn một bài để học. Bài có dấu ✓ là bạn đã làm; nên đi theo thứ tự từ bài 1.",
      video: "Video tóm tắt bài học. Xem xong, mở bài để làm 40 câu — có làm mới nhớ lâu.",
      toi: "Trang của bạn: chủ đề đang học, kết quả từng bài, nhóm học. Đổi máy? Mở “Chuyển tiến độ sang máy khác”.",
      hd: "Đây là trang hướng dẫn. Cần làm ngay thì bấm nút bên dưới, mình chỉ từng bước.",
      khac: "Chào bạn! Mình là Đét. Hỏi mình bất cứ lúc nào: “Tôi cần làm gì?”",
    };
    const text = T[c.trang] || T.khac;
    return { text: hoc && c.trang !== "toi" ? `${text} Bạn còn một bài đang học dở.` : text, nut: hoc };
  }
  if (c.loai === "bai") {
    const p = c.parts || [];
    const cho = p.find((x) => x.dat && !x.done && c.nhom);
    if (cho) return { text: `Bạn đã đạt ${PHAN[cho.key]} rồi! Bấm “Đã xong phần này” ở cuối trang để lưu cho nhóm nhé.`, nut: cho.key !== c.part ? { t: `Mở ${PHAN[cho.key]}`, lam: di(cho.key) } : null };
    const k = p.find((x) => !x.done && x.key !== "" && x.key !== "info") || p.find((x) => !x.done);
    if (c.part === "") return { text: "Bây giờ: đọc hết Bài viết. Chú ý chữ tô đậm — đó là ý sẽ được hỏi trong 40 câu.", nut: c.boBang ? { t: "Đọc xong → làm Trắc nghiệm", lam: di("quiz") } : { t: "Đọc xong → bước tiếp", lam: (x) => x.docXong?.() } }; // #319
    if (c.part === "info") return { text: "Lướt Bảng 40 câu để biết bài hỏi gì — bảng không đánh dấu đáp án đúng, tự tìm trong bài viết.", nut: k ? { t: `Xem xong → ${PHAN[k.key]}`, lam: di(k.key) } : null };
    if (!k) return c.next ? { text: "Bài này bạn xong cả 5 phần rồi. Giỏi lắm! Sang bài tiếp nhé.", nut: { t: `Sang ${c.next.label}`, lam: c.next.go } } : { text: "Bạn xong cả 5 phần của bài này rồi. Ôn lại câu sai hoặc chọn chủ đề mới nhé." };
    if (k.key === c.part) {
      if (k.key === "") return { text: "Bây giờ: đọc hết Bài viết. Chú ý chữ tô đậm — đó là ý sẽ được hỏi trong 40 câu." };
      if (k.key === "info") return { text: "Bây giờ: lướt Bảng 40 câu để biết bài sẽ hỏi gì. Bảng không đánh dấu đáp án đúng — tự tìm trong bài viết." };
      return { text: `Bây giờ: làm ${PHAN[k.key]}${k.of ? ` (đang ${k.count}/${k.of}${c.nhom && k.can ? `, nhóm cần ${k.can}` : ""})` : ""}. Bí thì bấm “Giải thích” hoặc mở lại bảng.` };
    }
    return { text: `Bạn nên làm ${PHAN[k.key]} trước — đi đúng thứ tự sẽ nhớ lâu hơn.`, nut: { t: `Đi tới ${PHAN[k.key]}`, lam: di(k.key) } };
  }
  if (c.loai === "nhom") {
    if (c.xongCa) return { text: "Cả nhóm đã về đích! 🎉 Xem lại cây, hoặc mở một nhóm học mới cho chuỗi khác." };
    if (c.laChu && c.choDuyet) return { text: `Có ${c.choDuyet} bài nói đang chờ bạn nghe và sửa — đây là việc chính của người hướng dẫn.`, nut: { t: "Mở Duyệt bài nói", lam: (x) => x.mo?.("noi") } }; // #347
    if (c.tamNghi) return { text: "Bạn đang “tạm nghỉ” — nhóm vẫn đi tiếp. Muốn học lại, nhắn trưởng nhóm." };
    const vang = (c.a || []).findIndex(Boolean);
    if (vang >= 0) return { text: `Bạn đã đạt ${PHAN[KEYS[vang]]} của ${c.bai} nhưng chưa bấm “Đã xong phần này” (lá vàng). Mở ra bấm lưu nhé.`, nut: { t: `Mở ${PHAN[KEYS[vang]]}`, lam: (x) => x.openPart?.(KEYS[vang]) } };
    if (c.chuaBatDau) return { text: `Bắt đầu ${c.bai}: đọc Bài viết trước, rồi làm 3 bài tập.`, nut: { t: "Đọc Bài viết", lam: (x) => x.openPart?.("") } };
    const j = [2, 3, 4].find((i) => !c.g?.[i]);
    if (j !== undefined) return { text: `Việc tiếp theo: ${PHAN[KEYS[j]]} của ${c.bai}${c.c?.[KEYS[j]] ? ` (đang ${c.c[KEYS[j]]}/${KEYS[j] === "true-or-false" ? 80 : 40})` : ""} — chuẩn bị cho bài nói cuối bài 🎯.`, nut: { t: `Làm ${PHAN[KEYS[j]]}`, lam: (x) => x.openPart?.(KEYS[j]) } };
    if (!c.noi?.baoGui) return { text: `Bạn xong 3 bài tập của ${c.bai} — giờ tới phần quan trọng nhất 🎯: bài nói thật. Bấm hoa cuối cành lấy gợi ý, nói 1–2 phút bằng tiếng Anh, gửi qua kênh Zalo của nhóm rồi bấm “Đã gửi bài nói” — người hướng dẫn sẽ nghe và sửa cho bạn.`, nut: { t: "Mở bài nói tự do", lam: (x) => x.openFlower?.() } };
    if (c.lamTruoc) return { text: `Bạn xong ${c.bai} rồi — đang chờ ${c.slow || "vài"} bạn. Bạn được làm trước ${c.lamTruoc}, hoặc vào Hỏi đáp động viên mọi người.`, nut: { t: `Làm trước ${c.lamTruoc}`, lam: (x) => x.hocTiep?.() } };
    return { text: "Bạn đã làm hết phần của mình. Chờ cả nhóm xong để mở bài tiếp — bấm tên một bạn để gửi lời động viên." };
  }
  if (c.loai === "tao") return { text: "Mở nhóm học chỉ cần: chọn chuỗi bài, gõ tên bạn và đặt PIN 4 số. Các cài đặt khác để mặc định là được." };
  if (c.loai === "cua" && c.moi) {
    // #319 cầm tay chỉ việc theo bước đang làm
    const B = {
      1: "Bước 1/4: gõ tên của bạn vào ô “Tên hiển thị” — tên cả nhóm sẽ thấy, ví dụ “Oanh”. Dòng “Tên đăng nhập” máy tự tạo, không cần sửa.",
      2: "Bước 2/4: gõ 4 số bất kỳ làm PIN (như mật khẩu ngắn). Bấm hình con mắt để xem lại. Nhớ chụp màn hình hoặc ghi ra giấy — sang máy khác cần PIN này.",
      3: "Bước 3/4: tick vào ô vuông “Tôi đồng ý…”.",
      4: "Bước 4/4: bấm nút xanh “Vào nhóm” là xong! Vào rồi mình chỉ tiếp việc đầu tiên cần làm.",
    };
    return { text: B[c.buoc] || B[1] };
  }
  if (c.loai === "cua") return { text: "Lần đầu vào nhóm? Bấm “Lần đầu vào nhóm này?” hoặc “Tôi là người mới” — mình chỉ từng bước. Đã vào trước đây: bấm tên của bạn rồi gõ PIN." };
  return { text: "Chào bạn! Mình là Đét. Hỏi mình bất cứ lúc nào: “Tôi cần làm gì?”" };
}
const KEYS = ["", "info", "quiz", "listen-speak", "true-or-false"];
/** #318 Khu vực Đét đang đứng → menu phù hợp. */
export function vung(c) {
  if (!c || c.loai === "ngoai") return "ngoai";
  if (c.loai === "bai") return c.nhom ? "bai-nhom" : "bai";
  return c.loai; // nhom | cua | tao
}

export const KICH_BAN = {
  goc: {
    det: (c) => goiY(c).text,
    chon: (c) => {
      const g = goiY(c);
      const nut = g.nut ? [{ t: g.nut.t, lam: g.nut.lam, chinh: true }] : [];
      const v = vung(c);
      if (v === "ngoai")
        return [
          ...nut,
          { t: "Mới bắt đầu thì học từ đâu?", toi: "ng-bat-dau" },
          { t: "Một bài học gồm những gì?", toi: "buoc" },
          { t: "Học cùng bạn bè (nhóm học)", toi: "ng-nhom" },
          { t: "Đổi máy / tiến độ lưu ở đâu?", toi: "ng-tien-do" },
          { t: "Gặp trục trặc", toi: "loi" },
        ];
      if (v === "cua") return [{ t: "Tôi là người mới", toi: "cua-moi", chinh: true }, { t: "Quên PIN / đổi máy", toi: "pin" }, { t: "Nhóm học là gì?", toi: "ng-nhom" }];
      if (v === "tao") return [{ t: "Mở nhóm cần chuẩn bị gì?", toi: "tao-can", chinh: true }, { t: "Cài đặt nên để thế nào?", toi: "tao-cd" }, { t: "Nhóm học là gì?", toi: "ng-nhom" }];
      if (v === "bai")
        return [...nut, { t: "Hỏi từng bước: mình đang ở đâu?", toi: "hoi-doc" }, { t: "Cách học một bài (5 phần)", toi: "buoc" }, { t: "Muốn học cùng bạn bè?", toi: "ng-nhom" }, { t: "Đổi máy có mất bài không?", toi: "ng-tien-do" }, { t: "Gặp trục trặc", toi: "loi" }];
      if (v === "bai-nhom")
        return [
          ...nut,
          { t: "Hỏi từng bước: mình đang ở đâu?", toi: "hoi-doc" },
          { t: "Nút “Đã xong phần này” ở đâu?", toi: "nut-xong" },
          { t: "Hỏi bạn / người hướng dẫn về câu này", toi: "hoi-dap" },
          ...(c?.veCay ? [{ t: "Về cây nhóm", lam: (x) => x.veCay?.() }] : []),
          { t: "Mất mạng có sao không?", toi: "mat-mang" },
          { t: "Gặp trục trặc", toi: "loi" },
        ];
      // cây nhóm
      return [
        ...nut,
        { t: "Hỏi từng bước: mình đang ở đâu?", toi: "hoi-doc" },
        { t: "Về nhóm học (lá, khoá bài, đồng hồ…)", toi: "nhom" },
        { t: "Ai làm việc gì trong nhóm?", toi: "ai-viec" },
        { t: "Chuỗi ngày 🔥 và huy hiệu 🏅", toi: "chuoi-hh" },
        ...(c?.laChu ? [{ t: "Việc của trưởng nhóm", toi: "chu" }] : []),
        { t: "Gặp trục trặc", toi: "loi" },
      ];
    },
  },

  // ---- #318 Trang bên ngoài ----
  "ng-bat-dau": {
    det: "Mới bắt đầu: chọn một chủ đề bạn quan tâm → mở Bài 1 → làm lần lượt 5 phần (đọc, xem bảng, trắc nghiệm, nghe nói, true or false). Mỗi ngày một bài khoảng 20–30 phút là đủ — đều đặn quan trọng hơn làm nhiều.",
    chon: (c) => [...(c?.last ? [{ t: "Học tiếp bài đang dở", lam: (x) => x.nav?.(x.lastHref), chinh: true }] : []), { t: "Về trang chủ chọn chủ đề", lam: (x) => x.nav?.("/") }, { t: "Một bài học gồm những gì?", toi: "buoc" }],
  },
  "ng-nhom": {
    det: "Nhóm học: vài người học cùng một chuỗi bài, mỗi người một cây. Cả nhóm xong bài thì mở bài tiếp. Có Hỏi đáp, thấy ai đang làm gì, chuỗi ngày 🔥, huy hiệu 🏅, trưởng nhóm nghe bài nói. Mở nhóm mất khoảng 1 phút.",
    chon: [{ t: "Mở nhóm học mới", lam: (x) => x.nav?.("/nhom/tao"), chinh: true }, { t: "Tôi đã có link nhóm", toi: "cua-moi" }, { t: "Xem nhóm học của tôi", lam: (x) => x.nav?.("/me") }],
  },
  "ng-tien-do": {
    det: "Học riêng: tiến độ lưu trên trình duyệt của máy này. Đổi máy: vào trang Của tôi → “Chuyển tiến độ sang máy khác” → chép mã, dán ở máy mới (câu ở hai máy được cộng dồn). Học nhóm: tiến độ lưu trên máy chủ — máy nào cũng thấy.",
    chon: [{ t: "Mở trang Của tôi", lam: (x) => x.nav?.("/me"), chinh: true }],
  },
  "cua-moi": { det: "Mở link nhóm trưởng nhóm gửi → bấm “Tôi là người mới” → gõ tên → đặt PIN 4 số (nhớ PIN). Lần sau trên máy này tự vào; máy khác thì bấm tên mình + gõ PIN.", chon: [{ t: "Quên PIN thì sao?", toi: "pin" }] },
  "tao-can": { det: "Chỉ cần: chọn chuỗi bài, gõ tên bạn, đặt PIN 4 số. Xong bấm “Chép link” gửi vào nhóm Zalo — mọi người bấm link là vào.", chon: [{ t: "Cài đặt nên để thế nào?", toi: "tao-cd" }] },
  "tao-cd": { det: "Để mặc định là ổn: Trắc nghiệm đúng 40/40, Nghe nói 30/40, True or false làm hết lượt; mỗi bài hạn 48 giờ, Đét tự nhắc người chậm. Sửa được bất cứ lúc nào trong tab “Cài đặt nhóm”.", chon: [{ t: "Quay lại", toi: "tao-can" }] },
  "ai-viec": { det: "🙋 Bạn: làm 3 bài tập để chuẩn bị (chấm ngay), rồi nói 1–2 phút bằng tiếng Anh và gửi.\n🎧 Người hướng dẫn: nghe và sửa riêng từng bài nói của bạn (phát âm – cách dùng từ – ý); trả lời thắc mắc, hỗ trợ khi cần, gửi hướng dẫn riêng; chuẩn bị bài, cùng làm với nhóm để tạo động lực, nhắc nhở.\n🤖 Đét & DetPro: soạn bài, chấm bài tập, gợi ý bài nói, nhắc lịch.\nBài tập giúp bạn sẵn sàng — phần được kèm riêng là bài nói của bạn.", chon: [{ t: "Mở hoa bài nói", lam: (c) => c?.openFlower?.(), chinh: true }, { t: "Xem lại giới thiệu nhóm", lam: (c) => c?.xemChao?.() }, { t: "Quay lại", toi: "goc" }] }, // #347 #354
  "chuoi-hh": { det: "🔥 Chuỗi ngày: hôm nào làm thêm vài câu là +1 ngày (tính theo giờ Việt Nam, tới 24h). 🔥 mờ = hôm nay chưa học. 🏅 Huy hiệu: về đích đầu tiên một bài, chuỗi 3/7/14/30 ngày, về đích cả chuỗi. Mỗi tối sau 20h Đét tổng kết trong Hỏi đáp.", chon: [{ t: "Quay lại", toi: "goc" }] },
  "mat-mang": { det: "Không sao! Mất mạng vẫn làm bài bình thường — câu được giữ trong máy, có mạng là tự lưu (kể cả đóng trang rồi mở lại). Thấy dòng “Đang mất mạng” là đang chờ lưu.", chon: [{ t: "Quay lại", toi: "goc" }] },

  // ---- Hỏi từng bước ----
  "hoi-doc": { det: "Bạn đã đọc Bài viết của bài này chưa?", chon: [{ t: "Chưa", toi: "doc" }, { t: "Rồi", toi: "hoi-bang" }] },
  doc: {
    det: "Đọc trước đã nhé! Mẹo: có video tóm tắt ngay dưới tên bài nếu bạn thích xem; đọc chậm ở chữ tô đậm — 40 câu hỏi đều nằm ở đó. Khoảng 6 phút.",
    chon: [{ t: "Mở Bài viết", lam: (c) => (c?.loai === "nhom" ? c.openPart?.("") : c?.go?.("")), chinh: true }, { t: "Đọc xong rồi → bước tiếp", toi: "hoi-bang" }],
  },
  "hoi-bang": { det: "Bạn đã lướt Bảng 40 câu chưa? (Biết trước bài hỏi gì sẽ đọc kỹ đúng chỗ.)", chon: [{ t: "Chưa", toi: "bang" }, { t: "Rồi", toi: "hoi-tn" }] },
  bang: {
    det: "Bảng có 40 câu, mỗi câu 3 đáp án, KHÔNG đánh dấu đáp án đúng. Lướt qua, thấy câu nào chưa chắc thì quay lại bài viết tìm. Muốn nghe: bấm “Nghe cả 40 câu”.",
    chon: [{ t: "Mở Bảng thông tin", lam: (c) => (c?.loai === "nhom" ? c.openPart?.("info") : c?.go?.("info")), chinh: true }, { t: "Xem rồi → bước tiếp", toi: "hoi-tn" }],
  },
  "hoi-tn": { det: "Trắc nghiệm 40 câu bạn làm xong chưa?", chon: [{ t: "Chưa", toi: "tn" }, { t: "Xong rồi", toi: "hoi-nn" }] },
  tn: {
    det: "Trắc nghiệm: mỗi câu chọn 1 lần trong 3 đáp án. Đúng thì tự sang câu (3 giây). Sai thì thấy ngay đáp án đúng — bấm “Giải thích” xem vì sao, rồi tự bấm “Câu tiếp”. Xong 40 câu có báo cáo — bấm “Luyện lại câu sai” để làm lại những câu sai.",
    chon: [{ t: "Làm Trắc nghiệm", lam: (c) => (c?.loai === "nhom" ? c.openPart?.("quiz") : c?.go?.("quiz")), chinh: true }, { t: "Sai nhiều quá thì sao?", toi: "tn-sai" }, { t: "Xong rồi → bước tiếp", toi: "hoi-nn" }],
  },
  "tn-sai": { det: "Không sao — sai là đang học! Câu sai được khoá lại để bạn xem đáp án đúng và “Giải thích”. Làm hết 40 câu rồi bấm “Luyện lại câu sai” ở báo cáo — làm lại tới khi đúng hết (nhóm cần đủ 40/40).", chon: [{ t: "Quay lại", toi: "tn" }] },
  "hoi-nn": { det: "Phần Nghe nói (nói lại đáp án đúng bằng tiếng Anh) xong chưa?", chon: [{ t: "Chưa", toi: "nn" }, { t: "Xong rồi", toi: "hoi-tf" }] },
  nn: {
    det: "Nghe nói: nghe câu hỏi + 3 đáp án → bấm Nói → nói lại đáp án đúng (khớp từ 50% là được). Trên điện thoại chọn “Cả hai” để đọc trên màn hình rồi chỉ việc nói.",
    chon: [{ t: "Làm Nghe nói", lam: (c) => (c?.loai === "nhom" ? c.openPart?.("listen-speak") : c?.go?.("listen-speak")), chinh: true }, { t: "Máy không nghe / không hiểu tôi", toi: "loi-mic" }, { t: "Xong rồi → bước tiếp", toi: "hoi-tf" }],
  },
  "hoi-tf": { det: "True or false (80 câu đúng/sai) xong chưa?", chon: [{ t: "Chưa", toi: "tf" }, { t: "Xong rồi", toi: "sau-tf" }] },
  tf: {
    det: "True or false: nghe câu hỏi + một câu trả lời → bấm True nếu đúng, False nếu sai. Đúng +1, sai −1, không chọn lại — trả lời nhanh để luyện phản xạ.",
    chon: [{ t: "Làm True or false", lam: (c) => (c?.loai === "nhom" ? c.openPart?.("true-or-false") : c?.go?.("true-or-false")), chinh: true }, { t: "Xong rồi → bước tiếp", toi: "sau-tf" }],
  },
  "sau-tf": { det: (c) => (c?.loai === "nhom" || c?.nhom ? "Bạn đã bấm “Đã xong phần này” ở cả 3 bài tập chưa? (Lá xanh mới tính cho nhóm; lá vàng = đạt nhưng chưa bấm.)" : "Tuyệt — bạn xong 5 phần! Sang bài tiếp, hoặc ôn câu sai trong báo cáo."), chon: (c) => (c?.loai === "nhom" || c?.nhom ? [{ t: "Bấm hết rồi", toi: "hoi-noi" }, { t: "Chưa / không thấy nút", toi: "nut-xong" }] : [{ t: "Về đầu", toi: "goc" }]) },
  "nut-xong": { det: "Nút “Đã xong phần này” hiện ở cuối mỗi phần bài tập và tự dính ở đáy màn khi bạn đạt điều kiện (ví dụ Trắc nghiệm đúng 40/40). Chưa thấy = chưa đạt — xem dòng “Điều kiện xong” ngay trên nút.", chon: [{ t: "Hiểu rồi", toi: "hoi-noi" }] },
  "hoi-noi": { det: "Còn bài nói tự do (bông cuối cành). Bạn gửi chưa?", chon: [{ t: "Chưa", toi: "noi" }, { t: "Gửi rồi", toi: "xong-nhom" }] },
  noi: {
    det: "Bài nói tự do: hoa cuối cành mở khi bạn xong cả 5 lá. Bấm hoa → có “Gợi ý bài nói” (dàn ý 1–2 phút, câu tiếng Anh lấy từ chính bài — tải về bằng ảnh được). Nói theo gợi ý, ghi âm bằng Zalo, gửi trưởng nhóm, rồi quay lại bấm “Đã gửi bài nói”.",
    chon: [{ t: "Mở hoa bài nói", lam: (c) => c?.openFlower?.(), chinh: true }, { t: "Nói gì bây giờ?", toi: "noi-goi-y" }],
  },
  "noi-goi-y": { det: "Bấm hoa bài nói (khi đã xong 5 lá) → khung “💡 Gợi ý bài nói”: mở đầu, 3–4 ý chính bằng tiếng Anh từ chính bài, phần của bạn, kết. Bấm “Tải ảnh gợi ý” để nhìn khi ghi âm. Không cần hoàn hảo — nói 1–2 phút là đủ!", chon: [{ t: "Quay lại", toi: "noi" }] },
  "xong-nhom": { det: "Bạn xong phần của mình rồi! Khi chính bạn xong bài hiện tại, bạn được làm trước 1 bài. Bài xa hơn mở khi cả nhóm xong — vào Hỏi đáp động viên bạn bè nhé.", chon: [{ t: "Về đầu", toi: "goc" }] },

  buoc: {
    det: "Một bài = 5 phần, đi theo thứ tự:\n1. Bài viết (đọc, chú ý chữ tô đậm)\n2. Bảng thông tin (40 câu, tự tìm đáp án)\n3. Trắc nghiệm (chọn đúng)\n4. Nghe nói (nói lại đáp án)\n5. True or false (phản xạ đúng/sai)\nTrong nhóm: thêm bài nói tự do gửi qua Zalo.",
    chon: [{ t: "Bắt đầu hỏi từng bước", toi: "hoi-doc" }],
  },

  // ---- Nhóm học ----
  nhom: {
    det: "Bạn muốn biết gì về nhóm học?",
    chon: [
      { t: "Lá vàng / lá xám là gì?", toi: "la" },
      { t: "Vì sao bài sau bị khoá?", toi: "khoa" },
      { t: "Đồng hồ đếm ngược là gì?", toi: "dong-ho" },
      { t: "Quên PIN / đổi máy", toi: "pin" },
      { t: "Hỏi bạn bè, hỏi trưởng nhóm", toi: "hoi-dap" },
      { t: "Bạn bè đang làm tới đâu?", toi: "ai-lam" },
    ],
  },
  la: { det: "Mỗi bài 5 lá: 2 lá ĐỌC (Bài viết, Bảng) xanh sẵn. 3 lá BÀI TẬP: xám = chưa xong · vàng = đạt rồi nhưng chưa bấm “Đã xong phần này” · xanh = xong. Lá xanh đậm phát sáng = cả nhóm xong.", chon: [{ t: "Quay lại", toi: "nhom" }] },
  khoa: { det: "Bạn xong cả 5 phần của bài hiện tại → được làm trước 1 bài. Các bài xa hơn mở khi CẢ NHÓM xong bài hiện tại — để mọi người đi cùng nhau. Bạn nào bỏ dở lâu, trưởng nhóm có thể cho “tạm nghỉ” để nhóm đi tiếp.", chon: [{ t: "Quay lại", toi: "nhom" }] },
  "dong-ho": { det: "Đồng hồ trên đầu trang = thời hạn của bài hiện tại cho cả nhóm (trưởng nhóm đặt, thường 48 giờ). Chuông đỏ = bạn chưa xong và sắp hết giờ.", chon: [{ t: "Quay lại", toi: "nhom" }] },
  pin: { det: "Máy này nhớ PIN của bạn. Sang máy khác: mở link nhóm → bấm tên bạn → gõ PIN. Quên PIN: nhắn trưởng nhóm đặt lại (tab Học viên). Gõ sai nhiều lần sẽ bị khoá 10 phút.", chon: [{ t: "Quay lại", toi: "nhom" }] },
  "hoi-dap": { det: "Trang bài: nút “Hỏi đáp” trên thanh nhóm — đang làm câu nào mà hỏi thì tin tự gắn nhãn câu đó, người hướng dẫn và bạn bấm nhãn là mở đúng câu. Trang cây: khung Hỏi đáp cạnh cây (điện thoại: nút 💬). Nút tròn trên thân cây = Hỏi đáp riêng của bài đó.", chon: [{ t: "Quay lại", toi: "goc" }] },
  "ai-lam": { det: "Thẻ “Nhóm đang học” cạnh cây: chấm xanh = đang trong bài, việc mới nhất của từng người (bấm 👏 Khen để động viên). Trong Hỏi đáp cũng có dòng “… đang làm …” (tắt bằng nút “Hoạt động”). Bấm tên một bạn: xem thống kê, huy hiệu, gửi lời nhắn.", chon: [{ t: "Quay lại", toi: "nhom" }] },

  // ---- Trưởng nhóm ----
  chu: {
    det: "Việc của trưởng nhóm:",
    chon: [
      { t: "Mời người vào nhóm", toi: "chu-moi" },
      { t: "Nghe + nhận xét bài nói", toi: "chu-duyet" },
      { t: "Có bạn quên PIN", toi: "chu-pin" },
      { t: "Có bạn bỏ dở, nhóm bị kẹt", toi: "chu-ket" },
      { t: "Xem ai học tới đâu", toi: "chu-nk" },
    ],
  },
  "chu-moi": { det: "Bấm “Chép link” trên trang cây → dán vào Zalo. Người nhận bấm “Tôi là người mới”, gõ tên + đặt PIN là vào. Đừng gửi link có tên của bạn (…/nhom/MÃ/tên-bạn).", chon: [{ t: "Quay lại", toi: "chu" }] },
  "chu-duyet": { det: "Tab “Duyệt bài nói”: ô vàng = học viên đã báo gửi. Nghe bên Zalo → bấm “✎ Nhận xét” (khung lớn, có mẫu Điểm tốt / Cần sửa / Luyện thêm) → bấm “Duyệt” để bông xanh.", chon: [{ t: "Mở Duyệt bài nói", lam: (c) => c?.mo?.("noi"), chinh: true }, { t: "Quay lại", toi: "chu" }] },
  "chu-pin": { det: "Tab “Học viên” → bên cạnh tên bạn đó bấm “Đặt lại PIN” → gõ PIN mới (hiện ••••) → Lưu. Nhắn riêng PIN mới cho bạn ấy.", chon: [{ t: "Mở Học viên", lam: (c) => c?.mo?.("hv"), chinh: true }, { t: "Quay lại", toi: "chu" }] },
  "chu-ket": { det: "Tab “Học viên” → bấm “Tạm nghỉ” cho bạn đang bỏ dở: nhóm không chờ bạn đó nữa. Bạn ấy quay lại thì bấm “Học lại”.", chon: [{ t: "Mở Học viên", lam: (c) => c?.mo?.("hv"), chinh: true }, { t: "Quay lại", toi: "chu" }] },
  "chu-nk": { det: "Tab “Học viên” → nút “Nhật ký” cạnh từng người: thấy từng lần vào nhóm, đang làm câu mấy, đã xong phần nào, giờ nào.", chon: [{ t: "Mở Học viên", lam: (c) => c?.mo?.("hv"), chinh: true }, { t: "Quay lại", toi: "chu" }] },

  // ---- Trục trặc ----
  loi: {
    det: "Bạn gặp trục trặc gì?",
    chon: [
      { t: "Máy không nghe tiếng tôi nói", toi: "loi-mic" },
      { t: "Không nghe được tiếng đọc", toi: "loi-loa" },
      { t: "Mất tiến độ / chấm xanh biến mất", toi: "loi-mat" },
      { t: "Không vào được nhóm", toi: "pin" },
    ],
  },
  "loi-mic": { det: "Cho phép trình duyệt dùng micro (biểu tượng ổ khoá cạnh địa chỉ web). Nói rõ, gần máy. Máy hỏi “Sorry, what did you say?” là chưa nghe rõ — không tính sai. iPhone: dùng Safari. Không nói được thì chuyển sang “Gõ”.", chon: [{ t: "Quay lại", toi: "loi" }] },
  "loi-loa": { det: "Kiểm tra âm lượng và nút gạt im lặng của điện thoại; bấm vào trang một lần (trình duyệt chỉ phát tiếng sau khi bạn bấm).", chon: [{ t: "Quay lại", toi: "loi" }] },
  "loi-mat": { det: "Học riêng: tiến độ lưu trên trình duyệt của máy này — đổi máy thì dùng “Chuyển tiến độ sang máy khác” ở trang Của tôi. Trong nhóm: tiến độ lưu trên máy chủ, mất mạng vẫn giữ trong máy rồi tự lưu — bấm “Cập nhật”. Vẫn mất thì báo trưởng nhóm.", chon: [{ t: "Quay lại", toi: "loi" }] },
};
