import { useCallback, useEffect, useMemo, useState } from "react";
import { fileTarget } from "../api/targets";
import type { InternRow, TargetStatusResponse } from "../types";
import { MagnifyingGlassIcon, TableIcon, WarningCircleIcon } from "./icons";
import { TargetDetailHeader } from "./TargetDetailHeader";

type Props = {
	status: TargetStatusResponse | null;
	busy: boolean;
	onPauseToggle: () => void;
	onBack: () => void;
};

const COLUMNS: Array<{ key: keyof InternRow; label: string }> = [
	{ key: "recordId", label: "record_id" },
	{ key: "internId", label: "intern_id" },
	{ key: "firstName", label: "first_name" },
	{ key: "lastName", label: "last_name" },
	{ key: "email", label: "email" },
	{ key: "college", label: "college" },
	{ key: "department", label: "department" },
	{ key: "mentor", label: "mentor" },
	{ key: "startDate", label: "start_date" },
	{ key: "status", label: "status" },
	{ key: "createdAt", label: "created_at" },
];

export function FileTargetDetail({ status, busy, onPauseToggle, onBack }: Props) {
	const [rows, setRows] = useState<InternRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	const refresh = useCallback(async () => {
		try {
			setRows(await fileTarget.listInterns());
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load data.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
		const interval = setInterval(refresh, 4000);
		return () => clearInterval(interval);
	}, [refresh]);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) => COLUMNS.some((col) => row[col.key].toLowerCase().includes(query)));
	}, [rows, search]);

	return (
		<div>
			<TargetDetailHeader
				label="File"
				icon={TableIcon}
				tone="bg-success"
				status={status}
				busy={busy}
				onPauseToggle={onPauseToggle}
				onBack={onBack}
			/>

			<div className="relative mt-5 max-w-sm">
				<MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search interns.csv…"
					className="w-full rounded-xl border border-overlay/40 bg-canvas py-2.5 pl-10 pr-3 text-sm text-text
						placeholder:text-subtext/60 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
				/>
			</div>

			{loading ? (
				<p className="mt-4 text-sm text-subtext">Loading…</p>
			) : error ? (
				<div className="mt-4 flex items-center gap-2 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
					<WarningCircleIcon className="h-4 w-4 shrink-0" />
					<span>{error}</span>
				</div>
			) : filtered.length === 0 ? (
				<p className="mt-4 text-sm text-subtext">
					{rows.length === 0 ? "interns.csv is empty so far." : "No rows match your search."}
				</p>
			) : (
				<div className="mt-4 overflow-hidden rounded-2xl border border-overlay/20 shadow-sm">
					<div className="overflow-x-auto">
						<table className="border-collapse text-xs">
							<thead>
								<tr>
									<th className="sticky left-0 z-10 border border-overlay/30 bg-surface px-2 py-1.5 text-center font-semibold text-subtext">
										#
									</th>
									{COLUMNS.map((col) => (
										<th
											key={col.key}
											className="whitespace-nowrap border border-overlay/30 bg-surface px-3 py-1.5 text-left font-semibold text-text"
										>
											{col.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{filtered.map((row, index) => (
									<tr key={row.recordId} className={index % 2 === 0 ? "bg-canvas" : "bg-mantle"}>
										<td className="sticky left-0 border border-overlay/20 bg-surface/60 px-2 py-1.5 text-center text-subtext">
											{index + 1}
										</td>
										{COLUMNS.map((col) => (
											<td
												key={col.key}
												className="whitespace-nowrap border border-overlay/20 px-3 py-1.5 text-text"
											>
												{row[col.key] || <span className="text-subtext">—</span>}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
