import type { ComponentType } from "react";
import type { TargetStatusResponse } from "../types";
import { ArrowLeftIcon, PauseIcon, PlayCircleIcon } from "./icons";

type Props = {
	label: string;
	icon: ComponentType<{ className?: string }>;
	tone: string;
	status: TargetStatusResponse | null;
	busy: boolean;
	onPauseToggle: () => void;
	onBack: () => void;
};

export function TargetDetailHeader({ label, icon: Icon, tone, status, busy, onPauseToggle, onBack }: Props) {
	const paused = status?.paused ?? false;

	return (
		<div className="flex flex-wrap items-center justify-between gap-4">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onBack}
					aria-label="Back to targets"
					className="flex h-9 w-9 items-center justify-center rounded-full border border-overlay/30 text-subtext transition-colors hover:border-accent hover:text-accent"
				>
					<ArrowLeftIcon className="h-4 w-4" />
				</button>
				<div className={`flex h-9 w-9 items-center justify-center rounded-full ${tone} text-canvas`}>
					<Icon className="h-4 w-4" />
				</div>
				<div>
					<p className="font-medium text-text">{label}</p>
					<span
						className={
							"inline-block rounded-full px-2 py-0.5 text-xs font-medium " +
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
			</div>
			<button
				type="button"
				onClick={onPauseToggle}
				disabled={busy || status === null}
				aria-label={`${paused ? "Resume" : "Pause"} ${label}`}
				className="inline-flex items-center gap-2 rounded-xl border border-overlay/30 px-4 py-2 text-sm font-medium
					text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
			>
				{paused ? <PlayCircleIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
				{paused ? "Resume" : "Pause"}
			</button>
		</div>
	);
}
