<script setup>
import { reactive, ref, computed } from 'vue'
import gsap from 'gsap'
import GuestCard from './GuestCard.vue'

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzN8yG3kctTG_NRCwvqmK_6B3po1L5iuvfjC-RumUPKOLVAbA7uf7VpnrXks4xZQUBhSA/exec'

// ---- Thank-you screen ----
const SCRIPT_FONT = 'Brittany'           // used only for the date
const WEDDING_DATE = new Date(2027, 4, 15) // 15 May 2027 (months count from 0)
const WEDDING_DATE_TEXT = '15.05.2027'
const CALENDAR_LINK =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=' + encodeURIComponent('Nunta Vlad & Iulia') +
  '&dates=20270515/20270516'
// --------------------------

const daysLeft = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((WEDDING_DATE - today) / 86400000))
})
// Romanian: "1 zi", "5 zile", "250 de zile"
const daysLabel = computed(() => {
  const n = daysLeft.value
  if (n === 1) return 'zi'
  const lastTwo = n % 100
  return (n >= 20 && (lastTwo === 0 || lastTwo >= 20)) ? 'de zile' : 'zile'
})

let guestSeq = 0
const newGuest = () => ({ id: guestSeq++, nume: '', meniu: '' })

const defaultForm = () => ({
  prezenta: '',
  guests: [newGuest()],
  alergii: '',
  mesaj: ''
})

const form = reactive(defaultForm())
const sending = ref(false)
const status = ref(null)
const submitted = ref(null)   // copy of the answers, shown on the thank-you screen
const root = ref(null)

const addGuest = () => form.guests.push(newGuest())
const removeGuest = (idx) => form.guests.splice(idx, 1)

// ---------- Animations ----------
function onGuestEnter(el, done) {
  gsap.fromTo(el, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', onComplete: done })
}
function onGuestLeave(el, done) {
  gsap.to(el, { opacity: 0, x: 16, duration: 0.2, ease: 'power1.in', onComplete: done })
}
function onStatusEnter(el, done) {
  gsap.fromTo(el,
    { opacity: 0, y: -6, scale: 0.98 },
    { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.7)', onComplete: done }
  )
}

// Form fades out, thank-you screen comes in
function onViewLeave(el, done) {
  gsap.to(el, { opacity: 0, y: -12, duration: 0.35, ease: 'power2.in', onComplete: done })
}

function onViewEnter(el, done) {
  // Back to the form: simple fade
  if (!el.classList.contains('thanks')) {
    gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', onComplete: done })
    return
  }

  root.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const q = (sel) => el.querySelector(sel)
  const path = q('.flourish path')
  const len = path.getTotalLength()

  const tl = gsap.timeline({ onComplete: done })
  tl.set(el, { opacity: 1 })
  // small caps "ÎȚI MULȚUMIM" opens up
  tl.from(q('.eyebrow'), { opacity: 0, letterSpacing: '0.05em', duration: 1, ease: 'power2.out' })
  // the flourish draws itself like a pen stroke
  tl.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, '-=0.6')
  if (q('.lead')) tl.from(q('.lead'), { opacity: 0, y: 8, duration: 0.6 }, '-=0.8')
  // the date / "Ne vei lipsi" is written left to right
  tl.fromTo(q('.big-script'),
    { clipPath: 'inset(-30% 100% -30% -5%)' },
    { clipPath: 'inset(-30% 0% -30% -5%)', duration: 1.4, ease: 'power2.inOut' }, '-=0.3')
  if (el.querySelectorAll('.after').length) {
    tl.from(el.querySelectorAll('.after'), { opacity: 0, y: 8, duration: 0.5, stagger: 0.12 }, '-=0.4')
  }
  // the answer card slides up, then gets stamped (only for "Da")
  if (q('.card')) {
    tl.from(q('.card'), { opacity: 0, y: 30, rotate: -1.5, duration: 0.8, ease: 'power3.out' }, '-=0.1')
      .from(q('.stamp'), { opacity: 0, scale: 2.4, rotate: -30, duration: 0.45, ease: 'power4.in' }, '-=0.1')
      .to(q('.card'), { x: 3, duration: 0.05, yoyo: true, repeat: 3 })   // little "thump"
  }
  tl.from(el.querySelectorAll('.foot'), { opacity: 0, duration: 0.5 })
}

// ---------- Submit ----------
async function submitForm() {
  sending.value = true
  status.value = null

  const fd = new FormData()
  fd.append('prezenta', form.prezenta)
  // Always send the main guest's name, also when they answer "Nu"
  fd.append('nume', form.guests[0].nume)

  if (form.prezenta === 'Da') {
    fd.append('nrPersoane', form.guests.length)

    const counts = { Standard: 0, Vegetarian: 0, Copil: 0 }
    form.guests.forEach((guest, idx) => {
      counts[guest.meniu] = (counts[guest.meniu] || 0) + 1
      if (idx > 0) fd.append(`persoana_${idx + 1}`, guest.nume)
      fd.append(`meniu_${idx + 1}`, guest.meniu)
    })
    fd.append('nrStandard', counts.Standard)
    fd.append('nrVegetarian', counts.Vegetarian)
    fd.append('nrCopil', counts.Copil)
    fd.append('alergii', form.alergii)
  }

  fd.append('mesaj', form.mesaj)

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd })
    const data = await res.json()

    if (data.result === 'success') {
      // Keep a copy of what was sent, then show the thank-you screen
      submitted.value = {
        prezenta: form.prezenta,
        guests: form.prezenta === 'Da'
          ? form.guests.map(g => ({ nume: g.nume, meniu: g.meniu }))
          : [{ nume: form.guests[0].nume }],
        alergii: form.prezenta === 'Da' ? form.alergii.trim() : '',
        mesaj: form.mesaj.trim()
      }
      Object.assign(form, defaultForm())
    } else {
      // Show the exact reason the sheet script gave (e.g. what's wrong with the name)
      status.value = { type: 'error', message: data.message || 'A apărut o eroare. Te rugăm să încerci din nou!' }
      console.warn('Răspuns server:', data)
    }
  } catch (err) {
    status.value = { type: 'error', message: 'A apărut o eroare. Te rugăm să încerci din nou!' }
    console.error('Eroare:', err)
  } finally {
    sending.value = false
  }
}

function newResponse() {
  submitted.value = null
}
</script>

<template>
  <div ref="root">
    <Transition mode="out-in" :css="false" @leave="onViewLeave" @enter="onViewEnter">

      <!-- ---------- Thank-you screen ---------- -->
      <section v-if="submitted" key="thanks" class="thanks">
        <p class="eyebrow">Îți mulțumim</p>

        <svg class="flourish" viewBox="0 0 240 34" aria-hidden="true">
          <path d="M4 18 C40 18 60 6 90 12 C110 16 112 28 100 28 C88 28 92 10 120 10 C148 10 152 28 140 28 C128 28 130 16 150 12 C180 6 200 18 236 18" />
        </svg>

        <!-- Coming -->
        <template v-if="submitted.prezenta === 'Da'">
          <p class="lead">Abia așteptăm să sărbătorim împreună. Ne vedem pe</p>
          <p class="big-script" :style="{ fontFamily: `'${SCRIPT_FONT}', cursive` }">{{ WEDDING_DATE_TEXT }}</p>
          <p v-if="daysLeft > 0" class="after countdown">încă <strong>{{ daysLeft }}</strong> {{ daysLabel }}</p>
          <a class="after cal-link" :href="CALENDAR_LINK" target="_blank" rel="noopener">Adaugă în calendar</a>
        </template>

      <!-- Not coming -->
      <template v-else>
        <p class="big-script big-plain">Ne vei lipsi...</p>
      </template>

        <!-- The answer, as a little vintage card (only when coming) -->
        <div v-if="submitted.prezenta === 'Da'" class="card">
          <span class="stamp">Confirmat</span>

          <p class="card-title">Răspunsul tău</p>

          <ul class="guests">
            <li v-for="(g, i) in submitted.guests" :key="i">
              <span class="g-name">{{ g.nume }}</span>
              <span class="g-dots"></span>
              <span class="g-menu">{{ g.meniu }}</span>
            </li>
          </ul>

          <p v-if="submitted.alergii" class="card-note"><em>Alergii:</em> {{ submitted.alergii }}</p>
          <p v-if="submitted.mesaj" class="card-quote">„{{ submitted.mesaj }}”</p>
        </div>

        <button type="button" class="again foot" @click="newResponse">Trimite un alt răspuns</button>
      </section>

      <!-- ---------- Form ---------- -->
      <form v-else key="form" @submit.prevent="submitForm">
        <div class="field">
          <label for="prezenta">Vei fi alături de noi? <span class="req">*</span></label>
          <select id="prezenta" v-model="form.prezenta" required>
            <option value="" disabled>Alege un răspuns</option>
            <option value="Da">Da, cu drag!</option>
            <option value="Nu">Din păcate, nu pot ajunge</option>
          </select>
        </div>

        <div v-if="form.prezenta === 'Nu'" class="field">
          <label for="nume-nu">Nume &amp; Prenume <span class="req">*</span></label>
          <input type="text" id="nume-nu" v-model="form.guests[0].nume" placeholder="Nume Prenume" required>
        </div>

        <template v-if="form.prezenta === 'Da'">
          <div class="field">
            <label>Invitați &amp; meniuri</label>

            <TransitionGroup tag="div" :css="false" @enter="onGuestEnter" @leave="onGuestLeave">
              <GuestCard
                v-for="(guest, idx) in form.guests"
                :key="guest.id"
                :guest="guest"
                :index="idx"
                @remove="removeGuest(idx)"
              />
            </TransitionGroup>

            <button type="button" class="add-guest" @click="addGuest">+ Adaugă un însoțitor</button>
          </div>

          <div class="field">
            <label for="alergii">Alergii sau restricții alimentare (opțional)</label>
            <textarea id="alergii" v-model="form.alergii" rows="2" placeholder="Specificați alergiile sau restricțiile alimentare..."></textarea>
          </div>
        </template>

        <div class="field">
          <label for="mesaj">Dacă dorești să ne transmiți un mesaj</label>
          <textarea id="mesaj" v-model="form.mesaj" rows="3" placeholder="Scrie aici un gând sau o urare..."></textarea>
        </div>

        <p class="req-note"><span class="req">*</span> câmp obligatoriu</p>

        <button type="submit" class="submit" :disabled="sending">
          {{ sending ? 'Se trimite...' : 'Trimite Confirmarea' }}
        </button>

        <Transition :css="false" @enter="onStatusEnter">
          <div v-if="status" class="status" :class="status.type">{{ status.message }}</div>
        </Transition>
      </form>

    </Transition>
  </div>
</template>

<style scoped>
/* The white card comes from the "letter" in App.vue */
form { margin: 0; }

.field { margin-bottom: 26px; }

.add-guest {
  width: 100%;
  background: transparent;
  border: 1px dashed var(--clay);
  color: var(--clay);
  padding: 11px;
  margin-top: 4px;
  border-radius: 3px;
  font-family: var(--sans);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.add-guest:hover { background: #f1f4ee; }

.submit {
  width: 100%;
  padding: 14px;
  margin-top: 6px;
  background: var(--clay);
  color: #fff;
  border: none;
  border-radius: 3px;
  font-family: var(--sans);
  font-size: 0.98rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.submit:hover:not(:disabled) { background: var(--sage); }
.submit:disabled { opacity: 0.6; cursor: default; }

.req { color: var(--error); font-weight: 600; }

.req-note {
  margin: 0 0 6px;
  font-family: var(--sans);
  font-size: 0.8rem;
  color: var(--muted);
}

.status {
  margin-top: 20px;
  text-align: center;
  font-family: var(--sans);
  font-size: 0.95rem;
  padding: 14px;
  border-radius: 3px;
}

.status.success { background: #eef1e9; color: #4c5940; }
.status.error { background: #f7e9e6; color: var(--error); }

/* ================= Thank-you screen ================= */
.thanks {
  /* Same basic font as the rest of the page — only the date uses Brittany */
  --serif-fine: var(--sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  --ink-red: #9b2d24;
  text-align: center;
  font-family: var(--serif-fine);
  color: var(--ink);
  padding: 8px 0 4px;
}

.eyebrow {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--clay);
  padding-left: 0.3em; /* balances the letter-spacing so it stays centred */
}

.flourish {
  display: block;
  width: 190px;
  height: auto;
  margin: 10px auto 18px;
}

.flourish path {
  fill: none;
  stroke: var(--sage);
  stroke-width: 1.3;
  stroke-linecap: round;
}

.lead {
  margin: 0 auto;
  max-width: 32ch;
  font-size: 1.05rem;
  line-height: 1.45;
}

.big-script {
  margin: 6px 0 4px;
  font-size: clamp(3.4rem, 13vw, 5rem);
  line-height: 1.25;
  color: var(--clay);
  font-weight: 800;
  font:bold
}

.countdown {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

.countdown strong { color: var(--clay); font-weight: 600; }

.cal-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 0.95rem;
  color: var(--clay);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

/* ---- The answer card ---- */
.card {
  position: relative;
  margin: 34px auto 0;
  max-width: 400px;
  padding: 26px 26px 22px;
  text-align: left;
  background: #fbf6ec;
  border: 1px solid #dccfb6;
  outline: 1px dashed #cdbd9e;
  outline-offset: -8px;
  box-shadow: 0 6px 18px rgba(60, 40, 10, 0.08);
}

.card-title {
  margin: 0 0 14px;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--muted);
}

.guests { list-style: none; margin: 0; padding: 0; }

.guests li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 5px 0;
  font-size: 1rem;
}

.g-name { font-weight: 500; }
.g-dots { flex: 1; border-bottom: 1px dotted #b9a987; transform: translateY(-4px); }
.g-menu { font-style: italic; color: var(--sage); }

.g-single { margin: 0; text-align: center; font-size: 1.05rem; font-weight: 500; }

/* "Ne vei lipsi" in the basic font */
.big-plain {
  font-size: clamp(1.8rem, 7vw, 2.4rem);
  font-weight: 300;
  letter-spacing: 0.02em;
}

.card-note {
  margin: 14px 0 0;
  font-size: 1rem;
  color: var(--muted);
}

.card-quote {
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px solid #e6dcc7;
  font-size: 1rem;
  font-style: italic;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

/* Rubber stamp */
.stamp {
  position: absolute;
  top: -14px;
  right: -10px;
  padding: 5px 12px 4px;
  border: 2px solid var(--ink-red);
  border-radius: 4px;
  outline: 1px solid var(--ink-red);
  outline-offset: 2px;
  color: var(--ink-red);
  background: rgba(251, 246, 236, 0.6);
  font-family: var(--serif-fine);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  rotate: -12deg;
  opacity: 0.85;
  mix-blend-mode: multiply;
}

.again {
  margin-top: 26px;
  background: transparent;
  border: none;
  color: var(--muted);
  font-family: var(--serif-fine);
  font-size: 0.9rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

@media (max-width: 480px) {
  .eyebrow { font-size: 0.9rem; letter-spacing: 0.3em; }
  .card { padding: 24px 18px 20px; }
  .stamp { right: -4px; }
}
</style>