<script setup>
// @ts-check
import { ref } from 'vue';
import PokerRoom from './components/PokerRoom.vue';
import UserNameInput from './components/UserNameInput.vue';

const roomId = ref("");

</script>

<template>
  <p v-if="roomId !== ''">Room ID: {{ roomId }}</p>
  <main>
    <UserNameInput v-if="roomId === ''" />
    <PokerRoom v-else></PokerRoom>
  </main>
</template>

<style scoped></style>
