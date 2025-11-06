import { type FormEvent, useEffect, useState } from "react";
import Modal from "./Modal";

type InviteCollaboratorModalProps = {
  open: boolean;
  onClose(): void;
  onInvite(identifier: string): Promise<void>;
};

export default function InviteCollaboratorModal({
  open,
  onClose,
  onInvite,
}: InviteCollaboratorModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setIdentifier("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("Enter a username or email to send an invite.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onInvite(trimmed);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send invitation.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Collaborator"
      footer={
        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="modal-button modal-button--ghost"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="invite-collaborator-form"
            className="modal-button modal-button--primary"
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Send Invite"}
          </button>
        </div>
      }
    >
      <form
        id="invite-collaborator-form"
        onSubmit={handleSubmit}
        className="modal-form"
      >
        <div className="modal-field">
          <label htmlFor="invite-identifier" className="modal-field__label">
            Username or Email
          </label>
          <input
            id="invite-identifier"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="modal-field__control"
            placeholder="dev@example.com or dev_username"
            disabled={submitting}
            autoFocus
          />
          <p className="modal-helper">
            We&apos;ll send a collaboration invite that they can accept or decline.
          </p>
        </div>

        {error && <p className="modal-error">{error}</p>}
      </form>
    </Modal>
  );
}
