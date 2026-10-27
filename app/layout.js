// Khung chung cho mọi trang (thay public/index.html + App.js + Helmet của bản CRA).
// Thứ tự CSS giống bản CRA: bootstrap (bản CRA nạp toàn cục ở A1_Header) → giao diện DetPro.
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/KnowledgeLesson.css";
import "@/styles/KnowledgePages.css";
import "@/styles/UnitPage.css";
import "@/styles/kt.css";
import "@/styles/VongDet.css";
import "@/styles/globals.css";
import { SITE_URL, SLOGAN, BIO } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // #167: tiêu đề mọi trang có đuôi thương hiệu (thay titleTemplate của Helmet)
  title: { template: "%s | DetPro", default: `DetPro — ${SLOGAN}` },
  description: `DetPro — ${BIO}`, // #191: cùng câu tiểu sử Fanpage
  applicationName: "DetPro",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/detpro-icon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo192.png",
  },
  openGraph: {
    siteName: "DetPro",
    type: "website",
    locale: "vi_VN",
    title: `DetPro — ${SLOGAN}`,
    description: "Kiến thức thực tế qua câu hỏi trắc nghiệm, luyện nghe – nói bằng tiếng Anh.",
    images: [{ url: "/og-detpro.jpg", width: 1200, height: 630, alt: `DetPro — ${SLOGAN}` }],
  },
  twitter: { card: "summary_large_image" },
  other: { google: "notranslate" },
};

export const viewport = { themeColor: "#0f6e5a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        {/* Phông như bản CRA (KnowledgeLesson.css @import): Be Vietnam Pro + Literata */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Literata:opsz,wght@7..72,400;7..72,500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
