import type {
	CreateInternRequest,
	InternSubmissionResponse,
	InternSummaryResponse,
	ValidationErrorResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://iipservice.azaken.com";

export class ApiValidationError extends Error {
	readonly errors: ValidationErrorResponse["errors"];

	constructor(errors: ValidationErrorResponse["errors"]) {
		super("Validation failed");
		this.name = "ApiValidationError";
		this.errors = errors;
	}
}

export async function submitIntern(
	request: CreateInternRequest,
): Promise<InternSubmissionResponse> {
	const response = await fetch(`${API_BASE_URL}/interns`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(request),
	});

	if (response.status === 400) {
		const body: ValidationErrorResponse = await response.json();
		throw new ApiValidationError(body.errors);
	}
	if (!response.ok) {
		throw new Error(`Submission failed (HTTP ${response.status})`);
	}
	return response.json();
}

export async function listInterns(): Promise<InternSummaryResponse[]> {
	const response = await fetch(`${API_BASE_URL}/interns`);
	if (!response.ok) {
		throw new Error(`Failed to load interns (HTTP ${response.status})`);
	}
	return response.json();
}
