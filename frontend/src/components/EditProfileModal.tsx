import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Modal from "./Modal";
import { resolveAssetUrl } from "../utils/url";

type EditProfileModalProps = {
  open: boolean;
  initialBio?: string | null;
  initialAvatarUrl?: string | null;
  onClose(): void;
  onSave(updates: { bio?: string; avatar_url?: string }): Promise<void>;
  onUploadAvatar(file: File): Promise<string | undefined>;
};

const BIO_LIMIT = 500;

export default function EditProfileModal({
  open,
  initialBio,
  initialAvatarUrl,
  onClose,
  onSave,
  onUploadAvatar,
}: EditProfileModalProps) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
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

  const trimmedBio = bio.trim();
  const trimmedAvatar = avatarUrl.trim();
  const remainingCharacters = useMemo(
    () => BIO_LIMIT - bio.length,
    [bio.length],
  );
  const canSubmit = Boolean(trimmedBio || trimmedAvatar || avatarCleared);
  const resolvedAvatarPreview = useMemo(
    () => resolveAssetUrl(avatarUrl),
    [avatarUrl],
  );

  const handleAvatarFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setAvatarUploadError(null);

    try {
      const uploadedUrl = await onUploadAvatar(file);
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        setAvatarCleared(false);
      }
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profile"
      className="modal--wide"
      footer={
        <div className="modal-actions">
          <button
            type="button"
            className="modal-button modal-button--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            className="modal-button modal-button--primary"
            disabled={saving || !canSubmit}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      }
    >
      <form id="edit-profile-form" className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-field avatar-upload">
          <label className="modal-field__label">Profile photo</label>
          <div className="avatar-upload__preview">
            {resolvedAvatarPreview ? (
              <img
                src={resolvedAvatarPreview}
                alt="Profile preview"
                className="avatar-upload__image"
              />
            ) : (
              <div className="avatar-upload__placeholder">No photo yet</div>
            )}
          </div>
          <div className="avatar-upload__actions">
            <label className="avatar-upload__button">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                disabled={uploadingAvatar || saving}
              />
              {uploadingAvatar ? "Uploading…" : "Upload image"}
            </label>
            {avatarUrl && (
              <button
                type="button"
                className="avatar-upload__reset"
                onClick={() => {
                  setAvatarUrl("");
                  setAvatarCleared(true);
                }}
                disabled={uploadingAvatar || saving}
              >
                Remove
              </button>
            )}
          </div>
          {avatarCleared && (
            <p className="modal-helper modal-helper--warning">
              Your photo will be removed after saving.
            </p>
          )}
          {avatarUploadError && (
            <p className="modal-error">{avatarUploadError}</p>
          )}
        </div>

        <div className="modal-field">
          <label htmlFor="edit-bio" className="modal-field__label">
            Bio
          </label>
          <textarea
            id="edit-bio"
            className="modal-field__control modal-textarea"
            value={bio}
            onChange={(event) => {
              const { value } = event.target;
              setBio(value.slice(0, BIO_LIMIT));
            }}
            placeholder="Tell the community a bit about your skills and goals."
            disabled={saving}
          />
          <div className="modal-helper">
            <span>{remainingCharacters} characters left</span>
          </div>
        </div>

        {error && <p className="modal-error">{error}</p>}
      </form>
    </Modal>
  );
}
