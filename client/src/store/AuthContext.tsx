import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AuthContextType, 
  LoginCredentials, 
  RegisterCredentials, 
  UpdatePasswordData, 
  ForgotPasswordData, 
  ResetPasswordData, 
  User,
  Response
} from '../typescript/interfaces';

// Initial auth state
const initialState: AuthContextType = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateDetails: async () => {},
  updatePassword: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  clearError: () => {}
};

// Create context
export const AuthContext = createContext<AuthContextType>(initialState);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [authState, setAuthState] = useState<AuthContextType>(initialState);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from token
  const loadUser = async () => {
    try {
      console.log('Loading user ---------------------------------- ');
      const res = await axios.get<Response<User>>('/api/auth/me');
      
      setAuthState(prevState => ({
        ...prevState,
        isAuthenticated: true,
        user: res.data.data,
        loading: false,
        error: null
      }));
    } catch (err) {
      setAuthState(prevState => ({
        ...prevState,
        isAuthenticated: false,
        user: null,
        loading: false
      }));
    }
  };

  // Register user
  const register = async (credentials: RegisterCredentials) => {
    setAuthState(prevState => ({ ...prevState, loading: true }));

    // Validate password match
    if (credentials.password !== credentials.confirmPassword) {
      setAuthState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: 'Passwords do not match' 
      }));
      return;
    }

    try {
      await axios.post<Response<{ token: string }>>('/api/auth/register', {
        email: credentials.email,
        password: credentials.password
      });

      setAuthState(prevState => ({
        ...prevState,
        isAuthenticated: true,
        loading: false,
        error: null
      }));

      // Load user data after successful registration
      await loadUser();
    } catch (err: any) {
      setAuthState(prevState => ({
        ...prevState,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: err.response?.data?.error || 'Registration failed'
      }));
    }
  };

  // Login user
  const login = async (credentials: LoginCredentials) => {
    setAuthState(prevState => ({ ...prevState, loading: true }));

    try {
      await axios.post<Response<{ token: string }>>('/api/auth/login', credentials);

      setAuthState(prevState => ({
        ...prevState,
        isAuthenticated: true,
        loading: false,
        error: null
      }));

      // Load user data after successful login
      await loadUser();
    } catch (err: any) {
      setAuthState(prevState => ({
        ...prevState,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: err.response?.data?.error || 'Invalid credentials'
      }));
    }
  };

  // Logout user
  const logout = async () => {
    setAuthState(prevState => ({ ...prevState, loading: true }));

    try {
      await axios.get('/api/auth/logout');

      setAuthState(prevState => ({
        ...prevState,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      }));
    } catch (err: any) {
      setAuthState(prevState => ({
        ...prevState,
        loading: false,
        error: err.response?.data?.error || 'Logout failed'
      }));
    }
  };

  // Update user details
  const updateDetails = async (email: string, user_name: string) => {
    try {
      setAuthState(prevState => ({
        ...prevState,
        loading: true,
        error: null
      }));

      const res = await axios.put<Response<User>>('/api/auth/updatedetails', {
        email,
        user_name
      });

      setAuthState(prevState => ({
        ...prevState,
        user: res.data.data,
        loading: false
      }));
    } catch (err: any) {
      setAuthState(prevState => ({
        ...prevState,
        error: err.response?.data?.error || 'Failed to update profile',
        loading: false
      }));
    }
  };

  // Update password
  const updatePassword = async (data: UpdatePasswordData) => {
    setAuthState(prevState => ({ ...prevState, loading: true }));

    // Validate password match
    if (data.newPassword !== data.confirmNewPassword) {
      setAuthState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: 'New passwords do not match' 
      }));
      return;
    }

    try {
      await axios.put('/api/auth/updatepassword', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      setAuthState(prevState => ({
        ...prevState,
        loading: false,
        error: null
      }));
    } catch (err: any) {
      setAuthState(prevState => ({
        ...prevState,
        loading: false,
        error: err.response?.data?.error || 'Password update failed'
      }));
    }
  };

  // Forgot password
  const forgotPassword = async (data: ForgotPasswordData) => {
    setAuthState(prevState => ({ ...prevState, loading: true }));

    try {
      await axios.post('/api/auth/forgotpassword', { email: data.email });

      setAuthState(prevState => ({
        ...prevState,
        loading: false,
        error: null
      }));
    } catch (err: any) {
      setAuthState(prevState => ({
        ...prevState,
        loading: false,
        error: err.response?.data?.error || 'Failed to process request'
      }));
    }
  };

  // Reset password
  const resetPassword = async (resetToken: string, data: ResetPasswordData) => {
    setAuthState(prevState => ({ ...prevState, loading: true }));

    // Validate password match
    if (data.password !== data.confirmPassword) {
      setAuthState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: 'Passwords do not match' 
      }));
      return;
    }

    try {
      await axios.put(`/api/auth/resetpassword/${resetToken}`, {
        password: data.password
      });

      setAuthState(prevState => ({
        ...prevState,
        loading: false,
        error: null
      }));
    } catch (err: any) {
      setAuthState(prevState => ({
        ...prevState,
        loading: false,
        error: err.response?.data?.error || 'Password reset failed'
      }));
    }
  };

  // Clear error
  const clearError = () => {
    setAuthState(prevState => ({ ...prevState, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        loading: authState.loading,
        error: authState.error,
        login,
        register,
        logout,
        updateDetails,
        updatePassword,
        forgotPassword,
        resetPassword,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 