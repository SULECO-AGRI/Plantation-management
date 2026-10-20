import React from 'react'
import { Modal } from '../common/Modal'
import { LoginForm } from '../auth/LoginForm'
import type { UserProfile } from '../../types/auth'

type LoginModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: UserProfile) => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Portal Sign In"
      maxWidth="md"
    >
      <div style={{ padding: '4px 0' }}>
        <LoginForm
          onSuccess={(user) => {
            onClose()
            if (onSuccess) onSuccess(user)
          }}
          redirectAfterLogin={true}
        />
      </div>
    </Modal>
  )
}
