<script lang="ts" setup>
import { ref, watch, onUnmounted } from 'vue';
import Cookies from 'js-cookie';
import { io, Socket } from 'socket.io-client';

import * as constants from './constants';
import PokerRoom from './components/PokerRoom.vue';
import UserNameInput from './components/UserNameInput.vue';
import RoomChooser from './components/RoomChooser.vue';

const roomId = ref<string | undefined>(undefined);

export type UserState = {
  id: string;
  username: string;
  voted: boolean;
  vote: string | null;
}
export type RoomState = {
  users: Array<UserState>;
  votesRevealed: boolean;
  deck: string;
}
const roomState = ref<RoomState | null>(null);
const errorMessage = ref<string | null>(null);

type User = {
  name: string;
  sessionId: string;
  ttl: number;
}
const user = ref<User | null>(null);

const storedSessionId = Cookies.get('sessionId');
const storedUsername = localStorage.getItem('username');
if (storedSessionId && storedUsername) {
  console.log("Restoring session for user:", storedUsername);
  user.value = {
    name: storedUsername,
    sessionId: storedSessionId,
    ttl: 0
  };
}

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

function castVote(value: string) {
  if (socket != null && roomId.value.trim() !== "") {
    console.debug(`Casting vote "${value}" in room "${roomId.value}"`);
    socket.emit("sendVote", { roomId: roomId.value, userId: user.value?.sessionId, vote: value });
  } else {
    console.warn("Cannot cast vote: socket or roomId is undefined");
  }
}

function revealCards() {
  if (socket == null || roomId.value.trim() === "") {
    return;
  }
  console.debug(`Revealing votes in room "${roomId.value}"`);
  socket.emit("revealVotes", { roomId: roomId.value });
}

function resetVoting() {
  if (socket == null
    || roomId.value.trim() === "" 
    || roomState.value == null
    || !roomState.value.votesRevealed) {
    return;
  }
  console.debug(`Resetting votes in room "${roomId.value}"`);
  socket.emit("resetVotes", { roomId: roomId.value });
}

function closeSocket() {
  if (socket != null) {
    console.log("Closing socket connection");
    socket.off(); // Remove listeners
    socket.disconnect();
    socket = undefined;
  }
}

watch(roomId, (newRoomId) => {
  // Close any dangling socket connection
  closeSocket();

  if (newRoomId == null || newRoomId.trim() === "") {
    return;
  }
  
  // Extract the origin and path from BASE_URL
  const baseUrl = new URL(constants.BASE_URL);
  const socketPath = baseUrl.pathname === '/' ? '/socket.io/' : `${baseUrl.pathname}/socket.io/`;
  console.debug(`Connecting to socket at ${baseUrl.origin} with path ${socketPath}`);
  socket = io(baseUrl.origin, {
    path: socketPath,
    transports: ["websocket"],
    withCredentials: true
  });

  socket.on("connect", () => {
    console.debug(`Connected to server with socket ID: ${socket?.id}`);
    socket?.emit("joinRoom", { roomId: newRoomId, userId: user.value?.sessionId });
  });

  socket.on("socketError", (error: { receivedEvent: string, message: string }) => {
    console.error("Error from server:", JSON.stringify(error));

    switch (error.receivedEvent) {
      case "joinRoom":
        errorMessage.value = "Failed to join room!";
        roomId.value = undefined;
        user.value = null;
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.toString());
        break;

      default:
        errorMessage.value = error.message;
        break;
    }
  });

  socket.on("roomState", (state: RoomState) => {
    console.debug("Received room state:", state);
    roomState.value = state;
  });

  socket.on("votesRevealed", (results: Array<{ userId: string; vote: string }>) => {
    console.debug("Votes have been revealed:", results);
    if (roomState.value == null) {
      console.error("Cannot reveal votes: roomState is null");
      return;
    }

    const voteMap = new Map<string, string>(results.map(r => [r.userId, r.vote]));
    roomState.value.users = roomState.value.users.map(user =>
      ({ ...user, vote: voteMap.get(user.id) ?? null })
    );
    roomState.value.votesRevealed = true;
  });

  socket.on("disconnect", (reason: unknown) => {
    console.info(`Disconnected from server: ${reason}`);
  });
})

// Cleanup when component unmounts (e.g. reload, navigate away)
onUnmounted(() => {
  closeSocket();
});

roomId.value = new URL(window.location.href).searchParams.get('room') || undefined;
</script>

<template>
  <main>
    <div v-if="errorMessage != null" class="error-banner">
      <span>{{ errorMessage }}</span>
      <button @click="errorMessage = null">✕</button>
    </div>
    <UserNameInput v-if="user == null" @set-user="setUser" />
    <RoomChooser v-else-if="roomId == null" @set-room="setRoom" />
    <PokerRoom v-else @reveal-cards="revealCards" @cast-vote="castVote" @reset-voting="resetVoting"
      :room-state="roomState" />
  </main>
</template>

<style scoped>
.error-banner {
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  color: #b91c1c;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-banner button {
  background: transparent;
  border: none;
  color: #b91c1c;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
}
</style>
