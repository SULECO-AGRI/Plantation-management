import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserProfile } from '../../types/auth'

type LoginFormProps = {
  onSuccess?: (user: UserProfile) => void
  redirectAfterLogin?: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectAfterLogin = true,
}) => {
  const { login, getRoleDefaultTab } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusNotice, setStatusNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFillCredentials = (u: string, p: string = 'estate123') => {
    setUsername(u)
    setPassword(p)
    setErrorMessage(null)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)
    setStatusNotice(null)

    if (!username.trim()) {
      setErrorMessage('Please enter your username or work email address.')
      return
    }

    try {
      setIsSubmitting(true)
      // Login automatically determines the user's role and assigned plantation from credentials
      const user = await login(username, password)
      
      const plantation = user.plantationScope || 'Agalawatte'
      const roleTitle = user.roleTitle || user.role

      setStatusNotice(`Authenticated as ${user.name} (${roleTitle}). Routing to ${plantation} map view...`)

      setTimeout(() => {
        if (onSuccess) onSuccess(user)

        if (redirectAfterLogin) {
          // Automatic role & plantation routing strictly dictated by credentials:
          // admin_wat, manager_wat, officer_wat -> always Watawala map
          // admin, manager, officer -> always Agalawatte map
          const isWatawala = (user.plantationScope || '').toLowerCase() === 'watawala'
          const plantationParam = isWatawala ? 'watawala' : 'agalawatte'
          const defaultTab = user.defaultTab || getRoleDefaultTab(user.role)

          // If the user previously attempted to access a specific tab, honor it
          const stateObj = location.state as { from?: { pathname?: string; search?: string } } | undefined
          let targetTab = defaultTab
          if (stateObj?.from?.search) {
            const params = new URLSearchParams(stateObj.from.search)
            const requestedTab = params.get('tab')
            if (requestedTab) {
              targetTab = requestedTab as any
            }
          }

          if (user.role === 'super_admin' || user.role === 'Admin' || targetTab === 'map') {
            navigate(`/map?plantation=${plantationParam}`, { replace: true })
          } else {
            navigate(`/map?plantation=${plantationParam}&tab=${targetTab}`, { replace: true })
          }
        }
      }, 400)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid username or password.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="clean-login-card">
      <div className="clean-login-header">
        <h1 className="clean-login-title">Plantation Portal Sign In</h1>
      </div>

      {/* Status Notice (Minimalist without decorative icons) */}
      {statusNotice && (
        <div className="clean-alert clean-alert--success" role="status">
          <strong>Access Authorized</strong>
          <p>{statusNotice}</p>
        </div>
      )}

      {/* Error Alert (Minimalist without decorative icons) */}
      {errorMessage && (
        <div className="clean-alert clean-alert--error" role="alert">
          <strong>Authentication Failed</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Direct Credentials Form */}
      <form onSubmit={handleSubmit} className="clean-login-form">
        <div className="clean-form-group">
          <label htmlFor="login-username" className="clean-form-label">
            Username or Work Email
          </label>
          <input
            id="login-username"
            type="text"
            className="clean-form-input"
            placeholder="admin, manager, officer (Agalawatte) or admin_wat, manager_wat, officer_wat (Watawala)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            autoComplete="username"
            autoFocus
            required
          />
        </div>

        <div className="clean-form-group">
          <div className="clean-label-row">
            <label htmlFor="login-password" className="clean-form-label">
              Password
            </label>
            <button
              type="button"
              className="clean-text-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            className="clean-form-input"
            placeholder="Enter password (default: estate123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="clean-form-options">
          <label className="clean-checkbox-label">
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
          className="clean-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Authenticating & Routing...' : 'Sign In'}
        </button>
      </form>

      {/* Quick Demo Credentials Footer */}
      <div className="clean-demo-accounts">
        <span className="clean-demo-title">Test Credentials (Password: estate123):</span>
        
        <div style={{ marginTop: '8px', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#3c5248' }}>
          Agalawatte Map:
        </div>
        <div className="clean-demo-buttons">
          <button
            type="button"
            className="clean-demo-chip"
            onClick={() => handleFillCredentials('admin')}
            title="Agalawatte Admin (Username: admin)"
          >
            admin
          </button>
          <button
            type="button"
            className="clean-demo-chip"
            onClick={() => handleFillCredentials('manager')}
            title="Agalawatte Manager (Username: manager)"
          >
            manager
          </button>
          <button
            type="button"
            className="clean-demo-chip"
            onClick={() => handleFillCredentials('officer')}
            title="Agalawatte Officer (Username: officer)"
          >
            officer
          </button>
        </div>

        <div style={{ marginTop: '10px', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#3c5248' }}>
          Watawala Map:
        </div>
        <div className="clean-demo-buttons">
          <button
            type="button"
            className="clean-demo-chip"
            onClick={() => handleFillCredentials('admin_wat')}
            title="Watawala Admin (Username: admin_wat)"
          >
            admin_wat
          </button>
          <button
            type="button"
            className="clean-demo-chip"
            onClick={() => handleFillCredentials('manager_wat')}
            title="Watawala Manager (Username: manager_wat)"
          >
            manager_wat
          </button>
          <button
            type="button"
            className="clean-demo-chip"
            onClick={() => handleFillCredentials('officer_wat')}
            title="Watawala Officer (Username: officer_wat)"
          >
            officer_wat
          </button>
        </div>
      </div>
    </div>
  )
}
