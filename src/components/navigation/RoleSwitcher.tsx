import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Mail, MapPin, Phone, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types/auth'

export const RoleSwitcher: React.FC = () => {
  const { currentUser, logout, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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

  const getRoleDisplayName = (role: UserRole | string) => {
    switch (role) {
      case 'super_admin':
      case 'estate_manager':
        return 'Super Admin'
      case 'division_manager':
        return 'Division Manager'
      case 'field_officer':
      case 'kangany':
      case 'agronomist':
        return 'Field Officer'
      case 'worker':
      case 'employee':
      case 'harvester':
      case 'sprayer':
      case 'sundry':
        return 'Employee'
      default:
        return 'Super Admin'
    }
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <div className="role-switcher" ref={dropdownRef}>
      <button
        type="button"
        className="role-switcher-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title="User Account Menu"
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
        <div className="role-dropdown-menu" style={{ width: '280px', padding: '16px' }}>
          {/* User Profile Card */}
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--forest-900)', lineHeight: 1.3 }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--emerald-700)', marginTop: '2px' }}>
              {currentUser.roleTitle || getRoleDisplayName(currentUser.role)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={11} />
              <span>
                {currentUser.assignedField ? `${currentUser.assignedField}, ` : ''}{currentUser.divisionScope || currentUser.assignedDivision || 'Weddamulla'}
              </span>
            </div>
          </div>

          {/* User Details (Phone & Email) */}
          <div style={{ padding: '10px 0', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {currentUser.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={13} color="var(--text-muted)" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.email}
                </span>
              </div>
            )}
            {currentUser.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={13} color="var(--text-muted)" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {currentUser.phone}
                </span>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2'
                e.currentTarget.style.borderColor = '#fca5a5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2'
                e.currentTarget.style.borderColor = '#fecaca'
              }}
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
