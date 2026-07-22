import type { InternRow, InternSummaryResponse, TargetStatusResponse } from "../types";

const DB_ADAPTER_BASE_URL = import.meta.env.VITE_DB_ADAPTER_BASE_URL ?? "http://localhost:8081";
const FILE_ADAPTER_BASE_URL = import.meta.env.VITE_FILE_ADAPTER_BASE_URL ?? "http://localhost:8082";

async function getStatus(baseUrl: string): Promise<TargetStatusResponse> {
	const response = await fetch(`${baseUrl}/admin/status`);
	if (!response.ok) throw new Error(`Failed to get status (HTTP ${response.status})`);
	return response.json();
}

async function pause(baseUrl: string): Promise<TargetStatusResponse> {
	const response = await fetch(`${baseUrl}/admin/pause`, { method: "POST" });
	if (!response.ok) throw new Error(`Failed to pause (HTTP ${response.status})`);
	return response.json();
}

async function resume(baseUrl: string): Promise<TargetStatusResponse> {
	const response = await fetch(`${baseUrl}/admin/resume`, { method: "POST" });
	if (!response.ok) throw new Error(`Failed to resume (HTTP ${response.status})`);
	return response.json();
}

export const dbTarget = {
	name: "Database" as const,
	getStatus: () => getStatus(DB_ADAPTER_BASE_URL),
	pause: () => pause(DB_ADAPTER_BASE_URL),
	resume: () => resume(DB_ADAPTER_BASE_URL),
	async listInterns(): Promise<InternSummaryResponse[]> {
		const response = await fetch(`${DB_ADAPTER_BASE_URL}/interns`);
		if (!response.ok) throw new Error(`Failed to load interns (HTTP ${response.status})`);
		return response.json();
	},
};

export const fileTarget = {
	name: "File" as const,
	getStatus: () => getStatus(FILE_ADAPTER_BASE_URL),
	pause: () => pause(FILE_ADAPTER_BASE_URL),
	resume: () => resume(FILE_ADAPTER_BASE_URL),
	async listInterns(): Promise<InternRow[]> {
		const response = await fetch(`${FILE_ADAPTER_BASE_URL}/interns`);
		if (!response.ok) throw new Error(`Failed to load interns (HTTP ${response.status})`);
		return response.json();
	},
};
