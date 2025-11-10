/**
 * useEditProfileModal Hook
 *
 * Manages the state and behavior of the Edit Profile modal.
 * Handles bio updates, avatar uploads, validation, and submission.
 *
 * Responsibilities:
 * - Manage controlled state for the user's bio and avatar.
 * - Handle avatar uploads, removal, and error feedback.
 * - Enforce the bio character limit (500).
 * - Provide a ready-to-use form submission handler for updating profile data.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

const BIO_LIMIT = 500;

/**
 * UseEditProfileModalOptions
 *
 * Configuration for initializing and controlling the Edit Profile modal.
 *
 * - open: Whether the modal is currently visible.
 * - initialBio: The user’s bio text when opening the modal.
 * - initialAvatarUrl: The user’s avatar URL (if any).
 * - onClose: Function called when the modal closes.
 * - onSave: Called when saving profile updates (bio, avatar, or both).
 * - onUploadAvatar: Handles avatar upload and returns the new avatar URL.
 */
type UseEditProfileModalOptions = {
  open: boolean;
  initialBio?: string | null;
  initialAvatarUrl?: string | null;
  onClose(): void;
  onSave(updates: { bio?: string; avatar_url?: string | null }): Promise<void>;
  onUploadAvatar(file: File): Promise<string>;
};

/**
 * useEditProfileModal
 *
 * Hook for managing user profile editing state.
 * Provides field values, validation, upload handling, and submission logic.
 *
 * Returns:
 * - bio, avatarUrl → Controlled form fields.
 * - error, avatarUploadError → Validation or upload error messages.
 * - saving, uploadingAvatar → Submission/loading indicators.
 * - avatarCleared → Whether the user removed their avatar.
 * - remainingCharacters → Computed remaining bio character count.
 * - canSubmit → Whether the form has valid changes.
 * - handleAvatarFileChange → Handles avatar uploads via file input.
 * - handleRemoveAvatar → Marks avatar for removal.
 * - handleSubmit → Saves the profile changes and triggers onSave.
 */
export function useEditProfileModal({
  open,
  initialBio,
  initialAvatarUrl,
  onClose,
  onSave,
  onUploadAvatar,
}: UseEditProfileModalOptions) {
  // State
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(
    null,
  );
  const [avatarCleared, setAvatarCleared] = useState(false);
  const wasOpenRef = useRef(false);

  // Reset form when modal opens for the first time
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setBio(initialBio ?? "");
      setAvatarUrl(initialAvatarUrl ?? "");
      setError(null);
      setSaving(false);
      setUploadingAvatar(false);
      setAvatarUploadError(null);
      setAvatarCleared(false);
    }
    wasOpenRef.current = open;
  }, [open, initialBio, initialAvatarUrl]);

  // Derived Computed Values
  const remainingCharacters = useMemo(
    () => BIO_LIMIT - bio.length,
    [bio.length],
  );
  const trimmedBio = bio.trim();
  const trimmedAvatar = avatarUrl.trim();
  const canSubmit = Boolean(trimmedBio || trimmedAvatar || avatarCleared);

  // Handlers

  /**
   * Handles avatar file upload via file input.
   * Uploads the image, updates the preview, and clears previous errors.
   */
  const handleAvatarFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setAvatarUploadError(null);

    try {
      const uploadedUrl = await onUploadAvatar(file);
      setAvatarUrl(uploadedUrl);
      setAvatarCleared(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to upload image.";
      setAvatarUploadError(message);
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  /**
   * Submits the profile update form.
   * Validates input and calls onSave with the modified fields.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    if (!trimmedBio && !trimmedAvatar && !avatarCleared) {
      setError("Update your bio or avatar to save changes.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        bio: trimmedBio || undefined,
        avatar_url:
          trimmedAvatar.length > 0
            ? trimmedAvatar
            : avatarCleared
              ? null
              : undefined,
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update profile.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Clears the current avatar preview and marks it for deletion.
   */
  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    setAvatarCleared(true);
  };

  // Return API
  return {
    bio,
    setBio,
    avatarUrl,
    setAvatarUrl,
    error,
    saving,
    uploadingAvatar,
    avatarUploadError,
    avatarCleared,
    remainingCharacters,
    canSubmit,
    handleAvatarFileChange,
    handleRemoveAvatar,
    handleSubmit,
  };
}
