<script setup>
// @ts-check
import { ref, computed } from "vue";
import axios from "axios";
import { API_BASE_URL } from "@/constants";

const PLACEHOLDER = "Enter room ID";

const emit = defineEmits(["set-room"])
const room = ref("")

const isValid = computed(() => {
	const v = room.value
	return v != null && 0 < v.length
})

function sanitize(value) {
	return value
		.trim()
}

function handleInput(event) {
	const sanitized = sanitize(event.target.value)
	room.value = sanitized
}

function joinRoom() {
	emit("set-room", room.value)
}

function createRoom() {
	axios.get(`${API_BASE_URL}/create-room`, {
		params: {
			deck: "fibonacci" // TODO: Allow user to select deck
		}
	}).then(response => {
		emit("set-room", response.data.roomId);
	}).catch(error => {
		if (error.code === "ERR_NETWORK") {
			console.error("Network error:", error);
			alert("Failed to connect to the server");
			return;
		}
		console.error("Error creating a new room:", error);
		alert("An error occurred while creating a new room.");
	});
}
</script>

<template>
	<div class="room-input">
		<div>
			<input v-model="room" @input="handleInput" :placeholder="PLACEHOLDER"
				:aria-invalid="!isValid" class="input" autocomplete="off" />

			<button :disabled="!isValid" class="join-room" @click="joinRoom">
				Submit
			</button>
		</div>
		<div>
			<button class="create-room" @click="createRoom">
				Create new Room
			</button>
		</div>
	</div>
</template>

<style scoped>
.room-input {
	display: flex;
	flex-direction: column;
}

.input {
	padding: 0.5rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 1rem;
	margin-right: 1.5rem;
}

.error {
	color: #dc2626;
	font-size: 0.875rem;
	margin-top: 0.25rem;
}
</style>