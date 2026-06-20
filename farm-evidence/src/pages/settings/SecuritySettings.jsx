import { useState } from 'react';
import { changePassword } from '../../api/auth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/FormElements';
import { Button } from '../../components/ui/Button';

const SYMBOL_REGEX = /[!@#$%^&*(),.?":{}|<>]/;
const NUMBER_REGEX = /[0-9]/;
const UPPERCASE_REGEX = /[A-Z]/;

function getPasswordStrength(password) {
  const lengthScore = password.length >= 8 ? 1 : 0;
  const numberScore = NUMBER_REGEX.test(password) ? 1 : 0;
  const advancedScore = UPPERCASE_REGEX.test(password) && SYMBOL_REGEX.test(password) ? 1 : 0;
  return lengthScore + numberScore + advancedScore;
}

function getStrengthLabel(score) {
  if (score === 3) return 'Strong';
  if (score === 2) return 'Fair';
  if (score === 1) return 'Weak';
  return 'Too weak';
}

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strengthScore = getPasswordStrength(newPassword);
  const strengthLabel = getStrengthLabel(strengthScore);

  const getStrengthClasses = (index) => {
    const filled = index <= strengthScore;
    const base = 'h-2 rounded-full transition-colors';
    if (!filled) return `${base} bg-slate-200`;
    if (strengthScore === 1) return `${base} bg-terracotta`;
    if (strengthScore === 2) return `${base} bg-amber-400`;
    return `${base} bg-canopy`;
  };

  const clearForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleSubmit = async () => {
    const nextErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = 'Current password is required.';
    }
    if (newPassword.length < 8) {
      nextErrors.newPassword = 'New password must be at least 8 characters.';
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await changePassword({ currentPassword, newPassword });
      setSuccessMessage('Password updated successfully');
      clearForm();
      window.setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      if (error?.response?.status === 401) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        setErrors({ form: 'Unable to update password. Please try again.' });
        console.error('Password update failed:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card accent="none" className="space-y-6 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
            <p className="mt-1 text-sm text-slate-600">Update your account password to keep your profile secure.</p>
          </div>
          {successMessage ? (
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              {successMessage}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="current-password">
              Current Password
            </label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500"
              >
                {showCurrent ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.currentPassword ? <p className="text-sm text-rose-600">{errors.currentPassword}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="new-password">
              New Password
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500"
              >
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex w-full gap-2">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className={getStrengthClasses(index)} />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-700">{strengthLabel}</span>
              </div>
              {errors.newPassword ? <p className="text-sm text-rose-600">{errors.newPassword}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500"
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword ? <p className="text-sm text-rose-600">{errors.confirmPassword}</p> : null}
          </div>

          {errors.form ? <p className="text-sm text-rose-600">{errors.form}</p> : null}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              Update Password
            </Button>
          </div>
        </div>
      </Card>

      <Card accent="none" className="p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Active Session</h2>
          <p className="mt-2 text-sm text-slate-600">You are currently logged in on this device.</p>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          {/* A full manage active sessions experience would require server-side session/token tracking beyond a single JWT. */}
          A full active session management view is a future enhancement that requires server-side session tracking.
        </p>
      </Card>
    </div>
  );
}
