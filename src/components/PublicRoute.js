import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const PublicRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const { t } = useTranslation();

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('publicRoute.loading')}</p>
                </div>
            </div>
        );
    }

    // If user is authenticated, redirect to appropriate dashboard
    if (isAuthenticated && user) {
        // Redirect based on user type and role
        if (user.userType === 'Client') {
            if (user.role === 'admin') {
                return <Navigate to="/admin/dashboard" replace />;
            } else {
                return <Navigate to="/client/dashboard" replace />;
            }
        } else if (user.userType === 'Avocat') {
            return <Navigate to="/avocat/dashboard" replace />;
        } else {
            // Fallback redirect
            return <Navigate to="/client/dashboard" replace />;
        }
    }

    // If not authenticated, show the public route (login/signup pages)
    return children;
};

export default PublicRoute;
