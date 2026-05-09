import React from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiCheckCircle, FiClock, FiMapPin, FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import api from "../../api";

const statusLabel = {
	hadir: "Hadir",
	izin: "Izin",
	sakit: "Sakit",
	alpha: "Alpha",
	cuti: "Cuti",
	dinas_luar: "Dinas Luar",
	wfh: "WFH",
	wfa: "WFA",
};

const formatTime = (value) => {
	if (!value) return "--:--";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "--:--";
	return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const getGreeting = () => {
	const hour = new Date().getHours();
	if (hour < 10) return "Selamat pagi";
	if (hour < 15) return "Selamat siang";
	if (hour < 18) return "Selamat sore";
	return "Selamat malam";
};

const PegawaiDashboardPage = () => {
	const navigate = useNavigate();
	const user = React.useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
	const [today, setToday] = React.useState(null);
	const [settings, setSettings] = React.useState(null);
	const [summary, setSummary] = React.useState(null);
	const [loading, setLoading] = React.useState(true);

	const loadDashboard = React.useCallback(async () => {
		setLoading(true);
		try {
			const [todayResponse, historyResponse] = await Promise.all([
				api.get("/absensi/today"),
				api.get("/absensi/history"),
			]);

			setToday(todayResponse.data.data || null);
			setSettings(todayResponse.data.settings || null);
			setSummary(historyResponse.data.data?.summary || null);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadDashboard().catch(() => setLoading(false));
	}, [loadDashboard]);

	const currentStatus = today?.status ? statusLabel[today.status] || today.status : "Belum Presensi";
	const hasClockIn = Boolean(today?.jam_masuk);
	const hasClockOut = Boolean(today?.jam_keluar);

	return (
		<div className="min-h-screen bg-slate-100 px-4 pb-28 pt-5">
			<div className="mx-auto max-w-5xl">
				<section className="relative overflow-hidden rounded-3xl bg-[#0b2217] px-5 py-6 text-white shadow-xl shadow-slate-900/10">
					<div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-yellow-300/20" />
					<div className="absolute bottom-0 right-0 h-28 w-full bg-gradient-to-t from-black/25 to-transparent" />
					<div className="relative">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-sm font-bold text-yellow-200">{getGreeting()}</p>
								<h1 className="mt-1 text-3xl font-black leading-tight tracking-normal">
									{user.name || "Pegawai"}
								</h1>
								<p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
									Pantau presensi hari ini dan ringkasan kehadiran bulan berjalan.
								</p>
							</div>
							<button
								type="button"
								onClick={loadDashboard}
								className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur transition hover:bg-white/15"
								title="Refresh"
							>
								<FiRefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
							</button>
						</div>

						<div className="mt-6 grid grid-cols-2 gap-3">
							<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
								<p className="text-xs font-bold uppercase text-white/50">Status Hari Ini</p>
								<p className="mt-2 text-xl font-black">{currentStatus}</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
								<p className="text-xs font-bold uppercase text-white/50">Jam Kerja</p>
								<p className="mt-2 text-xl font-black">{settings?.jam_masuk || "08:00"}</p>
							</div>
						</div>
					</div>
				</section>

				<section className="mt-5 grid grid-cols-2 gap-3">
					<div className="rounded-2xl bg-white p-4 shadow-sm">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
							<FiClock className="h-5 w-5" />
						</div>
						<p className="mt-3 text-xs font-black uppercase text-slate-400">Masuk</p>
						<p className="mt-1 text-2xl font-black text-slate-900">{formatTime(today?.jam_masuk)}</p>
					</div>
					<div className="rounded-2xl bg-white p-4 shadow-sm">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
							<FiCheckCircle className="h-5 w-5" />
						</div>
						<p className="mt-3 text-xs font-black uppercase text-slate-400">Pulang</p>
						<p className="mt-1 text-2xl font-black text-slate-900">{formatTime(today?.jam_keluar)}</p>
					</div>
				</section>

				<section className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-black uppercase text-orange-600">Bulan Ini</p>
							<h2 className="text-xl font-black text-slate-950">Ringkasan Presensi</h2>
						</div>
						<FiTrendingUp className="h-6 w-6 text-orange-500" />
					</div>
					<div className="grid grid-cols-4 gap-2">
						{[
							["Hadir", summary?.hadir || 0, "bg-emerald-50 text-emerald-700"],
							["Izin", summary?.izin || 0, "bg-blue-50 text-blue-700"],
							["Sakit", summary?.sakit || 0, "bg-amber-50 text-amber-700"],
							["Total", summary?.total || 0, "bg-slate-100 text-slate-700"],
						].map(([label, value, color]) => (
							<div key={label} className={`rounded-2xl p-3 text-center ${color}`}>
								<p className="text-2xl font-black">{value}</p>
								<p className="mt-1 text-[11px] font-bold uppercase">{label}</p>
							</div>
						))}
					</div>
				</section>

				<section className="mt-5 grid gap-3 sm:grid-cols-3">
					<button
						type="button"
						onClick={() => navigate("/pegawai/absensi")}
						className="flex min-h-16 items-center gap-4 rounded-2xl bg-orange-600 px-4 py-3 text-left text-white shadow-lg shadow-orange-900/15 transition hover:bg-orange-700"
					>
						<FiMapPin className="h-6 w-6 shrink-0" />
						<span className="font-black">{hasClockIn && !hasClockOut ? "Presensi Pulang" : "Buka Presensi"}</span>
					</button>
					<button
						type="button"
						onClick={() => navigate("/pegawai/absensi?tab=riwayat")}
						className="flex min-h-16 items-center gap-4 rounded-2xl bg-white px-4 py-3 text-left text-slate-800 shadow-sm transition hover:bg-slate-50"
					>
						<FiCalendar className="h-6 w-6 shrink-0 text-orange-600" />
						<span className="font-black">Riwayat Presensi</span>
					</button>
				</section>
			</div>
		</div>
	);
};

export default PegawaiDashboardPage;
