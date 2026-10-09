<script setup>
defineProps({
  guest: { type: Object, required: true },
  index: { type: Number, required: true }
})
defineEmits(['remove'])
</script>

<template>
  <div class="guest-card">
    <button
      v-if="index > 0"
      type="button"
      class="remove-guest"
      aria-label="Elimină invitatul"
      @click="$emit('remove')"
    >×</button>

    <div class="guest-label">
      {{ index === 0 ? 'INVITAT PRINCIPAL' : 'ÎNSOȚITOR ' + (index + 1) }}
    </div>

    <div class="guest-field">
      <label :for="'nume-' + guest.id">Nume &amp; Prenume <span class="req">*</span></label>
      <input type="text" :id="'nume-' + guest.id" v-model="guest.nume" placeholder="Nume Prenume" required>
    </div>

    <div class="guest-field">
      <label :for="'meniu-' + guest.id">Meniu <span class="req">*</span></label>
      <select :id="'meniu-' + guest.id" v-model="guest.meniu" required>
        <option value="" disabled>Alege meniul</option>
        <option value="Standard">Standard</option>
        <option value="Vegetarian">Vegetarian</option>
        <option value="Copil">Copil</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.guest-card {
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 18px;
  margin-bottom: 14px;
  background: var(--cream);
  position: relative;
  transition: box-shadow 0.2s ease;
}

.guest-card:hover { box-shadow: 0 4px 14px rgba(0, 30, 20, 0.08); }

.guest-label {
  font-family: var(--sans);
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  color: #857b70;
  margin-bottom: 10px;
}

.guest-field { margin-bottom: 12px; }
.guest-field:last-child { margin-bottom: 0; }

.guest-field label {
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 5px;
}

.req { color: var(--error); font-weight: 600; }

.remove-guest {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: #fff;
  color: #a89a8c;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.remove-guest:hover { border-color: var(--error); color: var(--error); }
</style>