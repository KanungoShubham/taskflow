import type { MetadataRoute } from "next";

// Lets phones install TaskFlow to the home screen (required for notifications on iPhone).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaskFlow · Team Task Manager",
    short_name: "TaskFlow",
    description: "Plan, assign and track tasks with your team on a Kanban board.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f7fb",
    theme_color: "#5b4cf0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
