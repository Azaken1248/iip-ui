import { useMemo, useState, type FormEvent } from "react";
import { submitRecord } from "../api/records";
import type { ContractDefinition, ContractField } from "../types";
import { CheckCircleIcon, PaperPlaneTiltIcon, SpinnerIcon, WarningCircleIcon } from "./icons";

const inputClass =
	"w-full rounded-xl border border-overlay/40 bg-canvas px-3 py-2 text-sm text-text " +
	"placeholder:text-subtext/60 transition-colors focus:border-accent focus:outline-none focus:ring-2 " +
	"focus:ring-accent/30 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20";

/** The HTML input type a contract's field type maps to. */
function inputTypeFor(field: ContractField): string {
	switch (field.type) {
		case "date":
			return "date";
		case "email":
			return "email";
		case "integer":
			return "number";
		default:
			return "text";
	}
}

/**
 * A submission form for <em>any</em> contract, built from its own definition
 * (Phase 6.9).
 *
 * <p>This replaces a form that named nine intern fields in JSX. The claim being
 * made is the release's: a contract defined in the browser five minutes ago
 * gets a usable form with no code written for it, because the contract already
 * says everything a form needs — the fields, their types, which are required,
 * and which have defaults the server will fill in.
 *
 * <p>What it deliberately does not do is validate the payload itself. The
 * source service validates every submission against the registered contract
 * regardless of who sent it, and a second implementation of those rules here
 * would be a second thing to keep in step with a definition that changes at
 * runtime. Required-ness is marked so the browser can catch the obvious case;
 * everything else is the server's answer to give.
 */
export function RecordForm({
	contract,
	onSubmitted,
}: {
	contract: ContractDefinition;
	onSubmitted: () => void;
}) {
	const [values, setValues] = useState<Record<string, string>>({});
	const [problems, setProblems] = useState<string[]>([]);
	const [notice, setNotice] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	// Fields the server fills in when omitted. Showing them as optional with
	// the default as placeholder is more honest than marking them required and
	// making someone type a value the contract already knows.
	const fields = useMemo(() => contract.fields ?? [], [contract]);

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setProblems([]);
		setNotice(null);
		setBusy(true);

		try {
			const payload = coerce(fields, values);
			const accepted = await submitRecord(contract.contractId, payload);
			setNotice(
				`Accepted as record ${accepted.recordId ?? ""} — published to ${contract.contractId}.created ` +
					"and on its way to whatever is attached.",
			);
			setValues({});
			onSubmitted();
		} catch (error) {
			setProblems(messagesOf(error));
		} finally {
			setBusy(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{fields.map((field) => (
				<div key={field.name}>
					<label className="mb-1 block text-sm font-medium text-subtext" htmlFor={field.name}>
						{field.name}
						{field.required && !field.default && <span className="ml-1 text-danger">*</span>}
						<span className="ml-2 text-xs font-normal text-subtext/70">{field.type}</span>
					</label>

					{field.type === "enum" ? (
						<select
							id={field.name}
							className={inputClass}
							value={values[field.name] ?? field.default ?? ""}
							onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
						>
							{!field.required && <option value="">—</option>}
							{(field.values ?? []).map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					) : field.type === "boolean" ? (
						<select
							id={field.name}
							className={inputClass}
							value={values[field.name] ?? field.default ?? ""}
							onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
						>
							<option value="">—</option>
							<option value="true">true</option>
							<option value="false">false</option>
						</select>
					) : (
						<input
							id={field.name}
							type={inputTypeFor(field)}
							className={inputClass}
							placeholder={field.default ? `${field.default} (default)` : ""}
							value={values[field.name] ?? ""}
							onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
						/>
					)}
				</div>
			))}

			{problems.length > 0 && (
				<div
					role="alert"
					className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-text"
				>
					<div className="mb-1 flex items-center gap-2 font-medium">
						<WarningCircleIcon className="h-4 w-4 text-danger" /> Not accepted
					</div>
					<ul className="ml-6 list-disc space-y-1 text-subtext">
						{problems.map((problem) => (
							<li key={problem}>{problem}</li>
						))}
					</ul>
				</div>
			)}

			{notice && (
				<div
					role="status"
					className="flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-text"
				>
					<CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
					<span>{notice}</span>
				</div>
			)}

			<button
				type="submit"
				disabled={busy}
				className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
			>
				{busy ? (
					<SpinnerIcon className="h-4 w-4 animate-spin" />
				) : (
					<PaperPlaneTiltIcon className="h-4 w-4" />
				)}
				Submit record
			</button>
		</form>
	);
}

/**
 * Turns form strings into the JSON types the contract declares.
 *
 * <p>An HTML input yields a string for everything, and the envelope schema
 * cares: `rating: "5"` and `rating: 5` are a string and a number, and a
 * contract declaring `integer` means the second. Empty values are dropped
 * rather than sent as `""`, so a field with a server-side default gets the
 * default instead of a blank that would fail its own required check.
 */
function coerce(
	fields: ContractField[],
	values: Record<string, string>,
): Record<string, unknown> {
	const payload: Record<string, unknown> = {};
	for (const field of fields) {
		const raw = values[field.name];
		if (raw === undefined || raw === "") continue;

		if (field.type === "integer") {
			const parsed = Number(raw);
			payload[field.name] = Number.isFinite(parsed) ? parsed : raw;
		} else if (field.type === "boolean") {
			payload[field.name] = raw === "true";
		} else {
			payload[field.name] = raw;
		}
	}
	return payload;
}

function messagesOf(error: unknown): string[] {
	if (error && typeof error === "object" && "problems" in error) {
		const problems = (error as { problems: string[] }).problems;
		if (problems.length > 0) return problems;
	}
	return [error instanceof Error ? error.message : "Something went wrong"];
}
