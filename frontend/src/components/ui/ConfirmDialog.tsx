import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
}

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = "Confirm", loading, danger = true }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title=""
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-danger-500)]/12 text-[color:var(--color-danger-400)]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-base font-semibold text-[color:var(--color-ink-0)]">{title}</p>
        <p className="text-sm text-[color:var(--color-ink-3)]">{description}</p>
      </div>
    </Modal>
  );
}
