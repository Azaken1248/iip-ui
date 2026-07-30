import type {
	AdapterTypeDescriptor,
	Attachment,
	ContractDefinition,
	RegistryProblemResponse,
} from "../types";

// The control plane. A fourth backend rather than a path on the source
// service, because defining a schema and submitting a record against it are
// different jobs done by different people at wildly different rates -- see the
// registry's own README.
const REGISTRY_BASE_URL =
	import.meta.env.VITE_CONTRACT_REGISTRY_URL ?? "https://iipregistry.azaken.com";

/**
 * A registry refusal that names what is wrong, field by field.
 *
 * The registry answers 400 with a `problems` array precisely so a form can show
 * every problem at once rather than one per round trip. Flattening that to a
 * single message here would throw away the reason it is an array.
 */
export class RegistryError extends Error {
	readonly problems: string[];
	readonly status: number;

	constructor(status: number, error: string, problems: string[]) {
		super(error);
		this.name = "RegistryError";
		this.status = status;
		this.problems = problems;
	}
}

async function readError(response: Response): Promise<RegistryError> {
	let body: Partial<RegistryProblemResponse> = {};
	try {
		body = await response.json();
	} catch {
		// A proxy or a cold start can answer with HTML. Falling through to the
		// status code is better than showing a JSON parse error to someone who
		// was trying to define a contract.
	}
	return new RegistryError(
		response.status,
		body.error ?? `Request failed (HTTP ${response.status})`,
		body.problems ?? [],
	);
}

export async function listContracts(): Promise<ContractDefinition[]> {
	const response = await fetch(`${REGISTRY_BASE_URL}/contracts`);
	if (!response.ok) throw await readError(response);
	return response.json();
}

export async function getContract(contractId: string): Promise<ContractDefinition> {
	const response = await fetch(`${REGISTRY_BASE_URL}/contracts/${encodeURIComponent(contractId)}`);
	if (!response.ok) throw await readError(response);
	return response.json();
}

/**
 * UC-13, in one call. No build, no deploy, no developer.
 *
 * 201 for a contract that did not exist and 200 for one that did — the registry
 * distinguishes them so a UI can say "created" or "updated" honestly.
 */
export async function registerContract(
	definition: ContractDefinition,
): Promise<{ contract: ContractDefinition; created: boolean }> {
	const response = await fetch(`${REGISTRY_BASE_URL}/contracts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(definition),
	});

	if (!response.ok) throw await readError(response);
	return { contract: await response.json(), created: response.status === 201 };
}

export async function listAdapterTypes(): Promise<AdapterTypeDescriptor[]> {
	const response = await fetch(`${REGISTRY_BASE_URL}/adapter-types`);
	if (!response.ok) throw await readError(response);
	return response.json();
}

/** Everything a contract fans out to, including paused targets (Phase 6.6). */
export async function listAttachments(contractId: string): Promise<Attachment[]> {
	const response = await fetch(
		`${REGISTRY_BASE_URL}/contracts/${encodeURIComponent(contractId)}/adapters`,
	);
	if (!response.ok) throw await readError(response);
	return response.json();
}

/** UC-14: attach an adapter. One insert, no build, no redeploy. */
export async function createAttachment(
	contractId: string,
	adapterType: string,
	config: Record<string, unknown>,
): Promise<Attachment> {
	const response = await fetch(
		`${REGISTRY_BASE_URL}/contracts/${encodeURIComponent(contractId)}/adapters`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ adapterType, config }),
		},
	);
	if (!response.ok) throw await readError(response);
	return response.json();
}

/**
 * UC-12's pause switch. A flag rather than a delete, so the configuration
 * survives the pause and resuming is one click rather than filling the form in
 * again from memory.
 */
export async function setAttachmentEnabled(
	contractId: string,
	attachmentId: string,
	enabled: boolean,
): Promise<Attachment> {
	const response = await fetch(
		`${REGISTRY_BASE_URL}/contracts/${encodeURIComponent(contractId)}/adapters/${attachmentId}`,
		{
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ enabled }),
		},
	);
	if (!response.ok) throw await readError(response);
	return response.json();
}
