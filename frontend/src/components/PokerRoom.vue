<script lang="ts" setup>
import { computed, ComputedRef } from 'vue';
import PokerTable from './PokerTable.vue';
import PokerUser from './PokerUser.vue';
import { RoomState, UserState } from '@/App.vue';
import FibonacciVoting from './FibonacciVoting.vue';

const emit = defineEmits(["cast-vote", "reveal-cards", "reset-voting"]);

const props = defineProps({
	roomState: {
		type: Object as () => RoomState | null,
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
		console.warn("No room state available for positioning users.");
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
		<table>
			<tr>
				<td></td>
				<td id="players-top" class="player-container">
					<PokerUser v-for="user in positionedUserMap.get('top')" :key="user.id" :username="user.username"
						:voted="user.voted" :vote="user.vote" />
				</td>
				<td></td>
			</tr>
			<tr>
				<td id="players-left" class="player-container">
					<PokerUser v-for="user in positionedUserMap.get('left')" :key="user.id" :username="user.username"
						:voted="user.voted" :vote="user.vote"  />
				</td>
				<td>
					<PokerTable :any-user-present="hasAnyUsers" :any-vote-present="hasAnyVotes"
						:votes-revealed="roomState?.votesRevealed ?? false" @reveal-cards="revealCards"
						@reset-voting="resetVoting" />
				</td>
				<td id="players-right" class="player-container">
					<PokerUser v-for="user in positionedUserMap.get('right')" :key="user.id" :username="user.username"
						:voted="user.voted" :vote="user.vote" />
				</td>
			</tr>
			<tr>
				<td></td>
				<td id="players-bottom" class="player-container">
					<PokerUser v-for="user in positionedUserMap.get('bottom')" :key="user.id" :username="user.username"
						:voted="user.voted" :vote="user.vote" />
				</td>
				<td></td>
			</tr>
		</table>
	</div>
	<FibonacciVoting :enabled="!roomState?.votesRevealed" @cast-vote="castVote" />
</template>

<style scoped>
.player-container {
	width: 200px;
	height: 200px;
	text-align: center;
}

#players-top,
#players-bottom {
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	gap: 10px;
	flex-direction: row;
	width: 100%;
}

#players-left,
#players-right {
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	gap: 10px;
	flex-direction: column;
	height: 100%;
}

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