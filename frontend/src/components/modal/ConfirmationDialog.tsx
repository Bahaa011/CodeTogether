import Modal from "./Modal";
import "../../styles/confirm-modal.css";

type ConfirmationDialogProps = {
  open: boolean;
  mode: "confirm" | "prompt";
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "info" | "danger";
  inputLabel?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  onCancel(): void;
  onConfirm(): void;
  onChange?(value: string): void;
};

export default function ConfirmationDialog({
  open,
  mode,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "info",
  inputLabel,
  placeholder,
  value,
  error,
  onCancel,
  onConfirm,
  onChange,
}: ConfirmationDialogProps) {
  const resolvedTitle = title ?? (mode === "confirm" ? "Confirm action" : "Enter a value");
  const resolvedConfirmLabel = confirmLabel ?? (mode === "confirm" ? "Confirm" : "Save");
  const resolvedCancelLabel = cancelLabel ?? "Cancel";

  return (
    <Modal
      open={open}
      title={resolvedTitle}
      onClose={onCancel}
      className={tone === "danger" ? "modal--danger" : undefined}
      footer={
        <div className="modal-actions confirm-modal__actions">
          <button
            type="button"
            className="modal-button modal-button--ghost"
            onClick={onCancel}
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            className={
              tone === "danger"
                ? "modal-button confirm-modal__danger"
                : "modal-button modal-button--primary"
            }
            onClick={onConfirm}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      }
    >
      <p className="confirm-modal__message">{message}</p>
      {mode === "prompt" && (
        <div className="confirm-modal__field">
          <label className="confirm-modal__label">
            {inputLabel ?? "Label"}
          </label>
          <input
            type="text"
            className={
              error
                ? "confirm-modal__input confirm-modal__input--error"
                : "confirm-modal__input"
            }
            value={value ?? ""}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
          />
          {error && <p className="confirm-modal__error">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
