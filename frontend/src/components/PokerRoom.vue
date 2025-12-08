<script lang="ts" setup>
import { computed } from 'vue';
import PokerTable from './PokerTable.vue';
import PokerUser from './PokerUser.vue';
import { RoomState } from '@/App.vue';
import FibonacciVoting from './FibonacciVoting.vue';

const emit = defineEmits(["cast-vote", "reveal-cards", "reset-voting"]);

const props = defineProps({
	roomState: {
		type: Object as () => RoomState | null,
		required: false
	}
});

const hasAnyUsers = computed(() => {
	return props.roomState?.users.length > 0;
});
const hasAnyVotes = computed(() => {
	return props.roomState?.users.some(user => user.voted) ?? false;
});

function castVote(value: string) {
	emit("cast-vote", value);
}

function revealCards() {
	emit("reveal-cards");
}

function resetVoting() {
	emit("reset-voting");
}

/**
 * Returns style object to position user around the table
 * @param index Index of the user
 * @param total Total number of users
 */
function getPositionStyle(index: number, total: number): { [s: string]: string; } {
	const angle = (360 / total) * index;
	const radius = 250;
	const x = Math.cos((angle * Math.PI) / 180) * radius;
	const y = Math.sin((angle * Math.PI) / 180) * radius;

	return {
		position: 'absolute',
		left: `calc(50% + ${x}px)`,
		top: `calc(50% + ${y}px)`,
		transform: 'translate(-50%, -50%)',
	};
}
</script>

<template>
	<div class="poker-table-container">
		<PokerTable :any-user-present="hasAnyUsers" :any-vote-present="hasAnyVotes" :votes-revealed="roomState?.votesRevealed ?? false" @reveal-cards="revealCards" @reset-voting="resetVoting" />
		<PokerUser v-for="(user, i) in roomState?.users" :key="i" :username="user.username" :voted="user.voted" :vote="user.vote"
			:style="getPositionStyle(i, roomState?.users.length ?? 0)" />
	</div>
	<FibonacciVoting :enabled="!roomState?.votesRevealed" @cast-vote="castVote" />
</template>

<style scoped>
.poker-table-container {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 600px;
	height: 600px;
	margin: 0 auto;
	position: relative;
}

.players {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
}
</style>