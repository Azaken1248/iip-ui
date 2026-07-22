import { useCallback, useEffect, useState } from "react";
import { dbTarget, fileTarget } from "../api/targets";
import type { TargetStatusResponse } from "../types";
import { DatabaseIcon, TableIcon } from "./icons";
import { TargetCard } from "./TargetCard";
import { DatabaseTargetDetail } from "./DatabaseTargetDetail";
import { FileTargetDetail } from "./FileTargetDetail";

type Selected = "database" | "file" | null;

export function TargetsPage() {
	const [selected, setSelected] = useState<Selected>(null);
	const [dbStatus, setDbStatus] = useState<TargetStatusResponse | null>(null);
	const [fileStatus, setFileStatus] = useState<TargetStatusResponse | null>(null);
	const [dbBusy, setDbBusy] = useState(false);
	const [fileBusy, setFileBusy] = useState(false);

	const refreshStatuses = useCallback(async () => {
		const [db, file] = await Promise.allSettled([dbTarget.getStatus(), fileTarget.getStatus()]);
		if (db.status === "fulfilled") setDbStatus(db.value);
		if (file.status === "fulfilled") setFileStatus(file.value);
	}, []);

	useEffect(() => {
		refreshStatuses();
		const interval = setInterval(refreshStatuses, 3000);
		return () => clearInterval(interval);
	}, [refreshStatuses]);

	async function toggleDb() {
		setDbBusy(true);
		try {
			setDbStatus(dbStatus?.paused ? await dbTarget.resume() : await dbTarget.pause());
		} finally {
			setDbBusy(false);
		}
	}

	async function toggleFile() {
		setFileBusy(true);
		try {
			setFileStatus(fileStatus?.paused ? await fileTarget.resume() : await fileTarget.pause());
		} finally {
			setFileBusy(false);
		}
	}

	if (selected === "database") {
		return (
			<DatabaseTargetDetail
				status={dbStatus}
				busy={dbBusy}
				onPauseToggle={toggleDb}
				onBack={() => setSelected(null)}
			/>
		);
	}

	if (selected === "file") {
		return (
			<FileTargetDetail
				status={fileStatus}
				busy={fileBusy}
				onPauseToggle={toggleFile}
				onBack={() => setSelected(null)}
			/>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<TargetCard
				label="Database"
				description="Postgres, via the Database Adapter"
				icon={DatabaseIcon}
				tone="bg-info"
				status={dbStatus}
				busy={dbBusy}
				onPauseToggle={toggleDb}
				onOpen={() => setSelected("database")}
			/>
			<TargetCard
				label="File"
				description="interns.csv, via the File Adapter"
				icon={TableIcon}
				tone="bg-success"
				status={fileStatus}
				busy={fileBusy}
				onPauseToggle={toggleFile}
				onOpen={() => setSelected("file")}
			/>
		</div>
	);
}
