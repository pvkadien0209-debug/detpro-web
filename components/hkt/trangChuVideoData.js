// #206 — 6 video slide-show trang chủ "Bắt đầu với DetPro" (kịch bản #201, anh chốt TC-Q1–Q6).
// Giọng đọc TIẾNG ANH + phụ đề tiếng Việt như video bài (TC-Q1). Dùng chung cho:
//   - web: băng video quẹt ngang ở trang chủ (HomeVideos.js) — video chưa render thì phát bản xem trước bằng slide;
//   - Remotion (my-sta-video): chép sang SEO\DetPro\video\trang-chu\kich-ban-tc.json để dựng video + tạo giọng.
// Mỗi slide: en = lời Đét đọc · vi = phụ đề · show = chữ lớn trên slide (**…** = tô vàng) · art = hình gợi ý · sec = giây.
// Tên tệp video trên Drive: trang-chu-<id>--w01.mp4 (+ .jpg ảnh bìa) — web tự nhận khi tệp có trong DetProMedia.

export const HOME_VIDEOS = [
  {
    id: "tc1",
    dur: 33, // giây — video đã render (#208)
    title: "DetPro là gì?",
    blurb: "Hiểu trang làm gì trong nửa phút",
    color: "#0f6e5a",
    slides: [
      { art: "ring", sec: 7, show: "**Mỗi ngày biết thêm** một điều hay", en: "Hi, I'm Det. Every day, I help you learn one more useful thing.", vi: "Xin chào, mình là Đét. Mỗi ngày, mình giúp bạn biết thêm một điều hay." },
      { art: "cards", sec: 8, show: "Kiến thức **dùng được ngay**", en: "On DetPro, you learn things you can use right away: job interviews, renting a room, work, travel.", vi: "Ở DetPro, bạn học kiến thức dùng được ngay: đi phỏng vấn, thuê trọ, đi làm, du lịch." },
      { art: "article", sec: 6, show: "Bài viết ngắn · **~6 phút**", en: "Each lesson is a short article. It takes about six minutes to read.", vi: "Mỗi bài là một bài viết ngắn, đọc khoảng sáu phút." },
      { art: "abc", sec: 9, show: "Nghe – nói tiếng Anh = **cách học**", en: "Then you answer questions by listening and speaking English. English is how you learn. The knowledge is what you keep.", vi: "Rồi bạn trả lời câu hỏi bằng cách nghe và nói tiếng Anh. Tiếng Anh là cách học, kiến thức là thứ bạn mang về." },
      { art: "free", sec: 7, show: "**Miễn phí** · mở là học", en: "It's free, and you don't need an account. Pick a topic and start.", vi: "Miễn phí, không cần đăng ký. Chọn một chủ đề là học được ngay." },
      { art: "logo", sec: 7, show: "One a day, **the DetPro way**", en: "One a day, the DetPro way.", vi: "Mỗi ngày một điều — quyết tâm mỗi ngày, tiến bộ mỗi ngày." },
    ],
  },
  {
    id: "tc2",
    dur: 46, // giây — video đã render (#208)
    title: "Học một bài trong 4 bước",
    blurb: "Từ chọn bài đến xem kết quả",
    color: "#2456a6",
    slides: [
      { art: "steps", sec: 6, show: "**4 bước** · 1 bài", en: "Learning a lesson on DetPro takes just four steps. Let's go together.", vi: "Học một bài trên DetPro chỉ có bốn bước. Đi cùng mình nhé." },
      { art: "screen-home", sec: 9, show: "① **Chọn bài** đúng hoàn cảnh", en: "Step one: choose a lesson. Pick the topic or situation that fits you, then tap Start.", vi: "Bước một: chọn bài. Chọn chủ đề hoặc hoàn cảnh hợp với bạn, rồi bấm Bắt đầu học." },
      { art: "article", sec: 8, show: "② **Đọc bài** hoặc xem video", en: "Step two: read the article, or watch the short video if you prefer.", vi: "Bước hai: đọc bài, hoặc xem video tóm tắt nếu bạn ngại đọc." },
      { art: "table", sec: 7, show: "Bảng thông tin = **chỗ tra**", en: "The Info Table has all forty questions, so you can check them any time.", vi: "Phần Bảng thông tin có đủ 40 câu hỏi để bạn tra lại bất cứ lúc nào." },
      { art: "abc", sec: 10, show: "③ **Luyện** 3 phần", en: "Step three: practise. The quiz helps you remember, listening and speaking build your reflexes, and true or false makes it stick.", vi: "Bước ba: luyện. Trắc nghiệm để nhớ, Nghe nói để phản xạ, True or false để chắc chắn." },
      { art: "report", sec: 8, show: "④ **Kết quả** → làm lại câu sai", en: "Step four: see your results, and try the wrong answers again.", vi: "Bước bốn: xem kết quả và làm lại đúng những câu còn sai." },
      { art: "ring", sec: 9, show: "Bấm **Học tiếp**", en: "Next time, tap Continue to go back to where you stopped. Your progress is saved on your device.", vi: "Lần sau, bấm Học tiếp là quay về đúng chỗ đang dở. Tiến độ lưu ngay trên máy của bạn." },
      { art: "thumb", sec: 6, show: "Thử ngay **một bài**", en: "One lesson, four steps, about half an hour. Try one now!", vi: "Một bài, bốn bước, khoảng nửa giờ. Thử ngay một bài nhé!" },
    ],
  },
  {
    id: "tc3",
    dur: 41, // giây — video đã render (#208)
    title: "Nói vào micro thế nào?",
    blurb: "Không còn ngại phần Nghe nói",
    color: "#b4472e",
    slides: [
      { art: "mic", sec: 7, show: "Nói với máy: **dễ hơn bạn nghĩ**", en: "Speaking English to a computer for the first time? I was nervous too. Here's how.", vi: "Lần đầu nói tiếng Anh với máy? Mình cũng run. Làm thế này là dễ." },
      { art: "allow", sec: 6, show: "Bấm **Cho phép** micro", en: "The first time, your browser asks to use the microphone. Tap Allow.", vi: "Lần đầu, trình duyệt hỏi quyền dùng micro. Bạn bấm Cho phép." },
      { art: "abc", sec: 7, show: "Nghe → **chọn trong đầu**", en: "Listen to the question and the three answers. Tap the speaker to hear them again.", vi: "Nghe câu hỏi và ba đáp án. Muốn nghe lại thì bấm loa." },
      { art: "wave", sec: 8, show: "Bấm **Nói** → đọc đáp án", en: "Tap Speak and say your answer out loud. It keeps listening until you tap Send or Stop.", vi: "Bấm Nói, đọc to đáp án bạn chọn. Máy nghe tới khi bạn bấm Gửi hoặc Dừng." },
      { art: "text", sec: 8, show: "Xem chữ → **Gửi**", en: "Check what it heard. If it's right, tap Send. If not, tap Clear and try again.", vi: "Xem chữ máy nghe được. Đúng ý thì bấm Gửi, sai thì bấm Xoá nói lại." },
      { art: "half", sec: 7, show: "Khớp ≥ 50% là **đạt**", en: "You don't need to be perfect. Half of the words or more counts as correct.", vi: "Không cần nói hoàn hảo: khớp từ một nửa trở lên là tính đúng." },
      { art: "keyboard", sec: 6, show: "Không tiện nói → **Gõ**", en: "In a busy place? Switch to Type instead.", vi: "Đang ở chỗ đông người? Chuyển sang Gõ cũng được." },
      { art: "thumb", sec: 6, show: "Sai cũng là **tiến bộ**", en: "Mistakes are fine. Every time you speak, you get better.", vi: "Nói sai cũng không sao. Mỗi lần nói là một lần tiến bộ." },
    ],
  },
  {
    id: "tc4",
    dur: 62, // giây — video đã render (#208)
    title: "20 giờ đầu tiên",
    blurb: "Vì sao học ngắn, đều mỗi ngày lại hiệu quả",
    color: "#7a3fa0",
    source: "Theo ý sách “20 Giờ Đầu Tiên” (The First 20 Hours) của Josh Kaufman",
    slides: [
      { art: "book", sec: 7, show: "Theo **20 Giờ Đầu Tiên** · Josh Kaufman", en: "This idea comes from the book The First 20 Hours, by Josh Kaufman.", vi: "Ý tưởng này từ cuốn sách 20 Giờ Đầu Tiên của Josh Kaufman." },
      { art: "n10000", sec: 8, show: "~~10.000 giờ~~", en: "You may have heard that you need ten thousand hours to be great. That's for becoming a master.", vi: "Bạn từng nghe: muốn giỏi phải luyện mười nghìn giờ? Đó là để thành bậc thầy." },
      { art: "n20", sec: 9, show: "**20 giờ** · đủ dùng", en: "To be good enough for your own needs, many people need only about twenty hours of the right practice.", vi: "Muốn làm được, đủ dùng cho việc của mình, nhiều người chỉ cần khoảng hai mươi giờ luyện tập đúng cách." },
      { art: "curve", sec: 9, show: "**Rào cản thất vọng**", en: "The first hours are the hardest. Everyone feels clumsy and wants to quit. The book calls this the frustration barrier.", vi: "Khó nhất là mấy giờ đầu: ai cũng lúng túng, dễ bỏ cuộc. Sách gọi đó là rào cản thất vọng." },
      { art: "steps", sec: 5, show: "4 bước **học nhanh**", en: "Here are four steps to get past it.", vi: "Vượt qua bằng bốn bước." },
      { art: "split", sec: 9, show: "① **Chia nhỏ**", en: "One: break it down. DetPro splits each skill into a series of lessons, and each lesson into five small parts.", vi: "Một: chia nhỏ. DetPro chia mỗi kỹ năng thành chuỗi bài, mỗi bài năm phần nhỏ." },
      { art: "article", sec: 9, show: "② **Học vừa đủ** để tự sửa", en: "Two: learn just enough to correct yourself. Read a short article, then let each explanation show you what went wrong.", vi: "Hai: học vừa đủ để tự sửa. Đọc bài ngắn, rồi để từng lời giải thích chỉ cho bạn chỗ sai." },
      { art: "free", sec: 9, show: "③ **Dẹp rào cản**", en: "Three: remove the barriers. No account, just open your phone and learn. Tap Continue to jump right back in.", vi: "Ba: dẹp rào cản. Không cần tài khoản, mở điện thoại là học, bấm Học tiếp là vào đúng chỗ." },
      { art: "clock", sec: 9, show: "④ **Luyện đều** mỗi ngày", en: "Four: practise every day. Twenty to thirty minutes a day, and in a few weeks you reach twenty hours.", vi: "Bốn: luyện đều. Mỗi ngày hai mươi đến ba mươi phút, vài tuần là đủ hai mươi giờ." },
      { art: "ring", sec: 6, show: "Bắt đầu từ **hôm nay**", en: "Your first twenty hours start with today's lesson.", vi: "Hai mươi giờ đầu tiên, bắt đầu từ bài hôm nay." },
    ],
  },
  {
    id: "tc5",
    dur: 58, // giây — video đã render (#208)
    title: "10 mẹo học nhanh",
    blurb: "Nguyên tắc trong sách → việc làm ngay trên DetPro",
    color: "#c07a00",
    source: "Theo ý sách “20 Giờ Đầu Tiên” (The First 20 Hours) của Josh Kaufman",
    slides: [
      { art: "book", sec: 7, show: "**10 mẹo** · mỗi mẹo 10 giây", en: "Ten tips from The First 20 Hours by Josh Kaufman. Ten seconds each.", vi: "Mười mẹo từ sách 20 Giờ Đầu Tiên của Josh Kaufman, mỗi mẹo mười giây." },
      { art: "n1", sec: 10, show: "Chọn **đúng hoàn cảnh** của bạn", en: "One: choose something you really want to do. Open Situations and pick yours.", vi: "Một: chọn việc bạn thật sự muốn làm được. Vào Hoàn cảnh, chọn đúng hoàn cảnh của bạn." },
      { art: "n2", sec: 10, show: "Xong **một chuỗi** rồi mới sang chuỗi mới", en: "Two: one skill at a time. Finish one series before you open the next.", vi: "Hai: mỗi lúc một kỹ năng. Học xong một chuỗi rồi mới mở chuỗi mới." },
      { art: "n3", sec: 10, show: "Đọc “**Sau chuỗi này, bạn sẽ…**”", en: "Three: know your target. Read the line that says what you'll be able to do.", vi: "Ba: biết trước mình muốn đạt tới đâu. Đọc dòng “Sau chuỗi này, bạn sẽ…”." },
      { art: "n4", sec: 10, show: "Làm **từng phần một**", en: "Four: break it down. Each lesson has five parts. Do one at a time.", vi: "Bốn: chia nhỏ. Mỗi bài năm phần, làm từng phần một." },
      { art: "n5", sec: 10, show: "Ghim DetPro lên **màn hình**", en: "Five: remove distractions. Pin DetPro to your phone's home screen.", vi: "Năm: dẹp thứ cản trở. Ghim DetPro lên màn hình điện thoại." },
      { art: "n6", sec: 10, show: "Giờ học **cố định**", en: "Six: set a fixed time every day, like eight p.m.", vi: "Sáu: đặt giờ học cố định mỗi ngày, ví dụ tám giờ tối." },
      { art: "n7", sec: 10, show: "Đọc **giải thích** ngay sau câu sai", en: "Seven: get fast feedback. Read the explanation right after a wrong answer.", vi: "Bảy: phản hồi nhanh. Đọc giải thích ngay sau mỗi câu sai." },
      { art: "n8", sec: 10, show: "**20 phút** = một phần", en: "Eight: practise in short timed blocks. Twenty minutes, one part.", vi: "Tám: luyện theo đồng hồ, từng đợt ngắn. Hai mươi phút là một phần." },
      { art: "n9", sec: 10, show: "Hôm sau: **Làm lại câu sai**", en: "Nine: review with spaces. Tomorrow, tap Retry wrong answers.", vi: "Chín: ôn cách quãng. Hôm sau bấm Làm lại câu sai." },
      { art: "n10", sec: 10, show: "Mệt thì **nghỉ**", en: "Ten: take care of your body. Tired? Stop. Your progress is saved.", vi: "Mười: tôn trọng cơ thể. Mệt thì dừng, tiến độ đã lưu, mai học tiếp." },
      { art: "thumb", sec: 6, show: "Chọn **một mẹo** · làm ngay", en: "Pick one tip and try it today.", vi: "Chọn một mẹo, làm ngay hôm nay." },
    ],
  },
  {
    id: "tc6",
    dur: 28, // giây — video đã render (#208)
    title: "Tìm đúng bài cho bạn",
    blurb: "Hoàn cảnh · chủ đề · tìm kiếm",
    color: "#1f7a8c",
    slides: [
      { art: "doors", sec: 9, show: "**3 cửa** học", en: "DetPro has three doors: skills, knowledge, and professional topics for people at work.", vi: "DetPro có ba cửa: kỹ năng, kiến thức, và chuyên môn cho người đi làm." },
      { art: "people", sec: 10, show: "Bắt đầu từ **hoàn cảnh**", en: "Or start from your situation: a new student away from home, a job seeker, someone moving abroad.", vi: "Hoặc bắt đầu từ hoàn cảnh: tân sinh viên xa nhà, người đi phỏng vấn, người sắp ra nước ngoài…" },
      { art: "search", sec: 6, show: "Gõ để **tìm**", en: "Know what you need? Type it in the search box.", vi: "Biết mình cần gì? Gõ vào ô tìm kiếm." },
      { art: "cards", sec: 9, show: "Bài tổng → **đi sâu**", en: "Each topic is a series. The overview comes first, then each lesson goes deeper.", vi: "Mỗi chủ đề là một chuỗi bài, bài tổng mở đầu, các bài sau đi sâu dần." },
      { art: "thumb", sec: 6, show: "Bấm **Bắt đầu học**", en: "Pick a series and tap Start. That's it!", vi: "Chọn một chuỗi, bấm Bắt đầu học. Vậy thôi!" },
    ],
  },
];

export const videoSeconds = (v) => v.dur || v.slides.reduce((n, s) => n + s.sec, 0);
export const fmtSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// #228 — Bộ video HƯỚNG DẪN CHUNG "Học hiệu quả trên DetPro" (HD1–HD10; HD8–HD10 thêm ở #255): vì sao, làm thế nào, từng phần chi tiết.
// Cùng khuôn slide-show + giọng Kokoro tiếng Anh + phụ đề Việt như video trang chủ. Tệp: huong-dan-<id>--w01.mp4.
export const GUIDE_VIDEOS = [
  {
    id: "hd1", file: "huong-dan-hd1", dur: 50, title: "Tổng quan: một bài trên DetPro", blurb: "Bài viết, Bảng, 3 phần luyện, Nghe 40 câu, Học tiếp", color: "#0f6e5a",
    slides: [
      { art: "ring", sec: 7, show: "Một bài có **5 phần**", en: "Every DetPro lesson has five parts. Here is the whole map.", vi: "Mỗi bài DetPro có năm phần. Đây là toàn bộ bản đồ." },
      { art: "article", sec: 8, show: "① **Bài viết** · ~6 phút", en: "Part one: the article. A short read, in Vietnamese, about one real situation.", vi: "Phần một: bài viết. Đọc ngắn, bằng tiếng Việt, về một tình huống thật." },
      { art: "table", sec: 8, show: "② **Bảng thông tin** · 40 câu", en: "Part two: the Info Table. All forty questions and their answer choices in one place.", vi: "Phần hai: Bảng thông tin. Cả bốn mươi câu hỏi và các lựa chọn ở một chỗ." },
      { art: "headphones", sec: 9, show: "**Nghe cả 40 câu**", en: "In the Info Table, tap Listen to all. Choose to show the question, the answer, both, or nothing.", vi: "Trong Bảng thông tin, bấm Nghe cả 40 câu. Chọn hiện câu hỏi, đáp án, cả hai, hoặc nghe chay." },
      { art: "abc", sec: 8, show: "③ **Trắc nghiệm**", en: "Part three: the quiz. Pick an answer, read why, and fix every mistake.", vi: "Phần ba: trắc nghiệm. Chọn đáp án, đọc vì sao, sửa hết câu sai." },
      { art: "mic", sec: 8, show: "④ **Nghe nói**", en: "Part four: listen and speak. Hear the question, then say the answer out loud.", vi: "Phần bốn: nghe nói. Nghe câu hỏi, rồi nói to câu trả lời." },
      { art: "zap", sec: 7, show: "⑤ **True or false**", en: "Part five: true or false. Fast answers to make it stick.", vi: "Phần năm: đúng hay sai. Trả lời nhanh để nhớ chắc." },
      { art: "report", sec: 7, show: "**Kết quả** sau mỗi phần", en: "After each part, check your results and retry the wrong answers.", vi: "Sau mỗi phần, xem kết quả và làm lại câu sai." },
      { art: "ring", sec: 7, show: "Vòng Đét **khép** = xong bài", en: "Finish all five parts and your Det ring closes. Tap Continue next time.", vi: "Xong cả năm phần, Vòng Đét khép lại. Lần sau bấm Học tiếp." },
    ],
  },
  {
    id: "hd2", file: "huong-dan-hd2", dur: 35, title: "Vì sao nên học theo cách này?", blurb: "Biết thêm kiến thức và tiến bộ tiếng Anh cùng lúc", color: "#2456a6",
    slides: [
      { art: "brain", sec: 7, show: "Vì sao **câu hỏi** hơn đọc lại?", en: "Why answer questions instead of reading again?", vi: "Vì sao nên trả lời câu hỏi thay vì đọc lại?" },
      { art: "eye", sec: 9, show: "Đọc lại = **quen mắt**", en: "Reading again feels easy, but it only makes the page look familiar.", vi: "Đọc lại thấy dễ, nhưng chỉ làm trang giấy trông quen mắt." },
      { art: "brain", sec: 9, show: "Tự nhớ ra = **nhớ lâu**", en: "Pulling the answer out of your own memory is what makes it last.", vi: "Tự lôi câu trả lời ra từ trí nhớ mới giúp nhớ lâu." },
      { art: "check", sec: 8, show: "Sai → giải thích → **sửa ngay**", en: "A wrong answer with a quick explanation is one of the fastest ways to learn.", vi: "Trả lời sai rồi đọc giải thích ngay là một trong những cách học nhanh nhất." },
      { art: "mic", sec: 9, show: "Nói to = **dùng được**", en: "Saying it out loud turns knowledge you recognise into words you can use.", vi: "Nói to biến điều bạn nhận ra thành lời bạn dùng được." },
      { art: "cards", sec: 9, show: "**Hai trong một**", en: "So each lesson gives you two things: useful knowledge, and real English practice.", vi: "Vậy mỗi bài cho bạn hai thứ: kiến thức hữu ích, và luyện tiếng Anh thật." },
      { art: "thumb", sec: 6, show: "Học ít · **nhớ nhiều**", en: "Less time, more that stays. That's the DetPro way.", vi: "Học ít thời gian, nhớ được nhiều. Đó là cách DetPro." },
    ],
  },
  {
    id: "hd3", file: "huong-dan-hd3", dur: 35, title: "Đọc bài và Bảng thông tin", blurb: "Đọc thế nào, dùng Bảng và Nghe 40 câu thế nào", color: "#1f7a8c",
    slides: [
      { art: "article", sec: 8, show: "Đọc **lướt** trước", en: "First, skim the article. Look at the headings and the story.", vi: "Trước hết, đọc lướt bài viết. Xem các tiêu đề và câu chuyện." },
      { art: "search", sec: 8, show: "Tìm **ý chính** mỗi đoạn", en: "Then read again and find the main point of each section.", vi: "Rồi đọc lại và tìm ý chính của từng đoạn." },
      { art: "table", sec: 9, show: "Bảng = **40 câu** sẽ hỏi", en: "The Info Table shows the forty questions you will answer. No answers are marked.", vi: "Bảng thông tin cho thấy bốn mươi câu bạn sẽ trả lời. Không đánh dấu đáp án đúng." },
      { art: "search", sec: 8, show: "Tự **đoán** trước khi luyện", en: "Try to guess the answers from the article before you start the quiz.", vi: "Thử tự đoán đáp án từ bài viết trước khi vào trắc nghiệm." },
      { art: "headphones", sec: 9, show: "**Nghe 40 câu** khi rảnh tay", en: "Tap Listen to all forty. It reads each question, then the right answer.", vi: "Bấm Nghe cả 40 câu. Máy đọc từng câu hỏi, rồi đáp án đúng." },
      { art: "eye", sec: 10, show: "Hiện **câu hỏi / đáp án / cả hai**", en: "Show the question, the answer, both, or nothing at all, to test your ears.", vi: "Hiện câu hỏi, đáp án, cả hai, hoặc không hiện gì để thử tai mình." },
      { art: "repeat", sec: 8, show: "Bật **lặp lại** khi đi đường", en: "Turn on repeat and listen on the bus or while you walk.", vi: "Bật lặp lại và nghe trên xe buýt hay lúc đi bộ." },
    ],
  },
  {
    id: "hd4", file: "huong-dan-hd4", dur: 30, title: "Trắc nghiệm: làm sao cho hiệu quả", blurb: "Đoán, đọc giải thích, làm lại câu sai", color: "#7a3fa0",
    slides: [
      { art: "abc", sec: 7, show: "40 câu · **3 lựa chọn**", en: "The quiz has forty questions, each with three choices.", vi: "Trắc nghiệm có bốn mươi câu, mỗi câu ba lựa chọn." },
      { art: "brain", sec: 8, show: "**Nghĩ trước**, rồi mới chọn", en: "Answer in your head first, then pick. Don't just click.", vi: "Trả lời trong đầu trước, rồi mới chọn. Đừng bấm bừa." },
      { art: "text", sec: 9, show: "Sai? Đọc **giải thích**", en: "Wrong? Read the explanation. It shows where the answer is in the article.", vi: "Sai? Đọc giải thích. Nó chỉ chỗ đáp án nằm trong bài." },
      { art: "repeat", sec: 8, show: "**Làm lại câu sai**", en: "At the end, tap Retry wrong answers until all forty are right.", vi: "Cuối phần, bấm Làm lại câu sai tới khi đúng đủ bốn mươi câu." },
      { art: "split", sec: 8, show: "Ngại dài? Làm **20 câu** một lần", en: "Too long? Do twenty now and twenty later. Your progress is saved.", vi: "Thấy dài? Làm hai mươi câu bây giờ, hai mươi câu sau. Tiến độ đã lưu." },
      { art: "calendar", sec: 8, show: "Hôm sau: **ôn câu sai**", en: "Come back the next day and retry the ones you missed. That's spaced review.", vi: "Hôm sau quay lại làm lại câu đã sai. Đó là ôn cách quãng." },
    ],
  },
  {
    id: "hd5", file: "huong-dan-hd5", dur: 34, title: "Nghe nói: luyện nói cho trôi", blurb: "Nghe kỹ, nói to, không sợ sai", color: "#b4472e",
    slides: [
      { art: "headphones", sec: 8, show: "**Nghe** trước, đừng vội nói", en: "Listen to the question and the three answers first. Replay if you need.", vi: "Nghe câu hỏi và ba đáp án trước. Cần thì nghe lại." },
      { art: "mic", sec: 8, show: "Nói **to và rõ**", en: "Tap Speak and say your answer clearly, at a normal speed.", vi: "Bấm Nói và nói rõ câu trả lời, tốc độ bình thường." },
      { art: "repeat", sec: 9, show: "Bắt chước **giọng mẫu**", en: "Copy the voice you just heard. Same rhythm, same stress. This is shadowing.", vi: "Bắt chước giọng vừa nghe. Cùng nhịp, cùng trọng âm. Đó là nói đuổi." },
      { art: "half", sec: 8, show: "Khớp ≥ 50% là **đạt**", en: "Half of the words right counts. You don't need to be perfect.", vi: "Khớp một nửa số từ là tính đạt. Không cần hoàn hảo." },
      { art: "text", sec: 8, show: "Xem **chữ máy nghe**", en: "Look at what the computer heard. It shows which words to say more clearly.", vi: "Xem chữ máy nghe được. Nó cho thấy từ nào cần nói rõ hơn." },
      { art: "keyboard", sec: 7, show: "Chỗ đông người → **Gõ**", en: "In a noisy place, switch to Type for now and speak later.", vi: "Ở chỗ ồn, tạm chuyển sang Gõ và nói sau." },
      { art: "thumb", sec: 6, show: "Mỗi lần nói = **tiến bộ**", en: "Every answer you say out loud makes the next one easier.", vi: "Mỗi câu bạn nói to làm câu sau dễ hơn." },
    ],
  },
  {
    id: "hd6", file: "huong-dan-hd6", dur: 21, title: "True or false: phản xạ nhanh", blurb: "Trả lời nhanh để nhớ chắc", color: "#c07a00",
    slides: [
      { art: "zap", sec: 7, show: "Câu nói **đúng hay sai**?", en: "You hear a statement. Is it true or false?", vi: "Bạn nghe một câu. Đúng hay sai?" },
      { art: "clock", sec: 8, show: "Trả lời **nhanh**", en: "Answer fast. Speed shows what you really remember.", vi: "Trả lời nhanh. Tốc độ cho thấy điều bạn thật sự nhớ." },
      { art: "text", sec: 8, show: "Sai → đọc **vì sao**", en: "If you miss one, read why, then keep going.", vi: "Sai câu nào, đọc vì sao, rồi đi tiếp." },
      { art: "check", sec: 8, show: "Làm **cuối cùng**", en: "Do it last, after the quiz and speaking. It checks the whole lesson.", vi: "Làm sau cùng, sau trắc nghiệm và nghe nói. Nó kiểm cả bài." },
      { art: "ring", sec: 7, show: "Xong là **khép vòng**", en: "Finish it and your Det ring for this lesson closes.", vi: "Làm xong là Vòng Đét của bài khép lại." },
    ],
  },
  {
    id: "hd7", file: "huong-dan-hd7", dur: 33, title: "Học thế nào cho hiệu quả nhất?", blurb: "Lịch học, thứ tự, ôn, nghỉ", color: "#3f6f3a",
    slides: [
      { art: "calendar", sec: 8, show: "**20–30 phút** mỗi ngày", en: "Twenty to thirty minutes a day beats three hours once a week.", vi: "Hai mươi đến ba mươi phút mỗi ngày tốt hơn ba tiếng một lần mỗi tuần." },
      { art: "route", sec: 9, show: "Đi đúng **thứ tự** 5 phần", en: "Follow the order: read, table, quiz, speak, true or false.", vi: "Đi đúng thứ tự: đọc, bảng, trắc nghiệm, nói, đúng sai." },
      { art: "split", sec: 8, show: "Một lần **một phần**", en: "One part per session is enough. Small steps add up.", vi: "Mỗi lần một phần là đủ. Bước nhỏ cộng lại thành lớn." },
      { art: "headphones", sec: 8, show: "Rảnh tay → **Nghe 40 câu**", en: "Commuting or cooking? Play all forty questions and answers.", vi: "Đi đường hay nấu ăn? Bật nghe cả bốn mươi câu và đáp án." },
      { art: "repeat", sec: 8, show: "Hôm sau **ôn lại**", en: "Next day, retry wrong answers before starting something new.", vi: "Hôm sau, làm lại câu sai trước khi học cái mới." },
      { art: "mic", sec: 9, show: "**Nói lại** bằng lời của bạn", en: "After a lesson, tell someone what you learned, in English. Even one minute.", vi: "Học xong, kể lại cho ai đó điều bạn học bằng tiếng Anh. Một phút cũng được." },
      { art: "bed", sec: 7, show: "Mệt thì **nghỉ**", en: "Tired? Stop. Sleep helps you remember. Continue tomorrow.", vi: "Mệt thì dừng. Ngủ giúp nhớ. Mai học tiếp." },
    ],
  },
  // #255 — video mới theo tính năng web (Học cùng nhóm / Mở lớp / Mức A·B·C). Chưa có dur: lấy tổng sec cho tới khi render xong.
  {
    id: "hd8", file: "huong-dan-hd8", title: "Học cùng nhóm: vào nhóm và đi trên cây", blurb: "Link nhóm, ID + PIN, cây 5 lá 1 bông, Hỏi đáp", color: "#0e8784",
    slides: [
      { art: "people", sec: 7, show: "**Học cùng** một nhóm", en: "Learning with friends? On DetPro, a whole group can study one series together.", vi: "Học cùng bạn bè? Trên DetPro, cả nhóm học chung một chuỗi bài." },
      { art: "screen-home", sec: 7, show: "Mở **link nhóm**", en: "Your guide sends a group link. Open it. You don't need an account.", vi: "Người hướng dẫn gửi link nhóm. Bạn mở link ra, không cần tài khoản." },
      { art: "keyboard", sec: 8, show: "Chọn tên · đặt **PIN 4 số**", en: "Choose your name, or create a new ID. A four-digit PIN keeps your ID yours.", vi: "Chọn tên của bạn, hoặc tạo ID mới. PIN 4 số giữ ID là của riêng bạn." },
      { art: "route", sec: 8, show: "Cây = **đường đi** của nhóm", en: "The tree is the group's path. Each lesson has five leaves and one flower.", vi: "Cây là đường đi của cả nhóm. Mỗi bài có năm lá và một bông." },
      { art: "split", sec: 8, show: "Lá **1–5** = 5 phần bài", en: "Tap a numbered leaf to do that part right away, in a pop-up window.", vi: "Bấm vào lá có số để làm ngay phần đó, trong một cửa sổ nổi." },
      { art: "clock", sec: 9, show: "Bài sau mở khi **cả nhóm xong**", en: "The next lesson opens when everyone finishes. A countdown and reminders keep the pace.", vi: "Bài sau chỉ mở khi mọi người xong bài trước. Đồng hồ đếm ngược và chuông nhắc giữ nhịp cho nhóm." },
      { art: "report", sec: 8, show: "Bấm **tên một bạn**", en: "Tap a friend's name to see their practice stats, or send them a cheer.", vi: "Bấm tên một bạn để xem thống kê luyện tập, hoặc gửi lời động viên." },
      { art: "mic", sec: 9, show: "Bông = **bài nói tự do**", en: "The flower is a free talk. Say what you remember, send it, then tap I've sent it.", vi: "Bông là bài nói tự do. Nói những gì bạn nhớ, gửi đi, rồi bấm Đã gửi bài nói." },
      { art: "check", sec: 7, show: "Được **duyệt** → bông xanh", en: "Your guide listens and approves. Then your flower turns green.", vi: "Người hướng dẫn nghe và duyệt. Khi đó bông của bạn chuyển xanh." },
      { art: "text", sec: 8, show: "Nút tròn = **Hỏi đáp** của bài", en: "The round button on the trunk opens questions and answers for that lesson.", vi: "Nút tròn trên thân cây mở phần Hỏi đáp riêng của bài đó." },
      { art: "thumb", sec: 6, show: "Cùng giữ nhịp · **cùng về đích**", en: "Keep the pace together, and reach the end together.", vi: "Cùng nhau giữ nhịp, cùng nhau về đích." },
    ],
  },
  // #255 — video mới theo tính năng web (Học cùng nhóm / Mở lớp / Mức A·B·C). Chưa có dur: lấy tổng sec cho tới khi render xong.
  {
    id: "hd9", file: "huong-dan-hd9", title: "Mở lớp: dành cho người hướng dẫn", blurb: "Chọn chuỗi, ID + PIN, ngưỡng qua phần, đếm ngược, duyệt bài nói", color: "#6b3fa0",
    slides: [
      { art: "people", sec: 7, show: "**Mở lớp** hướng dẫn", en: "Want to guide a class? You can open a group on DetPro in a few steps.", vi: "Muốn hướng dẫn một lớp? Bạn mở được nhóm trên DetPro chỉ trong vài bước." },
      { art: "search", sec: 7, show: "Chọn **một chuỗi bài**", en: "Choose one series of lessons and give your class a name.", vi: "Chọn một chuỗi bài và đặt tên cho lớp." },
      { art: "keyboard", sec: 8, show: "Bạn cũng là **người học**", en: "You learn too. Create your own ID and a four-digit PIN.", vi: "Bạn cũng là người học. Tạo ID của riêng bạn kèm PIN 4 số." },
      { art: "check", sec: 8, show: "Chỉ bạn **duyệt** và đổi cài đặt", en: "Only you approve free talks and change the settings. Learners can't use your ID.", vi: "Chỉ bạn duyệt bài nói tự do và đổi cài đặt. Học viên không vào thay ID của bạn được." },
      { art: "half", sec: 8, show: "Qua phần khi **đúng ≥ 70%**…", en: "Decide when a part counts as passed, for example seventy or eighty percent correct.", vi: "Quyết định khi nào một phần được tính là qua, ví dụ đúng từ 70% hay 80%." },
      { art: "clock", sec: 9, show: "Đếm ngược **mỗi chặng**", en: "Add a countdown for each stage, like twenty-four hours, and reminders for anyone behind.", vi: "Thêm đồng hồ đếm ngược cho mỗi chặng, ví dụ 24 giờ, và lời nhắc cho người chưa xong." },
      { art: "screen-home", sec: 8, show: "Gửi **link nhóm** qua Zalo", en: "Send the group link by Zalo. Keep the link to your guide page private.", vi: "Gửi link nhóm qua Zalo. Link trang người hướng dẫn là của riêng bạn, đừng gửi ai." },
      { art: "mic", sec: 8, show: "Nghe · nhận xét · **Duyệt**", en: "Learners send free talks through your channel. Listen, write a comment, and approve.", vi: "Học viên gửi bài nói qua kênh của bạn. Bạn nghe, ghi nhận xét và bấm Duyệt." },
      { art: "repeat", sec: 9, show: "Ai bỏ dở → **Tạm nghỉ**", en: "If someone stops, set them to Paused so the group can move on. Reset forgotten PINs in Learners.", vi: "Ai bỏ dở thì chuyển Tạm nghỉ để nhóm đi tiếp. Ai quên PIN thì đặt lại ở tab Học viên." },
      { art: "thumb", sec: 7, show: "Đổi cài đặt **lúc nào cũng được**", en: "You can change the settings at any time. They apply from the stage that is open.", vi: "Bạn đổi cài đặt lúc nào cũng được, áp dụng từ chặng đang mở." },
    ],
  },
  // #255 — video mới theo tính năng web (Học cùng nhóm / Mở lớp / Mức A·B·C). Chưa có dur: lấy tổng sec cho tới khi render xong.
  {
    id: "hd10", file: "huong-dan-hd10", title: "Mức tiếng Anh A · B · C của một bài", blurb: "Bài cần tiếng Anh mức nào để làm xong 40 câu", color: "#c23d6a",
    slides: [
      { art: "abc", sec: 7, show: "Bài này cần **mức nào**?", en: "Each lesson shows the English level you need to finish its forty questions.", vi: "Mỗi bài ghi rõ cần tiếng Anh mức nào để làm xong 40 câu." },
      { art: "steps", sec: 6, show: "Ba mức: **A · B · C**", en: "There are three levels: A, B and C.", vi: "Có ba mức: A, B và C." },
      { art: "book", sec: 8, show: "**A** — cơ bản · A1–A2", en: "Level A: short sentences and everyday words. Beginners can do it.", vi: "Mức A: câu ngắn, từ thông dụng hằng ngày. Người mới học làm được." },
      { art: "brain", sec: 8, show: "**B** — trung cấp · B1–B2", en: "Level B: longer sentences, words for life and work, and longer listening.", vi: "Mức B: câu ghép, từ vựng đời sống và công việc, nghe câu dài vừa." },
      { art: "zap", sec: 8, show: "**C** — nâng cao · C1–C2", en: "Level C: long sentences and specialist terms, like law, finance or engineering.", vi: "Mức C: câu dài, thuật ngữ chuyên môn như luật, tài chính, kỹ thuật." },
      { art: "table", sec: 9, show: "Đo bằng **độ dài đáp án**", en: "The level comes from the average length of the correct answers in the forty questions.", vi: "Mức được tính từ độ dài trung bình của đáp án đúng trong 40 câu." },
      { art: "report", sec: 8, show: "Xem ở **thẻ chủ đề** và **Bảng thông tin**", en: "Look for the level on the topic card, under the lesson title, and in the Info Table.", vi: "Mức hiện ở thẻ chủ đề, dưới tên bài và trong Bảng thông tin." },
      { art: "thumb", sec: 7, show: "Chọn bài **vừa sức**", en: "Start with lessons at your level, then move up when they feel easy.", vi: "Bắt đầu từ bài vừa sức, thấy dễ rồi thì lên mức cao hơn." },
    ],
  },
];
