// /ren-luyen/phong/<tệp>/<bài> — #414 phòng rèn luyện CHÉP Y NGUYÊN project cũ (/roomoffline/:roomCode/:currentIndex), tham số ?a ?b ?tb… như cũ.
import PhongLoader from "@/components/renLuyen/cu/PhongLoader";

export const metadata = { title: "Rèn luyện", robots: { index: false } };

export default function Page() {
  return <PhongLoader />;
}
