// U3-Q2 (#061): /articles (bài viết cũ) → /for
import { permanentRedirect } from "next/navigation";
export default function Page() {
  permanentRedirect("/for");
}
