import { useState, type ComponentType, type FormEvent } from "react";
import { ApiValidationError, submitIntern } from "../api/interns";
import type { CreateInternRequest } from "../types";
import {
	BriefcaseIcon,
	CalendarBlankIcon,
	CheckCircleIcon,
	EnvelopeSimpleIcon,
	GraduationCapIcon,
	IdentificationBadgeIcon,
	PaperPlaneTiltIcon,
	SpinnerIcon,
	UserIcon,
	UsersThreeIcon,
	WarningCircleIcon,
} from "./icons";

const emptyForm: CreateInternRequest = {
	internId: "",
	firstName: "",
	lastName: "",
	email: "",
	college: "",
	department: "",
	mentor: "",
	startDate: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors Hibernate Validator's default messages so a client-side catch
// and a server-side 400 read identically to the person filling the form.
function validate(values: CreateInternRequest): Record<string, string> {
	const errors: Record<string, string> = {};
	if (!values.internId.trim()) errors.internId = "must not be blank";
	if (!values.firstName.trim()) errors.firstName = "must not be blank";
	if (!values.lastName.trim()) errors.lastName = "must not be blank";
	if (!values.email.trim()) errors.email = "must not be blank";
	else if (!EMAIL_PATTERN.test(values.email)) errors.email = "must be a well-formed email address";
	if (!values.college.trim()) errors.college = "must not be blank";
	if (!values.department.trim()) errors.department = "must not be blank";
	if (!values.startDate) errors.startDate = "must not be null";
	return errors;
}

const inputClass =
	"w-full rounded-xl border border-overlay/40 bg-canvas py-2.5 pl-10 pr-3 text-sm text-text " +
	"placeholder:text-subtext/60 transition-colors focus:border-accent focus:outline-none focus:ring-2 " +
	"focus:ring-accent/30 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20";

const labelClass = "mb-1 block text-sm font-medium text-subtext";

const FIELDS: Array<{
	name: keyof CreateInternRequest;
	label: string;
	type?: string;
	required?: boolean;
	icon: ComponentType<{ className?: string }>;
	tone: string;
}> = [
	{ name: "internId", label: "Intern ID", required: true, icon: IdentificationBadgeIcon, tone: "text-info" },
	{ name: "firstName", label: "First name", required: true, icon: UserIcon, tone: "text-accent" },
	{ name: "lastName", label: "Last name", required: true, icon: UserIcon, tone: "text-accent" },
	{ name: "email", label: "Email", type: "email", required: true, icon: EnvelopeSimpleIcon, tone: "text-info" },
	{ name: "college", label: "College", required: true, icon: GraduationCapIcon, tone: "text-success" },
	{ name: "department", label: "Department", required: true, icon: BriefcaseIcon, tone: "text-warning" },
	{ name: "mentor", label: "Mentor", icon: UsersThreeIcon, tone: "text-subtext" },
	{ name: "startDate", label: "Start date", type: "date", required: true, icon: CalendarBlankIcon, tone: "text-warning" },
];

type Status = "idle" | "submitting" | "success" | "error";

type Props = {
	onSubmitted: () => void;
};

export function InternForm({ onSubmitted }: Props) {
	const [values, setValues] = useState<CreateInternRequest>(emptyForm);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [status, setStatus] = useState<Status>("idle");
	const [banner, setBanner] = useState<string | null>(null);

	function update<K extends keyof CreateInternRequest>(field: K, value: CreateInternRequest[K]) {
		setValues((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();

		const clientErrors = validate(values);
		if (Object.keys(clientErrors).length > 0) {
			setErrors(clientErrors);
			setStatus("error");
			setBanner("Fix the highlighted fields and try again.");
			return;
		}

		setErrors({});
		setStatus("submitting");
		setBanner(null);

		try {
			const request: CreateInternRequest = {
				...values,
				mentor: values.mentor?.trim() ? values.mentor.trim() : null,
			};
			const response = await submitIntern(request);
			setStatus("success");
			setBanner(`Submitted — record ${response.recordId}`);
			setValues(emptyForm);
			onSubmitted();
		} catch (err) {
			if (err instanceof ApiValidationError) {
				const fieldErrors: Record<string, string> = {};
				for (const fieldError of err.errors) {
					fieldErrors[fieldError.field] = fieldError.message;
				}
				setErrors(fieldErrors);
				setStatus("error");
				setBanner("Fix the highlighted fields and try again.");
			} else {
				setStatus("error");
				setBanner(err instanceof Error ? err.message : "Something went wrong.");
			}
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			noValidate
			className="overflow-hidden rounded-2xl border border-overlay/20 bg-mantle shadow-sm"
		>
			<div className="h-1.5 w-full bg-gradient-to-r from-accent via-success to-accent" />

			<div className="p-5 sm:p-6">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{FIELDS.map(({ name, label, type, required, icon: Icon, tone }) => (
						<div key={name}>
							<label htmlFor={name} className={labelClass}>
								{label}
								{required && <span className="text-danger"> *</span>}
							</label>
							<div className="relative">
								<Icon
									className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${tone}`}
								/>
								<input
									id={name}
									name={name}
									type={type ?? "text"}
									value={values[name] ?? ""}
									onChange={(e) => update(name, e.target.value)}
									aria-invalid={Boolean(errors[name])}
									aria-describedby={errors[name] ? `${name}-error` : undefined}
									className={inputClass}
								/>
							</div>
							{errors[name] && (
								<p id={`${name}-error`} className="mt-1 text-xs text-danger">
									{errors[name]}
								</p>
							)}
						</div>
					))}
				</div>

				{banner && (
					<div
						role="status"
						className={
							"mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm " +
							(status === "success" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")
						}
					>
						{status === "success" ? (
							<CheckCircleIcon className="h-4 w-4 shrink-0" />
						) : (
							<WarningCircleIcon className="h-4 w-4 shrink-0" />
						)}
						<span>{banner}</span>
					</div>
				)}

				<button
					type="submit"
					disabled={status === "submitting"}
					className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm
						font-medium text-canvas shadow-sm transition hover:opacity-90 hover:shadow-md
						disabled:cursor-not-allowed disabled:opacity-60"
				>
					{status === "submitting" ? (
						<SpinnerIcon className="h-4 w-4 animate-spin" />
					) : (
						<PaperPlaneTiltIcon className="h-4 w-4" />
					)}
					Submit intern
				</button>
			</div>
		</form>
	);
}
