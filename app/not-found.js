// Trang 404 (thay route "*" của bản CRA).
import Link from "next/link";
import VongDet, { SIGN } from "@/components/hkt/VongDet";

export const metadata = { title: "Không tìm thấy trang", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="kt" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div
        style={{
          textAlign: "center",
          background: "#fff",
          borderRadius: 16,
          padding: "2.5rem 2rem",
          maxWidth: 420,
          width: "100%",
          border: "1px solid var(--kt-line)",
          boxShadow: "0 1px 3px rgba(15,23,42,.06), 0 6px 18px rgba(15,23,42,.05)",
        }}
      >
        <VongDet sweep={SIGN} track={false} size={64} className="vd-missing" />
        <h1 className="kt-h1" style={{ margin: "1rem 0 .5rem", fontSize: 24 }}>
          Không tìm thấy trang
        </h1>
        <p className="kt-muted" style={{ marginBottom: "1.25rem" }}>
          Đường dẫn này không tồn tại hoặc đã được di chuyển.
        </p>
        <Link className="kt-btn" href="/">
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
