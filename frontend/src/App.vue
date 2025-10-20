<script lang="ts" setup>
import { ref, watch } from 'vue';
import Cookies from 'js-cookie';

import PokerRoom from './components/PokerRoom.vue';
import UserNameInput from './components/UserNameInput.vue';
import RoomChooser from './components/RoomChooser.vue';

const roomId = ref<string | undefined>(new URL(window.location.href).searchParams.get('room') || undefined);

type User = {
  name: string;
  sessionId: string;
  ttl: number;
}
const user = ref<User | null>(null);

function setUser(createdUser: User) {
  // Store username more persistently
  localStorage.setItem('username', createdUser.name);

  // Store sessionId in a cookie with expiration based on ttl (ms)
  Cookies.set('sessionId', createdUser.sessionId, { expires: createdUser.ttl / 1000 / 60 / 60 / 24 });
  user.value = createdUser;
}

function setRoom(id: string) {
  roomId.value = id;

  const url = new URL(window.location.href);
  url.searchParams.set('room', id);
  window.history.replaceState({}, '', url.toString());
}

watch(roomId, (newRoomId) => {

  // TODO: Join room via websocket
})
</script>

<template>
  <p v-if="roomId !== ''">Room ID: {{ roomId }}</p>
  <main>
    <UserNameInput v-if="user == null" @set-user="setUser" />
    <RoomChooser v-else-if="roomId == null" @set-room="setRoom" />
    <PokerRoom v-else></PokerRoom>
  </main>
</template>

<style scoped></style>
