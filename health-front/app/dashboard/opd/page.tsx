import { redirect } from "next/navigation";

export default function OpdIndexPage() {
  redirect("/dashboard/opd/queue");
}
