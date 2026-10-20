import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { normalizeRole, type UserRole } from '../../types/auth'

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: (UserRole | string)[]
  allowedPlantations?: string[]
  fallbackPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowedPlantations,
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, isLoading, currentUser, role, plantationScope } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8faf8',
          fontFamily: 'var(--font-body, system-ui, sans-serif)',
          color: '#142820',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '2.5px solid #d8e5dc',
            borderTopColor: '#1f6b52',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7f75' }}>
          Verifying session credentials...
        </span>
      </div>
    )
  }

  // Not authenticated: Redirect to login while preserving target route
  if (!isAuthenticated || !currentUser) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Role validation
  if (allowedRoles && allowedRoles.length > 0) {
    const userNormRole = normalizeRole(currentUser.role)
    const isRoleAllowed = allowedRoles.some((allowed) => {
      const normAllowed = normalizeRole(allowed)
      return normAllowed === userNormRole || allowed.toLowerCase() === currentUser.role.toLowerCase()
    })

    if (!isRoleAllowed) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'var(--font-body, system-ui, sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              padding: '32px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e3ede6',
              boxShadow: '0 4px 16px rgba(15, 36, 28, 0.05)',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#142820',
                margin: '0 0 8px',
              }}
            >
              Access Restricted
            </h2>
            <p
              style={{
                fontSize: '13.5px',
                color: '#6b7f75',
                lineHeight: 1.5,
                margin: '0 0 20px',
              }}
            >
              Your current role (<strong>{currentUser.roleTitle || role}</strong>) does not have
              permission to access this module. Authorized roles: {allowedRoles.join(', ')}.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.history.back()}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d8e5dc',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#3c5248',
                  cursor: 'pointer',
                }}
              >
                Go Back
              </button>
              <a
                href="/login"
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#1f6b52',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                Switch Account
              </a>
            </div>
          </div>
        </div>
      )
    }
  }

  // Plantation scope validation if specified
  if (allowedPlantations && allowedPlantations.length > 0) {
    const currentPlantation = plantationScope || currentUser.plantationScope || 'Watawala'
    const isPlantationAllowed = allowedPlantations.some(
      (p) => p.toLowerCase() === currentPlantation.toLowerCase()
    )

    if (!isPlantationAllowed) {
      return <Navigate to="/map" replace />
    }
  }

  return <>{children}</>
}
