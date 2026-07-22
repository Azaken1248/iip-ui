import { useState } from "react";
import { InternForm } from "./components/InternForm";
import { InternList } from "./components/InternList";
import { TargetsPage } from "./components/TargetsPage";
import { ThemeToggle } from "./components/ThemeToggle";
import { ViewToggle } from "./components/ViewToggle";
import { useViewMode } from "./hooks/useViewMode";

type Page = "submit" | "targets";

function App() {
	const [page, setPage] = useState<Page>("submit");
	const [refreshKey, setRefreshKey] = useState(0);
	const { viewMode, setViewMode } = useViewMode();

	return (
		<div className="min-h-svh bg-canvas text-text">
			<header className="border-b border-overlay/20 bg-mantle">
				<div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex flex-wrap items-center gap-4">
						<h1 className="text-lg font-semibold text-text">Intern Integration Platform</h1>
						<nav className="inline-flex items-center gap-0.5 rounded-lg border border-overlay/30 bg-canvas p-0.5">
							<button
								type="button"
								onClick={() => setPage("submit")}
								className={
									"rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
									(page === "submit" ? "bg-accent text-canvas" : "text-subtext hover:text-text")
								}
							>
								Submit
							</button>
							<button
								type="button"
								onClick={() => setPage("targets")}
								className={
									"rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
									(page === "targets" ? "bg-accent text-canvas" : "text-subtext hover:text-text")
								}
							>
								Targets
							</button>
						</nav>
					</div>
					<ThemeToggle />
				</div>
			</header>

			<main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
				{page === "submit" ? (
					<div className="flex flex-col gap-8 lg:flex-row lg:items-start">
						<section className="lg:w-[420px] lg:shrink-0">
							<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtext">
								Submit a new intern
							</h2>
							<InternForm onSubmitted={() => setRefreshKey((key) => key + 1)} />
						</section>

						<section className="min-w-0 flex-1">
							<div className="mb-4 flex items-center justify-between gap-4">
								<h2 className="text-sm font-semibold uppercase tracking-wide text-subtext">
									Submitted interns
								</h2>
								<ViewToggle viewMode={viewMode} onChange={setViewMode} />
							</div>
							<InternList refreshKey={refreshKey} viewMode={viewMode} />
						</section>
					</div>
				) : (
					<section>
						<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtext">
							Target processes
						</h2>
						<TargetsPage />
					</section>
				)}
			</main>
		</div>
	);
}

export default App;
