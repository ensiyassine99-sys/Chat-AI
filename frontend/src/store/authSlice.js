import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';
import toast from 'react-hot-toast';

export const extractErrorMessage = (error) => {
  // String directe
  if (typeof error === 'string') return error;

  if (!error) return null;

  // error.response.data.error.message
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  // error.response.data.message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // error.response.data.error (string)
  if (typeof error.response?.data?.error === 'string') {
    return error.response.data.error;
  }

  // error.response.data (string)
  if (typeof error.response?.data === 'string') {
    return error.response.data;
  }

  // error.data.message
  if (error.data?.message) {
    return error.data.message;
  }

  // error.data (string)
  if (typeof error.data === 'string') {
    return error.data;
  }

  // error.message
  if (error.message) {
    return error.message;
  }

  // error.error
  if (error.error) {
    return error.error;
  }

  // error.msg
  if (error.msg) {
    return error.msg;
  }

  // error.response.statusText
  if (error.response?.statusText) {
    return error.response.statusText;
  }

  // Tableau d'erreurs
  if (Array.isArray(error) && error.length > 0) {
    return error[0].message || error[0].msg || error[0];
  }

  // error.errors (array)
  if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0].message || error.errors[0].msg || error.errors[0];
  }

  // Retourne null si aucun message trouvé
  return null;
};


// Async thunks
export const signup = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.signup(userData);
      return response;
    } catch (error) {

      return rejectWithValue(extractErrorMessage(error));

    }
  }
);


export const verifyResetToken = createAsyncThunk(
  'auth/verifyResetToken',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyResetToken(token);
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(token, password);
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token); // ton service API
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error) {


      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.checkAuth();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await authService.refreshToken(refreshToken);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    // Signup
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;

        state.error = typeof action.payload === 'string'
          ? action.payload
          : 'Signup failed';
        toast.error(state.error);

      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;

      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';

        state.error = typeof action.payload === 'string'
          ? action.payload
          : 'Signup failed';


        toast.error(state.error);
      });





    builder
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : 'Verification failed';
      });
    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        toast.success('Logged out successfully');
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        // Force logout even if request fails
        state.user = null;
        state.isAuthenticated = false;
      });





    // Ajouter dans extraReducers
    builder
      .addCase(verifyResetToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyResetToken.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyResetToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : 'Token verification failed';
      })

      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : 'Password reset failed';
      });
    // Check Auth
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.authenticated;
        state.isInitialized = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      });

    // Refresh Token
    builder
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  },
});

export const { setUser, clearError, updateUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;
