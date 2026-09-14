import { redirect } from "next/navigation";

// Staff accounts are created in the protected super administrator team page.
// Keep this route so old bookmarks lead users to the sign-in page.
export default function SignUpPage() {
  redirect("/sign-in");
}
