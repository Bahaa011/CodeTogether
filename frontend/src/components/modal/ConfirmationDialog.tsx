/**
 * ConfirmationDialog Component
 * ------------------------------
 * A lightweight and reusable modal component used for confirmations
 * or text-input prompts before performing important actions.
 *
 * Responsibilities:
 * - Render a two-action confirmation modal ("Confirm" / "Cancel").
 * - Support an optional "prompt" mode with an input field for text validation.
 * - Adapt visual tone for info or destructive actions ("danger").
 *
 * Context:
 * Used throughout the app for critical user decisions such as:
 * - Deleting a project or collaborator (danger tone)
 * - Confirming irreversible operations
 * - Capturing a short text input before saving or renaming items
 */

import Modal from "./Modal";
import "../../styles/confirm-modal.css";

/**
 * ConfirmationDialogProps
 * -------------------------
 * Props accepted by the ConfirmationDialog component.
 *
 * - open: Controls visibility of the modal.
 * - mode: Either "confirm" (yes/no) or "prompt" (input required).
 * - title: Custom modal title (optional).
 * - message: Main message body shown inside modal.
 * - confirmLabel: Custom label for confirm button.
 * - cancelLabel: Custom label for cancel button.
 * - tone: Visual emphasis ("info" | "danger"), defaults to info.
 * - inputLabel: Label for the prompt input field (if mode = "prompt").
 * - placeholder: Placeholder text for the input field.
 * - value: Current value of input field (for controlled components).
 * - error: Optional error text displayed under the input field.
 * - onCancel: Handler called when user cancels or closes modal.
 * - onConfirm: Handler called when user confirms action.
 * - onChange: Handler called when user types in the prompt field.
 */
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

/**
 * ConfirmationDialog
 * -------------------
 * Displays a confirmation or prompt modal.
 * Relies on the shared Modal component for accessibility and layout consistency.
 */
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
  // Determine fallback text based on mode
  const resolvedTitle =
    title ?? (mode === "confirm" ? "Confirm action" : "Enter a value");
  const resolvedConfirmLabel =
    confirmLabel ?? (mode === "confirm" ? "Confirm" : "Save");
  const resolvedCancelLabel = cancelLabel ?? "Cancel";

  return (
    <Modal
      open={open}
      title={resolvedTitle}
      onClose={onCancel}
      className={tone === "danger" ? "modal--danger" : undefined}
      footer={
        <div className="modal-actions confirm-modal__actions">
          {/* Cancel button */}
          <button
            type="button"
            className="modal-button modal-button--ghost"
            onClick={onCancel}
          >
            {resolvedCancelLabel}
          </button>

          {/* Confirm button */}
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
      {/* ---- Message Body ---- */}
      <p className="confirm-modal__message">{message}</p>

      {/* ---- Optional Input Field (Prompt Mode) ---- */}
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
