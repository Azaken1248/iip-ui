import { useEffect, useState } from "react";

type ViewMode = "grid" | "list";

function getInitialViewMode(): ViewMode {
	return localStorage.getItem("viewMode") === "list" ? "list" : "grid";
}

export function useViewMode() {
	const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);

	useEffect(() => {
		localStorage.setItem("viewMode", viewMode);
	}, [viewMode]);

	return { viewMode, setViewMode };
}
