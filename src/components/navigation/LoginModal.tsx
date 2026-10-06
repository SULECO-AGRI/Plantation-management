import React, { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../common/Modal'
import { useAuth } from '../../context/AuthContext'
import type { UserProfile, UserRole } from '../../types/auth'

type LoginModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: UserProfile) => void
}

type DemoAccount = {
  role: UserRole
  roleName: string
  username: string
  password: string
  targetTab: 'map' | 'workforce' | 'tasks' | 'harvest' | 'incidents'
  targetLabel: string
  badgeColor: string
  icon: string
  desc: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'super_admin',
    roleName: 'Super Admin',
    username: 'admin',
    password: 'estate123',
    targetTab: 'map',
    targetLabel: 'GIS Interactive Map & Overview',
    badgeColor: '#155e43',
    icon: '👑',
    desc: 'Global control: dispatch tasks to Division Managers & Field Officers, view analytics',
  },
  {
    role: 'division_manager',
    roleName: 'Division Manager',
    username: 'manager',
    password: 'estate123',
    targetTab: 'tasks',
    targetLabel: 'Division Tasks & Harvest Operations',
    badgeColor: '#0d9488',
    icon: '📊',
    desc: 'View Super Admin tasks, dispatch work orders to your Field Officers & oversee division',
  },
  {
    role: 'field_officer',
    roleName: 'Field Officer',
    username: 'officer',
    password: 'estate123',
    targetTab: 'tasks',
    targetLabel: 'Assigned Work Orders & Attendance',
    badgeColor: '#0369a1',
    icon: '📋',
    desc: 'View assigned tasks & update status, roll-call & harvest weigh-ins (cannot add tasks)',
  },
  {
    role: 'worker',
    roleName: 'Employee',
    username: 'worker',
    password: 'estate123',
    targetTab: 'workforce',
    targetLabel: 'Workforce Portal & Attendance',
    badgeColor: '#7c3aed',
    icon: '🧑‍🌾',
    desc: 'Harvester gang roll call, daily field tasks & personal yield tracking',
  },
]

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, getRoleDefaultTab } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    if (!username.trim()) {
      setErrorMessage('Please enter your username or email.')
      return
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your access password.')
      return
    }

    try {
      setIsSubmitting(true)
      const user = await login(username, password)
      const targetTab = user.defaultTab || getRoleDefaultTab(user.role)
      const targetAccount = DEMO_ACCOUNTS.find((a) => a.role === user.role)
      const destinationTitle = targetAccount ? targetAccount.targetLabel : `${targetTab.toUpperCase()} Portal`

      setRedirectNotice(`Authenticated as ${user.name} (${user.roleTitle}). Redirecting to ${destinationTitle}...`)

      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess(user)
        navigate(`/map?tab=${targetTab}`)
      }, 700)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLogin = async (acc: DemoAccount) => {
    setUsername(acc.username)
    setPassword(acc.password)
    setErrorMessage(null)

    try {
      setIsSubmitting(true)
      const user = await login(acc.username, acc.password)
      setRedirectNotice(`Logged in as ${acc.roleName}. Redirecting to ${acc.targetLabel}...`)

      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess(user)
        navigate(`/map?tab=${acc.targetTab}`)
      }, 600)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo login failed.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plantation Operations Portal Login"
      subtitle="Sign in to access your role-tailored agricultural tools"
      icon={<Lock size={20} className="text-emerald" />}
      maxWidth="md"
    >
      <div className="login-modal-body">
        {/* Redirecting Notice Toast */}
        {redirectNotice && (
          <div className="login-alert login-alert--success">
            <CheckCircle2 size={18} />
            <div>
              <strong>Access Granted!</strong>
              <p>{redirectNotice}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="login-alert login-alert--error">
            <AlertCircle size={18} />
            <div>
              <strong>Authentication Error</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-username" className="form-label">
              Username or Work Email
            </label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="login-username"
                type="text"
                className="form-input"
                placeholder="e.g. admin, manager, officer, worker"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="login-password" className="form-label">
                Access Password
              </label>
              <span className="demo-pass-hint">Demo: <code>estate123</code></span>
            </div>
            <div className="input-with-icon">
              <KeyRound size={16} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="login-form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember session on this device</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn--primary login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span>Or Choose a Role to Test One-Click Login</span>
        </div>

        {/* Quick Demo Role Cards */}
        <div className="demo-accounts-grid">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              className="demo-account-card"
              onClick={() => handleQuickLogin(acc)}
              disabled={isSubmitting}
              title={`Log in as ${acc.roleName}`}
            >
              <div className="demo-account-card__top">
                <span className="demo-account-card__icon">{acc.icon}</span>
                <span className="demo-account-card__role" style={{ color: acc.badgeColor }}>
                  {acc.roleName}
                </span>
              </div>
              <p className="demo-account-card__desc">{acc.desc}</p>
              <div className="demo-account-card__footer">
                <span className="demo-account-card__dest">
                  <Sparkles size={12} />
                  <span>Redirects to: <strong>{acc.targetLabel}</strong></span>
                </span>
                <span className="demo-account-card__creds">
                  User: <code>{acc.username}</code>
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="login-modal-security-note">
          <ShieldCheck size={14} />
          <span>Role-Based Access Control active. Your authenticated role restricts visible division records and authorization actions.</span>
        </div>
      </div>
    </Modal>
  )
}
