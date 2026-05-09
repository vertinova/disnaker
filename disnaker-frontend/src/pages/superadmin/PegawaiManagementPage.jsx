import React from "react";
import toast from "react-hot-toast";
import {
	FiEdit2,
	FiKey,
	FiPlus,
	FiRefreshCw,
	FiSearch,
	FiTrash2,
	FiUser,
	FiX,
} from "react-icons/fi";
import api from "../../api";

const emptyForm = {
	name: "",
	email: "",
	password: "password",
	role: "pegawai",
	bidang_id: "",
	nip: "",
	jabatan: "",
	jenis_kelamin: "L",
	status_kepegawaian: "Tenaga_Alih_Daya",
	no_hp: "",
	unit_kerja: "Dinas Tenaga Kerja Kabupaten Bogor",
	tempat_lahir: "",
	tanggal_lahir: "",
	is_active: true,
};

const roleOptions = [
	{ value: "pegawai", label: "Pegawai" },
	{ value: "superadmin", label: "Superadmin" },
	{ value: "sekretaris_dinas", label: "Sekretaris Dinas" },
	{ value: "kepala_dinas", label: "Kepala Dinas" },
	{ value: "kepala_bidang", label: "Kepala Bidang" },
	{ value: "ketua_tim", label: "Ketua Tim" },
];

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

const formatRole = (role) => role?.replace(/_/g, " ") || "-";

const mapRecordToForm = (record) => ({
	name: record.name || "",
	email: record.email || "",
	password: "",
	role: record.role || "pegawai",
	bidang_id: record.pegawai?.bidang?.id || record.bidang_id || "",
	nip: record.pegawai?.nip || "",
	jabatan: record.pegawai?.jabatan || "",
	jenis_kelamin: record.pegawai?.jenis_kelamin || "L",
	status_kepegawaian: record.pegawai?.status_kepegawaian || "Tenaga_Alih_Daya",
	no_hp: record.pegawai?.no_hp || "",
	unit_kerja: record.pegawai?.unit_kerja || "Dinas Tenaga Kerja Kabupaten Bogor",
	tempat_lahir: "",
	tanggal_lahir: "",
	is_active: record.is_active !== false,
});

const PegawaiManagementPage = () => {
	const [records, setRecords] = React.useState([]);
	const [bidangs, setBidangs] = React.useState([]);
	const [statuses, setStatuses] = React.useState(Object.keys(statusLabels));
	const [search, setSearch] = React.useState("");
	const [loading, setLoading] = React.useState(true);
	const [submitting, setSubmitting] = React.useState(false);
	const [modalOpen, setModalOpen] = React.useState(false);
	const [editing, setEditing] = React.useState(null);
	const [form, setForm] = React.useState(emptyForm);

	const loadOptions = React.useCallback(async () => {
		const response = await api.get("/admin/pegawai/options");
		const data = response.data.data || {};
		setBidangs(data.bidangs || []);
		setStatuses(data.status_kepegawaian || Object.keys(statusLabels));
		if (data.bidangs?.[0]?.id) {
			setForm((prev) => ({ ...prev, bidang_id: prev.bidang_id || data.bidangs[0].id }));
		}
	}, []);

	const loadRecords = React.useCallback(async (query = search) => {
		setLoading(true);
		try {
			const response = await api.get("/admin/pegawai", {
				params: { search: query },
			});
			setRecords(response.data.data || []);
		} catch (error) {
			toast.error(error.response?.data?.message || "Gagal memuat data pegawai");
		} finally {
			setLoading(false);
		}
	}, [search]);

	React.useEffect(() => {
		loadOptions().catch(() => toast.error("Gagal memuat opsi pegawai"));
		loadRecords("");
	}, [loadOptions, loadRecords]);

	React.useEffect(() => {
		const timer = setTimeout(() => loadRecords(search), 350);
		return () => clearTimeout(timer);
	}, [search, loadRecords]);

	const openCreateModal = () => {
		setEditing(null);
		setForm({
			...emptyForm,
			bidang_id: bidangs[0]?.id || "",
		});
		setModalOpen(true);
	};

	const openEditModal = (record) => {
		setEditing(record);
		setForm(mapRecordToForm(record));
		setModalOpen(true);
	};

	const updateForm = (key, value) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitting(true);

		const payload = {
			...form,
			password: form.password || undefined,
		};

		try {
			if (editing) {
				await api.put(`/admin/pegawai/${editing.id}`, payload);
				toast.success("Pegawai diperbarui");
			} else {
				await api.post("/admin/pegawai", payload);
				toast.success("Pegawai ditambahkan");
			}
			setModalOpen(false);
			await loadRecords();
		} catch (error) {
			toast.error(error.response?.data?.message || "Gagal menyimpan pegawai");
		} finally {
			setSubmitting(false);
		}
	};

	const handleResetPassword = async (record) => {
		if (!window.confirm(`Reset password ${record.name} menjadi "password"?`)) return;
		try {
			await api.patch(`/admin/pegawai/${record.id}/reset-password`, { password: "password" });
			toast.success("Password direset ke password");
			await loadRecords();
		} catch (error) {
			toast.error(error.response?.data?.message || "Gagal reset password");
		}
	};

	const handleDelete = async (record) => {
		if (!window.confirm(`Hapus ${record.name}? Data akun dan pegawai akan dihapus.`)) return;
		try {
			await api.delete(`/admin/pegawai/${record.id}`);
			toast.success("Pegawai dihapus");
			await loadRecords();
		} catch (error) {
			toast.error(error.response?.data?.message || "Gagal menghapus pegawai");
		}
	};

	return (
		<div className="min-h-screen bg-slate-100 px-4 pb-28 pt-5">
			<div className="mx-auto max-w-5xl">
				<header className="mb-5">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-xs font-black uppercase text-orange-600">Superadmin</p>
							<h1 className="mt-1 text-3xl font-black tracking-normal text-slate-950">Management Pegawai</h1>
							<p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
								Kelola akun login, data pegawai, bidang, jabatan, dan status kepegawaian.
							</p>
						</div>
						<button
							type="button"
							onClick={openCreateModal}
							className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white shadow-lg shadow-orange-900/20 transition hover:bg-orange-700"
							title="Tambah pegawai"
						>
							<FiPlus className="h-6 w-6" />
						</button>
					</div>
				</header>

				<div className="mb-4 flex gap-2">
					<label className="relative flex-1">
						<FiSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Cari nama, email, NIP"
							className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
						/>
					</label>
					<button
						type="button"
						onClick={() => loadRecords(search)}
						className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
						title="Refresh"
					>
						<FiRefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
					</button>
				</div>

				<div className="grid gap-3 md:grid-cols-2">
					{loading ? (
						<div className="col-span-full rounded-lg bg-white p-6 text-center text-sm font-semibold text-slate-500 shadow-sm">
							Memuat data pegawai...
						</div>
					) : records.length === 0 ? (
						<div className="col-span-full rounded-lg bg-white p-6 text-center text-sm font-semibold text-slate-500 shadow-sm">
							Belum ada pegawai yang cocok.
						</div>
					) : records.map((record) => (
						<article key={record.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
							<div className="flex gap-3">
								<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
									<FiUser className="h-6 w-6" />
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<h2 className="truncate text-base font-black text-slate-900">{record.name}</h2>
											<p className="truncate text-xs font-semibold text-slate-500">{record.email}</p>
										</div>
										<span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase ${record.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
											{record.is_active ? "Aktif" : "Nonaktif"}
										</span>
									</div>

									<div className="mt-3 grid grid-cols-2 gap-2 text-xs">
										<div className="rounded-md bg-slate-50 px-3 py-2">
											<p className="font-bold uppercase text-slate-400">Role</p>
											<p className="mt-1 font-black capitalize text-slate-700">{formatRole(record.role)}</p>
										</div>
										<div className="rounded-md bg-slate-50 px-3 py-2">
											<p className="font-bold uppercase text-slate-400">Bidang</p>
											<p className="mt-1 truncate font-black text-slate-700">{record.pegawai?.bidang?.nama || "-"}</p>
										</div>
										<div className="rounded-md bg-slate-50 px-3 py-2">
											<p className="font-bold uppercase text-slate-400">Status</p>
											<p className="mt-1 truncate font-black text-slate-700">{statusLabels[record.pegawai?.status_kepegawaian] || "-"}</p>
										</div>
										<div className="rounded-md bg-slate-50 px-3 py-2">
											<p className="font-bold uppercase text-slate-400">Password</p>
											<p className="mt-1 truncate font-black text-slate-700">{record.plain_password || "-"}</p>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-3 gap-2">
								<button type="button" onClick={() => openEditModal(record)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-100 text-xs font-black text-slate-700 transition hover:bg-slate-200">
									<FiEdit2 className="h-4 w-4" />
									Edit
								</button>
								<button type="button" onClick={() => handleResetPassword(record)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-100 text-xs font-black text-amber-800 transition hover:bg-amber-200">
									<FiKey className="h-4 w-4" />
									Reset
								</button>
								<button type="button" onClick={() => handleDelete(record)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-100 text-xs font-black text-red-700 transition hover:bg-red-200">
									<FiTrash2 className="h-4 w-4" />
									Hapus
								</button>
							</div>
						</article>
					))}
				</div>
			</div>

			{modalOpen && (
				<div className="fixed inset-0 z-[70] flex items-end bg-black/60 px-0 sm:items-center sm:px-4">
					<div className="mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
						<div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
							<div>
								<p className="text-xs font-black uppercase text-orange-600">{editing ? "Edit" : "Tambah"}</p>
								<h2 className="text-xl font-black text-slate-950">{editing ? "Edit Pegawai" : "Pegawai Baru"}</h2>
							</div>
							<button type="button" onClick={() => setModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
								<FiX className="h-5 w-5" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5 sm:grid-cols-2">
							<label className="sm:col-span-2">
								<span className="text-xs font-black uppercase text-slate-500">Nama</span>
								<input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Email</span>
								<input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} required className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Password</span>
								<input value={form.password} onChange={(event) => updateForm("password", event.target.value)} placeholder={editing ? "Kosongkan jika tidak diubah" : "password"} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Role</span>
								<select value={form.role} onChange={(event) => updateForm("role", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400">
									{roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
								</select>
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Bidang</span>
								<select value={form.bidang_id} onChange={(event) => updateForm("bidang_id", event.target.value)} required className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400">
									<option value="">Pilih bidang</option>
									{bidangs.map((bidang) => <option key={bidang.id} value={bidang.id}>{bidang.nama}</option>)}
								</select>
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">NIP</span>
								<input value={form.nip} onChange={(event) => updateForm("nip", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Jabatan</span>
								<input value={form.jabatan} onChange={(event) => updateForm("jabatan", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Jenis Kelamin</span>
								<select value={form.jenis_kelamin} onChange={(event) => updateForm("jenis_kelamin", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400">
									<option value="L">Laki-laki</option>
									<option value="P">Perempuan</option>
								</select>
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Status Kepegawaian</span>
								<select value={form.status_kepegawaian} onChange={(event) => updateForm("status_kepegawaian", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400">
									{statuses.map((status) => <option key={status} value={status}>{statusLabels[status] || status}</option>)}
								</select>
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">No HP</span>
								<input value={form.no_hp} onChange={(event) => updateForm("no_hp", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Tempat Lahir</span>
								<input value={form.tempat_lahir} onChange={(event) => updateForm("tempat_lahir", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label>
								<span className="text-xs font-black uppercase text-slate-500">Tanggal Lahir</span>
								<input type="date" value={form.tanggal_lahir} onChange={(event) => updateForm("tanggal_lahir", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label className="sm:col-span-2">
								<span className="text-xs font-black uppercase text-slate-500">Unit Kerja</span>
								<input value={form.unit_kerja} onChange={(event) => updateForm("unit_kerja", event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
							</label>
							<label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 sm:col-span-2">
								<input type="checkbox" checked={form.is_active} onChange={(event) => updateForm("is_active", event.target.checked)} className="h-5 w-5 rounded border-slate-300 text-orange-600" />
								<span className="text-sm font-bold text-slate-700">Akun aktif</span>
							</label>

							<div className="sticky bottom-0 -mx-5 mt-2 flex gap-2 border-t border-slate-200 bg-white p-5 sm:col-span-2">
								<button type="button" onClick={() => setModalOpen(false)} className="h-12 flex-1 rounded-lg border border-slate-200 font-black text-slate-600">
									Batal
								</button>
								<button type="submit" disabled={submitting} className="h-12 flex-1 rounded-lg bg-orange-600 font-black text-white shadow-lg shadow-orange-900/15 disabled:bg-slate-400">
									{submitting ? "Menyimpan..." : "Simpan"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default PegawaiManagementPage;
