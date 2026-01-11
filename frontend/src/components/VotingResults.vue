<script lang="ts" setup>
import { computed } from 'vue';

type Vote = string;

const props = defineProps({
  results: {
    type: Array as () => Array<{ userId: string; vote: Vote }>,
    required: true
  }
});

// Aggregate votes by value and calculate percentages
const aggregatedResults = computed(() => {
  const voteMap = new Map<Vote, number>();
  
  // Count votes
  props.results.forEach(result => {
    voteMap.set(result.vote, (voteMap.get(result.vote) ?? 0) + 1);
  });

  // Convert to sorted array with percentages
  return Array.from(voteMap.entries())
    .map(([vote, count]) => ({
      vote,
      count,
      percentage: Math.round((count / props.results.length) * 100)
    }))
    .sort((a, b) => parseInt(a.vote) - parseInt(b.vote));
});
</script>

<template>
  <div class="results-container">
    <div class="results-grid">
      <div v-for="result in aggregatedResults" :key="result.vote" class="result-card">
        <div class="vote-count">{{ result.count }} {{ result.count === 1 ? 'Vote' : 'Votes' }}</div>
        <div class="vote-value">{{ result.vote }}</div>
        <div class="vote-percentage">{{ result.percentage }}%</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-container {
  padding: 1rem;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid #333;
  border-radius: 12px;
  background-color: #fff;
  min-height: 1rem;
  gap: 0.5rem;
}

.vote-count {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
}

.vote-value {
  font-size: 2rem;
  font-weight: bold;
  color: #000;
}

.vote-percentage {
  font-size: 1rem;
  color: #666;
  font-weight: 600;
}
</style>
