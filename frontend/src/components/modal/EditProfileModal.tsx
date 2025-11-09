import Modal from "./Modal";
import { resolveAssetUrl } from "../../utils/url";
import { useEditProfileModal } from "../../hooks/useEditProfileModal";

type EditProfileModalProps = {
  open: boolean;
  initialBio?: string | null;
  initialAvatarUrl?: string | null;
  onClose(): void;
  onSave(updates: { bio?: string; avatar_url?: string | null }): Promise<void>;
  onUploadAvatar(file: File): Promise<string>;
};

export default function EditProfileModal({
  open,
  initialBio,
  initialAvatarUrl,
  onClose,
  onSave,
  onUploadAvatar,
}: EditProfileModalProps) {
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
                  onClick={handleRemoveAvatar}
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
