import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiDownload, FiShield, FiSmartphone } from "react-icons/fi";
import { isStandaloneMode } from "../utils/pwa";

const LandingPage = () => {
	const navigate = useNavigate();
	const [installPrompt, setInstallPrompt] = useState(null);
	const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
	const [installMessage, setInstallMessage] = useState("");

	useEffect(() => {
		const handleBeforeInstallPrompt = (event) => {
			event.preventDefault();
			setInstallPrompt(event);
			setInstallMessage("");
		};

		const handleAppInstalled = () => {
			setIsInstalled(true);
			setInstallPrompt(null);
			setInstallMessage("Aplikasi sudah terpasang di perangkat ini.");
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	useEffect(() => {
		if (isInstalled) {
			navigate("/login", { replace: true });
		}
	}, [isInstalled, navigate]);

	const handleInstall = async () => {
		if (isInstalled) return;

		if (!installPrompt) {
			setInstallMessage("Install tersedia setelah browser menyiapkan prompt aplikasi.");
			return;
		}

		installPrompt.prompt();
		const choice = await installPrompt.userChoice;
		setInstallPrompt(null);

		if (choice.outcome === "accepted") {
			setInstallMessage("Instalasi Disnaker Presensi dimulai.");
		} else {
			setInstallMessage("Instalasi dibatalkan.");
		}
	};

	return (
		<main className="min-h-screen overflow-hidden bg-[#07130f] text-white">
			<section className="relative isolate flex min-h-screen px-4 py-5 sm:px-8 lg:px-10 xl:px-12">
				<div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,#06351f_0%,#081711_45%,#111827_100%)]" />
				<div className="absolute inset-x-0 top-0 -z-10 h-1.5 bg-gradient-to-r from-emerald-500 via-yellow-300 to-sky-500" />
				<div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-black/45 to-transparent" />
				<div className="absolute inset-0 -z-10 opacity-[0.055] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:38px_38px]" />

				<div className="mx-auto grid w-full max-w-6xl grid-rows-[auto_1fr_auto] gap-6">
					<header className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur sm:px-5">
						<div className="flex items-center gap-3">
							<img src="/logo-bogor.png" alt="Logo Kabupaten Bogor" className="h-10 w-10 object-contain" />
							<div className="text-left">
								<p className="text-xs font-bold uppercase text-yellow-200">Kabupaten Bogor</p>
								<p className="text-[11px] font-semibold uppercase text-white/55">Dinas Tenaga Kerja</p>
							</div>
						</div>
						<div className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold uppercase text-white/80">
							Presensi
						</div>
					</header>

					<div className="grid items-center gap-8 py-2 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.78fr)] lg:gap-12">
						<div className="mx-auto flex w-full max-w-[520px] flex-col items-center text-center lg:mx-0 lg:max-w-2xl lg:items-start lg:text-left">
							<div className="mb-5 flex aspect-square w-[min(54vw,230px)] items-center justify-center rounded-full border border-yellow-200/20 bg-white/[0.07] shadow-2xl shadow-black/35 backdrop-blur-sm sm:w-[260px] lg:hidden">
								<img src="/logo-bogor.png" alt="Logo Kabupaten Bogor" className="h-[76%] w-[76%] object-contain drop-shadow-2xl" />
							</div>

							<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-200/30 bg-yellow-200/10 px-4 py-2 text-[11px] font-black uppercase text-yellow-100">
								<FiShield className="h-4 w-4" />
								Aplikasi Resmi Disnaker
							</div>

							<h1 className="max-w-[680px] text-[clamp(2.9rem,14vw,5.6rem)] font-black uppercase leading-[0.9] tracking-normal sm:text-[5.2rem] lg:text-[6.2rem] xl:text-[6.7rem]">
								Disnaker
								<span className="mt-1 block text-yellow-300">Presensi</span>
							</h1>
							<p className="mt-5 max-w-xl text-sm font-medium leading-7 text-white/70 sm:text-base">
								Akses presensi pegawai Kabupaten Bogor melalui aplikasi yang terpasang di perangkat.
							</p>

							<div className="mt-7 grid w-full grid-cols-3 gap-3 text-left sm:max-w-lg">
								<div className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3">
									<p className="text-[10px] font-bold uppercase text-white/45">Wilayah</p>
									<p className="mt-1 text-sm font-black text-white">Bogor</p>
								</div>
								<div className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3">
									<p className="text-[10px] font-bold uppercase text-white/45">Mode</p>
									<p className="mt-1 text-sm font-black text-white">PWA</p>
								</div>
								<div className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3">
									<p className="text-[10px] font-bold uppercase text-white/45">Akses</p>
									<p className="mt-1 text-sm font-black text-white">App</p>
								</div>
							</div>

							<div className="mt-8 w-full max-w-sm space-y-3 sm:max-w-md">
								<button
									type="button"
									onClick={handleInstall}
									disabled={isInstalled}
									className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-yellow-300 px-6 py-4 text-base font-black uppercase text-slate-950 shadow-2xl shadow-yellow-950/30 transition hover:bg-yellow-200 disabled:cursor-default disabled:bg-emerald-300"
								>
									{isInstalled ? <FiCheckCircle className="h-5 w-5" /> : <FiDownload className="h-5 w-5" />}
									{isInstalled ? "Terpasang" : "Install Aplikasi"}
								</button>

								{installMessage && (
									<p className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-center text-xs font-semibold text-white/75 backdrop-blur">
										{installMessage}
									</p>
								)}
							</div>
						</div>

						<div className="hidden justify-end lg:flex">
							<div className="w-full max-w-[430px] rounded-xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/25 backdrop-blur">
								<div className="flex min-h-[360px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
									<img src="/logo-bogor.png" alt="Logo Kabupaten Bogor" className="h-72 w-72 object-contain drop-shadow-2xl xl:h-80 xl:w-80" />
								</div>
								<div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
									<div className="flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-300 text-slate-950">
										<FiSmartphone className="h-5 w-5" />
									</div>
									<div>
										<p className="text-sm font-black uppercase text-white">PWA Ready</p>
										<p className="text-xs font-semibold text-white/50">Login dibuka setelah aplikasi terpasang</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<footer className="text-center text-[11px] font-semibold uppercase text-white/35 lg:text-left">
						Disnaker Kabupaten Bogor
					</footer>
				</div>
			</section>
		</main>
	);
};

export default LandingPage;
