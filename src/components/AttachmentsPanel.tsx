import { useCallback, useEffect, useState } from "react";
import {
	RegistryError,
	createAttachment,
	listAdapterTypes,
	listAttachments,
	setAttachmentEnabled,
} from "../api/registry";
import type { AdapterTypeDescriptor, Attachment } from "../types";
import { AdapterConfigInput } from "./AdapterConfigField";
import { CheckCircleIcon, SpinnerIcon, WarningCircleIcon } from "./icons";

const inputClass =
	"w-full rounded-xl border border-overlay/40 bg-canvas px-3 py-2 text-sm text-text " +
	"transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

/**
 * [UC-14](https://github.com/Azaken1248/iip-docs): attach an adapter, and pause
 * one (UC-12).
 *
 * <p>Every input below is drawn from the catalog rather than written here. The
 * type list is everything that has ever registered itself, and each type's
 * fields are what that adapter published about itself in Phase 6.1. Nothing in
 * this file names postgres, csv or webhook, which is what makes UC-9's "a new
 * adapter type needs no UI change" true rather than aspirational — the webhook
 * adapter was built after this component and appears in it without a line
 * changing.
 *
 * <p>Registered is not the same as running, which is why `stale` is shown below
 * rather than filtered out. This panel offered webhook for five days after a
 * single local run of that adapter, and attaching to it would have succeeded
 * and then dropped every record on the floor. Hiding stale types would instead
 * have made the paused-adapter case look like the type had been deleted, so the
 * choice here is to say so and still let it be attached — a target configured
 * ahead of its adapter starting is a legitimate thing to want.
 */
export function AttachmentsPanel({ contractId }: { contractId: string }) {
	const [types, setTypes] = useState<AdapterTypeDescriptor[] | null>(null);
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [selectedType, setSelectedType] = useState<string>("");
	const [config, setConfig] = useState<Record<string, unknown>>({});
	const [problems, setProblems] = useState<string[]>([]);
	const [notice, setNotice] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const load = useCallback(() => {
		listAttachments(contractId).then(setAttachments).catch(() => setAttachments([]));
	}, [contractId]);

	useEffect(() => {
		listAdapterTypes()
			.then((catalog) => {
				setTypes(catalog);
				setSelectedType((current) => current || (catalog[0]?.type ?? ""));
			})
			.catch((e: Error) => setProblems([e.message]));
	}, []);

	useEffect(load, [load]);

	const descriptor = types?.find((t) => t.type === selectedType);

	async function attach() {
		setProblems([]);
		setNotice(null);
		setBusy(true);
		try {
			await createAttachment(contractId, selectedType, config);
			// Deliberately explicit about the window. The adapter learns about
			// this attachment on its next refresh, and records published before
			// then are skipped by its contract filter and their offsets
			// committed -- so they are not delivered here later. Verified
			// against the running stack while building this panel, by
			// submitting a record inside the window and watching it go nowhere.
			setNotice(
				`Attached. The ${selectedType} adapter picks this up on its next refresh (up to ~30s) — ` +
					"nothing is being restarted. Records submitted before then are not backfilled to this " +
					"target; replay the contract's topic if you need them.",
			);
			setConfig({});
			load();
		} catch (error) {
			// The registry validates the config against the same descriptor
			// this form was rendered from, so its complaints line up with the
			// inputs above rather than describing some other shape.
			setProblems(
				error instanceof RegistryError && error.problems.length > 0
					? error.problems
					: [error instanceof Error ? error.message : "Something went wrong"],
			);
		} finally {
			setBusy(false);
		}
	}

	async function toggle(attachment: Attachment) {
		setProblems([]);
		try {
			await setAttachmentEnabled(contractId, attachment.attachmentId, !attachment.enabled);
			load();
		} catch (error) {
			setProblems([error instanceof Error ? error.message : "Could not change the target"]);
		}
	}

	return (
		<div className="mt-4 border-t border-overlay/30 pt-4">
			<h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtext">
				Targets
			</h4>

			<div className="mb-4 flex flex-col gap-2">
				{attachments.map((attachment) => (
					<div
						key={attachment.attachmentId}
						className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-overlay/30 px-3 py-2"
					>
						<div className="min-w-0">
							<span className="text-sm font-medium text-text">{attachment.adapterType}</span>
							<code className="ml-2 break-all text-xs text-subtext">
								{summarise(attachment.config)}
							</code>
							{/*
							 * The expensive case. An enabled attachment reads as
							 * working, so an adapter that is simply not running is
							 * indistinguishable from one that is delivering -- the
							 * records are published either way and the contract's
							 * offsets move on without them.
							 */}
							{isStale(types, attachment.adapterType) && attachment.enabled && (
								<span className="ml-2 inline-flex items-center gap-1 rounded-md border border-warning/50 px-1.5 py-0.5 text-[11px] font-medium text-warning">
									<WarningCircleIcon className="h-3 w-3" /> adapter not running
								</span>
							)}
						</div>
						<button
							type="button"
							onClick={() => toggle(attachment)}
							className={
								"rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
								(attachment.enabled
									? "border border-success/50 text-success hover:bg-success/10"
									: "border border-overlay/40 text-subtext hover:text-text")
							}
						>
							{attachment.enabled ? "Active — pause" : "Paused — resume"}
						</button>
					</div>
				))}
				{attachments.length === 0 && (
					<p className="text-sm text-subtext">
						Nothing attached. Records for this contract are published and go nowhere.
					</p>
				)}
			</div>

			{!types && (
				<div className="flex items-center gap-2 text-sm text-subtext">
					<SpinnerIcon className="h-4 w-4 animate-spin" /> Loading the adapter catalog…
				</div>
			)}

			{types?.length === 0 && (
				<p className="text-sm text-subtext">
					No adapter types are registered. A type appears here when its service starts and
					registers itself — so this usually means no adapter is running.
				</p>
			)}

			{descriptor && (
				<div className="flex flex-col gap-3 rounded-xl border border-overlay/30 bg-mantle/40 p-3">
					<div>
						<label className="mb-1 block text-sm font-medium text-subtext" htmlFor="adapterType">
							Add a target
						</label>
						<select
							id="adapterType"
							className={inputClass}
							value={selectedType}
							onChange={(e) => {
								setSelectedType(e.target.value);
								setConfig({});
							}}
						>
							{types?.map((type) => (
								<option key={type.type} value={type.type}>
									{type.title}
									{type.stale ? " — not running" : ""}
								</option>
							))}
						</select>
						{descriptor.description && (
							<p className="mt-1 text-xs text-subtext/80">{descriptor.description}</p>
						)}
						{descriptor.stale && (
							<p className="mt-1 flex items-start gap-1.5 text-xs text-warning">
								<WarningCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
								<span>
									No {descriptor.title} adapter has checked in recently. You can still attach
									one — records will start flowing when the adapter comes back — but until
									then nothing is delivered here.
								</span>
							</p>
						)}
					</div>

					{(descriptor.configFields ?? []).map((field) => (
						<AdapterConfigInput
							key={field.name}
							field={field}
							value={config[field.name]}
							onChange={(next) => setConfig((current) => ({ ...current, [field.name]: next }))}
						/>
					))}

					<button
						type="button"
						disabled={busy}
						onClick={attach}
						className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
					>
						{busy && <SpinnerIcon className="h-4 w-4 animate-spin" />}
						Attach
					</button>
				</div>
			)}

			{problems.length > 0 && (
				<div
					role="alert"
					className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-text"
				>
					<div className="mb-1 flex items-center gap-2 font-medium">
						<WarningCircleIcon className="h-4 w-4 text-danger" /> Not attached
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
					className="mt-3 flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-text"
				>
					<CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
					<span>{notice}</span>
				</div>
			)}
		</div>
	);
}

/**
 * Whether the adapter behind an attachment has stopped announcing itself.
 *
 * <p>Unknown counts as fine: while the catalog is loading, and for an
 * attachment of a type no longer in it at all, the honest answer is "no
 * evidence" rather than a warning badge the operator cannot act on.
 */
function isStale(types: AdapterTypeDescriptor[] | null, adapterType: string): boolean {
	return types?.find((t) => t.type === adapterType)?.stale === true;
}

/** Enough of a config to tell two targets of the same type apart. */
function summarise(config: Record<string, unknown>): string {
	const identifying = config.url ?? config.path ?? config.table ?? config.mode;
	return identifying ? String(identifying) : "default configuration";
}
