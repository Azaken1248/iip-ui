import { useCallback, useEffect, useState } from "react";
import { listContracts } from "../api/registry";
import type { ContractDefinition } from "../types";
import { ContractForm } from "./ContractForm";
import { SpinnerIcon, WarningCircleIcon } from "./icons";

/**
 * The control plane's schema half ([UC-13](https://github.com/Azaken1248/iip-docs)).
 *
 * <p>Defining a contract used to mean editing a file, rebuilding an image and
 * redeploying a service. It is now a form, and the registry it posts to is the
 * same one the seed job uses — there is no privileged path.
 */
export function ContractsPage() {
	const [contracts, setContracts] = useState<ContractDefinition[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(() => {
		setError(null);
		listContracts()
			.then(setContracts)
			.catch((e: Error) => setError(e.message));
	}, []);

	useEffect(load, [load]);

	return (
		<div className="flex flex-col gap-8 lg:flex-row lg:items-start">
			<section className="lg:w-[560px] lg:shrink-0">
				<h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-subtext">
					Define a contract
				</h2>
				<p className="mb-4 text-sm text-subtext/80">
					A contract is what makes a schema real to the platform: its fields, its record types,
					and the business key its records are ordered by. Registering one takes effect
					immediately — no build, no deploy.
				</p>
				<ContractForm onRegistered={load} />
			</section>

			<section className="min-w-0 flex-1">
				<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtext">
					Registered contracts
				</h2>

				{error && (
					<div
						role="alert"
						className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-text"
					>
						<WarningCircleIcon className="h-4 w-4 text-danger" />
						{error}
					</div>
				)}

				{!contracts && !error && (
					<div className="flex items-center gap-2 text-sm text-subtext">
						<SpinnerIcon className="h-4 w-4 animate-spin" />
						Loading contracts…
					</div>
				)}

				<div className="flex flex-col gap-3">
					{contracts?.map((contract) => (
						<article
							key={contract.contractId}
							className="rounded-xl border border-overlay/30 bg-mantle/40 p-4"
						>
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<h3 className="font-semibold text-text">{contract.title}</h3>
								<code className="text-xs text-subtext">{contract.contractId}</code>
							</div>
							<p className="mt-1 text-xs text-subtext">
								v{contract.schemaVersion} · key{" "}
								<code>{contract.naturalKey?.fields?.join(" | ")}</code> ·{" "}
								{contract.recordTypes?.length ?? 0} record type
								{(contract.recordTypes?.length ?? 0) === 1 ? "" : "s"}
							</p>
							<div className="mt-3 flex flex-wrap gap-1.5">
								{contract.fields?.map((field) => (
									<span
										key={field.name}
										className="rounded-md border border-overlay/40 px-2 py-0.5 text-xs text-subtext"
										title={`${field.type}${field.required ? ", required" : ""}${
											field.queryable ? ", queryable" : ""
										}`}
									>
										{field.name}
										<span className="text-subtext/60">:{field.type}</span>
										{field.queryable && <span className="ml-1 text-accent">◆</span>}
									</span>
								))}
							</div>
						</article>
					))}
				</div>

				{contracts?.length === 0 && (
					<p className="text-sm text-subtext">
						No contracts registered yet. The form on the left is the whole of adding one.
					</p>
				)}
			</section>
		</div>
	);
}
