<script lang="ts">
	let { value }: { value: number } = $props();
	const pct = $derived(Math.round(value * 100));
	const color = $derived(pct >= 100 ? 'progress-success' : 'progress-primary');
</script>

<progress class="progress w-full {color}" value={pct} max="100"></progress>
