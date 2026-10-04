import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ShieldCheck, Sparkles, UserCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types/auth'

export const RoleSwitcher: React.FC = () => {
  const { currentUser, users, switchRole, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!currentUser) return null

  const handleSelectRole = async (role: UserRole) => {
    await switchRole(role)
    setIsOpen(false)
  }

  return (
    <div className="role-switcher" ref={dropdownRef}>
      <button
        type="button"
        className="role-switcher-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title="Switch User Persona (RBAC Testing)"
      >
        <div className="role-avatar-wrapper">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="role-avatar-img"
          />
          <span
            className="role-status-dot"
            style={{ backgroundColor: currentUser.badgeColor }}
          />
        </div>
        <div className="role-switcher-text">
          <span className="role-user-name">{currentUser.name}</span>
          <span className="role-user-title">
            <span
              className="role-badge-pill"
              style={{ backgroundColor: `${currentUser.badgeColor}18`, color: currentUser.badgeColor }}
            >
              {currentUser.role === 'estate_manager' && 'Super Admin'}
              {currentUser.role === 'field_officer' && 'Supervisor'}
              {currentUser.role === 'kangany' && 'Field Lead'}
              {currentUser.role === 'agronomist' && 'Agronomist'}
            </span>
            <span className="role-scope-chip">{currentUser.divisionScope}</span>
          </span>
        </div>
        <ChevronDown size={14} className={`role-chevron ${isOpen ? 'role-chevron--open' : ''}`} />
      </button>

      {isOpen && (
        <div className="role-dropdown-menu">
          <div className="role-dropdown-header">
            <div className="role-dropdown-header__title">
              <ShieldCheck size={14} />
              <span>Role-Based Access Control (RBAC)</span>
            </div>
            <p className="role-dropdown-header__subtitle">
              Switch persona to test permissions and operational scopes
            </p>
          </div>

          <div className="role-options-list">
            {users.map((user) => {
              const isActive = currentUser.role === user.role
              return (
                <button
                  key={user.id}
                  type="button"
                  className={`role-option-item ${isActive ? 'role-option-item--active' : ''}`}
                  onClick={() => handleSelectRole(user.role)}
                  disabled={isLoading}
                >
                  <div className="role-option-avatar-box">
                    <img src={user.avatar} alt={user.name} />
                    {isActive && (
                      <span className="role-option-check">
                        <Check size={11} />
                      </span>
                    )}
                  </div>
                  <div className="role-option-info">
                    <div className="role-option-headline">
                      <strong>{user.name}</strong>
                      <span
                        className="role-tag"
                        style={{ backgroundColor: `${user.badgeColor}22`, color: user.badgeColor }}
                      >
                        {user.role === 'estate_manager' ? 'Super Admin' : user.roleTitle.split('/')[0].trim()}
                      </span>
                    </div>
                    <div className="role-option-meta">
                      <span>Scope: <strong>{user.divisionScope}</strong></span>
                      <span>•</span>
                      <span>{user.phone}</span>
                    </div>
                    <p className="role-option-desc">{user.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="role-dropdown-footer">
            <Sparkles size={13} />
            <span>Active session permissions applied instantly across GIS &amp; ERP views</span>
          </div>
        </div>
      )}
    </div>
  )
}
