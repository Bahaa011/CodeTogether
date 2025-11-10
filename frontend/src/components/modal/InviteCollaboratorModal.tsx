/**
 * InviteCollaboratorModal Component
 * ---------------------------------
 * A focused modal dialog that allows users to invite collaborators
 * to join a project by entering their username or email address.
 *
 * Responsibilities:
 * - Render a simple form to send collaboration invites.
 * - Handle validation, loading state, and submission feedback.
 * - Integrate with backend collaboration APIs via the `onInvite` callback.
 *
 * Context:
 * This modal is typically triggered from the Project Settings → Collaborators tab.
 * It uses the shared Modal UI component for consistent design and accessibility.
 */

import Modal from "./Modal";
import { useInviteCollaboratorModal } from "../../hooks/useInviteCollaboratorModal";

/**
 * InviteCollaboratorModalProps
 * -----------------------------
 * Props accepted by the InviteCollaboratorModal component.
 *
 * - open: Whether the modal is visible.
 * - onClose: Closes the modal when user cancels or completes the action.
 * - onInvite: Async function that sends the invitation using a username or email.
 */
type InviteCollaboratorModalProps = {
  open: boolean;
  onClose(): void;
  onInvite(identifier: string): Promise<void>;
};

/**
 * InviteCollaboratorModal
 * ------------------------
 * Handles collaborator invitation through a minimal form interface.
 * Uses a custom hook for managing internal state and async submission logic.
 */
export default function InviteCollaboratorModal({
  open,
  onClose,
  onInvite,
}: InviteCollaboratorModalProps) {
  /**
   * Hook: useInviteCollaboratorModal
   * ---------------------------------
   * Manages form state, input binding, validation, submission, and errors.
   * - identifier: User-entered username or email.
   * - submitting: Loading state during invite request.
   * - handleSubmit: Submits the form to send the invite.
   */
  const { identifier, setIdentifier, error, submitting, handleSubmit } =
    useInviteCollaboratorModal({ open, onInvite, onClose });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Collaborator"
      footer={
        <div className="modal-actions">
          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="modal-button modal-button--ghost"
            disabled={submitting}
          >
            Cancel
          </button>

          {/* Submit button */}
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
      {/* Invite collaborator form */}
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

        {/* Error message */}
        {error && <p className="modal-error">{error}</p>}
      </form>
    </Modal>
  );
}
