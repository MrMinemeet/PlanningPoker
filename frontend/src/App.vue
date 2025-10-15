<script setup>
// @ts-check
import { ref, watch } from 'vue';
import Cookies from 'js-cookie';

import PokerRoom from './components/PokerRoom.vue';
import UserNameInput from './components/UserNameInput.vue';
import RoomChooser from './components/RoomChooser.vue';

const roomId = ref("");
/**
 * Example structure:
  {
    name: "Alex",
    sessionId: "1",
    ttl: 3600
  }
 */
const user = ref(null);

function setUser(createdUser) {
  // Store username more persistently
  localStorage.setItem('username', createdUser.name);

  // Store sessionId in a cookie with expiration based on ttl (ms)
  Cookies.set('sessionId', createdUser.sessionId, { expires: createdUser.ttl / 1000 / 60 / 60 / 24 });
  user.value = createdUser;
}

function setRoom(id) {
  roomId.value = id;
}

watch(roomId, (newRoomId) => {
  // TODO: Join room via websocket
})
</script>

<template>
  <p v-if="roomId !== ''">Room ID: {{ roomId }}</p>
  <main>
    <UserNameInput v-if="user == null" @set-user="setUser" />
    <RoomChooser v-else-if="roomId === ''" @set-room="setRoom" />
    <PokerRoom v-else></PokerRoom>
  </main>
</template>

<style scoped></style>
