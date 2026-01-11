<script lang="ts" setup>
import { computed, ComputedRef } from 'vue';
import PokerTable from './PokerTable.vue';
import PokerUser from './PokerUser.vue';
import VotingResults from './VotingResults.vue';
import { RoomState, UserState } from '@/App.vue';
import FibonacciVoting from './FibonacciVoting.vue';

const emit = defineEmits(["cast-vote", "reveal-cards", "reset-voting"]);

const props = defineProps({
	roomState: {
		type: Object as () => RoomState | null,
		required: false
	},
	votingResults: {
		type: Array as () => Array<{ userId: string; vote: string }> | null,
		required: false
	}
});

const positionedUserMap: ComputedRef<Map<"top" | "bottom" | "left" | "right", Array<UserState>>> = computed(() => {
	const positionMap = new Map<"top" | "bottom" | "left" | "right", Array<UserState>>([
		["top", []],
		["bottom", []],
		["left", []],
		["right", []]
	]);
	if (!props.roomState) {
		return positionMap;
	}
	
	const positions = ["top", "bottom", "left", "right"] as const;
	props.roomState.users.forEach((user, index) => {
		positionMap.get(positions[index % 4]).push(user);
	});
	return positionMap;
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
</script>

<template>
	<div class="poker-table-container">
		<div class="poker-grid">
			<!-- Row 1 -->
			<div class="grid-item"></div>
			<div id="players-top" class="player-container">
				<PokerUser v-for="user in positionedUserMap.get('top')" :key="user.id" :username="user.username"
					:voted="user.voted" :vote="user.vote" />
			</div>
			<div class="grid-item"></div>

			<!-- Row 2 -->
			<div id="players-left" class="player-container">
				<PokerUser v-for="user in positionedUserMap.get('left')" :key="user.id" :username="user.username"
					:voted="user.voted" :vote="user.vote" />
			</div>
			<div class="poker-table-center">
				<PokerTable :any-user-present="hasAnyUsers" :any-vote-present="hasAnyVotes"
					:votes-revealed="roomState?.votesRevealed ?? false" @reveal-cards="revealCards"
					@reset-voting="resetVoting" />
			</div>
			<div id="players-right" class="player-container">
				<PokerUser v-for="user in positionedUserMap.get('right')" :key="user.id" :username="user.username"
					:voted="user.voted" :vote="user.vote" />
			</div>

			<!-- Row 3 -->
			<div class="grid-item"></div>
			<div id="players-bottom" class="player-container">
				<PokerUser v-for="user in positionedUserMap.get('bottom')" :key="user.id" :username="user.username"
					:voted="user.voted" :vote="user.vote" />
			</div>
			<div class="grid-item"></div>
		</div>
		<div v-if="props.votingResults && props.votingResults.length > 0" class="results-section">
			<VotingResults :results="props.votingResults" />
		</div>
	</div>
	<FibonacciVoting :enabled="!roomState?.votesRevealed" @cast-vote="castVote" />
</template>

<style scoped>
.poker-table-container {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	width: 70%;
	height: 80%;
	margin: 0 auto;
}

.poker-grid {
	display: grid;
	grid-template-columns: 1fr 2fr 1fr;
	grid-template-rows: 1fr 2fr 1fr;
	width: 100%;
	height: 100%;
	gap: 0.1rem;
}

.poker-table-center {
	display: flex;
	justify-content: center;
	align-items: center;
}

.player-container {
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	gap: 0.1rem
}

#players-top,
#players-bottom {
	flex-direction: row;
}

#players-left,
#players-right {
	flex-direction: column;
}
</style>