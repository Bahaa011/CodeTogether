/**
 * Modal Component
 * ----------------
 * A reusable and accessible modal dialog used throughout the CodeTogether frontend.
 *
 * Responsibilities:
 * - Provide a centered overlay that traps focus and displays contextual content.
 * - Handle closing behavior via Escape key or background click.
 * - Support custom headers, bodies, and footers for flexible composition.
 *
 * Context:
 * Used by multiple features such as:
 *  - InviteCollaboratorModal
 *  - ProjectSettingsModal
 *  - Confirmation modals
 *  - Error or info dialogs
 *
 * Accessibility:
 * - Implements proper ARIA attributes for modal dialogs.
 * - Restores Escape-key handling and overlay click detection for keyboard users.
 */

import { useEffect, useId } from "react";
import type { ReactNode } from "react";
import "../../styles/modal.css";

/**
 * ModalProps
 * ------------
 * Props accepted by the Modal component.
 *
 * - open: Whether the modal is visible.
 * - title: Optional header title displayed at the top of the modal.
 * - onClose: Called when the modal should close (Escape or background click).
 * - children: Modal body content.
 * - footer: Optional footer (e.g., action buttons).
 * - className: Optional extra class to customize size or layout.
 */
type ModalProps = {
  open: boolean;
  title?: string;
  onClose(): void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * Modal
 * -------
 * Renders a full-screen overlay with a focusable dialog box.
 * Supports Escape-key dismissal and overlay click detection.
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  className,
}: ModalProps) {
  const titleId = useId();

  /**
   * Keyboard shortcut: close on Escape
   * -----------------------------------
   * Registers a temporary window listener while modal is open.
   */
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Render nothing if the modal is closed
  if (!open) return null;

  /**
   * Overlay click handler
   * ----------------------
   * Closes modal only when clicking directly on the backdrop,
   * not when interacting with inner content.
   */
  const handleOverlayMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div
        className={className ? `modal ${className}` : "modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {/* -------- Header -------- */}
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="modal__close"
            aria-label="Close modal"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </header>

        {/* -------- Body -------- */}
        <div className="modal__body">{children}</div>

        {/* -------- Footer -------- */}
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
