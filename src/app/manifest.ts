import type { MetadataRoute } from "next";

/** Lets phones install LibraSearch to the home screen and open it full screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LibraSearch",
    short_name: "LibraSearch",
    description: "Find the chapter your syllabus means, and the copy on the shelf.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe6",
    theme_color: "#f4efe6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search", url: "/search" },
      { name: "Library card", url: "/student/card" },
    ],
  };
}
