import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
    error: null,
};

// Actions
const actionTypes = {
    SET_LOADING: 'SET_LOADING',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_ERROR: 'LOGIN_ERROR',
    LOGOUT: 'LOGOUT',
    CLEAR_ERROR: 'CLEAR_ERROR',
    UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case actionTypes.SET_LOADING:
            return {
                ...state,
                loading: action.payload,
            };
        case actionTypes.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                loading: false,
                error: null,
            };
        case actionTypes.LOGIN_ERROR:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false,
                error: action.payload,
            };
        case actionTypes.LOGOUT:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            };
        case actionTypes.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };
        case actionTypes.UPDATE_USER:
            return {
                ...state,
                user: { ...state.user, ...action.payload },
            };
        default:
            return state;
    }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Check saved token on app load
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            try {
                const userData = JSON.parse(user);
                dispatch({
                    type: actionTypes.LOGIN_SUCCESS,
                    payload: { user: userData, token },
                });
            } catch (error) {
                // If token or user data is corrupted
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                dispatch({ type: actionTypes.SET_LOADING, payload: false });
            }
        } else {
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
    }, []);

    // Login function
    const login = async (credentials) => {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        try {
            const response = await authAPI.loginUser(credentials);
            const { user, token } = response.data;

            // Save data to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            dispatch({
                type: actionTypes.LOGIN_SUCCESS,
                payload: { user, token },
            });

            return response.data;
        } catch (error) {
        // Map backend error messages to translation keys for login
        let errorMessage = 'auth.invalidCredentials';
        
        if (error.response?.data?.message) {
            const backendMessage = error.response.data.message;
            if (backendMessage.includes('User not found') || backendMessage.includes('No user found')) {
                errorMessage = 'authErrors.userNotFound';
            } else if (backendMessage.includes('Invalid credentials') || backendMessage.includes('password')) {
                errorMessage = 'authErrors.invalidCredentials';
            } else {
                errorMessage = backendMessage; // Use backend message directly
            }
        } else if (error.response?.data?.error) {
            const backendError = error.response.data.error;
            if (backendError.includes('User not found') || backendError.includes('No user found')) {
                errorMessage = 'authErrors.userNotFound';
            } else if (backendError.includes('Invalid credentials') || backendError.includes('password')) {
                errorMessage = 'authErrors.invalidCredentials';
            } else {
                errorMessage = backendError;
            }
        }
        
            dispatch({
                type: actionTypes.LOGIN_ERROR,
                payload: errorMessage,
            });
            throw error;
        }
    };

    // Client signup
    const signupClient = async (userData) => {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        try {
            const response = await authAPI.signupClient(userData);
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            dispatch({
                type: actionTypes.LOGIN_SUCCESS,
                payload: { user, token },
            });

            return response.data;
        } catch (error) {
            // Map backend error messages to translation keys for client signup
            let errorMessage = 'authErrors.accountCreationError';
            
            if (error.response?.data?.error) {
                const backendError = error.response.data.error;
                if (backendError.includes('Email already exists')) {
                    errorMessage = 'authErrors.emailAlreadyExists';
                } else if (backendError.includes('validation') || backendError.includes('required')) {
                    errorMessage = 'authErrors.registrationFailed';
                } else {
                    errorMessage = backendError; // Use backend message directly if no mapping
                }
            } else if (error.response?.data?.message) {
                const backendMessage = error.response.data.message;
                if (backendMessage.includes('Email already exists')) {
                    errorMessage = 'authErrors.emailAlreadyExists';
                } else {
                    errorMessage = backendMessage;
                }
            }
            
            dispatch({
                type: actionTypes.LOGIN_ERROR,
                payload: errorMessage,
            });
            throw error;
        }
    };

    // Avocat signup
    const signupAvocat = async (userData) => {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        try {
            const response = await authAPI.signupAvocat(userData);
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            dispatch({
                type: actionTypes.LOGIN_SUCCESS,
                payload: { user, token },
            });

            return response.data;
        } catch (error) {
            // Map backend error messages to translation keys for avocat signup
            let errorMessage = 'authErrors.accountCreationError';
            
            if (error.response?.data?.error) {
                const backendError = error.response.data.error;
                if (backendError.includes('Email already exists')) {
                    errorMessage = 'authErrors.emailAlreadyExists';
                } else if (backendError.includes('validation') || backendError.includes('required')) {
                    errorMessage = 'authErrors.registrationFailed';
                } else {
                    errorMessage = backendError; // Use backend message directly if no mapping
                }
            } else if (error.response?.data?.message) {
                const backendMessage = error.response.data.message;
                if (backendMessage.includes('Email already exists')) {
                    errorMessage = 'authErrors.emailAlreadyExists';
                } else {
                    errorMessage = backendMessage;
                }
            }
            
            dispatch({
                type: actionTypes.LOGIN_ERROR,
                payload: errorMessage,
            });
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        // Clear localStorage and state
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: actionTypes.LOGOUT });
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: actionTypes.CLEAR_ERROR });
    };

    // Update user function
    const updateUser = (userData) => {
        // Update localStorage
        const updatedUser = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state
        dispatch({
            type: actionTypes.UPDATE_USER,
            payload: userData,
        });
    };

    const value = {
        ...state,
        login,
        signupClient,
        signupAvocat,
        logout,
        clearError,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};