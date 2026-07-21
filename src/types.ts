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
