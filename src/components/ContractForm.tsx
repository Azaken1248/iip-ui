import { useState, type FormEvent } from "react";
import { RegistryError, registerContract } from "../api/registry";
import { toDocument, validateContract } from "../contracts/validate";
import { FIELD_TYPES, type ContractDefinition, type ContractField } from "../types";
import { CheckCircleIcon, PaperPlaneTiltIcon, SpinnerIcon, WarningCircleIcon } from "./icons";

const emptyField = (): ContractField => ({
	name: "",
	type: "string",
	required: true,
	queryable: false,
	values: [],
	default: "",
});

const emptyContract = (): ContractDefinition => ({
	contractId: "",
	title: "",
	naturalKey: { strategy: "field", fields: [""] },
	recordTypes: [""],
	fields: [emptyField()],
});

const inputClass =
	"w-full rounded-xl border border-overlay/40 bg-canvas px-3 py-2 text-sm text-text " +
	"placeholder:text-subtext/60 transition-colors focus:border-accent focus:outline-none focus:ring-2 " +
	"focus:ring-accent/30";

const labelClass = "mb-1 block text-sm font-medium text-subtext";

const ghostButton =
	"rounded-lg border border-overlay/40 px-3 py-1.5 text-sm font-medium text-subtext " +
	"transition-colors hover:border-accent hover:text-text";

export function ContractForm({ onRegistered }: { onRegistered: () => void }) {
	const [contract, setContract] = useState<ContractDefinition>(emptyContract);
	const [problems, setProblems] = useState<string[]>([]);
	const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
	const [result, setResult] = useState<string | null>(null);

	function patchField(index: number, patch: Partial<ContractField>) {
		setContract((current) => ({
			...current,
			fields: current.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
		}));
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setResult(null);

		const found = validateContract(contract);
		if (found.length > 0) {
			setProblems(found);
			return;
		}

		setProblems([]);
		setStatus("sending");
		try {
			const { contract: saved, created } = await registerContract(toDocument(contract));
			setResult(
				`${created ? "Registered" : "Updated"} '${saved.contractId}' at schema version ` +
					`${saved.schemaVersion}. No service was restarted — records can be submitted against it now.`,
			);
			setStatus("done");
			setContract(emptyContract());
			onRegistered();
		} catch (error) {
			// The registry's problems are shown as it wrote them. It knows
			// things this form cannot — whether a change is backward compatible
			// with what is already registered, most of all — and paraphrasing
			// would lose the one explanation that says which consumers break.
			if (error instanceof RegistryError) {
				setProblems(error.problems.length > 0 ? error.problems : [error.message]);
			} else {
				setProblems([error instanceof Error ? error.message : "Something went wrong"]);
			}
			setStatus("idle");
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label className={labelClass} htmlFor="contractId">
						Contract id
					</label>
					<input
						id="contractId"
						className={inputClass}
						placeholder="purchase-orders"
						value={contract.contractId}
						onChange={(e) => setContract({ ...contract, contractId: e.target.value })}
					/>
					<p className="mt-1 text-xs text-subtext/80">
						Lower-case. Becomes the topic name — <code>{contract.contractId || "…"}.created</code>.
					</p>
				</div>
				<div>
					<label className={labelClass} htmlFor="title">
						Title
					</label>
					<input
						id="title"
						className={inputClass}
						placeholder="Purchase Orders"
						value={contract.title}
						onChange={(e) => setContract({ ...contract, title: e.target.value })}
					/>
				</div>
			</div>

			<section>
				<div className="mb-2 flex items-center justify-between">
					<h3 className="text-sm font-semibold text-text">Fields</h3>
					<button
						type="button"
						className={ghostButton}
						onClick={() => setContract({ ...contract, fields: [...contract.fields, emptyField()] })}
					>
						Add field
					</button>
				</div>

				<div className="flex flex-col gap-3">
					{contract.fields.map((field, index) => (
						<div
							key={index}
							className="rounded-xl border border-overlay/30 bg-mantle/40 p-3"
						>
							<div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
								<input
									className={inputClass}
									placeholder="fieldName"
									aria-label={`Field ${index + 1} name`}
									value={field.name}
									onChange={(e) => patchField(index, { name: e.target.value })}
								/>
								<select
									className={inputClass}
									aria-label={`Field ${index + 1} type`}
									value={field.type}
									onChange={(e) =>
										patchField(index, { type: e.target.value as ContractField["type"] })
									}
								>
									{FIELD_TYPES.map((type) => (
										<option key={type} value={type}>
											{type}
										</option>
									))}
								</select>
								<button
									type="button"
									className={ghostButton}
									aria-label={`Remove field ${index + 1}`}
									disabled={contract.fields.length === 1}
									onClick={() =>
										setContract({
											...contract,
											fields: contract.fields.filter((_, i) => i !== index),
										})
									}
								>
									Remove
								</button>
							</div>

							<div className="mt-3 flex flex-wrap items-center gap-4">
								<label className="flex items-center gap-2 text-sm text-subtext">
									<input
										type="checkbox"
										checked={field.required}
										onChange={(e) => patchField(index, { required: e.target.checked })}
									/>
									required
								</label>
								<label className="flex items-center gap-2 text-sm text-subtext">
									<input
										type="checkbox"
										checked={field.queryable ?? false}
										onChange={(e) => patchField(index, { queryable: e.target.checked })}
									/>
									queryable
									<span className="text-xs text-subtext/70">(indexed by database targets)</span>
								</label>
								<input
									className={inputClass + " max-w-[160px]"}
									placeholder="default"
									aria-label={`Field ${index + 1} default`}
									value={field.default ?? ""}
									onChange={(e) => patchField(index, { default: e.target.value })}
								/>
							</div>

							{field.type === "enum" && (
								<div className="mt-3">
									<input
										className={inputClass}
										placeholder="ACTIVE, COMPLETED, WITHDRAWN"
										aria-label={`Field ${index + 1} values`}
										value={(field.values ?? []).join(", ")}
										onChange={(e) =>
											patchField(index, { values: e.target.value.split(",").map((v) => v.trim()) })
										}
									/>
									<p className="mt-1 text-xs text-subtext/80">
										Comma-separated. An enum with no values is rejected.
									</p>
								</div>
							)}
						</div>
					))}
				</div>
			</section>

			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label className={labelClass} htmlFor="recordTypes">
						Record types
					</label>
					<input
						id="recordTypes"
						className={inputClass}
						placeholder="order.created, order.updated"
						value={contract.recordTypes.join(", ")}
						onChange={(e) =>
							setContract({ ...contract, recordTypes: e.target.value.split(",") })
						}
					/>
					<p className="mt-1 text-xs text-subtext/80">
						Comma-separated. A create-only contract is a legitimate, simpler contract.
					</p>
				</div>
				<div>
					<label className={labelClass} htmlFor="naturalKey">
						Natural key fields
					</label>
					<input
						id="naturalKey"
						className={inputClass}
						placeholder="orderNumber"
						value={contract.naturalKey.fields.join(", ")}
						onChange={(e) =>
							setContract({
								...contract,
								naturalKey: { strategy: "field", fields: e.target.value.split(",") },
							})
						}
					/>
					<p className="mt-1 text-xs text-subtext/80">
						The business identifier. Composite keys join with <code>|</code>. Must be required
						fields — an optional one yields a null partition key and silently loses ordering.
					</p>
				</div>
			</div>

			{problems.length > 0 && (
				<div
					role="alert"
					className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-text"
				>
					<div className="mb-1 flex items-center gap-2 font-medium">
						<WarningCircleIcon className="h-4 w-4 text-danger" />
						This contract was not registered
					</div>
					<ul className="ml-6 list-disc space-y-1 text-subtext">
						{problems.map((problem) => (
							<li key={problem}>{problem}</li>
						))}
					</ul>
				</div>
			)}

			{result && (
				<div
					role="status"
					className="flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-text"
				>
					<CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
					<span>{result}</span>
				</div>
			)}

			<button
				type="submit"
				disabled={status === "sending"}
				className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
			>
				{status === "sending" ? (
					<SpinnerIcon className="h-4 w-4 animate-spin" />
				) : (
					<PaperPlaneTiltIcon className="h-4 w-4" />
				)}
				Register contract
			</button>
		</form>
	);
}
