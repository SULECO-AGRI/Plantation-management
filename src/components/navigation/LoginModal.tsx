import React from 'react'
import { Modal } from '../common/Modal'
import { LoginForm } from '../auth/LoginForm'
import { useTranslation } from '../../context/LanguageContext'
import type { UserProfile } from '../../types/auth'

type LoginModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: UserProfile) => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('auth.portalSignIn')}
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
