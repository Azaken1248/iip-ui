import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// index.html's inline script already set the .dark class before React
// mounts (avoids a flash of the wrong theme); this hook just reads that
// initial state and keeps it in sync with user toggles afterward.
export function useTheme() {
	const [theme, setTheme] = useState<Theme>(getInitialTheme);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		localStorage.setItem("theme", theme);
	}, [theme]);

	function toggle() {
		setTheme((current) => (current === "dark" ? "light" : "dark"));
	}

	return { theme, toggle };
}
