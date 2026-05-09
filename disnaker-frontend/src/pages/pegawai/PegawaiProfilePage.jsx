import React from "react";
import { FiBriefcase, FiKey, FiLogOut, FiMail, FiPhone, FiRefreshCw, FiShield, FiUser } from "react-icons/fi";
import api from "../../api";

const statusLabels = {
	PNS: "PNS",
	PPPK: "PPPK",
	PPPK_Paruh_Waktu: "PPPK Paruh Waktu",
	Honorer: "Honorer",
	THL: "THL",
	Kontrak: "Kontrak",
	Tenaga_Alih_Daya: "Tenaga Alih Daya",
	Tenaga_Keamanan: "Tenaga Keamanan",
	Tenaga_Kebersihan: "Tenaga Kebersihan",
};

const InfoRow = ({ icon: Icon, label, value }) => (
	<div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
		<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
			<Icon className="h-5 w-5" />
		</div>
		<div className="min-w-0">
			<p className="text-xs font-black uppercase text-slate-400">{label}</p>
			<p className="mt-1 break-words text-sm font-bold text-slate-800">{value || "-"}</p>
		</div>
	</div>
);

const PegawaiProfilePage = () => {
	const [user, setUser] = React.useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
	const [today, setToday] = React.useState(null);
	const [loading, setLoading] = React.useState(false);

	const loadProfileContext = React.useCallback(async () => {
		setLoading(true);
		try {
			const response = await api.get("/absensi/today");
			setToday(response.data.data || null);
			setUser(JSON.parse(localStorage.getItem("user") || "{}"));
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadProfileContext().catch(() => setLoading(false));
	}, [loadProfileContext]);

	const handleLogout = () => {
		if (!window.confirm("Apakah Anda yakin ingin keluar?")) return;
		localStorage.removeItem("user");
		localStorage.removeItem("expressToken");
		localStorage.removeItem("authSession");
		window.location.href = "/";
	};

	const initials = (user.name || "P").slice(0, 1).toUpperCase();

	return (
		<div className="min-h-screen bg-slate-100 px-4 pb-28 pt-5">
			<div className="mx-auto max-w-3xl">
				<section className="relative overflow-hidden rounded-3xl bg-[#102642] px-5 py-6 text-white shadow-xl shadow-slate-900/10">
					<div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-300/20" />
					<div className="relative flex items-center gap-4">
						<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-orange-700 text-3xl font-black shadow-lg">
							{initials}
						</div>
						<div className="min-w-0">
							<p className="text-xs font-black uppercase text-orange-200">Profil Pegawai</p>
							<h1 className="mt-1 truncate text-2xl font-black tracking-normal">{user.name || "Pegawai"}</h1>
							<p className="mt-1 truncate text-sm font-medium text-white/65">{user.email}</p>
						</div>
					</div>
				</section>

				<section className="mt-5 grid grid-cols-2 gap-3">
					<div className="rounded-2xl bg-white p-4 shadow-sm">
						<p className="text-xs font-black uppercase text-slate-400">Role</p>
						<p className="mt-2 text-lg font-black capitalize text-slate-900">{user.role?.replace(/_/g, " ") || "-"}</p>
					</div>
					<div className="rounded-2xl bg-white p-4 shadow-sm">
						<p className="text-xs font-black uppercase text-slate-400">Presensi Hari Ini</p>
						<p className="mt-2 text-lg font-black capitalize text-slate-900">{today?.status?.replace(/_/g, " ") || "Belum"}</p>
					</div>
				</section>

				<section className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-black uppercase text-orange-600">Data Akun</p>
							<h2 className="text-xl font-black text-slate-950">Informasi Pegawai</h2>
						</div>
						<button
							type="button"
							onClick={loadProfileContext}
							className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
							title="Refresh"
						>
							<FiRefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
						</button>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<InfoRow icon={FiUser} label="Nama" value={user.name} />
						<InfoRow icon={FiMail} label="Email" value={user.email} />
						<InfoRow icon={FiShield} label="Role" value={user.role?.replace(/_/g, " ")} />
						<InfoRow icon={FiBriefcase} label="Bidang" value={user.bidang_nama || user.bidang_name || user.bidang_id ? `Bidang ID ${user.bidang_id}` : "-"} />
						<InfoRow icon={FiKey} label="NIP" value={user.nip} />
						<InfoRow icon={FiBriefcase} label="Jabatan" value={user.jabatan} />
						<InfoRow icon={FiShield} label="Status Kepegawaian" value={statusLabels[user.status_kepegawaian?.replace(/ /g, "_")] || user.status_kepegawaian} />
						<InfoRow icon={FiPhone} label="Pegawai ID" value={user.pegawai_id} />
					</div>
				</section>

				<section className="mt-5">
					<button
						type="button"
						onClick={handleLogout}
						className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black uppercase text-white shadow-lg shadow-red-900/15 transition hover:bg-red-700"
					>
						<FiLogOut className="h-5 w-5" />
						Keluar
					</button>
				</section>
			</div>
		</div>
	);
};

export default PegawaiProfilePage;
