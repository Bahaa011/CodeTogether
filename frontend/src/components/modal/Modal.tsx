import { useEffect, useId } from "react";
import type { ReactNode } from "react";
import "../../styles/modal.css";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose(): void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  className,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

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

  if (!open) {
    return null;
  }

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

        <div className="modal__body">{children}</div>

        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
