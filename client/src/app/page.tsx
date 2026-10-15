import { redirect } from "next/navigation";

// The app shell decides whether to show the dashboard or send the user to /login.
export default function Home() {
  redirect("/dashboard");
}
