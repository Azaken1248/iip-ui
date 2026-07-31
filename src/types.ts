// Mirrors source-service's api/model DTOs (see
// source-service/src/main/java/com/iip/sourceservice/api and .model).
// recordId, status, and createdAt are server-derived and never sent by
// the client — CreateInternRequest deliberately excludes them.

export interface CreateInternRequest {
	internId: string;
	firstName: string;
	lastName: string;
	email: string;
	college: string;
	department: string;
	mentor: string | null;
	startDate: string; // YYYY-MM-DD
}

export interface InternSubmissionResponse {
	recordId: string;
}

export interface FieldErrorDetail {
	field: string;
	message: string;
}

export interface ValidationErrorResponse {
	errors: FieldErrorDetail[];
}

export type InternStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN";

export interface InternSummaryResponse {
	recordId: string;
	internId: string;
	firstName: string;
	lastName: string;
	email: string;
	college: string;
	department: string;
	mentor: string | null;
	startDate: string;
	status: InternStatus;
	createdAt: string;
}

// Mirrors db-adapter's/file-adapter's AdminController.AdminStatusResponse.
export interface TargetStatusResponse {
	paused: boolean;
}

// Mirrors file-adapter's CsvInternReader/InternRow -- a raw projection of
// interns.csv's literal contents, deliberately all strings (not re-parsed
// into typed fields), matching what's actually in the file.
export interface InternRow {
	recordId: string;
	internId: string;
	firstName: string;
	lastName: string;
	email: string;
	college: string;
	department: string;
	mentor: string;
	startDate: string;
	status: string;
	createdAt: string;
}

// --- Control plane (Release 6) ---------------------------------------------

/** The field types the registry accepts (ContractDocumentValidator). */
export const FIELD_TYPES = ["string", "email", "date", "enum", "integer", "boolean"] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export interface ContractField {
	name: string;
	type: FieldType;
	required: boolean;
	/** Fields marked queryable become indexes in the postgres adapter (5.6). */
	queryable?: boolean;
	/** Required when type is enum, meaningless otherwise. */
	values?: string[];
	/** Applied before the required check, so a field can be required and omissible. */
	default?: string;
}

export interface ContractDefinition {
	contractId: string;
	title: string;
	schemaVersion?: number;
	naturalKey: { strategy: "field"; fields: string[] };
	recordTypes: string[];
	fields: ContractField[];
}

/** The `problems` array every registry refusal carries. */
export interface RegistryProblemResponse {
	error: string;
	problems: string[];
}

/** One entry of the adapter catalog (Phase 6.1), as an adapter published it. */
export interface AdapterTypeDescriptor {
	type: string;
	title: string;
	description?: string;
	configFields?: AdapterConfigField[];
	registeredAt?: string;
	updatedAt?: string;
}

export interface AdapterConfigField {
	name: string;
	label?: string;
	type: "string" | "enum" | "map" | "list";
	required?: boolean;
	description?: string;
	values?: string[];
	default?: string;
	itemFields?: AdapterConfigField[];
}

/** One row of adapter_attachments: "this contract fans out to that target". */
export interface Attachment {
	attachmentId: string;
	contractId: string;
	adapterType: string;
	config: Record<string, unknown>;
	enabled: boolean;
}

/** A record in envelope shape, as the source service and adapters return it. */
export interface RecordView {
	recordId: string;
	contractId?: string;
	recordType?: string | null;
	schemaVersion?: number;
	naturalKey?: string | null;
	occurredAt?: string;
	payload: Record<string, unknown>;
}
