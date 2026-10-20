import React from 'react'
import { Link } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { CropLensBrand } from '../components/navigation/CropLensBrand'

export function LoginPage() {
  return (
    <div className="login-page-container">
      <div className="login-page-topbar">
        <Link to="/" className="login-page-brand">
          <CropLensBrand />
        </Link>
        <Link to="/" className="login-page-back-link">
          &larr; Return to Overview
        </Link>
      </div>

      <main className="login-page-main">
        <LoginForm />
      </main>

      <footer className="login-page-footer">
        <p>
          Watawala Plantations PLC &bull; Geographic Information Systems &bull; Role-Based Access Control
        </p>
      </footer>
    </div>
  )
}
