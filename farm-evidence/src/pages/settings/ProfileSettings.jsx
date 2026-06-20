import { useState } from 'react';
import { useTrialContext, getInitials, getAvatarColor } from '../../context/TrialContext';
import { updateProfile, updateEmail } from '../../api/auth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/FormElements';
import { Button } from '../../components/ui/Button';

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ProfileSettings() {
  const { user, refreshUser } = useTrialContext();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');

  const initials = getInitials(user?.name);
  const avatarColor = getAvatarColor(user?.name);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      try {
        await updateProfile({ photoUrl: dataUrl });
        setPhotoUrl(dataUrl);
        await refreshUser();
        showSuccess('Profile updated');
      } catch (error) {
        console.error('Failed to upload profile photo:', error);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    try {
      await updateProfile({ photoUrl: null });
      setPhotoUrl('');
      await refreshUser();
      showSuccess('Profile updated');
    } catch (error) {
      console.error('Failed to remove profile photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name, phone });
      await refreshUser();
      showSuccess('Profile updated');
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setEmailError('');
    setIsSaving(true);
    try {
      await updateEmail({ email });
      await refreshUser();
      showSuccess('Profile updated');
    } catch (error) {
      if (error?.response?.status === 409) {
        setEmailError('This email is already in use.');
      } else {
        console.error('Failed to update email:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card accent="none" className="space-y-6 p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div
              className="h-24 w-24 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex items-center justify-center text-4xl font-semibold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={user?.name || 'Avatar'} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Photo</h2>
              <p className="mt-1 text-sm text-slate-600">Upload a profile photo to personalize your account.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200">
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </label>
            {photoUrl ? (
              <Button variant="secondary" onClick={handleRemovePhoto} disabled={isUploading}>
                Remove Photo
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-slate-500">
          For production, upload the image to object storage (S3 / Cloudinary) and store a URL instead of a base64 blob.
        </p>
      </Card>

      <Card accent="none" className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Basic Info</h2>
            <p className="mt-1 text-sm text-slate-600">Update your name and phone number. Change your email separately.</p>
          </div>
          {successMessage ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              {successMessage}
            </span>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="full-name">
              Full Name
            </label>
            <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="phone">
              Phone
            </label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {emailError ? <p className="text-sm text-rose-600">{emailError}</p> : null}
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={handleSaveEmail} disabled={isSaving}>
              Save Email
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            Save Changes
          </Button>
        </div>
      </Card>

      <Card accent="none" className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Account Info</h2>
          <p className="mt-1 text-sm text-slate-600">Your role, mode, and account activity are shown here.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Role</p>
            <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              {user?.role ?? 'Unknown'}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Mode</p>
            <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {user?.mode ?? 'Unknown'}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Member since</p>
            <p className="mt-2 text-sm text-slate-900">{formatDate(user?.createdAt)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Last login</p>
            <p className="mt-2 text-sm text-slate-900">{formatDate(user?.lastLoginAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
