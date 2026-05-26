import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyAdminOrdersRedirect() {
  redirect("/admin-panel/orders");
}
