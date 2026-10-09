<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ================== EDIT HERE as details become known ==================
// Leave a value as null / '' and the invitation shows a gentle "în curând" text instead.

const MAP_ARCHIA = 'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Conacul Archia, Hunedoara')

const EVENTS = [
  {
    title: 'Cununia religioasă',
    icon: 'rings',
    time: null,                  // ex: '13:00'
    place: null,                 // ex: 'Biserica Sfântul Nicolae'
    detail: '',                  // ex: 'Deva'
    mapUrl: null                 // ex: 'https://maps.google.com/?q=...'
  },
  {
    title: 'Cocktail hour',
    icon: 'glass',
    time: null,
    place: 'Conacul Archia',
    detail: 'Terasa, Salon Garden · Archia, Hunedoara',
    mapUrl: MAP_ARCHIA
  },
  {
    title: 'Petrecerea',
    icon: 'music',
    time: null,
    place: 'Conacul Archia',
    detail: 'Salon Garden · Archia, Hunedoara',
    mapUrl: MAP_ARCHIA
  }
]

// Phone numbers shown under the RSVP lead-in (tap = call)
const PHONES = [
  { name: 'Iulia', display: '0752 206 451', tel: '+40752206451' },
  { name: 'Vlad', display: '0736 614 605', tel: '+40736614605' }
]

// Godparents: the section appears on the invitation only once this is filled in.
const NASI = ''                  // ex: 'Ana & Mihai Popescu'

const TBA_ALL = 'Ora și locul vor fi anunțate în curând'
const TBA_TIME = 'Ora va fi anunțată în curând'
// ======================================================================

// Week of the wedding: Monday 10 – Sunday 16 May 2027, heart on Saturday 15
const WEEK = [
  { d: 'L', n: 10 }, { d: 'Ma', n: 11 }, { d: 'Mi', n: 12 }, { d: 'J', n: 13 },
  { d: 'V', n: 14 }, { d: 'S', n: 15, heart: true }, { d: 'D', n: 16 }
]

// Sections fade in as they scroll into view
const root = ref(null)
let io = null
onMounted(() => {
  const items = root.value.querySelectorAll('.reveal')
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'))
    return
  }
  io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    })
  }, { threshold: 0.15 })
  items.forEach(el => io.observe(el))
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div ref="root" class="details">
    <!-- Date -->
    <section class="inv-block reveal">
      <p class="inv-eyebrow">Sâmbătă</p>
      <p class="inv-big-date">15 mai 2027</p>

      <div class="week" aria-label="Săptămâna nunții: sâmbătă, 15 mai 2027">
        <div v-for="day in WEEK" :key="day.n" class="day" :class="{ on: day.heart }">
          <span class="d">{{ day.d }}</span>
          <span class="n">
            <svg v-if="day.heart" class="heart" viewBox="0 0 32 29" aria-hidden="true">
              <path d="M16 28.5S1.5 19.6 1.5 9.6C1.5 4.9 5 1.5 9.3 1.5c2.9 0 5.3 1.6 6.7 4 1.4-2.4 3.8-4 6.7-4 4.3 0 7.8 3.4 7.8 8.1 0 10-14.5 18.9-14.5 18.9z" />
            </svg>
            <span class="num">{{ day.n }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Godparents: only shown once NASI is filled in -->
    <section v-if="NASI" class="inv-block reveal">
      <p class="inv-eyebrow">Alături de nașii noștri</p>
      <p class="nasi">{{ NASI }}</p>
    </section>

    <!-- Events -->
    <section class="inv-block reveal">
      <p class="inv-eyebrow">Programul zilei</p>

      <div class="events">
        <article v-for="ev in EVENTS" :key="ev.title" class="event reveal">
          <span class="icon" aria-hidden="true">
            <!-- rings -->
            <svg v-if="ev.icon === 'rings'" viewBox="0 0 32 32"><circle cx="12" cy="19" r="8"/><circle cx="20" cy="19" r="8"/><path d="M13 6l3-3 3 3-3 3z"/></svg>
            <!-- glass -->
            <svg v-else-if="ev.icon === 'glass'" viewBox="0 0 32 32"><path d="M9 4h14l-1 8a6 6 0 0 1-12 0z"/><path d="M16 18v9M11 28h10"/><path d="M10 9h12"/></svg>
            <!-- music -->
            <svg v-else viewBox="0 0 32 32"><path d="M12 24V7l14-3v17"/><circle cx="8.5" cy="24" r="3.5"/><circle cx="22.5" cy="21" r="3.5"/></svg>
          </span>

          <h3 class="ev-title">{{ ev.title }}</h3>

          <template v-if="!ev.time && !ev.place">
            <p class="tba">{{ TBA_ALL }}</p>
          </template>
          <template v-else>
            <p class="ev-time" :class="{ tba: !ev.time }">{{ ev.time || TBA_TIME }}</p>
            <p v-if="ev.place" class="ev-place">{{ ev.place }}</p>
            <p v-if="ev.detail" class="ev-detail">{{ ev.detail }}</p>
            <a v-if="ev.mapUrl" class="map" :href="ev.mapUrl" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
              Vezi pe hartă
            </a>
          </template>
        </article>
      </div>
    </section>

    <!-- Lead-in to the form -->
    <section class="inv-block reveal rsvp-head">
      <svg class="inv-flourish" viewBox="0 0 240 34" aria-hidden="true">
        <path d="M4 18 C40 18 60 6 90 12 C110 16 112 28 100 28 C88 28 92 10 120 10 C148 10 152 28 140 28 C128 28 130 16 150 12 C180 6 200 18 236 18" />
      </svg>
      <p class="inv-eyebrow">Răspunde invitației</p>
      <p class="inv-lead">
        Te rugăm să ne anunți până pe <strong>15 aprilie 2027</strong>,
        completând formularul de mai jos sau telefonic:
      </p>
      <div class="phones">
        <a v-for="ph in PHONES" :key="ph.tel" class="phone" :href="'tel:' + ph.tel">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/></svg>
          <span class="ph-num">{{ ph.display }}</span>
          <span class="ph-name">{{ ph.name }}</span>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.details {
  text-align: center;
  font-family: var(--sans);
  color: var(--ink);
}

.inv-block { margin-bottom: 40px; }

.inv-eyebrow {
  margin: 0 0 10px;
  padding-left: 0.3em;          /* balances letter-spacing */
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--muted);
}

.inv-big-date {
  margin: 0 0 18px;
  font-size: clamp(1.6rem, 6vw, 2rem);
  font-weight: 300;
  letter-spacing: 0.02em;
  color: var(--clay);
}

/* ---- Week strip ---- */
.week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  max-width: 380px;
  margin: 0 auto;
}

.day { display: flex; flex-direction: column; align-items: center; gap: 8px; }

.d {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.n {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--ink);
}

.heart {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: var(--sage);
}

.day.on .num { position: relative; color: #fbf9f5; font-weight: 600; transform: translateY(-2px); }
.day.on .d { color: var(--sage); }

/* ---- Godparents ---- */
.nasi { margin: 0; font-size: 1.15rem; color: var(--clay); }

/* ---- Events ---- */
.events { display: flex; flex-direction: column; gap: 14px; }

.event {
  padding: 22px 20px 20px;
  background: #fbf8f1;
  border: 1px solid var(--line);
  border-radius: 6px;
}

.icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  margin-bottom: 6px;
}

.icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: var(--sage);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ev-title {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--clay);
}

.ev-time { margin: 0 0 10px; font-size: 1rem; font-weight: 600; }
.ev-place { margin: 0; font-size: 1rem; }
.ev-detail { margin: 2px 0 0; font-size: 0.9rem; color: var(--muted); }

.tba {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 400;
  font-style: italic;
  color: var(--muted);
}

.map {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  margin-top: 12px;
  padding: 0 18px;
  border: 1px solid var(--sage);
  border-radius: 999px;
  color: var(--sage);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.map:hover { background: var(--sage); color: #fbf9f5; }

.map svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; }

/* ---- Lead-in to the form ---- */
.rsvp-head { margin-bottom: 28px; }

.inv-flourish { display: block; width: 170px; height: auto; margin: 0 auto 18px; }
.inv-flourish path { fill: none; stroke: var(--sage); stroke-width: 1.3; stroke-linecap: round; }

.inv-lead { margin: 0; font-size: 1rem; line-height: 1.5; }
.inv-lead strong { color: var(--clay); font-weight: 600; }

.phones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}

.phone {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--sage);
  border-radius: 999px;
  color: var(--sage);
  font-size: 0.95rem;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.phone:hover { background: var(--sage); color: #fbf9f5; }
.phone svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linejoin: round; }
.ph-num { font-weight: 600; letter-spacing: 0.02em; }
.ph-name { opacity: 0.8; }

/* ---- Scroll reveal ---- */
.reveal { opacity: 0; transform: translateY(14px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
</style>
