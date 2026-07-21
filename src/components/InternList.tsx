import { useEffect, useState } from "react";
import { listInterns } from "../api/interns";
import type { InternSummaryResponse } from "../types";
import { UsersIcon, WarningCircleIcon } from "./icons";

type Props = {
	refreshKey: number;
};

type State =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "loaded"; interns: InternSummaryResponse[] };

const statusBadgeClass: Record<string, string> = {
	ACTIVE: "bg-success/15 text-success",
	COMPLETED: "bg-info/15 text-info",
	WITHDRAWN: "bg-overlay/20 text-subtext",
};

export function InternList({ refreshKey }: Props) {
	const [state, setState] = useState<State>({ status: "loading" });

	useEffect(() => {
		let cancelled = false;
		setState({ status: "loading" });

		listInterns()
			.then((interns) => {
				if (!cancelled) setState({ status: "loaded", interns });
			})
			.catch((err) => {
				if (!cancelled) {
					setState({
						status: "error",
						message: err instanceof Error ? err.message : "Failed to load interns.",
					});
				}
			});

		return () => {
			cancelled = true;
		};
	}, [refreshKey]);

	if (state.status === "loading") {
		return <p className="text-sm text-subtext">Loading…</p>;
	}

	if (state.status === "error") {
		return (
			<div className="flex items-center gap-2 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
				<WarningCircleIcon className="h-4 w-4 shrink-0" />
				<span>{state.message}</span>
			</div>
		);
	}

	if (state.interns.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-overlay/40 py-10 text-center text-subtext">
				<UsersIcon className="h-6 w-6" />
				<p className="text-sm">No interns submitted yet.</p>
			</div>
		);
	}

	return (
		<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{state.interns.map((intern) => (
				<li key={intern.recordId} className="rounded-2xl border border-overlay/20 bg-mantle p-4 shadow-sm">
					<div className="flex items-start justify-between gap-2">
						<div>
							<p className="font-medium text-text">
								{intern.firstName} {intern.lastName}
							</p>
							<p className="text-xs text-subtext">{intern.internId}</p>
						</div>
						<span
							className={
								"shrink-0 rounded-full px-2 py-0.5 text-xs font-medium " +
								(statusBadgeClass[intern.status] ?? "bg-overlay/20 text-subtext")
							}
						>
							{intern.status}
						</span>
					</div>
					<dl className="mt-3 space-y-1 text-sm text-subtext">
						<div className="flex justify-between gap-2">
							<dt>Email</dt>
							<dd className="truncate text-text">{intern.email}</dd>
						</div>
						<div className="flex justify-between gap-2">
							<dt>College</dt>
							<dd className="truncate text-text">{intern.college}</dd>
						</div>
						<div className="flex justify-between gap-2">
							<dt>Department</dt>
							<dd className="truncate text-text">{intern.department}</dd>
						</div>
						{intern.mentor && (
							<div className="flex justify-between gap-2">
								<dt>Mentor</dt>
								<dd className="truncate text-text">{intern.mentor}</dd>
							</div>
						)}
						<div className="flex justify-between gap-2">
							<dt>Start date</dt>
							<dd className="text-text">{intern.startDate}</dd>
						</div>
					</dl>
				</li>
			))}
		</ul>
	);
}
