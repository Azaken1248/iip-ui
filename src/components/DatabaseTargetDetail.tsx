import { useCallback, useEffect, useMemo, useState } from "react";
import { dbTarget } from "../api/targets";
import type { RecordView, TargetStatusResponse } from "../types";

/**
 * A record with its payload flattened alongside its id, which is the shape this
 * table has always drawn. Indexed rather than declared field by field, because
 * the payload's fields belong to a contract and this component is not entitled
 * to a fixed list of them.
 */
type FlattenedRecord = Record<string, string | undefined> & { recordId: string };
import { DatabaseIcon, MagnifyingGlassIcon, WarningCircleIcon } from "./icons";
import { TargetDetailHeader } from "./TargetDetailHeader";

type Props = {
	status: TargetStatusResponse | null;
	busy: boolean;
	onPauseToggle: () => void;
	onBack: () => void;
};

const statusBadgeClass: Record<string, string> = {
	ACTIVE: "bg-success/15 text-success",
	COMPLETED: "bg-info/15 text-info",
	WITHDRAWN: "bg-overlay/20 text-subtext",
};

export function DatabaseTargetDetail({ status, busy, onPauseToggle, onBack }: Props) {
	// The Targets page is an operator view of one deployment, and interns is
	// the contract this deployment has always had a shaped table for. Phase 6.9
	// generalises the *endpoint*; which contract this panel shows is a question
	// for the page, and naming one here keeps the change to what changed.
	const [records, setRecords] = useState<RecordView[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	const refresh = useCallback(async () => {
		try {
			setRecords(await dbTarget.listRecords("interns"));
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

	// The endpoint returns envelope-shaped records now (Phase 6.9), so the
	// payload is flattened back out here rather than through the whole table.
	// This panel still shows interns' columns, which is correct for what it is:
	// an operator's view of the shaped target this deployment actually has, not
	// a generic records browser -- that is the Submit page.
	const rows = useMemo<FlattenedRecord[]>(
		() =>
			records.map((record) => ({
				...(record.payload as Record<string, string | undefined>),
				recordId: record.recordId,
			})),
		[records],
	);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((intern) =>
			[
				intern.internId,
				intern.firstName,
				intern.lastName,
				intern.email,
				intern.college,
				intern.department,
				intern.mentor,
				intern.status,
			].some((field) => String(field ?? "").toLowerCase().includes(query)),
		);
	}, [rows, search]);

	return (
		<div>
			<TargetDetailHeader
				label="Database"
				icon={DatabaseIcon}
				tone="bg-info"
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
					placeholder="Search interns…"
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
					{rows.length === 0 ? "No rows in the database yet." : "No records match your search."}
				</p>
			) : (
				<div className="mt-4 overflow-hidden rounded-2xl border border-overlay/20 bg-mantle shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[840px] whitespace-nowrap text-left text-sm">
							<thead>
								<tr className="border-b border-overlay/20 text-xs font-semibold uppercase tracking-wide text-subtext">
									<th className="px-4 py-3 font-semibold">Intern</th>
									<th className="px-4 py-3 font-semibold">Email</th>
									<th className="px-4 py-3 font-semibold">College</th>
									<th className="px-4 py-3 font-semibold">Department</th>
									<th className="px-4 py-3 font-semibold">Mentor</th>
									<th className="px-4 py-3 font-semibold">Start date</th>
									<th className="px-4 py-3 font-semibold">Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-overlay/10">
								{filtered.map((intern) => (
									<tr key={intern.recordId} className="transition-colors hover:bg-canvas/60">
										<td className="px-4 py-3">
											<p className="font-medium text-text">
												{intern.firstName} {intern.lastName}
											</p>
											<p className="text-xs text-subtext">{intern.internId}</p>
										</td>
										<td className="max-w-[220px] truncate px-4 py-3 text-text">{intern.email}</td>
										<td className="px-4 py-3 text-text">{intern.college}</td>
										<td className="px-4 py-3 text-text">{intern.department}</td>
										<td className="px-4 py-3 text-text">{intern.mentor || "—"}</td>
										<td className="px-4 py-3 text-text">{intern.startDate}</td>
										<td className="px-4 py-3">
											<span
												className={
													"inline-block rounded-full px-2 py-0.5 text-xs font-medium " +
													(statusBadgeClass[intern.status ?? ""] ?? "bg-overlay/20 text-subtext")
												}
											>
												{intern.status}
											</span>
										</td>
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
