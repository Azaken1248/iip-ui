import { useEffect, useState } from "react";
import { listInterns } from "../api/interns";
import type { InternSummaryResponse } from "../types";
import {
	BriefcaseIcon,
	CalendarBlankIcon,
	EnvelopeSimpleIcon,
	GraduationCapIcon,
	UsersIcon,
	UsersThreeIcon,
	WarningCircleIcon,
} from "./icons";

type Props = {
	refreshKey: number;
	viewMode: "grid" | "list";
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

const AVATAR_TONES = ["bg-accent", "bg-info", "bg-success", "bg-warning"];

function avatarTone(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function initials(firstName: string, lastName: string): string {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
	return (
		<span
			className={
				"inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium " +
				(statusBadgeClass[status] ?? "bg-overlay/20 text-subtext")
			}
		>
			{status}
		</span>
	);
}

function Avatar({ intern, size = "md" }: { intern: InternSummaryResponse; size?: "sm" | "md" }) {
	const dimension = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
	return (
		<div
			className={`flex ${dimension} shrink-0 items-center justify-center rounded-full font-semibold text-canvas ring-2 ring-canvas ${avatarTone(intern.internId)}`}
		>
			{initials(intern.firstName, intern.lastName)}
		</div>
	);
}

function GridView({ interns }: { interns: InternSummaryResponse[] }) {
	return (
		<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
			{interns.map((intern) => (
				<li
					key={intern.recordId}
					className="rounded-2xl border border-overlay/20 bg-mantle p-5 shadow-sm transition-shadow hover:shadow-md"
				>
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-3">
							<Avatar intern={intern} />
							<div>
								<p className="font-medium text-text">
									{intern.firstName} {intern.lastName}
								</p>
								<p className="text-xs text-subtext">{intern.internId}</p>
							</div>
						</div>
						<StatusBadge status={intern.status} />
					</div>
					<dl className="mt-4 space-y-2 text-sm text-subtext">
						<div className="flex items-center justify-between gap-2">
							<dt className="flex items-center gap-1.5">
								<EnvelopeSimpleIcon className="h-3.5 w-3.5" />
								Email
							</dt>
							<dd className="truncate text-text">{intern.email}</dd>
						</div>
						<div className="flex items-center justify-between gap-2">
							<dt className="flex items-center gap-1.5">
								<GraduationCapIcon className="h-3.5 w-3.5" />
								College
							</dt>
							<dd className="truncate text-text">{intern.college}</dd>
						</div>
						<div className="flex items-center justify-between gap-2">
							<dt className="flex items-center gap-1.5">
								<BriefcaseIcon className="h-3.5 w-3.5" />
								Department
							</dt>
							<dd className="truncate text-text">{intern.department}</dd>
						</div>
						{intern.mentor && (
							<div className="flex items-center justify-between gap-2">
								<dt className="flex items-center gap-1.5">
									<UsersThreeIcon className="h-3.5 w-3.5" />
									Mentor
								</dt>
								<dd className="truncate text-text">{intern.mentor}</dd>
							</div>
						)}
						<div className="flex items-center justify-between gap-2">
							<dt className="flex items-center gap-1.5">
								<CalendarBlankIcon className="h-3.5 w-3.5" />
								Start date
							</dt>
							<dd className="text-text">{intern.startDate}</dd>
						</div>
					</dl>
				</li>
			))}
		</ul>
	);
}

function ListTableView({ interns }: { interns: InternSummaryResponse[] }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-overlay/20 bg-mantle shadow-sm">
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
						{interns.map((intern) => (
							<tr key={intern.recordId} className="transition-colors hover:bg-canvas/60">
								<td className="px-4 py-3">
									<div className="flex items-center gap-2.5">
										<Avatar intern={intern} size="sm" />
										<div>
											<p className="font-medium text-text">
												{intern.firstName} {intern.lastName}
											</p>
											<p className="text-xs text-subtext">{intern.internId}</p>
										</div>
									</div>
								</td>
								<td className="max-w-[220px] truncate px-4 py-3 text-text">{intern.email}</td>
								<td className="px-4 py-3 text-text">{intern.college}</td>
								<td className="px-4 py-3 text-text">{intern.department}</td>
								<td className="px-4 py-3 text-text">{intern.mentor || "—"}</td>
								<td className="px-4 py-3 text-text">{intern.startDate}</td>
								<td className="px-4 py-3">
									<StatusBadge status={intern.status} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export function InternList({ refreshKey, viewMode }: Props) {
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

	if (viewMode === "grid") {
		return <GridView interns={state.interns} />;
	}

	// A multi-column table can't fit meaningfully on a phone-width screen no
	// matter how many columns are hidden, so list view falls back to the
	// card grid below `sm` regardless of the selected mode -- pure CSS via
	// paired hidden/visible wrappers, no viewport-detection JS needed.
	return (
		<>
			<div className="sm:hidden">
				<GridView interns={state.interns} />
			</div>
			<div className="hidden sm:block">
				<ListTableView interns={state.interns} />
			</div>
		</>
	);
}
