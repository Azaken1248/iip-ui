import { useTheme } from "../hooks/useTheme";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
	const { theme, toggle } = useTheme();

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
			title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
			className="flex h-9 w-9 items-center justify-center rounded-full border border-overlay/30 text-subtext transition-colors hover:border-accent hover:text-accent"
		>
			{theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
		</button>
	);
}
