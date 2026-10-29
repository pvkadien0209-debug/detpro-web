// #269 Đét trợ thủ — KỊCH BẢN hướng dẫn "Tôi cần làm gì?".
// Mỗi nút: { id, det: lời Đét (chuỗi hoặc hàm ctx → chuỗi), chon: [{ t: chữ nút, toi: nút tiếp, lam: (ctx) => việc }] }.
// goiY(ctx) = câu mở đầu theo đúng chỗ bạn đang đứng (bài nào, phần nào, đã làm tới đâu). Sửa lời ở đây là đổi lời Đét.

const PHAN = { "": "Bài viết", info: "Bảng thông tin", quiz: "Trắc nghiệm", "listen-speak": "Nghe nói", "true-or-false": "True or false" };
const di = (k) => (c) => c?.go?.(k); // đi tới một phần của bài đang mở

/** Câu mở đầu + 1 nút làm ngay, theo ngữ cảnh. */
export function goiY(c) {
  if (!c) return { text: "Chào bạn! Mình là Đét. Chọn một chủ đề rồi bấm “Học tiếp” — mỗi bài có 5 phần: đọc, xem bảng, trắc nghiệm, nghe nói, true or false." };
  if (c.loai === "bai") {
    const p = c.parts || [];
    const cho = p.find((x) => x.dat && !x.done && c.nhom);
    if (cho) return { text: `Bạn đã đạt ${PHAN[cho.key]} rồi! Bấm “Đã xong phần này” ở cuối trang để lưu cho nhóm nhé.`, nut: cho.key !== c.part ? { t: `Mở ${PHAN[cho.key]}`, lam: di(cho.key) } : null };
    const k = p.find((x) => !x.done && x.key !== "" && x.key !== "info") || p.find((x) => !x.done);
    if (c.part === "") return { text: "Bây giờ: đọc hết Bài viết. Chú ý chữ tô đậm — đó là ý sẽ được hỏi trong 40 câu.", nut: { t: "Đọc xong → xem Bảng 40 câu", lam: di("info") } };
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
    if (c.laChu && c.choDuyet) return { text: `Có ${c.choDuyet} bài nói đang chờ bạn nghe và nhận xét.`, nut: { t: "Mở Duyệt bài nói", lam: (x) => x.mo?.("noi") } };
    if (c.tamNghi) return { text: "Bạn đang “tạm nghỉ” — nhóm vẫn đi tiếp. Muốn học lại, nhắn trưởng nhóm." };
    const vang = (c.a || []).findIndex(Boolean);
    if (vang >= 0) return { text: `Bạn đã đạt ${PHAN[KEYS[vang]]} của ${c.bai} nhưng chưa bấm “Đã xong phần này” (lá vàng). Mở ra bấm lưu nhé.`, nut: { t: `Mở ${PHAN[KEYS[vang]]}`, lam: (x) => x.openPart?.(KEYS[vang]) } };
    if (c.chuaBatDau) return { text: `Bắt đầu ${c.bai}: đọc Bài viết trước, rồi làm 3 bài tập.`, nut: { t: "Đọc Bài viết", lam: (x) => x.openPart?.("") } };
    const j = [2, 3, 4].find((i) => !c.g?.[i]);
    if (j !== undefined) return { text: `Việc tiếp theo: ${PHAN[KEYS[j]]} của ${c.bai}${c.c?.[KEYS[j]] ? ` (đang ${c.c[KEYS[j]]}/${KEYS[j] === "true-or-false" ? 80 : 40})` : ""}.`, nut: { t: `Làm ${PHAN[KEYS[j]]}`, lam: (x) => x.openPart?.(KEYS[j]) } };
    if (!c.noi?.baoGui) return { text: `Bạn xong 3 bài tập của ${c.bai}! Còn bài nói tự do: nói điều bạn nhớ bằng tiếng Anh, gửi qua kênh Zalo của nhóm rồi bấm “Đã gửi bài nói”.`, nut: { t: "Mở bài nói tự do", lam: (x) => x.openFlower?.() } };
    if (c.lamTruoc) return { text: `Bạn xong ${c.bai} rồi — đang chờ ${c.slow || "vài"} bạn. Bạn được làm trước ${c.lamTruoc}, hoặc vào Hỏi đáp động viên mọi người.`, nut: { t: `Làm trước ${c.lamTruoc}`, lam: (x) => x.hocTiep?.() } };
    return { text: "Bạn đã làm hết phần của mình. Chờ cả nhóm xong để mở bài tiếp — bấm tên một bạn để gửi lời động viên." };
  }
  if (c.loai === "tao") return { text: "Mở nhóm học chỉ cần: chọn chuỗi bài, gõ tên bạn và đặt PIN 4 số. Các cài đặt khác để mặc định là được." };
  if (c.loai === "cua") return { text: "Bấm vào tên của bạn rồi gõ PIN. Chưa có tên? Bấm “Tôi là người mới”, gõ tên + đặt PIN 4 số (nhớ PIN để vào lại trên máy khác)." };
  return { text: "Chào bạn! Mình là Đét. Hỏi mình bất cứ lúc nào: “Tôi cần làm gì?”" };
}
const KEYS = ["", "info", "quiz", "listen-speak", "true-or-false"];

export const KICH_BAN = {
  goc: {
    det: (c) => goiY(c).text,
    chon: (c) => [
      ...(goiY(c).nut ? [{ t: goiY(c).nut.t, lam: goiY(c).nut.lam, chinh: true }] : []),
      { t: "Hỏi từng bước: mình đang ở đâu?", toi: "hoi-doc" },
      { t: "Cách học một bài (5 phần)", toi: "buoc" },
      ...(c?.loai === "nhom" || c?.nhom ? [{ t: "Về nhóm học", toi: "nhom" }] : []),
      ...(c?.laChu ? [{ t: "Việc của trưởng nhóm", toi: "chu" }] : []),
      { t: "Gặp trục trặc", toi: "loi" },
    ],
  },

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
    det: "Trắc nghiệm: chọn 1 trong 3 đáp án, sai thì chọn lại tới khi đúng. Bấm “Giải thích” để hiểu vì sao. Xong 40 câu có báo cáo — câu sai được gom lại để luyện lại.",
    chon: [{ t: "Làm Trắc nghiệm", lam: (c) => (c?.loai === "nhom" ? c.openPart?.("quiz") : c?.go?.("quiz")), chinh: true }, { t: "Sai nhiều quá thì sao?", toi: "tn-sai" }, { t: "Xong rồi → bước tiếp", toi: "hoi-nn" }],
  },
  "tn-sai": { det: "Không sao — sai là đang học! Đọc phần “Giải thích”, mở lại Bảng (nút bảng góc phải) để tra, rồi bấm “Luyện lại câu sai” ở báo cáo cuối.", chon: [{ t: "Quay lại", toi: "tn" }] },
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
    det: "Bài nói tự do: nói 1–2 phút bằng tiếng Anh những gì bạn nhớ và nghĩ về bài (không cần hoàn hảo). Ghi âm bằng Zalo, gửi vào nhóm Zalo của trưởng nhóm, rồi quay lại bấm “Đã gửi bài nói” trên bông.",
    chon: [{ t: "Mở bông bài nói", lam: (c) => c?.openFlower?.(), chinh: true }, { t: "Nói gì bây giờ?", toi: "noi-goi-y" }],
  },
  "noi-goi-y": { det: "Gợi ý 3 câu: (1) Today I learned that… (2) The most useful idea for me is… because… (3) Next week I will try… — thế là đủ một bài nói!", chon: [{ t: "Quay lại", toi: "noi" }] },
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
  "hoi-dap": { det: "Nút 💬 góc phải = Hỏi đáp chung. Nút tròn trên thân cây = Hỏi đáp riêng của bài đó. Đang làm câu nào mà hỏi thì tin tự gắn nhãn câu đó.", chon: [{ t: "Quay lại", toi: "nhom" }] },
  "ai-lam": { det: "Xem khung “Ai đang làm gì” bên cạnh cây (có số câu đang làm). Bấm “Cập nhật” để lấy số mới nhất. Bấm tên một bạn: xem thống kê, gửi lời động viên.", chon: [{ t: "Quay lại", toi: "nhom" }] },

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
  "loi-mat": { det: "Học riêng: tiến độ lưu trên trình duyệt của máy này (đổi máy / xoá dữ liệu trình duyệt là mất). Trong nhóm: tiến độ lưu trên máy chủ — bấm “Cập nhật”. Vẫn mất thì báo trưởng nhóm.", chon: [{ t: "Quay lại", toi: "loi" }] },
};
