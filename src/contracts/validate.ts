import type { ContractDefinition } from "../types";
import { FIELD_TYPES } from "../types";

const CONTRACT_ID = /^[a-z][a-z0-9-]*$/;

/**
 * Mirrors the registry's `ContractDocumentValidator`, so a client-side catch
 * and a server-side 400 read identically to the person filling the form — the
 * same reasoning the submission form follows against the source service.
 *
 * <p>Deliberately a mirror rather than the authority. The registry validates
 * every document regardless of who sent it, and it has to: this file is one
 * client, and a contract POSTed by curl or by the seed job never passes through
 * it. What this buys is the round trip — someone naming a field twice finds out
 * while they are still looking at the field, not after a submit.
 */
export function validateContract(definition: ContractDefinition): string[] {
	const problems: string[] = [];

	if (!definition.contractId.trim()) {
		problems.push("contractId is required");
	} else if (!CONTRACT_ID.test(definition.contractId)) {
		problems.push(
			`contractId '${definition.contractId}' must match ${CONTRACT_ID.source.slice(1, -1)} ` +
				"(lower-case, starting with a letter — it becomes a Kafka topic name)",
		);
	}

	if (!definition.title.trim()) problems.push("title is required");

	if (definition.fields.length === 0) {
		problems.push("fields is required and must declare at least one field");
	}

	const seen = new Set<string>();
	for (const field of definition.fields) {
		const name = field.name.trim();
		if (!name) {
			problems.push("a field is missing its name");
			continue;
		}
		if (seen.has(name)) problems.push(`field '${name}' is declared more than once`);
		seen.add(name);

		if (!FIELD_TYPES.includes(field.type)) {
			problems.push(`field '${name}' declares unknown type '${field.type}'`);
		}
		if (field.type === "enum" && (field.values ?? []).filter((v) => v.trim()).length === 0) {
			problems.push(`field '${name}' is an enum but declares no values`);
		}
		if (field.type === "enum" && field.default?.trim()) {
			const values = (field.values ?? []).map((v) => v.trim());
			if (!values.includes(field.default.trim())) {
				problems.push(
					`field '${name}' defaults to '${field.default}', which is not one of its values`,
				);
			}
		}
	}

	const recordTypes = definition.recordTypes.map((t) => t.trim()).filter(Boolean);
	if (recordTypes.length === 0) {
		problems.push("recordTypes is required and must declare at least one record type");
	}
	if (new Set(recordTypes).size !== recordTypes.length) {
		problems.push("a record type is declared more than once");
	}

	const keyFields = definition.naturalKey.fields.map((f) => f.trim()).filter(Boolean);
	if (keyFields.length === 0) {
		problems.push("naturalKey must name at least one field");
	}
	for (const keyField of keyFields) {
		const declared = definition.fields.find((f) => f.name.trim() === keyField);
		if (!declared) {
			problems.push(`naturalKey derives from '${keyField}', which is not a declared field`);
		} else if (!declared.required) {
			// An optional key field yields a null partition key on any
			// submission that omits it, which destroys ordering silently
			// rather than failing.
			problems.push(
				`naturalKey derives from optional field '${keyField}'; key fields must be required`,
			);
		}
	}

	return problems;
}

/**
 * Strips the empties a form inevitably carries — a blank row someone added and
 * did not fill in, `values` on a field that is not an enum — so the registry
 * receives the contract that was meant rather than the form's scratch state.
 */
export function toDocument(definition: ContractDefinition): ContractDefinition {
	return {
		contractId: definition.contractId.trim(),
		title: definition.title.trim(),
		schemaVersion: 1,
		naturalKey: {
			strategy: "field",
			fields: definition.naturalKey.fields.map((f) => f.trim()).filter(Boolean),
		},
		recordTypes: definition.recordTypes.map((t) => t.trim()).filter(Boolean),
		fields: definition.fields
			.filter((field) => field.name.trim())
			.map((field) => ({
				name: field.name.trim(),
				type: field.type,
				required: field.required,
				...(field.queryable ? { queryable: true } : {}),
				...(field.type === "enum"
					? { values: (field.values ?? []).map((v) => v.trim()).filter(Boolean) }
					: {}),
				...(field.default?.trim() ? { default: field.default.trim() } : {}),
			})),
	};
}
