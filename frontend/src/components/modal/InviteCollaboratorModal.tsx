import Modal from "./Modal";
import { useInviteCollaboratorModal } from "../../hooks/useInviteCollaboratorModal";

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
  const { identifier, setIdentifier, error, submitting, handleSubmit } =
    useInviteCollaboratorModal({ open, onInvite, onClose });

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
