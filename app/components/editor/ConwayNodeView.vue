<template>
  <NodeViewWrapper as="figure" :class="['conway-figure', selected ? 'is-selected' : '', 'bg-surface text-body']">
    <figcaption class="conway-caption">
      <template v-if="selected">
        <div class="meta">{{ rows }} × {{ cols }} • {{ aliveCount }} alive</div>
      </template>
      <template v-else>
        <div class="meta">{{ rows }} × {{ cols }} • {{ aliveCount }} alive</div>
      </template>
    </figcaption>

    <div class="conway-grid mx-auto" @mouseleave="stopPainting">
      <div v-for="(row, r) in grid" :key="`row-${r}`" class="row">
        <div
          v-for="(cell, c) in row"
          :key="`cell-${r}-${c}`"
          class="cell"
          :class="{ alive: cell === 1 }"
          @mousedown.prevent="startPainting(r, c)"
          @mouseover.prevent="paintCell(r, c)"
          @mouseup.prevent="stopPainting"
        ></div>
      </div>
    </div>

    <div class="conway-controls">
      <NTooltip>
        <template #content>
          <span class="font-600">{{ isRunning ? 'Pause Simulation' : 'Start Simulation' }}</span>
        </template>
        <NButton btn="solid-gray" icon @click.prevent="toggleRunning" class="hover:scale-105 active:scale-99 transition-transform">
          <NIcon v-if="isRunning" name="i-lucide-pause" />
          <NIcon v-else name="i-lucide-play" />
          <span class="sr-only">{{ isRunning ? 'Pause' : 'Start' }}</span>
        </NButton>
      </NTooltip>
      <NTooltip>
        <template #content>
          <span class="font-600">Randomize Grid</span>
        </template>
        <NButton btn="solid-gray" label="i-lucide-shuffle" icon @click.prevent="randomizeGrid" class="hover:scale-105 active:scale-99 transition-transform" />
      </NTooltip>
      <NTooltip>
        <template #content>
          <span class="font-600">Reset Grid</span>
        </template>
        <NButton btn="solid-gray" label="i-lucide-rotate-ccw" icon @click.prevent="resetGrid" class="hover:scale-105 active:scale-99 transition-transform" />
      </NTooltip>
      <NTooltip>
        <template #content>
          <span class="font-600">Export Seed to Clipboard</span>
        </template>
        <NButton btn="solid-gray" label="i-lucide-clipboard" icon @click.prevent="exportSeed" class="hover:scale-105 active:scale-99 transition-transform" />
      </NTooltip>
      <div class="speed">
        <NTooltip>
          <template #content>
            <span class="font-600">Update simulation speed (ms/generation)</span>
          </template>
          <div class="speed-input" role="group" aria-label="Simulation speed control">
            <button type="button" class="spin-btn" @click.prevent="decrementSpeed" aria-label="Decrease speed">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>

            <input
              v-model.number="localSpeed"
              type="number"
              :min="50"
              :max="1000"
              :step="10"
              aria-label="Simulation speed in milliseconds per generation"
              class="speed-input__field"
            />

            <button type="button" class="spin-btn" @click.prevent="incrementSpeed" aria-label="Increase speed">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </NTooltip>
        <div class="font-600 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 opacity-[0.85]">GEN: {{ generation }}</div>
      </div>
    </div> 
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const rows = computed(() => Number(props.node.attrs.rows ?? 25))
const cols = computed(() => Number(props.node.attrs.cols ?? 25))
const isSelected = computed(() => !!props.selected)
const localSpeed = ref(Number(props.node.attrs.speed ?? 200))

const grid = ref<number[][]>([])
const isRunning = ref(false)
let intervalId: ReturnType<typeof setInterval> | null = null
const isPainting = ref(false)
const paintMode = ref<'add' | 'remove'>('add')
let commitTimeout: ReturnType<typeof setTimeout> | null = null
const generation = ref(0) // increments each generation to observe speed changes

function initializeGrid(empty = true) {
  grid.value = Array.from({ length: rows.value }).map(() => Array(cols.value).fill(0))
  generation.value = 0
  if (!empty) randomizeGrid()
}

function setGridFromSeed(seed: any) {
  if (!seed || !Array.isArray(seed)) return

  // Clear the grid without resetting the generation counter so
  // external seed updates (e.g., save/undo) do not restart the counter.
  grid.value = Array.from({ length: rows.value }).map(() => Array(cols.value).fill(0))

  for (const pair of seed) {
    if (!Array.isArray(pair) || pair.length < 2) continue
    const [r, c] = pair
    if (r >= 0 && r < rows.value && c >= 0 && c < cols.value) {
      const rowArr = grid.value[r]
      if (rowArr) rowArr[c] = 1
    }
  }
}

function gridToSeed() {
  const seed: number[][] = []
  for (let r = 0; r < rows.value; r++) {
    const rowArr = grid.value[r]
    if (!rowArr) continue
    for (let c = 0; c < cols.value; c++) {
      if (rowArr[c] === 1) seed.push([r, c])
    }
  }
  return seed
}

const aliveCount = computed(() => grid.value.flat().filter(Boolean).length)

function countNeighbors(r: number, c: number) {
  let count = 0
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue
      const nr = r + i
      const nc = c + j
      if (nr >= 0 && nr < rows.value && nc >= 0 && nc < cols.value) {
        const rowArr = grid.value[nr]
        if (rowArr) count += rowArr[nc] ?? 0
      }
    }
  }
  return count
}

function updateGrid() {
  const newGrid = grid.value.map((row) => row.slice())
  for (let r = 0; r < rows.value; r++) {
    for (let c = 0; c < cols.value; c++) {
      const cell = grid.value[r]?.[c] ?? 0
      const neighbors = countNeighbors(r, c)
      const rowNew = newGrid[r]
      if (rowNew) {
        if (cell === 1) {
          if (neighbors < 2 || neighbors > 3) rowNew[c] = 0
        } else {
          if (neighbors === 3) rowNew[c] = 1
        }
      }
    }
  }
  grid.value = newGrid
  generation.value += 1
} 

function startSimulation() {
  if (isRunning.value) return
  isRunning.value = true
  restartInterval()
} 

function stopSimulation() {
  if (!isRunning.value) return
  isRunning.value = false
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  commitSeedDebounced()
}

function toggleRunning() {
  if (isRunning.value) stopSimulation()
  else startSimulation()
}

function randomizeGrid() {
  grid.value = Array.from({ length: rows.value }).map(() => Array.from({ length: cols.value }).map(() => (Math.random() > 0.7 ? 1 : 0)))
  generation.value = 0
  commitSeedDebounced()
}

function resetGrid() {
  initializeGrid(true)
  generation.value = 0
  commitSeedDebounced()
} 

function startPainting(r: number, c: number) {
  if (isRunning.value) return
  isPainting.value = true
  const rowArr = grid.value[r]
  const current = rowArr ? rowArr[c] : 0
  paintMode.value = current === 1 ? 'remove' : 'add'
  if (rowArr) rowArr[c] = paintMode.value === 'add' ? 1 : 0
}

function paintCell(r: number, c: number) {
  if (!isPainting.value || isRunning.value) return
  const rowArr = grid.value[r]
  if (!rowArr) return
  rowArr[c] = paintMode.value === 'add' ? 1 : 0
}

function stopPainting() {
  if (!isPainting.value) return
  isPainting.value = false
  commitSeedDebounced()
}

function commitSeedDebounced() {
  if (commitTimeout) clearTimeout(commitTimeout)
  commitTimeout = setTimeout(() => {
    commitSeed()
  }, 250)
}

function commitSeed() {
  // Persist the current grid to node attributes as seed (array of [r,c])
  try {
    const seed = gridToSeed()
    props.updateAttributes({ seed })
  } catch (e) {
    // ignore silently
  }
}

function restartInterval() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  if (!isRunning.value) return
  intervalId = setInterval(() => updateGrid(), Number(localSpeed.value))
} 

function incrementSpeed() {
  const step = 10
  const max = 1000
  let v = Math.round(Number(localSpeed.value) || 200) + step
  if (v > max) v = max
  localSpeed.value = v
}

function decrementSpeed() {
  const step = 10
  const min = 50
  let v = Math.round(Number(localSpeed.value) || 200) - step
  if (v < min) v = min
  localSpeed.value = v
}

async function exportSeed() {
  try {
    const seed = gridToSeed()
    await navigator.clipboard.writeText(JSON.stringify(seed))
    // visual cue could be added
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  // Initialize from node attrs
  const seed = props.node.attrs.seed
  if (seed) setGridFromSeed(seed)
  else initializeGrid(true)
  document.addEventListener('mouseup', stopPainting)
})

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
  document.removeEventListener('mouseup', stopPainting)
})

watch(() => props.node.attrs.seed, (val) => {
  if (!val) return
  // when seed attr changes externally, reflect into local grid
  setGridFromSeed(val)
})

// Watch for external changes to speed attribute (e.g., undo/redo)
watch(() => props.node.attrs.speed, (newSpeed) => {
  const speed = Number(newSpeed ?? 200)
  if (speed !== localSpeed.value) {
    localSpeed.value = speed
  }
})

// Watch for local speed changes from user input
watch(localSpeed, (newSpeed, oldSpeed) => {
  // Clamp value to valid range
  const min = 50
  const max = 1000
  let value = Math.round(Number(newSpeed) || 200)
  if (value < min) value = min
  if (value > max) value = max
  
  // Persist to node attributes
  try {
    props.updateAttributes({ speed: value })
  } catch (e) {
    // ignore
  }

  // Restart interval to reflect new speed when running
  if (isRunning.value) {
    restartInterval()
  }
}, { flush: 'post' })

const selected = computed(() => !!props.selected)

</script>

<style scoped>
.conway-figure {
  margin: 1.5rem 0;
  padding: 1.25rem;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.conway-figure.is-selected {
  outline: 2px solid var(--un-primary-color, #3b82f6);
}

.conway-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--un-border-color, #e5e7eb);
  background: var(--un-background-color, #fff);
}
.dark .btn {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(75,85,99,0.35);
}

.speed { display: flex; align-items: center; gap: 0.5rem; }
.speed-label { font-weight: 600; font-size: 0.9rem; margin-right: 0.25rem; }
 /* speed-indicator styles replaced by UnoCSS utility classes on the element */
.speed-input {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  background: var(--un-surface, #f8fafc);
  border-radius: 9999px;
  padding: 0.125rem;
  border: 1px solid rgba(226,232,240,0.8);
  box-shadow: 0 1px 0 rgba(0,0,0,0.02) inset;
}

.speed-input__field {
  width: 4.25rem;
  padding: 0.35rem 0.5rem;
  border: none;
  background: transparent;
  text-align: center;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--un-body-color, #111827);
  outline: none;
  border-radius: 9999px;

  &:focus {
    box-shadow: 0 0 0 4px rgba(59,130,246,0.08);
  }
}

.dark .speed-input__field {
  color: var(--un-body-color, #f9fafb);

  &:focus {
    box-shadow: 0 0 0 2px rgba(255,255,246,0.52);
  }
}

.spin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  color: var(--un-muted-color, #6b7280);
  cursor: pointer;
  transition: transform .12s ease, background .12s ease, color .12s ease;
}

.spin-btn:hover { transform: translateY(-1px); background: rgba(59,130,246,0.04); color: var(--un-primary-color, #3b82f6); }

.spin-btn:focus-visible { outline: none; box-shadow: 0 0 0 4px rgba(59,130,246,0.12); border-radius: 9999px; }

.spin-btn svg { width: 14px; height: 14px; }

/* Remove native spinners */
.speed-input__field::-webkit-outer-spin-button,
.speed-input__field::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
.speed-input__field { -moz-appearance: textfield; appearance: textfield; }

.dark .speed-input {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(75,85,99,0.35);
}

.conway-grid {
  display: inline-block;
  background: var(--un-background-color, #fff);
  border-radius: 8px;
  padding: 10px;
  overflow: auto;
  margin: 0 auto;
}
.dark .conway-grid {
  background: rgba(255,255,255,0.02);
}

.row { display: flex; }
.cell {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin: 3px;
  background-color: rgba(249,250,251,0.92);
  border: 1px solid rgba(229,231,235,0.6);
  cursor: pointer;
  transition: all 0.18s ease-in-out;
}

.cell:hover {
  background-color: rgba(229,231,235,0.9);
  transform: scale(1.05);
}

.dark .cell {
  background-color: rgba(17,24,39,0.9);
  border: 1px solid rgba(75,85,99,0.6);
}

.dark .cell:hover {
  background-color: rgba(55,65,81,0.8);
  transform: scale(1.05);
}

.cell.alive {
  border: 1px solid transparent;
  box-shadow: 0 0 12px rgba(168,162,158,0.4);
  transition: all 0.18s ease-in-out;
  transform: scale(1.02);
  /* Base color */
  background: linear-gradient(135deg, #A684FF, #8567DB);
}

/* Color palette variations */
.cell.alive:nth-child(2n) {
  background: linear-gradient(135deg, #FF3EA5, #F564A9);
}
.cell.alive:nth-child(3n) {
  background: linear-gradient(135deg, #00FFDE, #15F5BA);
}
.cell.alive:nth-child(4n) {
  background: linear-gradient(135deg, #FFDB5C, #FFAF61);
}
.cell.alive:nth-child(5n) {
  background: linear-gradient(135deg, #687EFF, #1B56FD);
}

.cell.alive:hover {
  transform: scale(1.12);
  box-shadow: 0 0 20px rgba(168,162,158,0.6);
}

.dark .cell.alive {
  box-shadow: 0 0 12px rgba(168,162,158,0.6);
}

.dark .cell.alive:hover {
  box-shadow: 0 0 20px rgba(168,162,158,0.8);
}

.conway-caption { font-size: 0.85rem; color: var(--un-muted-color, #6b7280); margin-top: 0.75rem; text-align: center; }

.meta { font-weight: 600; }

/* Responsive tweaks */
@media (max-width: 768px) {
  .cell { width: 14px; height: 14px; margin: 2px; }
}

@media (max-width: 420px) {
  .cell { width: 12px; height: 12px; margin: 1px; }
}
</style>
