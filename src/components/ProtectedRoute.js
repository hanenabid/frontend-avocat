import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], allowedUserTypes = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        // Redirect to login with intended page
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check user type if required
    if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(user.userType)) {
        return <Navigate to="/login" replace />;
    }

    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;