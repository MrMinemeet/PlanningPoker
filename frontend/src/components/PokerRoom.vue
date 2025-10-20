<script lang="ts" setup>
import { ref } from 'vue';
import PokerTable from './PokerTable.vue';
import PokerUser from './PokerUser.vue';

const users = ref([]);

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
		<PokerTable 
			:any-user-present="users.length > 0"
			:any-vote-present="[...users].some(user => user.voted)"
		/>
		<PokerUser v-for="(user, i) in users" :key="i" :username="user.username" :voted="user.voted"
			:style="getPositionStyle(i, users.length)" />
	</div>
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