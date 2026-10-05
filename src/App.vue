<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import RsvpForm from './components/RsvpForm.vue'

// ---- Tweak these ----
const FRAME_COUNT = 10
const FPS = 4           // drawing speed (8–12 feels hand-drawn)
const LOOPS = 1              // times the drawing plays (it always ends on frame 10)
const HOLD = 1.5             // seconds the names sit behind frame 10 before going green
const NAMES_FONT = 'Brittany' // must match the font-family in your @font-face
const DARK_BG = '#0d3d14'
const LIGHT_TEXT = '#fbf9f5'
// ---------------------

// Files live in public/loading/frame-1.png … frame-10.png
const frames = Array.from({ length: FRAME_COUNT }, (_, i) =>
  `${import.meta.env.BASE_URL}loading/frame-${i + 1}.png`
)
const currentFrame = ref(frames[0])
const envelopeGone = ref(false)

const hero = ref(null)
const names = ref(null)
const img = ref(null)
const amp = ref(null)
const sub = ref(null)
const letter = ref(null)
const envBack = ref(null)
const envFront = ref(null)

let tl = null

function preload() {
  return Promise.all(frames.map(src => new Promise(res => {
    const im = new Image()
    im.onload = im.onerror = res
    im.src = src
  })))
}

function finish() {
  gsap.set(letter.value, { clearProps: 'transform' })
  envelopeGone.value = true
  document.body.style.overflow = ''
}

onMounted(async () => {
  document.body.style.overflow = 'hidden'
  await Promise.all([preload(), document.fonts.load(`1em "${NAMES_FONT}"`)])

  const vh = window.innerHeight
  const vw = window.innerWidth
  const chars = names.value.querySelectorAll('.char')
  const envelope = [envBack.value, envFront.value]

  // Final sizes once the names become the header
  const headerHeight = Math.max(vh * 0.3, 200)
const headerFont = Math.max(72, Math.min(vw * 0.14, 90))

  // Starting state
  gsap.set(chars, { opacity: 0, y: 18 })
  gsap.set([amp.value, sub.value], { opacity: 0 })
  gsap.set(names.value, { visibility: 'visible' })
  gsap.set(img.value, { filter: 'brightness(1) invert(0)' })
  gsap.set(envelope, { yPercent: 140 })   // parked below the screen, still hidden
  gsap.set(letter.value, { autoAlpha: 0 })

  const state = { f: 0 }
  tl = gsap.timeline()

  // 1. The drawing plays at full size and stops on frame 10
  tl.to(state, {
    f: FRAME_COUNT,
    duration: FRAME_COUNT / FPS,
    ease: `steps(${FRAME_COUNT})`,
    repeat: LOOPS - 1,
    onUpdate: () => {
      currentFrame.value = frames[Math.min(Math.floor(state.f), FRAME_COUNT - 1)]
    }
  })

  // 2. Behind frame 10, the names appear letter by letter
  tl.to(chars, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, '+=0.2')
  tl.to(amp.value, { opacity: 1, duration: 0.6 }, '-=0.6')
  tl.to({}, { duration: HOLD })

  // 3. The screen turns green, names and drawing turn white
  tl.to(document.body, { backgroundColor: DARK_BG, duration: 1.2, ease: 'power2.inOut' }, 'invert')
  tl.to([names.value, amp.value], { color: LIGHT_TEXT, duration: 1.2, ease: 'power2.inOut' }, 'invert')
  tl.to(img.value, { filter: 'brightness(0) invert(1)', duration: 1.2, ease: 'power2.inOut' }, 'invert')
  tl.to({}, { duration: 0.3 })

  // 4. Frame 10 fades away, names move up and get smaller, subtitle appears
  tl.to(img.value, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }, 'up')
  tl.to(hero.value, { height: headerHeight, duration: 1.1, ease: 'power3.inOut' }, 'up')
  tl.to(names.value, { fontSize: headerFont, duration: 1.1, ease: 'power3.inOut' }, 'up')
  tl.to(sub.value, { opacity: 1, duration: 0.6 }, 'up+=0.7')

  // 5. The envelope rises with the form tucked inside
  tl.set(envelope, { visibility: 'visible' }, 'envelope')   // only now, after the green
  tl.set(letter.value, { y: vh * 1.1, autoAlpha: 1 }, 'envelope')
  tl.to(envelope, { yPercent: 0, duration: 1, ease: 'power3.out' }, 'envelope')
  tl.to(letter.value, { y: vh * 0.46 - headerHeight, duration: 1, ease: 'power3.out' }, 'envelope')

  // 6. The form slides up out of the envelope, then the envelope drops away
  tl.to(letter.value, { y: 0, duration: 1.2, ease: 'power2.inOut' }, '+=0.4')
  tl.to(envelope, { yPercent: 140, duration: 0.9, ease: 'power2.in' }, '-=0.6')
  tl.call(finish)

  // Respect "reduce motion" settings: jump straight to the end
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) tl.progress(1)
})

onBeforeUnmount(() => {
  tl?.kill()
  document.body.style.overflow = ''
})
</script>

<template>
  <header ref="hero" class="hero">
    <div class="center">
      <h1 ref="names" class="names" :style="{ fontFamily: `'${NAMES_FONT}', cursive` }" aria-label="Vlad & Iulia">
        <span class="word"><span v-for="(c, i) in 'Vlad'" :key="'v' + i" class="char">{{ c }}</span></span>
        <span ref="amp" class="amp">&amp;</span>
        <span class="word iulia"><span v-for="(c, i) in 'Iulia'" :key="'i' + i" class="char">{{ c }}</span></span>
      </h1>
      <img ref="img" class="drawing" :src="currentFrame" alt="">
    </div>
    <p ref="sub" class="sub">CONFIRMARE DE PREZENȚĂ</p>
  </header>

  <main class="letter-wrap">
    <div ref="letter" class="letter">
      <RsvpForm />
    </div>
  </main>

  <template v-if="!envelopeGone">
    <div ref="envBack" class="env env-back"><div class="env-shape"></div></div>
    <div ref="envFront" class="env env-front">
      <div class="env-shape"></div>
      <div class="seal" :style="{ fontFamily: `'${NAMES_FONT}', cursive` }">V&amp;I</div>
    </div>
  </template>
</template>

<style scoped>
/* ---------- Header: fills the screen during the intro, then shrinks ---------- */
.hero {
  position: relative;
  z-index: 4;
  height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
}

.center {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Names sit BEHIND the drawing */
.names {
  position: relative;
  z-index: 1;
  margin: 0;
  display: flex;
  align-items: center;
  font-weight: 400;
  font-size: clamp(5rem, 15vw, 10rem);
  line-height: 1;
  color: var(--clay);
  white-space: nowrap;
  visibility: hidden;
}

.word { display: inline-block; padding: 0.15em 0.05em; }
.char { display: inline-block; }
.iulia { transform: translateY(0.35em); }

.amp {
  display: inline-block;
  margin: 0 0.25em;
  font-size: 0.6em;
  color: var(--sage);
  transform: translateY(0.2em);
}

/* The drawing, full size, on top of the names */
.drawing {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
  width: auto;
  height: auto;
  max-width: 90vw;
  max-height: 110svh;
  pointer-events: none;
}

.sub {
  margin: 0.4em 0 0;
  /* font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; */
  font-size: 0.85rem;
  color: rgba(248, 234, 216, 0.8);
  letter-spacing: 0.55em;
  margin-top: 1em;
  z-index: 100;
}

/* ---------- Letter (the form) ---------- */
.letter-wrap {
  display: flex;
  justify-content: center;
  padding: 0 16px 80px;
}

.letter {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 540px;
  background: #F7F2E8;
  padding: 32px 30px 36px;
  border-radius: 4px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
  visibility: hidden;
  opacity: 0;
}

/* ---------- Envelope (big, sits high) ---------- */
.env {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60svh;
  display: flex;
  justify-content: center;
  pointer-events: none;
  visibility: hidden;   /* GSAP shows it only after the screen turns green */
}

.env-shape {
  position: relative;
  width: min(680px, calc(100vw - 16px));
  height: 100%;
}

/* ---- Vintage paper look ---- */
/* fine paper grain, drawn with an SVG noise filter */
.env-shape,
.env-back .env-shape::before {
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0 0.12 0 0 0 0.22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at 30% 70%, rgba(140, 100, 45, 0.16), transparent 45%),
    radial-gradient(ellipse at 80% 25%, rgba(140, 100, 45, 0.12), transparent 40%),
    radial-gradient(ellipse at center, transparent 50%, rgba(95, 65, 25, 0.28) 100%);
}

/* back of the envelope, with the open flap */
.env-back { z-index: 1; }
.env-back .env-shape { background-color: #cdb58a; }
.env-back .env-shape::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: 100%;
  width: 100%;
  height: 20%;
  background-color: #c4aa7c;
  clip-path: polygon(0 100%, 50% 0, 100% 100%);
}

/* front pocket, covering the bottom of the letter */
.env-front { z-index: 3; }
.env-front .env-shape {
  background-color: #e2cfa6;
  clip-path: polygon(0 0, 50% 30%, 100% 0, 100% 100%, 0 100%);
  /* soft fold lines from the corners toward the middle */
  background-image:
    linear-gradient(to top right, transparent 49.7%, rgba(95, 65, 25, 0.22) 50%, transparent 50.4%),
    linear-gradient(to top left, transparent 49.7%, rgba(95, 65, 25, 0.22) 50%, transparent 50.4%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0 0.12 0 0 0 0.22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at 70% 80%, rgba(140, 100, 45, 0.16), transparent 45%),
    radial-gradient(ellipse at center, transparent 50%, rgba(95, 65, 25, 0.3) 100%);
}

/* wax seal where the pocket's V meets */
.seal {
  position: absolute;
  left: 50%;
  top: calc(60svh * 0.3);
  width: 74px;
  height: 74px;
  translate: -50% -50%;
  border-radius: 47% 53% 50% 50% / 52% 48% 52% 48%;
  background: radial-gradient(circle at 35% 30%, #a8403a, #7a1f1c 55%, #5a1412 100%);
  box-shadow:
    inset 0 0 0 6px rgba(0, 0, 0, 0.12),
    inset 0 0 0 9px rgba(255, 255, 255, 0.06),
    0 3px 8px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 225, 215, 0.75);
  font-size: 1.7rem;
  line-height: 1;
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.35);
}
</style>