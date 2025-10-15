<script setup>
// @ts-check
import { ref, computed, watch } from "vue";
import axios from "axios";
import { API_BASE_URL } from "@/constants";

const PLACEHOLDER = "Choose a username";
const MIN_LENGTH = 3;
const MAX_LENGTH = 30;
const STARTS_WITH_LETTER_REGEX = /^[a-z]/

const emit = defineEmits(["set-user"])
const username = ref("")

// Check local storage for existing username -> if found, request user creation directly
const storedUsername = localStorage.getItem('username');
if (storedUsername) {
	console.info("Found stored username, using it:", storedUsername);
	username.value = storedUsername;
	submitUsername();
}

const isValid = computed(() => {
	const v = username.value
	return v != null && v.length >= MIN_LENGTH && v.length <= MAX_LENGTH && STARTS_WITH_LETTER_REGEX.test(v.toLowerCase())
})

const errorMessage = computed(() => {
	const v = username.value
	if (!v) return `Username is required (min ${MIN_LENGTH} characters)`
	if (v.length < MIN_LENGTH) return `Minimum ${MIN_LENGTH} characters`
	if (v.length > MAX_LENGTH) return `Maximum ${MAX_LENGTH} characters`
	if (!STARTS_WITH_LETTER_REGEX.test(v.toLowerCase())) return `Must start with a letter (a-z)`
	return ''
})

function sanitize(value) {
	return value
		.trim()
}

function handleInput(event) {
	const sanitized = sanitize(event.target.value)
	username.value = sanitized
}

function submitUsername() {
	axios.get(`${API_BASE_URL}/create-user`, {
		params: {
			username: username.value
		}
	}).then(response => {
		emit("set-user", {
			name: username.value,
			sessionId: response.data.userId,
			ttl: response.data.ttl
		});
	}).catch(error => {
		console.error("Error setting username:", error);
		alert("An error occurred while setting the username.");
	});
}
</script>

<template>
	<div class="username-input">
		<div>
			<input v-model="username" @input="handleInput" :placeholder="PLACEHOLDER"
				:maxlength="MAX_LENGTH" :aria-invalid="!isValid" class="input" autocomplete="off" />

			<button :disabled="!isValid" class="submit-username" @click="submitUsername">
				Submit
			</button>
		</div>
		<p v-if="!isValid" class="error">{{ errorMessage }}</p>
	</div>
</template>

<style scoped>
.username-input {
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