<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps({
  anyUserPresent: {
    type: Boolean,
    required: true
  },
  anyVotePresent: {
    type: Boolean,
    required: true
  },
  votesRevealed: {
    type: Boolean,
    required: true
  }
});
const emit = defineEmits(["reveal-cards", "reset-voting"]);

function revealCards() {
  emit("reveal-cards");
  
}
function resetVoting() {
  emit("reset-voting");
}
</script>

<template>
  <div class="poker-table">
    <button v-if="anyVotePresent && !votesRevealed" @click="revealCards" class="reveal-cards-button">
      Reveal Cards
    </button>
    <button v-else-if="votesRevealed" @click="resetVoting" class="reset-voting-button">
      Reset Voting
    </button>
    <p v-else>
      <p v-if="anyUserPresent" class="info-text">
        Waiting for votes...
      </p>
      <p v-else class="info-text">
        No users present
      </p>
    </p>
  </div>
</template>

<style scoped>
.poker-table {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10rem;
  width: 20rem;
  background-color: #2596be;
  border-radius: 1rem;
}

.info-text {
  font-size: 1.5rem;
  color: white;
  font-weight: bold;
}
</style>
