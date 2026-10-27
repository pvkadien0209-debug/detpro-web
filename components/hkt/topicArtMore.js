// #199 — Hình đại diện cho các chủ đề chưa có hình riêng (trước đây hiện dấu "?").
// Cùng kiểu với topicArt.js (#072): nét trắng bo tròn trên nền màu chủ đề, viewBox 0 0 160 120,
// lớp "f" = tô trắng mờ · "s" = tô trắng đặc · "t" = chữ nhãn (IELTS, B2, EPC…).
// Mỗi chủ đề = một hình nền (MOTIF) + nhãn chữ ngắn tuỳ chọn → các chủ đề cùng nhánh vẫn khác nhau.
// Chủ đề mới chưa khai báo: artFor() đoán hình theo từ khoá trong slug, không bao giờ còn dấu "?".

export const MOTIF = {
  doc: '<rect class="f" x="46" y="14" width="64" height="88" rx="6"/><rect x="46" y="14" width="64" height="88" rx="6"/><path d="M60 36h36M60 50h36M60 64h24"/>',
  contract:
    '<rect class="f" x="40" y="12" width="66" height="90" rx="6"/><rect x="40" y="12" width="66" height="90" rx="6"/><path d="M54 32h38M54 44h38M54 56h26M54 84c6-8 10 4 16-4s8 4 14 0"/><circle class="f" cx="120" cy="86" r="16"/><circle cx="120" cy="86" r="16"/><path d="M114 86l4 4 8-9"/>',
  gavel:
    '<path d="M60 30l26 26M50 40l26-26M74 18l26 26M68 48l-36 36"/><rect class="f" x="56" y="22" width="30" height="20" rx="4" transform="rotate(45 71 32)"/><path d="M96 102h48M104 102v-8h32v8"/>',
  scale:
    '<path d="M80 16v84M52 104h56M30 34h100"/><circle class="s" cx="80" cy="16" r="5"/><path d="M30 34l-16 34h32zM130 34l-16 34h32z"/><path class="f" d="M14 68a16 10 0 0 0 32 0zM114 68a16 10 0 0 0 32 0z"/><path d="M14 68a16 10 0 0 0 32 0zM114 68a16 10 0 0 0 32 0z"/>',
  shield:
    '<path class="f" d="M80 12l40 14v30c0 26-18 42-40 50-22-8-40-24-40-50V26z"/><path d="M80 12l40 14v30c0 26-18 42-40 50-22-8-40-24-40-50V26z"/><path d="M64 58l12 12 22-24"/>',
  lock:
    '<rect class="f" x="48" y="52" width="64" height="50" rx="8"/><rect x="48" y="52" width="64" height="50" rx="8"/><path d="M60 52V40a20 20 0 0 1 40 0v12"/><circle class="s" cx="80" cy="72" r="6"/><path d="M80 78v10"/>',
  warning:
    '<path class="f" d="M80 14l56 92H24z"/><path d="M80 14l56 92H24z"/><path d="M80 46v30"/><circle class="s" cx="80" cy="90" r="5"/>',
  phone:
    '<rect class="f" x="54" y="10" width="52" height="100" rx="10"/><rect x="54" y="10" width="52" height="100" rx="10"/><path d="M72 22h16"/><circle class="s" cx="80" cy="96" r="4"/><path d="M66 44h28M66 56h20M66 68h24"/>',
  laptop:
    '<rect class="f" x="30" y="24" width="100" height="62" rx="6"/><rect x="30" y="24" width="100" height="62" rx="6"/><path d="M16 98h128l-8-12H24z"/><path d="M50 46h40M50 60h56"/>',
  chat:
    '<path class="f" d="M24 26h70a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H52L36 84V70H24a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z"/><path d="M24 26h70a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H52L36 84V70H24a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z"/><path d="M110 50h26a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8h-4v12l-12-12h-10a8 8 0 0 1-8-8"/><path d="M34 42h48M34 54h30"/>',
  mail:
    '<rect class="f" x="26" y="28" width="108" height="72" rx="8"/><rect x="26" y="28" width="108" height="72" rx="8"/><path d="M26 36l54 38 54-38"/>',
  headphones:
    '<path d="M36 76V60a44 44 0 0 1 88 0v16"/><rect class="f" x="26" y="68" width="22" height="36" rx="8"/><rect x="26" y="68" width="22" height="36" rx="8"/><rect class="f" x="112" y="68" width="22" height="36" rx="8"/><rect x="112" y="68" width="22" height="36" rx="8"/>',
  book:
    '<path class="f" d="M80 30c-14-10-36-12-56-8v74c20-4 42-2 56 8 14-10 36-12 56-8V22c-20-4-42-2-56 8z"/><path d="M80 30c-14-10-36-12-56-8v74c20-4 42-2 56 8 14-10 36-12 56-8V22c-20-4-42-2-56 8zM80 30v74"/><path d="M38 44h28M38 58h28M94 44h28M94 58h28"/>',
  pen:
    '<rect class="f" x="24" y="20" width="76" height="86" rx="6"/><rect x="24" y="20" width="76" height="86" rx="6"/><path d="M38 40h44M38 54h44M38 68h28"/><path d="M134 22l12 12-46 46-16 4 4-16z"/><path class="s" d="M88 84l-4 16 16-4z"/>',
  mic:
    '<rect class="f" x="62" y="12" width="36" height="58" rx="18"/><rect x="62" y="12" width="36" height="58" rx="18"/><path d="M48 56a32 32 0 0 0 64 0M80 88v18M62 106h36"/><path d="M28 40c-6 8-6 24 0 32M132 40c6 8 6 24 0 32"/>',
  clock:
    '<circle class="f" cx="80" cy="62" r="42"/><circle cx="80" cy="62" r="42"/><path d="M80 36v26l18 12"/><circle class="s" cx="80" cy="62" r="4"/>',
  calendar:
    '<rect class="f" x="30" y="24" width="100" height="80" rx="8"/><rect x="30" y="24" width="100" height="80" rx="8"/><path d="M30 46h100M54 16v16M106 16v16"/><path d="M48 64h12M74 64h12M100 64h12M48 84h12M74 84h12"/><path class="s" d="M100 80h14v12h-14z"/>',
  money:
    '<rect class="f" x="18" y="34" width="124" height="64" rx="8"/><rect x="18" y="34" width="124" height="64" rx="8"/><circle cx="80" cy="66" r="16"/><path d="M80 56v20M74 60h9a4 4 0 0 1 0 8h-6a4 4 0 0 0 0 8h9"/><circle class="s" cx="36" cy="66" r="4"/><circle class="s" cx="124" cy="66" r="4"/>',
  coins:
    '<ellipse class="f" cx="62" cy="88" rx="34" ry="12"/><ellipse cx="62" cy="88" rx="34" ry="12"/><path d="M28 88V70M96 88V70"/><ellipse cx="62" cy="70" rx="34" ry="12"/><path d="M28 70V52M96 70V52"/><ellipse class="f" cx="62" cy="52" rx="34" ry="12"/><ellipse cx="62" cy="52" rx="34" ry="12"/><path d="M110 70l14-22 14 14 14-30"/><path d="M140 32h12v12"/>',
  card:
    '<rect class="f" x="22" y="28" width="116" height="74" rx="10"/><rect x="22" y="28" width="116" height="74" rx="10"/><path d="M22 48h116"/><rect class="s" x="36" y="62" width="22" height="16" rx="3"/><path d="M76 86h44"/>',
  bank:
    '<path class="f" d="M80 12l60 28H20z"/><path d="M80 12l60 28H20zM28 48v40M56 48v40M104 48v40M132 48v40M16 100h128M22 92h116"/><circle class="s" cx="80" cy="30" r="4"/>',
  house:
    '<path class="f" d="M28 60l52-42 52 42v46H28z"/><path d="M28 60l52-42 52 42M40 50v56h80V50"/><rect x="68" y="72" width="24" height="34" rx="3"/><path d="M104 22v16"/>',
  key:
    '<circle class="f" cx="50" cy="60" r="24"/><circle cx="50" cy="60" r="24"/><circle class="s" cx="50" cy="60" r="7"/><path d="M74 60h70M120 60v18M136 60v12"/>',
  office:
    '<rect class="f" x="46" y="12" width="68" height="96" rx="4"/><rect x="46" y="12" width="68" height="96" rx="4"/><path d="M60 28h12M88 28h12M60 46h12M88 46h12M60 64h12M88 64h12M72 108V86h16v22"/>',
  factory:
    '<path class="f" d="M16 104V60l32 18V60l32 18V40h24v64z"/><path d="M16 104V60l32 18V60l32 18V40h24v64zM104 104h40V70h-40"/><path d="M88 40V22M96 40V28"/><path d="M128 14v40M128 34l-14-8M128 34l14-8M128 34v16"/><circle class="s" cx="128" cy="34" r="4"/>',
  helmet:
    '<path class="f" d="M30 80a50 46 0 0 1 100 0z"/><path d="M30 80a50 46 0 0 1 100 0zM20 80h120v12H20zM80 34v46M60 40l8 40M100 40l-8 40"/>',
  chart:
    '<path d="M24 16v86h120"/><rect class="f" x="40" y="66" width="18" height="36" rx="3"/><rect x="40" y="66" width="18" height="36" rx="3"/><rect class="f" x="70" y="48" width="18" height="54" rx="3"/><rect x="70" y="48" width="18" height="54" rx="3"/><rect class="f" x="100" y="30" width="18" height="72" rx="3"/><rect x="100" y="30" width="18" height="72" rx="3"/><path d="M40 50l30-18 30 6 32-24"/>',
  sheet:
    '<rect class="f" x="22" y="18" width="116" height="86" rx="6"/><rect x="22" y="18" width="116" height="86" rx="6"/><path d="M22 40h116M22 62h116M22 84h116M58 18v86M98 18v86"/><path class="s" d="M100 64h36v18h-36z"/>',
  plane:
    '<path class="f" d="M18 66l44-6 34-40h14l-16 40 36-4 8-12h10l-6 22 6 22h-10l-8-12-36-4 16 40H96L62 72l-44-6z"/><path d="M18 66l44-6 34-40h14l-16 40 36-4 8-12h10l-6 22 6 22h-10l-8-12-36-4 16 40H96L62 72l-44-6z"/>',
  passport:
    '<rect class="f" x="44" y="12" width="72" height="96" rx="8"/><rect x="44" y="12" width="72" height="96" rx="8"/><circle cx="80" cy="54" r="18"/><path d="M62 54h36M80 36c-8 10-8 26 0 36M80 36c8 10 8 26 0 36M64 86h32"/>',
  globe:
    '<circle class="f" cx="80" cy="60" r="44"/><circle cx="80" cy="60" r="44"/><path d="M36 60h88M80 16c-20 22-20 66 0 88M80 16c20 22 20 66 0 88M44 36h72M44 84h72"/>',
  briefcase:
    '<rect class="f" x="26" y="40" width="108" height="64" rx="8"/><rect x="26" y="40" width="108" height="64" rx="8"/><path d="M62 40v-8a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v8M26 66h108"/><rect class="s" x="72" y="60" width="16" height="12" rx="3"/>',
  people:
    '<circle cx="44" cy="52" r="12"/><path d="M22 100c0-14 10-24 22-24s22 10 22 24"/><circle cx="116" cy="52" r="12"/><path d="M94 100c0-14 10-24 22-24s22 10 22 24"/><circle class="f" cx="80" cy="40" r="16"/><circle cx="80" cy="40" r="16"/><path d="M52 108c0-18 12-30 28-30s28 12 28 30"/>',
  heart:
    '<path class="f" d="M80 104C40 78 20 58 20 40a24 24 0 0 1 60-10 24 24 0 0 1 60 10c0 18-20 38-60 64z"/><path d="M80 104C40 78 20 58 20 40a24 24 0 0 1 60-10 24 24 0 0 1 60 10c0 18-20 38-60 64z"/><path d="M34 62h24l8-14 12 28 8-14h40"/>',
  bowl:
    '<path class="f" d="M18 56h124a62 46 0 0 1-124 0z"/><path d="M18 56h124a62 46 0 0 1-124 0zM56 102h48"/><path d="M60 44c-6-8 6-12 0-22M80 44c-6-8 6-12 0-22M100 44c-6-8 6-12 0-22"/>',
  runner:
    '<circle class="s" cx="100" cy="20" r="10"/><path d="M92 36l-24 12-12 22M92 36l-6 30 22 16 4 24M86 66l-20 22-26 4M92 44l22 10 14-10"/><path d="M18 108h124"/>',
  brain:
    '<path class="f" d="M80 22c-10-10-32-6-34 10-14 2-20 18-12 28-8 10-2 28 12 28 4 14 26 16 34 6 8 10 30 8 34-6 14 0 20-18 12-28 8-10 2-26-12-28-2-16-24-20-34-10z"/><path d="M80 22c-10-10-32-6-34 10-14 2-20 18-12 28-8 10-2 28 12 28 4 14 26 16 34 6 8 10 30 8 34-6 14 0 20-18 12-28 8-10 2-26-12-28-2-16-24-20-34-10zM80 22v72M60 46c8 0 12 6 12 12M100 46c-8 0-12 6-12 12"/>',
  robot:
    '<rect class="f" x="36" y="34" width="88" height="62" rx="12"/><rect x="36" y="34" width="88" height="62" rx="12"/><path d="M80 34V18M24 58v20M136 58v20M62 82h36"/><circle class="s" cx="80" cy="16" r="5"/><circle class="s" cx="62" cy="60" r="7"/><circle class="s" cx="98" cy="60" r="7"/>',
  magnifier:
    '<circle class="f" cx="66" cy="54" r="34"/><circle cx="66" cy="54" r="34"/><path d="M90 78l38 30"/><path d="M50 54h32M66 38v32"/>',
  land:
    '<path class="f" d="M16 92l30-58 46 14 52-18-20 70H34z"/><path d="M16 92l30-58 46 14 52-18-20 70H34zM46 34l-4 70M92 48l-8 56"/><path d="M118 20a12 12 0 0 1 24 0c0 10-12 22-12 22s-12-12-12-22z"/><circle class="s" cx="130" cy="20" r="4"/>',
  percent:
    '<rect class="f" x="28" y="14" width="88" height="94" rx="6"/><rect x="28" y="14" width="88" height="94" rx="6"/><path d="M50 84l44-50"/><circle cx="54" cy="40" r="9"/><circle cx="90" cy="78" r="9"/><path d="M128 40v52M120 84l8 10 8-10"/>',
  trademark:
    '<circle class="f" cx="80" cy="60" r="44"/><circle cx="80" cy="60" r="44"/><path d="M58 44h28M72 44v36M92 80V44l12 18 12-18v36"/>',
  copyright:
    '<rect class="f" x="24" y="22" width="78" height="60" rx="6"/><rect x="24" y="22" width="78" height="60" rx="6"/><path d="M40 42l-8 10 8 10M60 42l8 10-8 10M48 66l6-28"/><circle cx="116" cy="86" r="24"/><path d="M124 78a10 10 0 1 0 0 16"/>',
  handshake:
    '<path d="M14 44h26v40H14M146 44h-26v40h26"/><path class="f" d="M40 50l22-8 18 8 18-8 22 8v28l-20 16H60L40 78z"/><path d="M40 50l22-8 18 8 18-8 22 8v28l-20 16H60L40 78zM62 64l12 10M72 58l14 12M84 54l12 10M58 80l8 8"/>',
  idcard:
    '<rect class="f" x="18" y="26" width="124" height="76" rx="10"/><rect x="18" y="26" width="124" height="76" rx="10"/><circle cx="52" cy="58" r="12"/><path d="M34 88c0-10 8-16 18-16s18 6 18 16M84 50h40M84 64h40M84 78h26"/>',
  baby:
    '<path class="f" d="M24 50h84a42 34 0 0 1-84 0z"/><path d="M24 50h84a42 34 0 0 1-84 0zM66 50V18a34 34 0 0 1 34 32"/><circle cx="40" cy="98" r="10"/><circle cx="96" cy="98" r="10"/><path d="M108 50l24-14"/>',
  receipt:
    '<path class="f" d="M44 12h72v96l-12-8-12 8-12-8-12 8-12-8-12 8z"/><path d="M44 12h72v96l-12-8-12 8-12-8-12 8-12-8-12 8zM58 32h44M58 46h44M58 60h28"/><path d="M90 78h14"/>',
  megaphone:
    '<path class="f" d="M30 48h22l56-28v76L52 68H30z"/><path d="M30 48h22l56-28v76L52 68H30zM52 48v20M42 68l8 30h14l-6-30"/><path d="M122 44c8 6 8 22 0 28M132 34c14 12 14 36 0 48"/>',
  target:
    '<circle class="f" cx="72" cy="64" r="42"/><circle cx="72" cy="64" r="42"/><circle cx="72" cy="64" r="26"/><circle class="s" cx="72" cy="64" r="8"/><path d="M72 64l60-50M118 14h14v14"/>',
  stairs:
    '<path class="f" d="M16 104h32V80h32V56h32V32h32v72z"/><path d="M16 104h32V80h32V56h32V32h32"/><path d="M124 8l4 8 8 4-8 4-4 8-4-8-8-4 8-4z"/><circle cx="60" cy="56" r="8"/><path d="M60 64v14"/>',
  motorbike:
    '<circle cx="34" cy="86" r="18"/><circle cx="126" cy="86" r="18"/><path d="M34 86l26-30h34l14 30M60 56l-8-14h18M94 56l14-24h16"/><path class="f" d="M64 66h40l6 20H70z"/><path d="M134 22a14 14 0 1 1-28 0v8h28z"/>',
  screen:
    '<rect class="f" x="40" y="20" width="56" height="88" rx="10"/><rect x="40" y="20" width="56" height="88" rx="10"/><circle cx="68" cy="56" r="14"/><path d="M68 48v8l6 4"/><circle class="s" cx="120" cy="40" r="8"/><path d="M120 54c-12 0-18 10-18 24h36c0-14-6-24-18-24z"/>',
  ai:
    '<rect class="f" x="40" y="30" width="80" height="60" rx="10"/><rect x="40" y="30" width="80" height="60" rx="10"/><path d="M56 30V16M80 30V16M104 30V16M56 104V90M80 104V90M104 104V90M26 46h14M26 74h14M120 46h14M120 74h14"/><path d="M62 72l10-26 10 26M66 64h12M94 46v26"/>',
  standup:
    '<circle cx="40" cy="40" r="10"/><path d="M40 50v30M24 104l16-24 16 24"/><circle cx="120" cy="40" r="10"/><path d="M120 50v30M104 104l16-24 16 24"/><rect class="f" x="64" y="24" width="32" height="24" rx="6"/><rect x="64" y="24" width="32" height="24" rx="6"/><path d="M72 36h16"/><path d="M80 60v44"/>',
  bed:
    '<path class="f" d="M18 64h124v20H18z"/><path d="M18 46v58M142 64v40M18 84h124M18 64h124"/><rect x="28" y="50" width="30" height="14" rx="6"/><path d="M104 22h14l-14 16h14M126 10h10l-10 12h10"/>',
  dumbbell:
    '<path d="M44 60h72"/><rect class="f" x="24" y="38" width="20" height="44" rx="4"/><rect x="24" y="38" width="20" height="44" rx="4"/><rect class="f" x="116" y="38" width="20" height="44" rx="4"/><rect x="116" y="38" width="20" height="44" rx="4"/><path d="M14 48v24M146 48v24"/>',
  roadmap:
    '<path d="M20 100c30 0 30-30 60-30s30-30 60-30"/><circle class="s" cx="20" cy="100" r="6"/><circle class="s" cx="80" cy="70" r="6"/><path class="f" d="M128 18a12 12 0 0 1 24 0c0 10-12 22-12 22s-12-12-12-22z"/><path d="M128 18a12 12 0 0 1 24 0c0 10-12 22-12 22s-12-12-12-22z"/>',
  hotel:
    '<path d="M18 104h124"/><path class="f" d="M38 60h84v44H38z"/><path d="M38 60h84v44H38zM30 60l50-34 50 34"/><path d="M60 104V82h40v22M54 70h8M98 70h8"/><circle class="s" cx="80" cy="44" r="5"/>',
  nurse:
    '<rect class="f" x="40" y="22" width="80" height="80" rx="16"/><rect x="40" y="22" width="80" height="80" rx="16"/><path d="M80 42v40M60 62h40"/>',
};

// Nhãn chữ: [chữ, cỡ chữ] — vẽ ở góc trên bên trái của hình
const T = (txt, size = 26) => `<text class="t" x="6" y="${size + 2}" font-size="${size}">${txt}</text>`;

/** Khai báo từng chủ đề: [hình, nhãn?, cỡ nhãn?] */
const TOPICS = {
  // Công việc & sự nghiệp
  "junior-accountants-invoices": ["receipt"],
  "junior-marketers": ["megaphone"],
  "junior-payroll-specialists": ["money"],
  "new-b2b-salespeople": ["handshake", "B2B"],
  // Sinh viên
  "credit-system-freshmen": ["calendar", "TÍN CHỈ", 18],
  "students-exam-week": ["pen", "THI"],
  "students-group-assignments": ["people"],
  "graduates-still-job-hunting": ["magnifier"],
  "students-during-internship": ["briefcase"],
  // Kỹ năng
  "office-workers-advanced-excel": ["chart", "EXCEL", 22],
  "students-spreadsheet-basics": ["sheet"],
  // Kinh doanh nhỏ
  "first-time-founders-after-35": ["stairs", "35+"],
  "founders-registering-a-company": ["office"],
  "household-business-owners-upgrading": ["stairs"],
  // Cách thức … bằng tiếng Anh
  "en-dev-daily-standup": ["standup", "STAND-UP", 18],
  "en-email-office-workers": ["mail"],
  "en-homestay-airbnb-hosts": ["house"],
  "en-hotel-front-desk-staff": ["hotel"],
  "en-nurses-foreign-patients": ["nurse"],
  "en-online-meeting-staff": ["laptop"],
  "en-students-emailing-professors": ["mail", "PROF", 22],
  "en-us-student-visa-applicants": ["passport", "VISA"],
  // Kiến thức tiếng Anh
  "b2-grammar-for-exam-takers": ["book", "B2", 32],
  "beginner-listening-learners": ["headphones"],
  "beginner-self-study-planners": ["roadmap"],
  "beginner-vocabulary-learners": ["book", "ABC"],
  "grammar-a2-past-and-future": ["clock", "A2", 32],
  "grammar-adult-linking-sentences": ["chat", "A2–B1", 20],
  "grammar-zero-beginners": ["book", "A1", 32],
  "lower-secondary-grammar": ["book", "THCS", 24],
  "upper-secondary-grammar": ["book", "THPT", 24],
  // Ẩm thực & sức khoẻ
  "healthy-eating": ["bowl"],
  "new-workers-burnout": ["bed"],
  "office-workers-moving-again-at-40": ["dumbbell", "40+"],
  "students-stress-and-anxiety": ["brain"],
  "workers-cutting-salt-sugar-at-40": ["heart", "40+"],
  // Ôn thi luật sư
  "bar-academy-admission": ["book", "HVTP", 24],
  "bar-exam-oral": ["mic"],
  "bar-exam-overview": ["doc", "TẬP SỰ", 18],
  "bar-exam-written1-civil": ["pen", "DÂN SỰ", 18],
  "bar-exam-written2-ethics": ["scale"],
  "bar-inhouse-to-lawyer": ["stairs"],
  "bar-practising-certificate": ["idcard"],
  "bar-roadmap": ["roadmap"],
  "bar-trainee-registration": ["contract"],
  // Người đi làm lâu năm
  "career-changers-over-35": ["roadmap", "35+"],
  "experts-staying-relevant-with-ai": ["ai"],
  "laid-off-at-40": ["briefcase", "40+"],
  "managers-handling-underperformers": ["chart"],
  "managers-running-performance-reviews": ["target"],
  "managers-supporting-team-mental-health": ["heart"],
  "managers-using-generative-ai": ["robot"],
  "middle-managers-caught-between": ["people"],
  "new-directors-first-90-days": ["calendar", "90"],
  // Gia đình
  "children-protecting-parents-from-scams": ["warning"],
  "parents-of-screen-hooked-kids": ["screen"],
  // Định cư & sống ở nước ngoài
  "emigrants-avoiding-migration-scams": ["warning"],
  "emigrants-keeping-property-in-vietnam": ["house", "VN"],
  "emigrants-passport-and-exit": ["passport"],
  "family-sponsored-immigrants-to-us": ["people", "US"],
  "migrant-workers-in-taiwan": ["plane", "TW"],
  "new-green-card-holders-in-us": ["idcard", "US"],
  "new-migrants-in-australia": ["globe", "AU"],
  "new-permanent-residents-in-canada": ["idcard", "CA"],
  "skilled-workers-eyeing-australia": ["helmet", "AU"],
  "skilled-workers-eyeing-canada-express-entry": ["plane", "CA"],
  "skilled-workers-moving-to-germany": ["briefcase", "DE"],
  "trainees-facing-japan-new-esd-system": ["roadmap", "JP"],
  "workers-applying-korea-eps": ["doc", "KR"],
  "workers-going-abroad-on-contract": ["contract"],
  "workers-heading-to-japan-ssw": ["helmet", "JP"],
  "young-vietnamese-ausbildung-germany": ["book", "DE"],
  // Thi cử tiếng Anh
  "english-certificate-choosers": ["idcard"],
  "ielts-academic-reading-takers": ["book", "IELTS", 22],
  "ielts-first-time-takers": ["target", "IELTS", 22],
  "ielts-listening-takers": ["headphones", "IELTS", 22],
  "ielts-speaking-takers": ["mic", "IELTS", 22],
  "ielts-writing-task1-takers": ["chart", "IELTS", 22],
  "ielts-writing-task2-takers": ["pen", "IELTS", 22],
  "parents-cambridge-young-learners": ["book", "KET", 26],
  "thpt-english-candidates": ["doc", "THPT", 24],
  "thpt-english-cloze-takers": ["pen", "THPT", 24],
  "thpt-english-ordering-takers": ["sheet", "THPT", 24],
  "thpt-english-reading-takers": ["book", "THPT", 24],
  "thpt-english-self-studiers": ["roadmap", "THPT", 24],
  "toeic-candidates": ["target", "TOEIC", 22],
  "toeic-listening-takers": ["headphones", "TOEIC", 22],
  "toeic-reading-takers": ["book", "TOEIC", 22],
  "vstep-candidates": ["target", "VSTEP", 22],
  "vstep-listening-reading-takers": ["headphones", "VSTEP", 22],
  "vstep-speaking-takers": ["mic", "VSTEP", 22],
  "vstep-writing-takers": ["pen", "VSTEP", 22],
  // Hợp đồng EPC
  "epc-contractor-side": ["helmet", "EPC"],
  "epc-engineering": ["factory", "EPC"],
  "epc-finance": ["coins", "EPC"],
  "epc-legal-counsel": ["scale", "EPC"],
  "epc-lender": ["bank", "EPC"],
  "epc-om-operator": ["factory", "O&M", 22],
  "epc-owner-executive": ["office", "EPC"],
  "epc-procurement": ["receipt", "EPC"],
  "epc-project-manager": ["calendar", "EPC"],
  // Tiền bạc & hưu trí
  "families-in-debt-trouble": ["money"],
  "first-time-stock-investors-35": ["coins"],
  "investment-scam-targets": ["warning"],
  "mid-career-money-planners": ["chart", "35–45", 20],
  "workers-planning-pension": ["coins", "BHXH", 22],
  // Nghề luật
  "law-arbitration-inhouse": ["gavel"],
  "law-commercial-lease": ["office"],
  "law-consumer-contracts": ["contract"],
  "law-contract-first-review": ["magnifier"],
  "law-contract-managers": ["contract"],
  "law-contract-playbook": ["book"],
  "law-contract-remedies": ["scale"],
  "law-contract-security": ["lock"],
  "law-corp-directors": ["people"],
  "law-corp-registration": ["office"],
  "law-corp-related-party": ["handshake"],
  "law-corp-secretary": ["calendar"],
  "law-data-cross-border": ["globe"],
  "law-data-dpo": ["shield"],
  "law-drafting-skills": ["pen"],
  "law-econtracts": ["laptop"],
  "law-fdi-setup": ["factory", "FDI", 24],
  "law-first-90-days": ["calendar", "90"],
  "law-intl-contracts": ["globe"],
  "law-intl-sale-goods": ["plane"],
  "law-ip-copyright-software": ["copyright"],
  "law-ip-enforcement": ["gavel"],
  "law-ip-trademark": ["trademark"],
  "law-labour-discipline": ["warning"],
  "law-labour-inhouse": ["doc"],
  "law-labour-line-managers": ["people"],
  "law-land-due-diligence": ["land"],
  "law-land-project": ["land"],
  "law-legal-english-reading": ["book", "EN"],
  "law-legal-opinion": ["pen"],
  "law-legal-research": ["magnifier"],
  "law-ma-due-diligence": ["magnifier", "M&A", 24],
  "law-ma-foreign-buyer": ["globe", "M&A", 24],
  "law-ma-founders": ["coins"],
  "law-ma-spa": ["contract", "SPA"],
  "law-nda-loi": ["lock", "NDA"],
  "law-realestate-sales": ["house"],
  "law-tax-audit": ["percent"],
  "law-tax-contract-clauses": ["percent"],
  // Gia đình & nhà ở
  "new-parents-paperwork-and-benefits": ["baby"],
  // Tiền bạc & đời sống
  "new-workers-buying-insurance": ["shield"],
  "new-workers-credit-cards": ["card"],
  "new-workers-start-investing": ["coins"],
  "students-first-bank-account": ["bank"],
  "students-instant-loan-apps": ["phone"],
  // Pháp luật thường ngày
  "new-workers-first-apartment-lease": ["key"],
  "new-workers-first-payslip": ["receipt"],
  "new-workers-hours-and-leave": ["clock"],
  "new-workers-job-loss": ["briefcase"],
  "new-workers-resigning": ["mail"],
  "new-workers-social-insurance": ["shield", "BHXH", 22],
  "new-workers-tax-finalisation": ["percent"],
  "students-legal-adulthood": ["scale", "18+"],
  "students-motorbike-safety": ["motorbike"],
  "students-online-shopping-rights": ["phone"],
  "students-residence-and-vneid": ["idcard"],
  "young-buyers-first-home": ["house"],
  // Đời sống số
  "new-workers-information-security": ["shield"],
  "new-workers-scam-recovery": ["warning"],
  "students-account-security": ["lock"],
  "students-ai-in-study": ["ai"],
  "students-personal-data": ["idcard"],
  "students-phone-and-social-media": ["phone"],
};

// Có nhãn chữ → thu nhỏ hình về góc dưới bên phải để chữ không đè lên hình (lớp "m": nét dày hơn để sau khi thu nhỏ vẫn ≈ 4)
const build = ([m, label, size]) =>
  label ? `<g class="m" transform="translate(44 34) scale(.72)">${MOTIF[m]}</g>${T(label, size)}` : MOTIF[m];

export const TOPIC_ART_MORE = Object.fromEntries(Object.entries(TOPICS).map(([slug, spec]) => [slug, build(spec)]));

// Chủ đề mới chưa khai báo: đoán hình theo từ khoá trong slug
const GUESS = [
  [/scam|fraud/, "warning"], [/ielts|toeic|vstep|thpt|exam|test/, "pen"], [/listen/, "headphones"], [/speak|oral|pronunc/, "mic"],
  [/read|book|grammar|vocab/, "book"], [/writ|draft/, "pen"], [/email|mail/, "mail"], [/tax/, "percent"], [/insur|secur|privacy|data/, "shield"],
  [/bank|loan|debt|money|salary|pay|pension|invest|stock|finance/, "coins"], [/house|home|rent|lease|apartment/, "house"],
  [/law|legal|contract|lawyer|bar-/, "contract"], [/epc|factory|plant|engineer/, "factory"], [/ai|robot/, "ai"], [/phone|social|screen/, "phone"],
  [/abroad|migr|visa|passport|japan|korea|germany|canada|australia|us-|taiwan/, "plane"], [/health|stress|mental|sleep/, "heart"],
  [/food|eat|cook/, "bowl"], [/run|sport|exercise|gym/, "runner"], [/manager|leader|team|people/, "people"], [/time|schedule|plan/, "calendar"],
  [/student|study|learn|school|university/, "book"], [/job|career|work/, "briefcase"],
];

/** SVG cho một chủ đề: hình riêng (topicArt.js) → hình ghép (#199) → đoán theo slug → hình chung "doc". */
export function artFor(slug, own = {}) {
  if (own[slug]) return own[slug];
  if (TOPIC_ART_MORE[slug]) return TOPIC_ART_MORE[slug];
  const g = GUESS.find(([re]) => re.test(slug || ""));
  return MOTIF[g ? g[1] : "doc"];
}
