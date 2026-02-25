<template>
  <div class="app-header">
    <h1>{{ t.app.title }}</h1>
    <div class="header-controls">
      <el-select v-model="settings.theme" size="small" style="width: 140px" @change="applyTheme">
        <el-option label="Electric Blue" value="electric-blue" />
        <el-option label="Matrix Green" value="matrix-green" />
        <el-option label="Red Alert" value="red-alert" />
      </el-select>
      <el-select v-model="settings.locale" size="small" style="width: 90px">
        <el-option label="中文" value="zh-CN" />
        <el-option label="EN" value="en-US" />
      </el-select>
      <el-dropdown trigger="click">
        <el-button size="small">{{ t.header.export }}</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="exportJson">{{ t.header.exportJson }}</el-dropdown-item>
            <el-dropdown-item @click="exportMatrix">{{ t.header.exportMatrix }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'
import { useStackStore } from '../stores/stack'
import { useComputeStore } from '../stores/compute'
import { useLocale } from '../composables/useLocale'

const settings = useSettingsStore()
const stack = useStackStore()
const compute = useComputeStore()
const { t } = useLocale()

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
}

function exportJson() {
  const data = stack.exportToJson()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rcf_stack.json'
  a.click()
  URL.revokeObjectURL(url)
}

function exportMatrix() {
  if (compute.resEneMatrix.length === 0) return
  const lines = compute.resEneMatrix.map(row => row.map(v => v.toFixed(6)).join(' '))
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'response_matrix.txt'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--rcf-border);
  background: var(--rcf-bg-secondary);
}
.app-header h1 {
  font-size: 18px;
  color: var(--rcf-primary);
  font-weight: 600;
}
.header-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
