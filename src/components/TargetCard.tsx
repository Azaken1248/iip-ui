import type { ComponentType } from "react";
import type { TargetStatusResponse } from "../types";
import { PauseIcon, PlayCircleIcon } from "./icons";

type Props = {
	label: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	tone: string;
	status: TargetStatusResponse | null;
	busy: boolean;
	onPauseToggle: () => void;
	onOpen: () => void;
};

export function TargetCard({ label, description, icon: Icon, tone, status, busy, onPauseToggle, onOpen }: Props) {
	const paused = status?.paused ?? false;

	return (
		<div className="rounded-2xl border border-overlay/20 bg-mantle p-5 shadow-sm transition-shadow hover:shadow-md">
			<div className="flex items-start justify-between gap-2">
				<button type="button" onClick={onOpen} className="flex items-center gap-3 text-left">
					<div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone} text-canvas`}>
						<Icon className="h-5 w-5" />
					</div>
					<div>
						<p className="font-medium text-text">{label}</p>
						<p className="text-xs text-subtext">{description}</p>
					</div>
				</button>
				<span
					className={
						"shrink-0 rounded-full px-2 py-0.5 text-xs font-medium " +
						(status === null
							? "bg-overlay/20 text-subtext"
							: paused
								? "bg-warning/15 text-warning"
								: "bg-success/15 text-success")
					}
				>
					{status === null ? "…" : paused ? "Paused" : "Running"}
				</span>
			</div>
			<button
				type="button"
				onClick={onPauseToggle}
				disabled={busy || status === null}
				aria-label={`${paused ? "Resume" : "Pause"} ${label}`}
				className="mt-4 inline-flex items-center gap-2 rounded-xl border border-overlay/30 px-4 py-2 text-sm font-medium
					text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
			>
				{paused ? <PlayCircleIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
				{paused ? "Resume" : "Pause"}
			</button>
		</div>
	);
}
