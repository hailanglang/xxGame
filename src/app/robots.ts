import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://xx-game-lu9zwkohm-langlang-s-projects2.vercel.app/sitemap.xml",
  }
}
