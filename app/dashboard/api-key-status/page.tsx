import { redirect } from "next/navigation";

export default function ApiKeyStatusRedirect() {
  redirect("/dashboard");
}
