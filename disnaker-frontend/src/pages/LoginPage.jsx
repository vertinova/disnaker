import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { FiEye, FiEyeOff, FiLoader, FiAlertCircle, FiLock, FiClock, FiSmartphone, FiDownload } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { isStandaloneMode } from "../utils/pwa";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(null);
	const [emailError, setEmailError] = useState(null);
	const [passwordError, setPasswordError] = useState(null);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const { login } = useAuth();
	const [lockoutUntil, setLockoutUntil] = useState(null);
	const [lockoutRemaining, setLockoutRemaining] = useState(0);
	const [isPwa, setIsPwa] = useState(isStandaloneMode);

	useEffect(() => {
		const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
		const updatePwaState = () => setIsPwa(isStandaloneMode());

		mediaQuery?.addEventListener?.("change", updatePwaState);
		window.addEventListener("appinstalled", updatePwaState);

		return () => {
			mediaQuery?.removeEventListener?.("change", updatePwaState);
			window.removeEventListener("appinstalled", updatePwaState);
		};
	}, []);

	// Countdown timer for lockout
	useEffect(() => {
		if (!lockoutUntil) return;

		const tick = () => {
			const remaining = Math.max(0, lockoutUntil - Date.now());
			setLockoutRemaining(remaining);
			if (remaining <= 0) {
				setLockoutUntil(null);
				setLockoutRemaining(0);
				setError(null);
			}
		};

		tick();
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [lockoutUntil]);

	const isLockedOut = lockoutUntil && lockoutRemaining > 0;
	const lockoutMinutes = Math.floor(lockoutRemaining / 60000);
	const lockoutSeconds = Math.floor((lockoutRemaining % 60000) / 1000);

	if (!isPwa) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#07130f] p-5 text-white">
				<div className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.07] p-6 text-center shadow-2xl shadow-black/30 backdrop-blur">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-yellow-300 text-slate-950">
						<FiSmartphone className="h-8 w-8" />
					</div>
					<h1 className="mt-5 text-2xl font-black text-white">Login hanya tersedia di aplikasi</h1>
					<p className="mt-3 text-sm font-medium leading-6 text-white/65">
						Install Disnaker Presensi lalu buka dari ikon aplikasi di perangkat untuk masuk.
					</p>
					<button
						type="button"
						onClick={() => navigate("/", { replace: true })}
						className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 py-3 text-sm font-black uppercase text-slate-950 transition hover:bg-yellow-200"
					>
						<FiDownload className="h-5 w-5" />
						Install Aplikasi
					</button>
				</div>
			</div>
		);
	}

	const handleLogin = async (e) => {
		e.preventDefault();

		// Block login if currently locked out
		if (isLockedOut) {
			setError(`Terlalu banyak percobaan login. Coba lagi dalam ${lockoutMinutes}:${lockoutSeconds.toString().padStart(2, '0')}`);
			return;
		}

		setLoading(true);
		setError(null);
		setEmailError(null);
		setPasswordError(null);
		try {
			// Get device ID for auto-registration
			let deviceId = localStorage.getItem('dpmd_device_id');
			if (!deviceId) {
				deviceId = crypto.randomUUID ? crypto.randomUUID() : 
					'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
						const r = (Math.random() * 16) | 0;
						return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
					});
				localStorage.setItem('dpmd_device_id', deviceId);
			}

			// Login to Express backend
			const response = await api.post("/auth/login", { email, password, device_id: deviceId });

			const newUser = response.data.data.user;
			const expressToken = response.data.data.token;

			console.log('✅ Login successful');

			// Reset lockout on successful login
			setLockoutUntil(null);
			setLockoutRemaining(0);

			// Save token and user using context
			login(newUser, null, expressToken);

			// Navigate based on role
		if (newUser.role === "superadmin") {
			navigate("/superadmin/pegawai");
		} else if (["pegawai", "ketua_tim", "kepala_bidang", "kepala_dinas", "sekretaris_dinas"].includes(newUser.role)) {
			navigate("/pegawai/dashboard");
		} else if (newUser.role === "absensi_admin" || newUser.role === "sekretariat") {
			navigate("/sekretariat/absensi-management");
		} else {
			navigate("/pegawai/absensi");
			}
		} catch (error) {
			console.error("Login gagal:", error.response?.data || error.message);
			
			// Handle rate limit (429) response
			if (error.response?.status === 429) {
				const rateLimit = error.response.data?.rate_limit;
				if (rateLimit?.retry_after_ms) {
					setLockoutUntil(Date.now() + rateLimit.retry_after_ms);
				} else {
					setLockoutUntil(Date.now() + 5 * 60 * 1000);
				}
				setError(error.response.data?.message || 'Terlalu banyak percobaan login. Silakan coba lagi dalam 5 menit.');
			} else if (error.response?.data?.error_type === 'email_not_found') {
				setEmailError('Email salah atau tidak ditemukan');
			} else if (error.response?.data?.error_type === 'wrong_password') {
				setPasswordError('Password salah');
			} else {
				setError(error.response?.data?.message || "Login gagal. Silakan coba lagi.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center bg-gray-300 p-4">
			<div className="relative z-10 flex w-full max-w-md overflow-hidden rounded-2xl bg-white/60 shadow-2xl p-4 border-2 border-white">
				<div className="w-full p-8">
					<h2 className="text-3xl font-bold text-gray-800">Selamat Datang!</h2>
					<p className="mt-2 text-gray-600">Silakan masuk untuk melanjutkan.</p>

					<form onSubmit={handleLogin} className="mt-8 space-y-6">
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							<input
								type="email"
								id="email"
								placeholder="anda@email.com"
								className={`w-full bg-white rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]'}`}
								value={email}
								onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
								required
							/>
							{emailError && (
								<p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
									<FiAlertCircle className="w-4 h-4 flex-shrink-0" />
									{emailError}
								</p>
							)}
						</div>
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
								Password
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									placeholder="Password"
									className={`w-full bg-white rounded-lg border px-4 py-3 pr-10 focus:ring-1 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${passwordError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]'}`}
									value={password}
									onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
									aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
								>
									{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
								</button>
							</div>
							{passwordError && (
								<p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
									<FiAlertCircle className="w-4 h-4 flex-shrink-0" />
									{passwordError}
								</p>
							)}
						</div>
						<button
							type="submit"
							disabled={loading || isLockedOut}
							className={`flex w-full items-center justify-center rounded-lg py-3 font-semibold text-white transition-colors shadow-xl disabled:cursor-not-allowed disabled:opacity-60 ${
								isLockedOut ? 'bg-red-400 disabled:bg-red-400' : 'bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/90 disabled:bg-gray-400'
							}`}
						>
							{loading ? (
								<FiLoader className="animate-spin" />
							) : isLockedOut ? (
								<span className="flex items-center gap-2">
									<FiLock className="w-4 h-4" />
									Dikunci {lockoutMinutes}:{lockoutSeconds.toString().padStart(2, '0')}
								</span>
							) : (
								"Sign In"
							)}
						</button>

						{/* Lockout Warning Banner */}
						{isLockedOut && (
							<div className="rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-300 p-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
										<FiLock className="w-5 h-5 text-red-600" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-red-800">Akun Dikunci Sementara</p>
										<p className="text-xs text-red-600 mt-0.5">Terlalu banyak percobaan login gagal (maks 5x)</p>
									</div>
									<div className="flex items-center gap-1.5 bg-red-100 px-3 py-1.5 rounded-lg flex-shrink-0">
										<FiClock className="w-4 h-4 text-red-600" />
										<span className="text-sm font-bold text-red-700 tabular-nums">
											{lockoutMinutes}:{lockoutSeconds.toString().padStart(2, '0')}
										</span>
									</div>
								</div>
							</div>
						)}

						{error && !isLockedOut && (
							<div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-shake">
								<div className="flex items-center gap-3">
									<FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
									<p className="text-sm text-red-700">{error}</p>
								</div>
							</div>
						)}
					</form>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
