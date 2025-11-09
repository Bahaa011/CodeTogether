import { useEffect, useState, type FormEvent } from "react";

type UseInviteCollaboratorModalOptions = {
  open: boolean;
  onInvite(identifier: string): Promise<void>;
  onClose(): void;
};

export function useInviteCollaboratorModal({
  open,
  onInvite,
  onClose,
}: UseInviteCollaboratorModalOptions) {
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

  return {
    identifier,
    setIdentifier,
    error,
    submitting,
    handleSubmit,
  };
}
