// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
// Session persistence handled via localStorage only

// 1. Membuat Context
const AuthContext = createContext(null);

// Session configuration - NO EXPIRY!
const SESSION_CONFIG = {
	ACTIVITY_CHECK_INTERVAL: 5 * 60 * 1000, // Check every 5 minutes (just for tracking, no expiry)
};

// Save session to localStorage
const saveSession = (user, token) => {
	localStorage.setItem("user", JSON.stringify(user));
	localStorage.setItem("expressToken", token);
};

// Helper function to load session
// NO EXPIRY CHECK - session is valid forever until logout
const loadSession = () => {
	try {
		const sessionStr = localStorage.getItem("authSession");
		if (!sessionStr) {
			// Fallback to old storage format
			const user = localStorage.getItem("user");
			const token = localStorage.getItem("expressToken");
			if (user && token) {
				return {
					user: JSON.parse(user),
					token,
					lastActivity: Date.now(),
					// NO expiresAt
				};
			}
			return null;
		}
		
		const session = JSON.parse(sessionStr);
		
		// NO EXPIRY CHECK - session is always valid!
		// Just update last activity timestamp
		session.lastActivity = Date.now();
		localStorage.setItem("authSession", JSON.stringify(session));
		
		// console.log('[Auth] ✅ Session loaded (no expiry check)');
		return session;
	} catch (error) {
		console.error('[Auth] Error loading session:', error);
		return null;
	}
};

// Helper function to clear session
const clearSession = () => {
	localStorage.removeItem("authSession");
	localStorage.removeItem("user");
	localStorage.removeItem("expressToken");
};

// Activity tracking (no-op in simplified version)
const updateActivity = () => {};

// 2. Membuat Provider (Penyedia Data)
export const AuthProvider = ({ children }) => {
	// NEW STRATEGY: Start with null, then check both localStorage and IndexedDB
	const [user, setUser] = useState(null);
	const [expressToken, setExpressToken] = useState(null);
	const [isCheckingSession, setIsCheckingSession] = useState(true);

	// PROACTIVE SESSION CHECK - Runs once on mount
	// Use ref to ensure this only runs once
	const sessionCheckedRef = useRef(false);

	useEffect(() => {
		if (sessionCheckedRef.current) return; // Prevent duplicate execution
		sessionCheckedRef.current = true;

		async function checkAndRestoreSession() {
			try {
				const session = loadSession();
				if (session) {
					setUser(session.user);
					setExpressToken(session.token);
				}
			} catch (error) {
				console.error('[Auth] Error checking session:', error);
			} finally {
				setIsCheckingSession(false);
			}
		}
		
		checkAndRestoreSession();
	}, []); // Run only once on mount

	// Activity monitoring (simplified - no IndexedDB)
	useEffect(() => {
		if (!user || !expressToken) return;
		return () => {};
	}, [user, expressToken]);

	// Update activity on visibility change (when user returns to app)
	// This serves as a fallback to check session when app becomes visible again
	useEffect(() => {
		if (!user || !expressToken) return; // Only run if logged in
		
		const handleVisibilityChange = async () => {
			if (document.visibilityState === 'visible') {
				console.log('[Auth] 👁️ App became visible, verifying session...');
				
				// Check localStorage first
				let session = loadSession();
				
				if (!session) {
					// If localStorage empty, try restore from IndexedDB
					console.log('[Auth] � Session missing, attempting restore from IndexedDB...');
					const restored = await restoreSessionFromIndexedDB();
					
					if (restored) {
						session = loadSession();
						if (session) {
							setUser(session.user);
							setExpressToken(session.token);
							console.log('[Auth] ✅ Session restored on visibility change');
							return;
						}
					}
					
					// Session truly lost, logout
					console.log('[Auth] ⚠️ Session lost, logging out...');
					logout();
				} else {
					// Session valid, just update activity
					updateActivity();
					console.log('[Auth] ✅ Session verified, activity updated');
				}
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	}, [user, expressToken]);

	const login = async (userData, _deprecated = null, expressAuthToken = null) => {
		setUser(userData);
		setExpressToken(expressAuthToken);
		saveSession(userData, expressAuthToken);
	};

	const logout = async () => {
		localStorage.removeItem('user');
		localStorage.removeItem('expressToken');
		localStorage.removeItem('authSession');
		setUser(null);
		setExpressToken(null);
	};

	// Role helper functions
	// Memeriksa apakah user adalah superadmin
	const isSuperAdmin = () => {
		return user?.role === "superadmin";
	};

	// Memeriksa apakah user adalah admin bidang pemberdayaan masyarakat
	// (kepala_bidang atau pegawai dengan bidang_id === 5)
	const isAdminBidangPMD = () => {
		if (!user) return false;
		
		// Bidang Pemberdayaan Masyarakat memiliki bidang_id = 5
		const isPMDBidang = user.bidang_id === 5;
		
		return (
			(user.role === "kepala_bidang" && isPMDBidang) ||
			(user.role === "pegawai" && isPMDBidang)
		);
	};

	// Memeriksa apakah user adalah user desa
	const isUserDesa = () => {
		return user?.role === "desa";
	};

	// Memeriksa apakah user memiliki akses admin untuk kelembagaan
	// (superadmin atau admin bidang)
	const isKelembagaanAdmin = () => {
		return isSuperAdmin() || isAdminBidangPMD();
	};

	// Memeriksa apakah user dapat mengelola kelembagaan
	// (superadmin, admin bidang, atau user desa)
	const canManageKelembagaan = () => {
		return isSuperAdmin() || isAdminBidangPMD() || isUserDesa();
	};

	// Nilai yang akan dibagikan ke semua komponen
	const value = {
		user,
		token: expressToken, // Alias for compatibility
		expressToken,
		login,
		logout,
		updateActivity, // Expose for manual updates if needed
		isCheckingSession, // Expose loading state
		// Role helpers
		isSuperAdmin,
		isAdminBidangPMD,
		isUserDesa,
		isKelembagaanAdmin,
		canManageKelembagaan,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Membuat Custom Hook (useAuth)
// Ini adalah "jalan pintas" untuk menggunakan context
export const useAuth = () => {
	return useContext(AuthContext);
};
