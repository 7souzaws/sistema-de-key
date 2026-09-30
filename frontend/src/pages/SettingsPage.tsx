import { useState } from 'react';
import { Save, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../services/api';

export default function SettingsPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await adminApi.changePassword(password);
      toast.success('Password updated');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-surface-400 mt-1">Manage your account settings</p>
      </div>

      <div className="card p-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-surface-700 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-surface-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Change Password</h2>
            <p className="text-sm text-surface-400">Update your admin password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="Min. 6 characters"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Confirm password"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
