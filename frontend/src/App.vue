<script setup>
// @ts-check
import { ref } from 'vue';
import PokerRoom from './components/PokerRoom.vue';

const roomId = ref("123123123");

</script>

<template>
  <header>
    <p>Room ID: {{ roomId }}</p>
  </header>
  <main>
    <PokerRoom></PokerRoom>
  </main>
</template>

<style scoped></style>
