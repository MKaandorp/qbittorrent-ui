const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
const ETA_UNKNOWN = 8640000;

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
	const value = bytes / Math.pow(1024, i);
	return `${value.toFixed(i === 0 ? 0 : 1)} ${UNITS[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
	return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(seconds: number): string {
	if (seconds < 0 || seconds >= ETA_UNKNOWN) return '--';
	if (seconds < 60) return `${seconds}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
	if (seconds < 86400) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		return `${h}h ${m}m`;
	}
	const d = Math.floor(seconds / 86400);
	const h = Math.floor((seconds % 86400) / 3600);
	return `${d}d ${h}h`;
}

export function formatRatio(ratio: number): string {
	return ratio.toFixed(2);
}

export function formatDate(ts: number): string {
	if (ts <= 0) return '—';
	return new Date(ts * 1000).toLocaleString();
}
