import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiDownload } from "react-icons/fi";

const isStandaloneMode = () =>
	window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;

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
		<main className="min-h-screen overflow-hidden bg-[#08130f] text-white">
			<section className="relative isolate flex min-h-screen items-stretch px-4 pb-5 pt-4 sm:px-8 lg:px-12">
				<div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_0%,rgba(247,203,28,0.28),transparent_34%),linear-gradient(150deg,#052e1a_0%,#07130f_43%,#101827_100%)]" />
				<div className="absolute inset-x-0 top-0 -z-10 h-1.5 bg-gradient-to-r from-emerald-500 via-yellow-300 to-sky-500" />
				<div className="absolute -left-20 top-16 -z-10 h-48 w-[130%] rotate-[-10deg] bg-yellow-300/10 lg:left-auto lg:right-0 lg:h-64 lg:w-[58%]" />
				<div className="absolute bottom-0 left-0 -z-10 h-40 w-full bg-gradient-to-t from-black/55 to-transparent" />
				<div className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:34px_34px]" />

				<div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-7 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
					<header className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<img src="/logo-bogor.png" alt="Logo Kabupaten Bogor" className="h-10 w-10 object-contain" />
							<div className="text-left">
								<p className="text-xs font-bold uppercase text-yellow-200">Kabupaten Bogor</p>
								<p className="text-[11px] font-semibold uppercase text-white/55">Dinas Tenaga Kerja</p>
							</div>
						</div>
						<div className="h-10 rounded-full border border-white/15 px-3 py-2 text-xs font-bold uppercase text-white/80">
							Presensi
						</div>
					</header>

					<div className="relative flex flex-1 flex-col justify-center py-3 lg:min-h-[620px]">
						<p className="absolute left-0 top-3 -z-10 text-[4.6rem] font-black uppercase leading-none text-white/[0.045] sm:text-[7rem] lg:text-[10rem]">
							Disnaker
						</p>

						<div className="mx-auto flex w-full max-w-[440px] flex-col items-center text-center lg:mx-0 lg:max-w-xl lg:items-start lg:text-left">
							<div className="relative mb-6 flex aspect-square w-[min(68vw,280px)] items-center justify-center sm:w-[320px] lg:hidden">
								<div className="absolute inset-0 rounded-full border border-yellow-200/25 bg-white/[0.08] shadow-2xl shadow-black/35 backdrop-blur-md" />
								<div className="absolute inset-5 rounded-full border border-emerald-300/25" />
								<img src="/logo-bogor.png" alt="Logo Kabupaten Bogor" className="relative h-[76%] w-[76%] object-contain drop-shadow-2xl" />
							</div>

							<div className="mb-4 inline-flex items-center gap-2 border border-yellow-200/30 bg-yellow-200/10 px-3 py-2 text-[11px] font-black uppercase text-yellow-100">
								<span className="h-2 w-2 rounded-full bg-yellow-300" />
								Aplikasi Resmi
							</div>

							<h1 className="text-[clamp(2.9rem,17vw,5.9rem)] font-black uppercase leading-[0.86] tracking-normal sm:text-[5.8rem] lg:text-[7.2rem]">
								Disnaker
								<span className="mt-2 block text-yellow-300">Presensi</span>
							</h1>

							<div className="mt-6 grid w-full grid-cols-3 gap-2 text-left">
								<div className="border-l-2 border-yellow-300 pl-3">
									<p className="text-[10px] font-bold uppercase text-white/45">Wilayah</p>
									<p className="text-sm font-black text-white">Bogor</p>
								</div>
								<div className="border-l-2 border-emerald-400 pl-3">
									<p className="text-[10px] font-bold uppercase text-white/45">Mode</p>
									<p className="text-sm font-black text-white">Mobile</p>
								</div>
								<div className="border-l-2 border-sky-400 pl-3">
									<p className="text-[10px] font-bold uppercase text-white/45">Akses</p>
									<p className="text-sm font-black text-white">App</p>
								</div>
							</div>
						</div>
					</div>

					<div className="relative hidden justify-center lg:flex">
						<div className="absolute top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full border border-yellow-200/15" />
						<div className="absolute top-1/2 h-[410px] w-[410px] -translate-y-1/2 rounded-full border border-emerald-300/15" />
						<img src="/logo-bogor.png" alt="Logo Kabupaten Bogor" className="relative z-10 h-[420px] w-[420px] object-contain drop-shadow-2xl" />
					</div>

					<footer className="lg:col-span-2">
						<div className="mx-auto w-full max-w-[440px] space-y-3 lg:mx-0 lg:max-w-md">
							<button
								type="button"
								onClick={handleInstall}
								disabled={isInstalled}
								className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-yellow-300 px-6 py-4 text-base font-black uppercase text-slate-950 shadow-2xl shadow-yellow-950/30 transition hover:bg-yellow-200 disabled:cursor-default disabled:bg-emerald-300"
							>
								{isInstalled ? <FiCheckCircle className="h-5 w-5" /> : <FiDownload className="h-5 w-5" />}
								{isInstalled ? "Terpasang" : "Install"}
							</button>

							{installMessage && (
								<p className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-center text-xs font-semibold text-white/75 backdrop-blur">
									{installMessage}
								</p>
							)}
						</div>
					</footer>
				</div>
			</section>
		</main>
	);
};

export default LandingPage;
