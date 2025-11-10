/**
 * EditProfileModal Component
 * ----------------------------
 * A user-facing modal that allows profile customization, including
 * updating the bio and uploading/removing an avatar image.
 *
 * Responsibilities:
 * - Display a live preview of the user’s profile photo.
 * - Allow avatar upload or removal (via `onUploadAvatar`).
 * - Manage bio input with character count and validation.
 * - Integrate asynchronous save and upload operations through hooks.
 *
 * Context:
 * Invoked from the user Profile page when the “Edit Profile” button is pressed.
 * Built on the reusable `Modal` component for consistent accessibility and layout.
 */

import Modal from "./Modal";
import { resolveAssetUrl } from "../../utils/url";
import { useEditProfileModal } from "../../hooks/useEditProfileModal";

const BIO_LIMIT = 500;

/**
 * EditProfileModalProps
 * ----------------------
 * Props accepted by the EditProfileModal component.
 *
 * - open: Whether the modal is visible.
 * - initialBio: Current user bio (for editing).
 * - initialAvatarUrl: Existing profile image URL.
 * - onClose: Called when modal is dismissed.
 * - onSave: Async handler that updates user profile on backend.
 * - onUploadAvatar: Async handler that uploads and returns avatar URL.
 */
type EditProfileModalProps = {
  open: boolean;
  initialBio?: string | null;
  initialAvatarUrl?: string | null;
  onClose(): void;
  onSave(updates: { bio?: string; avatar_url?: string | null }): Promise<void>;
  onUploadAvatar(file: File): Promise<string>;
};

/**
 * EditProfileModal
 * -----------------
 * Renders a structured form for editing user profile details.
 * Handles avatar uploads and bio text updates with built-in validation.
 */
export default function EditProfileModal({
  open,
  initialBio,
  initialAvatarUrl,
  onClose,
  onSave,
  onUploadAvatar,
}: EditProfileModalProps) {
  /**
   * Hook: useEditProfileModal
   * --------------------------
   * Centralizes state and event handlers for:
   * - Avatar preview, upload, removal.
   * - Bio text input and validation.
   * - Async save state, errors, and character tracking.
   */
  const {
    bio,
    setBio,
    avatarUrl,
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
  } = useEditProfileModal({
    open,
    initialBio,
    initialAvatarUrl,
    onClose,
    onSave,
    onUploadAvatar,
  });

  const resolvedAvatarPreview = resolveAssetUrl(avatarUrl);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profile"
      className="modal--wide"
      footer={
        <div className="modal-actions">
          {/* Cancel button */}
          <button
            type="button"
            className="modal-button modal-button--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          {/* Save button */}
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
      {/* Edit Profile Form */}
      <form id="edit-profile-form" className="modal-form" onSubmit={handleSubmit}>
        {/* ---------- Avatar Section ---------- */}
        <div className="modal-field avatar-upload">
          <label className="modal-field__label">Profile photo</label>

          {/* Avatar preview */}
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

          {/* Avatar upload controls */}
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
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar || saving}
              >
                Remove
              </button>
            )}
          </div>

          {/* Avatar helper and error messages */}
          {avatarCleared && (
            <p className="modal-helper modal-helper--warning">
              Your photo will be removed after saving.
            </p>
          )}
          {avatarUploadError && (
            <p className="modal-error">{avatarUploadError}</p>
          )}
        </div>

        {/* ---------- Bio Section ---------- */}
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

        {/* ---------- Error Feedback ---------- */}
        {error && <p className="modal-error">{error}</p>}
      </form>
    </Modal>
  );
}
