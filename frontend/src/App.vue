<script lang="ts" setup>
import { ref, watch } from 'vue';
import Cookies from 'js-cookie';
import { io, Socket } from 'socket.io-client';

import * as constants from './constants';
import PokerRoom from './components/PokerRoom.vue';
import UserNameInput from './components/UserNameInput.vue';
import RoomChooser from './components/RoomChooser.vue';

const roomId = ref<string | undefined>(undefined);

export type UserState = {
  username: string;
  voted: boolean;
}
export type RoomState = {
  users: Array<UserState>;
  votesRevealed: boolean;
  deck: string;
}
const roomState = ref<RoomState | null>(null);

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

let socket: Socket | undefined = undefined;
watch(roomId, (newRoomId) => {
  if (newRoomId == null || newRoomId.trim() === "") {
    return;
  }

  if (socket) {
    console.log("Disconnecting existing socket");
    socket.disconnect();
  }
  socket = io(`${constants.BASE_URL}`, {
    transports: ["websocket"],
    withCredentials: true
  });

  socket.on("connect", () => {
    console.debug(`Connected to server with socket ID: ${socket?.id}`);
    socket?.emit("joinRoom", { roomId: newRoomId, userId: user.value?.sessionId });
  });

  socket.on("roomState", (state: RoomState) => {
    console.debug("Received room state:", state);
    roomState.value = state;
  });

  socket.on("disconnect", (reason: unknown) => {
    console.info(`Disconnected from server: ${reason}`);
  });
})

roomId.value = new URL(window.location.href).searchParams.get('room') || undefined;
</script>

<template>
  <main>
    <UserNameInput v-if="user == null" @set-user="setUser" />
    <RoomChooser v-else-if="roomId == null" @set-room="setRoom" />
    <PokerRoom v-else :room-state="roomState" />
  </main>
</template>

<style scoped></style>
