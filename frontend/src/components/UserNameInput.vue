<script setup>
// @ts-check
import { ref, computed, watch } from 'vue'

const PLACEHOLDER = "Choose a username";
const MIN_LENGTH = 3;
const MAX_LENGTH = 30;
const STARTS_WITH_LETTER_REGEX = /^[a-z]/

const emit = defineEmits(['update:modelValue', 'valid'])
const inputValue = ref("")

const isValid = computed(() => {
	const v = inputValue.value
	return !!v && v.length >= MIN_LENGTH && v.length <= MAX_LENGTH && STARTS_WITH_LETTER_REGEX.test(v.toLowerCase())
})

const errorMessage = computed(() => {
	const v = inputValue.value
	if (!v) return `Username is required (min ${MIN_LENGTH} characters)`
	if (v.length < MIN_LENGTH) return `Minimum ${MIN_LENGTH} characters`
	if (v.length > MAX_LENGTH) return `Maximum ${MAX_LENGTH} characters`
	if (!STARTS_WITH_LETTER_REGEX.test(v.toLowerCase())) return `Must start with a letter (a-z)`
	return ''
})

watch(inputValue, (newVal) => {
	emit('update:modelValue', newVal)
	emit('valid', isValid.value)
})

function sanitize(value) {
	return value
		.trim()
}


function handleInput(event) {
	const sanitized = sanitize(event.target.value)
	inputValue.value = sanitized
}

function onBlur() {
	inputValue.value = sanitize(inputValue.value)
}
</script>

<template>
	<div class="username-input">
		<input v-model="inputValue" @input="handleInput" @blur="onBlur" :placeholder="PLACEHOLDER"
			:maxlength="MAX_LENGTH" :aria-invalid="!isValid" class="input" autocomplete="off" />
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
}

.error {
	color: #dc2626;
	font-size: 0.875rem;
	margin-top: 0.25rem;
}
</style>