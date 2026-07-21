import { useState } from "react";
import { InternForm } from "./components/InternForm";
import { InternList } from "./components/InternList";
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<div className="min-h-svh bg-canvas text-text">
			<header className="border-b border-overlay/20 bg-mantle">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
					<h1 className="text-lg font-semibold text-text">Intern Integration Platform</h1>
					<ThemeToggle />
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
					<section className="lg:col-span-2">
						<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtext">
							Submit a new intern
						</h2>
						<InternForm onSubmitted={() => setRefreshKey((key) => key + 1)} />
					</section>

					<section className="lg:col-span-3">
						<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtext">
							Submitted interns
						</h2>
						<InternList refreshKey={refreshKey} />
					</section>
				</div>
			</main>
		</div>
	);
}

export default App;
