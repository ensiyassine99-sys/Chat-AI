import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  login,
  logout,
  signup,
  checkAuth,
  clearError,
  verifyEmail,
  verifyResetToken,
  resetPassword,
  clearUser,
  handleOAuthCallback, // ✅ Nouveau import
} from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    isInitialized
  } = useSelector(state => state.auth);

  useEffect(() => {
    if (!isInitialized) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        dispatch(checkAuth());
      }
    }
  }, [dispatch, isInitialized]);

  const handleLogin = async (credentials) => {
    const result = await dispatch(login(credentials));
    if (login.fulfilled.match(result)) {
      navigate('/chat');
      return true;
    }
    return false;
  };

  const handleSignup = async (userData) => {
    const result = await dispatch(signup(userData));
    if (signup.fulfilled.match(result)) {
      navigate('/login', {
        state: {
          fromSignup: true,
          email: result.payload?.email || userData.email
        }
      });
      return result.payload || true;
    }
    return false;
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleVerifyEmail = async (token) => {
    const result = await dispatch(verifyEmail(token));
    if (verifyEmail.fulfilled.match(result)) {
      return { success: true, data: result.payload };
    }
    return { success: false, error: result.payload };
  };

  const handleVerifyResetToken = async (token) => {
    const result = await dispatch(verifyResetToken(token));
    if (verifyResetToken.fulfilled.match(result)) {
      return { success: true, data: result.payload };
    }
    return { success: false, error: result.payload };
  };

  const handleResetPassword = async (token, password) => {
    const result = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(result)) {
      return { success: true, data: result.payload };
    }
    return { success: false, error: result.payload };
  };

  // ✅ NOUVEAU : Gérer le callback OAuth
  const handleOAuthLogin = async (token, refreshToken) => {
    const result = await dispatch(handleOAuthCallback({ token, refreshToken }));
    if (handleOAuthCallback.fulfilled.match(result)) {
      navigate('/chat', { replace: true });
      return { success: true, data: result.payload };
    }
    return { success: false, error: result.payload };
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const handleClearUser = () => {
    dispatch(clearUser());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    verifyEmail: handleVerifyEmail,
    verifyResetToken: handleVerifyResetToken,
    resetPassword: handleResetPassword,
    oauthLogin: handleOAuthLogin, // ✅ Nouveau
    clearError: clearAuthError,
    clearUser: handleClearUser
  };
};