import { Loader2 } from "lucide-react";
import { Button } from "./button";

const labelMap = {
  pending: "Interest Sent",
  accepted: "Matched",
  declined: "Declined",
};

export function InterestButton({ status = "pending", onClick, disabled, loading }) {
  const isPending = status === "pending";
  const label = status ? labelMap[status] || "Express Interest" : "Express Interest";

  return (
    <Button
      size="sm"
      variant={status === "accepted" ? "success" : status === "declined" ? "outline" : "default"}
      onClick={onClick}
      disabled={disabled || !!status}
      className="flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Sending...
        </>
      ) : (
        label
      )}
    </Button>
  );
}
