/**
 * useInviteCollaboratorModal Hook
 *
 * Handles all logic related to the "Invite Collaborator" modal,
 * including form state, validation, and submission.
 *
 * Responsibilities:
 * - Manage user input for collaborator identifier (username or email).
 * - Validate form input before submission.
 * - Call `onInvite` to send an invitation through the backend.
 * - Handle loading and error states.
 * - Reset modal state when it closes.
 */

import { useEffect, useState, type FormEvent } from "react";

/**
 * UseInviteCollaboratorModalOptions
 *
 * Defines the configuration options passed to `useInviteCollaboratorModal`.
 *
 * Properties:
 * - open: Boolean indicating if the modal is currently visible.
 * - onInvite: Async callback invoked when the user submits a valid identifier.
 * - onClose: Function called when the modal should close (after success or cancel).
 */
type UseInviteCollaboratorModalOptions = {
  open: boolean;
  onInvite(identifier: string): Promise<void>;
  onClose(): void;
};

/**
 * useInviteCollaboratorModal
 *
 * Provides reactive logic and handlers for the Invite Collaborator modal.
 *
 * Returns:
 * - identifier: Current value of the input field (username/email).
 * - setIdentifier: Setter for the identifier input value.
 * - error: Validation or request error message (if any).
 * - submitting: Boolean indicating whether a submission is in progress.
 * - handleSubmit: Form submit handler to validate and send the invite.
 */
export function useInviteCollaboratorModal({
  open,
  onInvite,
  onClose,
}: UseInviteCollaboratorModalOptions) {
  // Form state
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Effect: Reset modal state when it is closed.
   * Clears identifier, error messages, and submission status.
   */
  useEffect(() => {
    if (!open) {
      setIdentifier("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  /**
   * handleSubmit
   *
   * Triggered when the user submits the form.
   * Validates the input, calls `onInvite`, handles errors,
   * and closes the modal on success.
   */
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

  // Return API
  return {
    identifier,
    setIdentifier,
    error,
    submitting,
    handleSubmit,
  };
}
