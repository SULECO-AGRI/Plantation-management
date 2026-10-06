import React, { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../common/Modal'
import { useAuth } from '../../context/AuthContext'
import type { UserProfile } from '../../types/auth'

type LoginModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: UserProfile) => void
}

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
      setErrorMessage('Please enter your password.')
      return
    }

    try {
      setIsSubmitting(true)
      const user = await login(username, password)
      const targetTab = user.defaultTab || getRoleDefaultTab(user.role)

      setRedirectNotice(`Signed in as ${user.name}. Redirecting...`)

      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess(user)
        navigate(`/map?tab=${targetTab}`)
      }, 500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid username or password.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign In"
      subtitle="Enter your username and password to continue"
      maxWidth="sm"
    >
      <div className="login-modal-body">
        {/* Redirecting Notice Toast */}
        {redirectNotice && (
          <div className="login-alert login-alert--success">
            <CheckCircle2 size={18} />
            <div>
              <strong>Access Granted</strong>
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
              Username or Email
            </label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="login-username"
                type="text"
                className="form-input"
                placeholder="Enter username"
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
                Password
              </label>
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
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn--primary login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
