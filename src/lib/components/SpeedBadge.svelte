<script lang="ts">
	import { formatSpeed } from '$lib/utils/format';

	let { dl, ul }: { dl: number; ul: number } = $props();
</script>

<span class="flex gap-2 text-sm">
	<span class="text-primary">↓ {formatSpeed(dl)}</span>
	<span class="text-secondary">↑ {formatSpeed(ul)}</span>
</span>
