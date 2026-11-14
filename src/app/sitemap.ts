import type { MetadataRoute } from "next";
import { capabilities } from "@/content/capabilities";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const routes = [
    "/",
    "/capabilities",
    ...capabilities.map((c) => `/capabilities/${c.slug}`),
    "/work",
    ...projects.map((p) => `/work/${p.slug}`),
    "/products-research",
    "/about",
    "/contact",
  ];
  return routes.map((r) => ({ url: `${base}${r}`, changeFrequency: "monthly", priority: r === "/" ? 1 : 0.7 }));
}
