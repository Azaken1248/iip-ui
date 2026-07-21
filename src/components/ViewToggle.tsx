import { ListBulletsIcon, SquaresFourIcon } from "./icons";

type Props = {
	viewMode: "grid" | "list";
	onChange: (mode: "grid" | "list") => void;
};

export function ViewToggle({ viewMode, onChange }: Props) {
	return (
		<div className="inline-flex items-center gap-0.5 rounded-lg border border-overlay/30 bg-canvas p-0.5">
			<button
				type="button"
				onClick={() => onChange("grid")}
				aria-pressed={viewMode === "grid"}
				aria-label="Grid view"
				title="Grid view"
				className={
					"flex h-7 w-7 items-center justify-center rounded-md transition-colors " +
					(viewMode === "grid" ? "bg-accent text-canvas" : "text-subtext hover:text-text")
				}
			>
				<SquaresFourIcon className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => onChange("list")}
				aria-pressed={viewMode === "list"}
				aria-label="List view"
				title="List view"
				className={
					"flex h-7 w-7 items-center justify-center rounded-md transition-colors " +
					(viewMode === "list" ? "bg-accent text-canvas" : "text-subtext hover:text-text")
				}
			>
				<ListBulletsIcon className="h-4 w-4" />
			</button>
		</div>
	);
}
