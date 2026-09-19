import { redirect } from "next/navigation";

export default function Home() {
  // Everyone starts at the login page.
  // Authenticated users are redirected to dashboard by the app layout guard.
  redirect("/login");
}
