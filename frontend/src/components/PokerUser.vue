<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps({
	username: {
		type: String,
		required: true
	},
	voted: {
		type: Boolean,
		required: true
	},
	vote: {
		type: String,
		required: false
	}
});

const NON_VOTED_COLOR = "#be2596";
const VOTED_COLOR = "#96be25";

const hasVote = computed(() => {
	return props.vote != null && props.vote !== "";
});

</script>

<template>
	<div class="poker-user">
		<div 
			:style="{backgroundColor: voted ? VOTED_COLOR : NON_VOTED_COLOR}"
			class="user-card">
			<p v-if="voted && !hasVote" class="vote-indicator">✔️</p>
			<p v-else-if="voted && hasVote" class="vote-value">{{ vote }}</p>
		</div>
		<p class="username">{{ username }}</p>
	</div>
</template>

<style scoped>
.poker-user {
	width: 5rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 0 0rem;
}

.vote-value {
	color: white;
	font-size: 1.5rem;
	font-weight: bold;
}

.user-card {
	height: 5rem;
	width: 3rem;
	border-radius: 0.5rem;
	margin-bottom: 0.5rem;
	display: flex;
	justify-content: center;
	align-items: center;
}

.username {
	font-size: 1rem;
	font-weight: bold;
	color: #333;
}
</style>
