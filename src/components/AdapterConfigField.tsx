import type { AdapterConfigField as FieldDescriptor } from "../types";

const inputClass =
	"w-full rounded-xl border border-overlay/40 bg-canvas px-3 py-2 text-sm text-text " +
	"placeholder:text-subtext/60 transition-colors focus:border-accent focus:outline-none focus:ring-2 " +
	"focus:ring-accent/30";

const ghostButton =
	"rounded-lg border border-overlay/40 px-2.5 py-1 text-xs font-medium text-subtext " +
	"transition-colors hover:border-accent hover:text-text";

/**
 * One config input, rendered from what an adapter said about itself.
 *
 * <p>This component has never heard of postgres, csv or webhook, and that is
 * the point of Phase 6.1's catalog: an adapter publishes the shape of its own
 * config, and the control plane renders it. A form with a branch per adapter
 * type would mean [UC-9](https://github.com/Azaken1248/iip-docs)'s "zero
 * changes to the UI" was false the first time anyone added a type.
 *
 * <p>Four kinds, because four is what the deployed adapters actually declare:
 * a string, a choice, an unordered map, and an ordered list of records. When a
 * fifth is genuinely needed a fifth adapter will declare it, and it will be
 * obvious here as an unrendered field rather than a silent omission — hence
 * the fallback.
 */
export function AdapterConfigInput({
	field,
	value,
	onChange,
}: {
	field: FieldDescriptor;
	value: unknown;
	onChange: (next: unknown) => void;
}) {
	const label = field.label ?? field.name;

	return (
		<div>
			<label className="mb-1 block text-sm font-medium text-subtext" htmlFor={field.name}>
				{label}
				{field.required && <span className="ml-1 text-danger">*</span>}
			</label>

			{field.type === "enum" ? (
				<select
					id={field.name}
					className={inputClass}
					value={String(value ?? field.default ?? "")}
					onChange={(e) => onChange(e.target.value)}
				>
					{(field.values ?? []).map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
			) : field.type === "map" ? (
				<PairEditor
					pairs={toPairs(value)}
					keyPlaceholder="name"
					valuePlaceholder="value"
					onChange={(pairs) => onChange(fromPairs(pairs))}
				/>
			) : field.type === "list" ? (
				<ListEditor
					rows={Array.isArray(value) ? (value as Record<string, string>[]) : []}
					itemFields={field.itemFields ?? []}
					onChange={onChange}
				/>
			) : field.type === "string" ? (
				<input
					id={field.name}
					className={inputClass}
					placeholder={field.default ?? ""}
					value={String(value ?? "")}
					onChange={(e) => onChange(e.target.value)}
				/>
			) : (
				// A type this build does not know how to render. Said out loud
				// rather than skipped: a silently missing field would be
				// indistinguishable from one the adapter does not need, and the
				// attachment would be created without it.
				<p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-text">
					This adapter declares <code>{field.name}</code> as <code>{field.type}</code>, which this
					version of the control plane cannot render. Attach it with the API, or update the UI.
				</p>
			)}

			{field.description && <p className="mt-1 text-xs text-subtext/80">{field.description}</p>}
		</div>
	);
}

/**
 * An ordered list of records — the csv adapter's column mapping.
 *
 * <p>Order is preserved and editable because for that adapter the order *is*
 * the meaning: it is the order of the columns in the file. Phase 6.3 learned
 * this the hard way, when the mapping was an object and came back from jsonb
 * sorted by key length.
 */
function ListEditor({
	rows,
	itemFields,
	onChange,
}: {
	rows: Record<string, string>[];
	itemFields: FieldDescriptor[];
	onChange: (next: Record<string, string>[]) => void;
}) {
	function patch(index: number, key: string, value: string) {
		onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
	}

	return (
		<div className="flex flex-col gap-2">
			{rows.map((row, index) => (
				<div key={index} className="flex items-center gap-2">
					<span className="w-5 shrink-0 text-right text-xs text-subtext/60">{index + 1}</span>
					{itemFields.map((item) => (
						<input
							key={item.name}
							className={inputClass}
							placeholder={item.name}
							aria-label={`Row ${index + 1} ${item.name}`}
							value={row[item.name] ?? ""}
							onChange={(e) => patch(index, item.name, e.target.value)}
						/>
					))}
					<button
						type="button"
						className={ghostButton}
						aria-label={`Remove row ${index + 1}`}
						onClick={() => onChange(rows.filter((_, i) => i !== index))}
					>
						−
					</button>
				</div>
			))}
			<button
				type="button"
				className={ghostButton + " self-start"}
				onClick={() => onChange([...rows, Object.fromEntries(itemFields.map((f) => [f.name, ""]))])}
			>
				Add row
			</button>
		</div>
	);
}

function PairEditor({
	pairs,
	keyPlaceholder,
	valuePlaceholder,
	onChange,
}: {
	pairs: [string, string][];
	keyPlaceholder: string;
	valuePlaceholder: string;
	onChange: (next: [string, string][]) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			{pairs.map(([key, value], index) => (
				<div key={index} className="flex items-center gap-2">
					<input
						className={inputClass}
						placeholder={keyPlaceholder}
						aria-label={`Entry ${index + 1} name`}
						value={key}
						onChange={(e) =>
							onChange(pairs.map((p, i) => (i === index ? [e.target.value, p[1]] : p)))
						}
					/>
					<input
						className={inputClass}
						placeholder={valuePlaceholder}
						aria-label={`Entry ${index + 1} value`}
						value={value}
						onChange={(e) =>
							onChange(pairs.map((p, i) => (i === index ? [p[0], e.target.value] : p)))
						}
					/>
					<button
						type="button"
						className={ghostButton}
						aria-label={`Remove entry ${index + 1}`}
						onClick={() => onChange(pairs.filter((_, i) => i !== index))}
					>
						−
					</button>
				</div>
			))}
			<button
				type="button"
				className={ghostButton + " self-start"}
				onClick={() => onChange([...pairs, ["", ""]])}
			>
				Add entry
			</button>
		</div>
	);
}

function toPairs(value: unknown): [string, string][] {
	if (!value || typeof value !== "object" || Array.isArray(value)) return [];
	return Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, String(v)]);
}

function fromPairs(pairs: [string, string][]): Record<string, string> {
	// Blank rows are dropped rather than sent as "": an untouched row someone
	// added and abandoned is not a header they meant to declare.
	return Object.fromEntries(pairs.filter(([key]) => key.trim()));
}
