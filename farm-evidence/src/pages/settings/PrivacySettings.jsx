import { useState } from 'react';
import { exportMyData, deleteAccount } from '../../api/auth';
import { useTrialContext } from '../../context/TrialContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/FormElements';
import { Button } from '../../components/ui/Button';

export function PrivacySettings() {
  const { logout } = useTrialContext();
  const [exporting, setExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportMyData();
      const blob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'farmevidence-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!password || !confirmChecked) return;
    setDeleteError('');
    setIsDeleting(true);

    try {
      await deleteAccount({ password });
      logout();
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.error;
      if (status === 401 || /password/i.test(message || '')) {
        setDeleteError('Incorrect password');
      } else {
        setDeleteError(message || 'Failed to delete account');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Export Your Data</h2>
          <p className="mt-2 text-sm text-slate-600">
            Includes all your Trials/Farms, plot records, and cost data.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Downloading…' : 'Download all my data as JSON'}
          </Button>
        </div>
      </Card>

      <Card className="border-terracotta bg-terracotta-pale p-6 text-terracotta">
        <div>
          <h2 className="text-xl font-semibold text-terracotta">Delete Account</h2>
          <p className="mt-2 max-w-2xl text-sm text-terracotta/80">
            This permanently deletes your account. Your existing Trials and Farms will remain in the database but become inaccessible without your login. This cannot be undone.
          </p>
        </div>

        <div className="mt-6">
          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
            disabled={isDeleting}
          >
            Delete My Account
          </Button>
        </div>
      </Card>

      {deleteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Confirm account deletion</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Type your password and confirm the warning to permanently delete your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPassword('');
                  setConfirmChecked(false);
                  setDeleteError('');
                }}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Enter your password to confirm
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-terracotta focus:ring-terracotta"
                />
                <span>I understand this is permanent</span>
              </label>

              {deleteError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {deleteError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setPassword('');
                    setConfirmChecked(false);
                    setDeleteError('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={!confirmChecked || !password || isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? 'Deleting…' : 'Permanently Delete Account'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
