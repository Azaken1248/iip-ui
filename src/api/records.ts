import type { RecordView } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://iipservice.azaken.com";

/**
 * A submission refused by the source service, with its reasons.
 *
 * The source service validates every payload against the registered contract,
 * so its complaints are the contract's own — field names the person filling the
 * form recognises, because the contract is where those names came from.
 */
export class RecordRejected extends Error {
	readonly problems: string[];

	constructor(problems: string[]) {
		super(problems[0] ?? "Rejected");
		this.name = "RecordRejected";
		this.problems = problems;
	}
}

/**
 * Submit a record against any contract (Phase 4.5's generic intake).
 *
 * The path carries the contract id, so this one function serves every contract
 * on the platform — including ones defined after this code was written.
 */
export async function submitRecord(
	contractId: string,
	payload: Record<string, unknown>,
): Promise<{ recordId?: string }> {
	const response = await fetch(
		`${API_BASE_URL}/contracts/${encodeURIComponent(contractId)}/records`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		},
	);

	if (!response.ok) {
		throw new RecordRejected(await problemsOf(response));
	}
	return response.json();
}

export async function listRecords(contractId: string): Promise<RecordView[]> {
	const response = await fetch(
		`${API_BASE_URL}/contracts/${encodeURIComponent(contractId)}/records`,
	);
	if (!response.ok) {
		throw new Error(`Failed to load records (HTTP ${response.status})`);
	}
	return response.json();
}

/**
 * The source service reports validation failures as a field→message map
 * (`errors`), which is a different shape from the registry's `problems` array.
 * Flattened here rather than in each caller, so a form only ever handles one.
 */
async function problemsOf(response: Response): Promise<string[]> {
	try {
		const body = await response.json();
		if (body.errors && typeof body.errors === "object") {
			return Object.entries(body.errors as Record<string, string>).map(
				([field, message]) => `${field}: ${message}`,
			);
		}
		if (Array.isArray(body.problems)) return body.problems;
		if (typeof body.message === "string") return [body.message];
	} catch {
		// Non-JSON error body; the status is all there is.
	}
	return [`Rejected (HTTP ${response.status})`];
}
