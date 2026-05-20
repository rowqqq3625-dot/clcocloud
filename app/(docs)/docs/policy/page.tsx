import { redirect } from "next/navigation";

export default function PolicyRedirectPage() {
  redirect("/docs/terms");
}
