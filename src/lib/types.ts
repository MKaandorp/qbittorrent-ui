export interface AppSettings {
	serverUrl: string;
	username: string;
	sid: string | null;
}

export type TorrentState =
	| 'error'
	| 'missingFiles'
	| 'uploading'
	| 'pausedUP'
	| 'queuedUP'
	| 'stalledUP'
	| 'checkingUP'
	| 'forcedUP'
	| 'allocating'
	| 'downloading'
	| 'metaDL'
	| 'pausedDL'
	| 'queuedDL'
	| 'stalledDL'
	| 'checkingDL'
	| 'forcedDL'
	| 'checkingResumeData'
	| 'moving'
	| 'unknown';

export interface Torrent {
	hash: string;
	name: string;
	size: number;
	progress: number;
	dlspeed: number;
	upspeed: number;
	num_seeds: number;
	num_leechs: number;
	ratio: number;
	eta: number;
	state: TorrentState;
	category: string;
	tags: string;
	added_on: number;
	completion_on: number;
	tracker: string;
	save_path: string;
	downloaded: number;
	uploaded: number;
	priority: number;
	seen_complete: number;
	last_activity: number;
}

export interface LoginResult {
	success: boolean;
	sid?: string;
	error?: string;
}

export interface ApiError {
	status: number;
	message: string;
}
