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
				<li
					key={intern.recordId}
					className="rounded-2xl border border-overlay/20 bg-mantle p-4 shadow-sm transition-shadow hover:shadow-md"
				>
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-canvas ring-2 ring-canvas ${avatarTone(intern.internId)}`}
							>
								{initials(intern.firstName, intern.lastName)}
							</div>
							<div>
								<p className="font-medium text-text">
									{intern.firstName} {intern.lastName}
								</p>
								<p className="text-xs text-subtext">{intern.internId}</p>
							</div>
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
					<dl className="mt-3 space-y-1.5 text-sm text-subtext">
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
