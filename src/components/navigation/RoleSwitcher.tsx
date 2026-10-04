import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ShieldCheck, Sparkles, User } from 'lucide-react'
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

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'estate_manager':
        return 'Super Admin'
      case 'field_officer':
        return 'Field Officer'
      case 'kangany':
        return 'Division Kangany'
      case 'agronomist':
        return 'Chief Agronomist'
      default:
        return 'Staff'
    }
  }

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
        title="Switch User Role"
      >
        <div
          className="role-icon-circle"
          style={{ backgroundColor: `${currentUser.badgeColor}22`, color: currentUser.badgeColor }}
        >
          <User size={15} />
        </div>
        <span className="role-label-name">
          {getRoleDisplayName(currentUser.role)}
        </span>
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
              Switch role to test permissions and operational scopes
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
                  <div
                    className="role-option-icon-box"
                    style={{ backgroundColor: `${user.badgeColor}20`, color: user.badgeColor }}
                  >
                    <User size={16} />
                    {isActive && (
                      <span className="role-option-check">
                        <Check size={10} />
                      </span>
                    )}
                  </div>
                  <div className="role-option-info">
                    <div className="role-option-headline">
                      <strong>{getRoleDisplayName(user.role)}</strong>
                      <span
                        className="role-tag"
                        style={{ backgroundColor: `${user.badgeColor}22`, color: user.badgeColor }}
                      >
                        {user.divisionScope}
                      </span>
                    </div>
                    <div className="role-option-meta">
                      <span>{user.name}</span>
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
