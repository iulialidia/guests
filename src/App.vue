<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import RsvpForm from './components/RsvpForm.vue'
import InviteDetails from './components/InviteDetails.vue'

// ---- Tweak these ----
const FRAME_COUNT = 10
const FPS = 4           // drawing speed (8–12 feels hand-drawn)
const LOOPS = 1              // times the drawing plays (it always ends on frame 10)
// After frame 10 the riders keep going: up past "Vlad & Iulia" and further into the distance
const RIDE_SECONDS = 3.25    // how long they keep riding away
const RIDE_UP = 1.2          // how far up they go (in name-heights; bigger = higher)
const NAMES_LEAD = 1         // "Vlad & Iulia" starts appearing this many seconds before the riders stop (0 = when they stop)
const RIDE_SCALE = 0.55      // how small they get at the end (smaller = further away)
const HOLD = 1.5             // seconds the names sit behind frame 10 before going green
const NAMES_FONT = 'Brittany' // must match the font-family in your @font-face
const DARK_BG = '#6f7a58'     // olive / sage green background
const GHOST_COLOR = '#7c8766' // big frame 8 in the background: just a touch lighter than DARK_BG
const GHOST_FRAME = 7         // which drawing sits big in the background after the colour change
const LIGHT_TEXT = '#fbf9f5'
// ---------------------

// Files live in public/loading/frame-1.png … frame-10.png
const frames = Array.from({ length: FRAME_COUNT }, (_, i) =>
  `${import.meta.env.BASE_URL}loading/frame-${i + 1}.png`
)
// While riding away the last 4 drawings keep cycling (hair swings left/right).
// ride-7/8/9 are frames 7–9 resized to match frame 10, so the riders don't jump in size.
const RIDE_FRAMES = ['ride-7', 'ride-8', 'ride-9'].map(n =>
  `${import.meta.env.BASE_URL}loading/${n}.png`
)
const currentFrame = ref(frames[0])
const envelopeGone = ref(false)

// Big background drawing: the PNG has lots of empty space around the lines,
// so we crop it to just the drawing once it's loaded. That way the drawing itself
// fills the background instead of a small drawing in a big empty box.
const ghostSrc = frames[GHOST_FRAME - 1]
const ghostMask = ref(ghostSrc)

function cropToInk(src) {
  return new Promise(res => {
    const im = new Image()
    im.onload = () => {
      try {
        const w = im.naturalWidth, h = im.naturalHeight
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(im, 0, 0)
        const d = ctx.getImageData(0, 0, w, h).data
        let x0 = w, y0 = h, x1 = -1, y1 = -1
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (d[(y * w + x) * 4 + 3] > 20) {
              if (x < x0) x0 = x
              if (x > x1) x1 = x
              if (y < y0) y0 = y
              if (y > y1) y1 = y
            }
          }
        }
        if (x1 < 0) return res(src)
        const pad = 2
        x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad)
        x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad)
        const out = document.createElement('canvas')
        out.width = x1 - x0 + 1; out.height = y1 - y0 + 1
        out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height)
        res(out.toDataURL('image/png'))
      } catch {
        res(src)   // if anything goes wrong, use the original image
      }
    }
    im.onerror = () => res(src)
    im.src = src
  })
}

// Invitation screen (waits for a tap before the green + envelope)
const INVITE_TEXT = 'Ne căsătorim și ne-am bucura să fii alături de noi.'
const photoSrc = `${import.meta.env.BASE_URL}noi.jpg`   // file lives in public/noi.jpg
const waiting = ref(false)
const center = ref(null)
const invite = ref(null)

// Shows/hides the invitation block and glides the names to their new place
// (instead of jumping when the layout changes)
function toggleInvite(show) {
  const before = center.value.getBoundingClientRect().top
  invite.value.style.display = show ? 'flex' : 'none'
  // room for the riders above the names while they're there; none once they've faded out
  center.value.style.marginTop = show ? '0.9em' : '0'
  if (show) gsap.set(invite.value, { autoAlpha: 1 })
  const after = center.value.getBoundingClientRect().top
  // when hiding, glide with exactly the same timing as the header shrinking,
  // so the names travel straight to their place (no dip down and back up)
  gsap.fromTo(center.value, { y: before - after }, { y: 0, duration: show ? 0.9 : 1.1, ease: 'power3.inOut' })
}

let tappedEarly = false
function openInvite() {
  if (!waiting.value) {          // tapped while the photo was still fading in
    tappedEarly = true
    return
  }
  waiting.value = false
  tl.play()
}

const hero = ref(null)
const names = ref(null)
const img = ref(null)
const amp = ref(null)
const letter = ref(null)
const envBack = ref(null)
const envFront = ref(null)
const backdrop = ref(null)
const ghost = ref(null)

let tl = null

function preload() {
  return Promise.all([...frames, ...RIDE_FRAMES, photoSrc].map(src => new Promise(res => {
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
  cropToInk(ghostSrc).then(url => { ghostMask.value = url })

  const vh = window.innerHeight
  const vw = window.innerWidth
  const words = names.value.querySelectorAll('.word')   // 'Vlad' and 'Iulia', kept whole so the script letters stay joined
  const envelope = [envBack.value, envFront.value]

  // Final sizes once the names become the header
  const headerHeight = Math.max(vh * 0.34, 240)
const headerFont = Math.max(72, Math.min(vw * 0.14, 90))

  // Starting state
  // hidden by a clip that is 'wiped' open left → right, like writing (generous margins for the swashes)
  //    (the words have big padding, so the whole letters fit inside the clip — no negative values needed)
  const HIDDEN = 'inset(0% 100% 0% 0%)'
  const SHOWN = 'inset(0% 0% 0% 0%)'
  gsap.set(words, { clipPath: HIDDEN, webkitClipPath: HIDDEN })
  gsap.set(amp.value, { opacity: 0 })
  gsap.set(names.value, { visibility: 'visible' })
  gsap.set(img.value, { filter: 'brightness(1) invert(0)' })
  gsap.set(envelope, { yPercent: 140 })   // parked below the screen, still hidden
  gsap.set(letter.value, { autoAlpha: 0 })
  gsap.set(backdrop.value, { autoAlpha: 0 })
  gsap.set(ghost.value, { autoAlpha: 0 })

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

  // 1b. They keep riding away: up past the names and smaller, in the same
  //     hand-drawn rhythm as the frames (stepped, not gliding)
  //     (starts on the beat of the last frame, so there is no pause in the middle)
  // GSAP owns the centring (-50%/-50%) so the ride can add to it cleanly
  gsap.set(img.value, { x: 0, y: 0, xPercent: -50, yPercent: -50, transformOrigin: '51% 58%' })
  tl.addLabel('ride', `-=${1 / FPS}`)
  tl.to(img.value, {
    yPercent: -50 - RIDE_UP / 3.17 * 100,   // 3.17 = drawing height in name-heights, so it scales with the names
    scale: RIDE_SCALE,
    duration: RIDE_SECONDS,
    ease: `steps(${Math.round(RIDE_SECONDS * FPS)})`
  }, 'ride')
  // ...and the drawings keep playing on the same beat, ending on drawing 7:
  //    the two of them closest together, turned towards each other.
  //    (3.25 s = 13 beats, which is exactly what lands on that drawing)
  const rideSteps = Math.round(RIDE_SECONDS * FPS)
  const ride = { k: 0 }
  tl.to(ride, {
    k: rideSteps,
    duration: RIDE_SECONDS,
    ease: `steps(${rideSteps})`,
    onUpdate: () => {
      const i = (Math.round(ride.k) + RIDE_FRAMES.length - 1) % RIDE_FRAMES.length   // starts on frame 10
      currentFrame.value = RIDE_FRAMES[i]
    },
    onComplete: () => { currentFrame.value = RIDE_FRAMES[0] }   // always stop on drawing 7 (side by side)
  }, 'ride')

  // 2. Just before the riders stop, the names are 'written' left to right
  //    (whole words, so the joined-up letters stay smooth on every phone)
  tl.to(words[0], { clipPath: SHOWN, webkitClipPath: SHOWN, duration: 0.9, ease: 'power1.inOut' },
    `ride+=${Math.max(0, RIDE_SECONDS - NAMES_LEAD)}`)
  tl.to(amp.value, { opacity: 1, duration: 0.4 }, '-=0.1')
  tl.to(words[1], { clipPath: SHOWN, webkitClipPath: SHOWN, duration: 1, ease: 'power1.inOut' }, '-=0.2')
  tl.set(words, { clearProps: 'clipPath,webkitClipPath' })
  tl.to({}, { duration: HOLD })

  // 2b. Names + drawing move up, the text and photo appear, then WAIT for a tap
  //     The invitation sits right under the names (normal page flow).
  //     Sizes are CSS values, so they keep adapting if the window is resized/rotated.
  //     The name size depends on width AND height (see --inv-f in .hero), so nothing gets cut.
  const INVITE_FONT = 'var(--inv-f)'
  const inviteFont = Math.max(46, Math.min(vw * 0.11, vh * 0.08, 84))
  tl.call(() => toggleInvite(true), null, 'invite')
  tl.to(center.value, { fontSize: inviteFont, duration: 1, ease: 'power3.inOut' }, 'invite')
  tl.set(center.value, { fontSize: INVITE_FONT }, 'invite+=1')
  tl.fromTo(invite.value.children,
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.2, ease: 'power2.out' }, 'invite+=0.5')
  tl.addPause('+=0', () => {
    if (tappedEarly) tl.play()   // don't make them tap twice
    else waiting.value = true
  })

  // 3. After the tap: the small riders fade away, the names settle into the header,
  //    the screen turns olive, and the big still drawing + the corner glow fade in behind.
  tl.to(invite.value, { autoAlpha: 0, duration: 0.5, ease: 'power1.in' })
  tl.addLabel('up')
  tl.to(img.value, { autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, 'up')
  tl.call(() => toggleInvite(false), null, 'up')
  tl.to(document.body, { backgroundColor: DARK_BG, '--cream-a': 0, duration: 1.3, ease: 'power2.inOut' }, 'up')
  tl.to(backdrop.value, { autoAlpha: 1, duration: 1.6, ease: 'power2.inOut' }, 'up+=0.3')
  tl.to(ghost.value, { autoAlpha: 1, duration: 1.8, ease: 'power2.inOut' }, 'up+=0.6')
  tl.to([names.value, amp.value], { color: LIGHT_TEXT, duration: 0.5, ease: 'power1.inOut' }, 'up+=0.45')
  tl.to(hero.value, { height: headerHeight, duration: 1.1, ease: 'power3.inOut' }, 'up')
  // start from the real current size (it is a CSS var(), which GSAP can't read as a number)
  tl.fromTo(center.value, { fontSize: () => getComputedStyle(center.value).fontSize },
    { fontSize: headerFont, duration: 1.1, ease: 'power3.inOut', immediateRender: false }, 'up')
  // after the move, switch to CSS sizes so the header adapts to any screen
  tl.set(hero.value, { height: 'max(34svh, 240px)' }, 'up+=1.1')
  tl.set(center.value, { fontSize: 'clamp(72px, 14vw, 90px)' }, 'up+=1.1')

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
  <!-- Olive-screen decoration: heavy drifting glow in the corner, a soft shade in the
       opposite corner, and the big still drawing running off the right edge -->
  <div ref="backdrop" class="backdrop" aria-hidden="true">
    <div class="shade"></div>
    <div class="bubble bubble-a"></div>
    <div class="bubble bubble-b"></div>
    <div
      ref="ghost"
      class="ghost"
      :style="{
        backgroundColor: GHOST_COLOR,
        maskImage: `url(${ghostMask})`,
        WebkitMaskImage: `url(${ghostMask})`
      }"
    ></div>
  </div>

  <header ref="hero" class="hero">
    <div ref="center" class="center">
      <h1 ref="names" class="names" :style="{ fontFamily: `'${NAMES_FONT}', cursive` }" aria-label="Vlad & Iulia">
        <span class="word">Vlad</span>
        <span ref="amp" class="amp">&amp;</span>
        <span class="word iulia">Iulia</span>
      </h1>
      <img ref="img" class="drawing" :src="currentFrame" alt="">
    </div>

    <!-- Invitation: text + photo, waits for a tap -->
    <div ref="invite" class="invite" @click="openInvite">
      <p class="invite-text">{{ INVITE_TEXT }}</p>
      <button type="button" class="open">
        <img class="photo" :src="photoSrc" alt="Vlad și Iulia">
        <span class="open-hint"><span class="pulse">Apasă pentru a deschide</span></span>
      </button>
    </div>
  </header>

  <main class="letter-wrap">
    <div ref="letter" class="letter">
      <InviteDetails />
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
/* ---------- Olive backdrop (appears after the tap) ---------- */
/* --glow sets how strong the corner gradient is: 1 = this heavier default,
   higher = even stronger, lower = subtler. */
.backdrop {
  --glow: 1;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
}

/* a deeper olive in the top-right corner, so the light corner has something to fade against */
.shade {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 85% 75% at 100% 0%,
    rgba(38, 46, 26, calc(0.42 * var(--glow))) 0%,
    rgba(38, 46, 26, calc(0.18 * var(--glow))) 45%,
    transparent 75%);
}

/* Heavy cream glow in the bottom-left corner, slowly drifting like a bubble */
.bubble {
  position: absolute;
  border-radius: 50%;
  filter: blur(26px);
  will-change: transform;
}
.bubble-a {
  width: 110vmax;
  height: 110vmax;
  left: -38vmax;
  bottom: -40vmax;
  background: radial-gradient(circle,
    rgba(238, 240, 208, calc(0.72 * var(--glow))) 0%,
    rgba(232, 232, 196, calc(0.46 * var(--glow))) 26%,
    rgba(226, 222, 186, calc(0.2 * var(--glow))) 48%,
    transparent 70%);
  animation: drift-a 18s ease-in-out infinite alternate;
}
.bubble-b {
  width: 52vmax;
  height: 52vmax;
  left: -10vmax;
  bottom: -18vmax;
  background: radial-gradient(circle,
    rgba(250, 246, 226, calc(0.6 * var(--glow))) 0%,
    rgba(244, 238, 212, calc(0.24 * var(--glow))) 45%,
    transparent 70%);
  animation: drift-b 13s ease-in-out infinite alternate;
}
@keyframes drift-a {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(5vmax, -4vmax) scale(1.08); }
  100% { transform: translate(2vmax, -8vmax) scale(0.95); }
}
@keyframes drift-b {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(7vmax, -6vmax) scale(1.15); }
  100% { transform: translate(-2vmax, -3vmax) scale(0.9); }
}

/* Big drawing, zoomed right in (cropped to its lines), running off the right edge.
   --ghost-h = how big, --ghost-x = where it starts from the left. */
.ghost {
  --ghost-h: 90svh;
  --ghost-x: 65vw;
  position: absolute;
  top: 50%;
  left: var(--ghost-x);
  width: 300vw;                /* wide box; the drawing just runs off the screen */
  height: var(--ghost-h);
  translate: 0 -50%;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-size: auto 100%;        /* fit the HEIGHT, keep proportions */
  -webkit-mask-size: auto 100%;
  mask-position: left center;
  -webkit-mask-position: left center;
}

/* Small screens: up in the top-right corner, running off the top and right edges */
@media (max-width: 640px) {
  .ghost {
    --ghost-h: 36svh;
    --ghost-x: 52svw;
    top: 3svh;
    translate: none;
    mask-position: left top;
    -webkit-mask-position: left top;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bubble { animation: none; }
}

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
  /* size of "Vlad & Iulia" on the invitation screen: fits both narrow and short screens */
  --inv-f: clamp(46px, min(11vw, 8svh), 84px);
}

.center {
  position: relative;
  font-size: clamp(5rem, 15vw, 10rem);   /* size of "Vlad & Iulia" (the drawing follows it) */
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
  font-size: 1.2em;
  line-height: 1;
  color: var(--clay);
  white-space: nowrap;
  visibility: hidden;
}

.word {
  display: inline-block;
  /* Big padding so the loops and tails of the script letters sit INSIDE the box
     (Safari cuts off ink that sticks out of an animated element); the negative
     margins cancel it out, so the layout looks exactly the same. */
  padding: 0.6em 0.35em;
  margin: -0.45em -0.3em;
}
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
  transform: translate(-50%, -50%);
  width: 4.6em;             /* always proportional to the names */
  height: auto;
  max-width: 90vw;
  pointer-events: none;
}

.sub {
  margin: 0.4em 0 0;
  /* font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; */
  font-size: clamp(0.7rem, 2.6vw, 0.85rem);
  color: rgba(248, 234, 216, 0.8);
  letter-spacing: 0.5em;
  padding-left: 0.5em;      /* keeps the spaced-out text centred */
  white-space: nowrap;
  text-align: center;
  margin-top: 3.2em;        /* room for the tail of the "I" in Iulia */
  opacity: 0;               /* hidden until the intro shows it (no flash on load) */
  z-index: 100;
}

/* ---------- Invitation screen (before the green) ---------- */
.invite {
  position: relative;
  z-index: 3;
  display: none;            /* GSAP shows it after the names appear */
  margin-top: clamp(26px, 6vw, 36px);   /* space between "Vlad & Iulia" and the text (leaves room for the tail of the "I") */
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
  cursor: pointer;
}

.invite-text {
  margin: 0;
  max-width: 28ch;
  font-family: var(--sans);
  font-weight: 300;
  font-size: clamp(1.05rem, 2.6vw, 1.3rem);
  line-height: 1.5;
  color: var(--clay);
}

.open {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.photo {
  display: block;
  height: clamp(150px, calc(100svh - 2.6 * var(--inv-f) - 240px), 46svh);
  width: auto;
  max-width: 78vw;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 999px 999px 14px 14px;   /* arched top */
  box-shadow: 0 14px 34px rgba(13, 61, 20, 0.18);
  transition: transform 0.3s ease;
}

.open:hover .photo { transform: translateY(-3px); }

.open-hint {
  font-family: var(--sans);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  padding-left: 0.3em;
  text-transform: uppercase;
  color: var(--muted);
}

.pulse { display: inline-block; animation: pulse 2s ease-in-out infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* ---------- Letter (the form) ---------- */
.letter-wrap {
  display: flex;
  justify-content: center;
  padding: 28px 16px 80px;   /* top: room for the tail of the "I" in Iulia */
}

.letter {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 540px;
  background: #fbf9f5;
  padding: 32px 30px 36px;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(40, 45, 25, 0.14);
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