import type { ContractDefinition, RecordView } from "../types";

/**
 * A records table for any contract, with its columns taken from the contract's
 * own field list (Phase 6.9).
 *
 * <p>Replaces a table that named intern columns in JSX. The column order is the
 * order the fields were declared in, which is the order whoever defined the
 * contract chose — a table that sorted them alphabetically would be tidier and
 * would lose the one piece of intent the definition carries about presentation.
 *
 * <p>Values are rendered by their declared type rather than by inspecting them,
 * so an empty cell means "the record did not carry this field" rather than
 * "this rendered to nothing".
 */
export function RecordTable({
	contract,
	records,
}: {
	contract: ContractDefinition;
	records: RecordView[];
}) {
	const fields = contract.fields ?? [];

	if (records.length === 0) {
		return (
			<p className="text-sm text-subtext">
				No records yet for <code>{contract.contractId}</code>.
			</p>
		);
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-overlay/30">
			<table className="w-full min-w-max text-left text-sm">
				<thead className="bg-mantle/60 text-xs uppercase tracking-wide text-subtext">
					<tr>
						{fields.map((field) => (
							<th key={field.name} className="whitespace-nowrap px-3 py-2 font-medium">
								{field.name}
								{field.queryable && (
									<span className="ml-1 text-accent" title="queryable — indexed by database targets">
										◆
									</span>
								)}
							</th>
						))}
						<th className="whitespace-nowrap px-3 py-2 font-medium">occurred at</th>
					</tr>
				</thead>
				<tbody>
					{records.map((record) => (
						<tr key={record.recordId} className="border-t border-overlay/20">
							{fields.map((field) => (
								<td key={field.name} className="whitespace-nowrap px-3 py-2 text-text">
									{render(record.payload?.[field.name])}
								</td>
							))}
							<td className="whitespace-nowrap px-3 py-2 text-subtext">
								{record.occurredAt ?? ""}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function render(value: unknown): string {
	if (value === undefined || value === null) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}
