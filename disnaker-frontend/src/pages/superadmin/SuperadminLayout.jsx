import React from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiBarChart2, FiBell, FiLogOut, FiUsers, FiLayers } from "react-icons/fi";

const SuperadminLayout = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const token = localStorage.getItem("expressToken");
	const user = React.useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);

	if (!token || user.role !== "superadmin") {
		return <Navigate to="/login" replace />;
	}

	const navItems = [
		{ path: "/superadmin/pegawai", label: "Pegawai", icon: FiUsers },
		{ path: "/superadmin/bidang", label: "Bidang", icon: FiLayers },
		{ path: "/superadmin/rekap", label: "Rekap", icon: FiBarChart2 },
		{ path: "/superadmin/popup", label: "Popup", icon: FiBell },
	];

	const handleLogout = () => {
		if (!window.confirm("Apakah Anda yakin ingin keluar?")) return;
		localStorage.removeItem("user");
		localStorage.removeItem("expressToken");
		localStorage.removeItem("authSession");
		window.location.href = "/";
	};

	return (
		<div className="min-h-screen bg-slate-100 pb-24">
			<header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
				<div className="mx-auto flex max-w-5xl items-center justify-between">
					<div>
						<p className="text-xs font-black uppercase text-orange-600">Superadmin</p>
						<p className="text-sm font-bold text-slate-900">Disnaker Presensi</p>
					</div>
					<button
						type="button"
						onClick={handleLogout}
						className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
						title="Keluar"
					>
						<FiLogOut className="h-5 w-5" />
					</button>
				</div>
			</header>

			<main>
				<Outlet />
			</main>

			<nav className="fixed bottom-3 left-3 right-3 z-50 rounded-2xl border border-orange-200 bg-white shadow-lg">
				<div className="mx-auto max-w-lg px-4">
					<div className="flex items-end justify-around py-2">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = location.pathname === item.path;

							return (
								<button
									key={item.path}
									type="button"
									onClick={() => navigate(item.path)}
									className={`relative flex flex-col items-center justify-center rounded-xl px-4 py-1 transition ${
										isActive ? "text-orange-700" : "text-gray-400 hover:text-orange-600"
									}`}
								>
									<Icon className="h-6 w-6" />
									<span className={`mt-1 text-[11px] font-medium ${isActive ? "text-orange-700" : "text-gray-400"}`}>
										{item.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</nav>
		</div>
	);
};

export default SuperadminLayout;
