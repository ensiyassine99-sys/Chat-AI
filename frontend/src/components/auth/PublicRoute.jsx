import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const PublicRoute = ({ children }) => {
    const { isAuthenticated, isInitialized } = useAuth();
    const location = useLocation();



    // Si authentifié, rediriger vers /chat
    if (isAuthenticated) {
        // Récupérer la destination d'origine si elle existe
        const from = location.state?.from?.pathname || '/chat';
        return <Navigate to={from} replace />;
    }

    // Sinon, afficher le contenu (HomePage)
    return children;
};

export default PublicRoute;