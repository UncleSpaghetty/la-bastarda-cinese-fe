import { CheckCircle2, XCircle } from "lucide-react";

export function ActionFeedback({ message, tone = "success" }: { message?: string; tone?: "success" | "error" }) {
  if (!message) return null;
  return <div className={`action-feedback ${tone}`} role={tone === "error" ? "alert" : "status"} aria-live="polite">
    {tone === "success" ? <CheckCircle2 size={19} /> : <XCircle size={19} />}{message}
  </div>;
}
