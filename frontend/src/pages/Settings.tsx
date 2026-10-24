import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Settings as SettingsIcon, Sun, Moon, User, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function Settings() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error('New passwords do not match')
      return
    }
    setPwLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      })
      toast.success('Password updated')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Password change failed')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <Layout title="Settings" subtitle="Account and application preferences">
      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader title="Profile" icon={<User size={16} />} />
          <div className="space-y-3 text-sm">
            {[
              { label: 'Username', value: user?.username },
              { label: 'Email', value: user?.email },
              { label: 'Full Name', value: user?.full_name || '—' },
              { label: 'Role', value: user?.role },
            ].map(f => (
              <div key={f.label} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">{f.label}</span>
                <span className="font-medium capitalize">{f.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader title="Appearance" icon={<SettingsIcon size={16} />} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
              <p className="text-xs text-gray-400">Currently: {theme === 'light' ? 'Light' : 'Dark'}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              Switch to {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader title="Change Password" icon={<Shield size={16} />} />
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password" className="input"
                value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password" className="input"
                value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                required minLength={8}
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password" className="input"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" isLoading={pwLoading} size="sm">Update Password</Button>
          </form>
        </Card>

        {/* Disclaimer */}
        <Card>
          <CardHeader title="Disclaimer" />
          <p className="text-xs text-gray-500 leading-relaxed">
            This application is developed for academic and research purposes. Its outputs are
            machine-learning predictions and must not be used as a substitute for professional
            medical judgment. No real patient data should be entered into this system.
            All predictions are stored in MongoDB and can be deleted from the Prediction History page.
          </p>
        </Card>
      </div>
    </Layout>
  )
}
