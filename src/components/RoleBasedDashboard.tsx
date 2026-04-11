import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import DoctorDashboard from '../pages/DoctorDashboard'
import CustomerDashboard from '../pages/CustomerDashboard'
import PetStoreDashboard from '../pages/PetStoreDashboard'
import AdminDashboard from '../pages/AdminDashboard'

interface RoleBasedDashboardProps {
  redirectTo?: string
}

const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ redirectTo = '/login' }) => {
  const { user, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time to ensure auth state is settled
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-vet-primary)]"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />
  }

  // Route based on user role
  switch ((user as any).role) {
    case 'vet':
      return <DoctorDashboard />
    case 'user':
      return <CustomerDashboard />
    case 'petstore':
      return <PetStoreDashboard />
    case 'admin':
      return <AdminDashboard />
    default:
      // If role is not recognized, default to customer dashboard
      return <CustomerDashboard />
  }
}

export default RoleBasedDashboard