import React from "react";
import toast from "react-hot-toast";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import api from "../../api";

const BidangManagementPage = () => {
	const [bidangs, setBidangs] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [submitting, setSubmitting] = React.useState(false);
	const [modalOpen, setModalOpen] = React.useState(false);
	const [editing, setEditing] = React.useState(null);
	const [nama, setNama] = React.useState("");

	const loadBidangs = React.useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/admin/bidang");
			setBidangs(res.data.data || []);
		} catch {
			toast.error("Gagal memuat data bidang");
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => { loadBidangs(); }, [loadBidangs]);

	const openCreate = () => {
		setEditing(null);
		setNama("");
		setModalOpen(true);
	};

	const openEdit = (b) => {
		setEditing(b);
		setNama(b.nama);
		setModalOpen(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!nama.trim()) return toast.error("Nama bidang wajib diisi");
		setSubmitting(true);
		try {
			if (editing) {
				await api.put(`/admin/bidang/${editing.id}`, { nama: nama.trim() });
				toast.success("Bidang diperbarui");
			} else {
				await api.post("/admin/bidang", { nama: nama.trim() });
				toast.success("Bidang ditambahkan");
			}
			setModalOpen(false);
			await loadBidangs();
		} catch (err) {
			toast.error(err.response?.data?.message || "Gagal menyimpan bidang");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (b) => {
		if (!window.confirm(`Hapus bidang "${b.nama}"?`)) return;
		try {
			await api.delete(`/admin/bidang/${b.id}`);
			toast.success("Bidang dihapus");
			await loadBidangs();
		} catch (err) {
			toast.error(err.response?.data?.message || "Gagal menghapus bidang");
		}
	};

	return (
		<div className="mx-auto max-w-2xl space-y-4 p-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-lg font-bold text-slate-900">Manajemen Bidang</h1>
					<p className="text-sm text-slate-500">Atur struktur bidang / unit kerja</p>
				</div>
				<button
					type="button"
					onClick={openCreate}
					className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
				>
					<FiPlus className="h-4 w-4" />
					Tambah
				</button>
			</div>

			{loading ? (
				<div className="py-12 text-center text-slate-400">Memuat...</div>
			) : bidangs.length === 0 ? (
				<div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-400">
					Belum ada bidang. Tambahkan bidang terlebih dahulu.
				</div>
			) : (
				<ul className="space-y-2">
					{bidangs.map((b, idx) => (
						<li
							key={b.id}
							className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
						>
							<div className="flex items-center gap-3">
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
									{idx + 1}
								</span>
								<div>
									<p className="font-semibold text-slate-800">{b.nama}</p>
									<p className="text-xs text-slate-400">{b.jumlah_pegawai} pegawai</p>
								</div>
							</div>
							<div className="flex gap-1">
								<button
									type="button"
									onClick={() => openEdit(b)}
									className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
								>
									<FiEdit2 className="h-4 w-4" />
								</button>
								<button
									type="button"
									onClick={() => handleDelete(b)}
									className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
								>
									<FiTrash2 className="h-4 w-4" />
								</button>
							</div>
						</li>
					))}
				</ul>
			)}

			{/* Modal */}
			{modalOpen && (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
					<div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-base font-bold text-slate-900">
								{editing ? "Edit Bidang" : "Tambah Bidang"}
							</h2>
							<button
								type="button"
								onClick={() => setModalOpen(false)}
								className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
							>
								<FiX className="h-4 w-4" />
							</button>
						</div>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Nama Bidang <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={nama}
									onChange={(e) => setNama(e.target.value)}
									placeholder="Contoh: Sekretariat"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
									autoFocus
								/>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setModalOpen(false)}
									className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
								>
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

export default BidangManagementPage;
