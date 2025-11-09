import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

const BIO_LIMIT = 500;

type UseEditProfileModalOptions = {
  open: boolean;
  initialBio?: string | null;
  initialAvatarUrl?: string | null;
  onClose(): void;
  onSave(updates: { bio?: string; avatar_url?: string | null }): Promise<void>;
  onUploadAvatar(file: File): Promise<string>;
};

export function useEditProfileModal({
  open,
  initialBio,
  initialAvatarUrl,
  onClose,
  onSave,
  onUploadAvatar,
}: UseEditProfileModalOptions) {
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

  const remainingCharacters = useMemo(
    () => BIO_LIMIT - bio.length,
    [bio.length],
  );
  const trimmedBio = bio.trim();
  const trimmedAvatar = avatarUrl.trim();
  const canSubmit = Boolean(trimmedBio || trimmedAvatar || avatarCleared);

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

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    setAvatarCleared(true);
  };

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
