import { useCallback, useEffect, useState } from "react";
import { listRecords } from "../api/records";
import { listContracts } from "../api/registry";
import type { ContractDefinition, RecordView } from "../types";
import { RecordForm } from "./RecordForm";
import { RecordTable } from "./RecordTable";
import { SpinnerIcon, WarningCircleIcon } from "./icons";

/**
 * Submit a record against any contract, and see what has been submitted
 * (Phase 6.9).
 *
 * <p>Phase 6.9's completion criterion is that the forms contract gets a usable
 * form with no UI code written for it — so this page contains no field names,
 * no column headings and no contract names. It asks the registry which
 * contracts exist and renders whichever one is picked.
 *
 * <p>The interns contract is not special here and does not appear anywhere in
 * this file, which is the visible end of a thread that started in Release 3:
 * the source service stopped knowing what an intern was, then the adapters did,
 * and this is the last place that did.
 */
export function SubmitPage() {
	const [contracts, setContracts] = useState<ContractDefinition[] | null>(null);
	const [selectedId, setSelectedId] = useState<string>("");
	const [records, setRecords] = useState<RecordView[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listContracts()
			.then((all) => {
				setContracts(all);
				setSelectedId((current) => current || (all[0]?.contractId ?? ""));
			})
			.catch((e: Error) => setError(e.message));
	}, []);

	const selected = contracts?.find((c) => c.contractId === selectedId);

	const refresh = useCallback(() => {
		if (!selectedId) return;
		listRecords(selectedId)
			.then(setRecords)
			.catch(() => setRecords([]));
	}, [selectedId]);

	useEffect(refresh, [refresh]);

	if (error) {
		return (
			<div
				role="alert"
				className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-text"
			>
				<WarningCircleIcon className="h-4 w-4 text-danger" />
				{error}
			</div>
		);
	}

	if (!contracts) {
		return (
			<div className="flex items-center gap-2 text-sm text-subtext">
				<SpinnerIcon className="h-4 w-4 animate-spin" /> Loading contracts…
			</div>
		);
	}

	if (contracts.length === 0) {
		return (
			<p className="text-sm text-subtext">
				No contracts are registered. Define one on the Contracts page — there is nothing to
				submit against until then.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-8 lg:flex-row lg:items-start">
			<section className="lg:w-[420px] lg:shrink-0">
				<label className="mb-1 block text-sm font-medium text-subtext" htmlFor="contract">
					Contract
				</label>
				<select
					id="contract"
					className="mb-4 w-full rounded-xl border border-overlay/40 bg-canvas px-3 py-2 text-sm text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
					value={selectedId}
					onChange={(e) => setSelectedId(e.target.value)}
				>
					{contracts.map((contract) => (
						<option key={contract.contractId} value={contract.contractId}>
							{contract.title}
						</option>
					))}
				</select>

				{selected && <RecordForm contract={selected} onSubmitted={refresh} />}
			</section>

			<section className="min-w-0 flex-1">
				<div className="mb-4 flex items-center justify-between gap-4">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-subtext">
						{selected?.title ?? "Records"}
					</h2>
					<button
						type="button"
						onClick={refresh}
						className="rounded-lg border border-overlay/40 px-3 py-1.5 text-sm font-medium text-subtext transition-colors hover:border-accent hover:text-text"
					>
						Refresh
					</button>
				</div>
				{selected && <RecordTable contract={selected} records={records} />}
			</section>
		</div>
	);
}
