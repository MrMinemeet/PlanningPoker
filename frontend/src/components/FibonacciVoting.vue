<script lang="ts" setup>
import { ref } from "vue";

const emit = defineEmits(["cast-vote"]);

const FIBONACCI_VALUES = ["0", "1", "2", "3", "5", "8", "13", "☕", "?"] as const
type FibonacciEntry = typeof FIBONACCI_VALUES[number];

const currentVote = ref<FibonacciEntry | null>(null);

function vote(value: FibonacciEntry) {
	if (currentVote.value === value) {
		// Same vote, do nothing
		return;
	}
	currentVote.value = value;
	emit("cast-vote", value);
}
</script>

<template>
	<div class="voting-bar">
		<button v-for="value in FIBONACCI_VALUES" :key="value" class="voting-button"
			:class="{ 'selected': currentVote === value }" @click="vote(value)">
			{{ value }}
		</button>
	</div>
</template>

<style scoped>
.voting-bar {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 2rem;
}

.voting-button {
	cursor: pointer;
	display: flex;
	justify-content: center;
	align-items: center;
	height: 5rem;
	width: 5rem;
	background-color: #2596be;
	border-radius: 1rem;
	margin: 0.5rem;
	border: none;
	color: white;
	font-size: 1.5rem;
	font-weight: bold;
	transition: all 0.2s ease;
}

.voting-button:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(37, 150, 190, 0.2);
}

.voting-button.selected {
	background-color: #ffcc00;
	color: #333;
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(255, 204, 0, 0.3);
}
</style>
