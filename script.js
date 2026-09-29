const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzN8yG3kctTG_NRCwvqmK_6B3po1L5iuvfjC-RumUPKOLVAbA7uf7VpnrXks4xZQUBhSA/exec";

// Generare dinamică câmpuri însoțitori (Persoana 2, Persoana 3...)
// Păstrează numele deja scrise când se schimbă numărul de persoane.
const numeInsotitori = {};

function generateGuestFields(total) {
  const container = document.getElementById('containerInsotitori');
  const n = Math.max(1, parseInt(total) || 1);

  // Dacă numărul nu s-a schimbat, nu refacem câmpurile (altfel se pierde click-ul/focusul)
  if (container.querySelectorAll('input').length === n - 1) {
    sincronizeazaMeniuri();
    return;
  }
  container.innerHTML = '';

  if (n > 1) {
    container.style.display = 'block';

    for (let i = 2; i <= n; i++) {
      const div = document.createElement('div');
      div.style.marginBottom = '10px';

      div.innerHTML = `
        <label style="font-size: 0.9em; color: #444;">Persoana ${i}:</label>
        <input type="text" name="persoana_${i}" placeholder="Nume Prenume" required>
      `;
      const input = div.querySelector('input');
      input.value = numeInsotitori[input.name] || '';
      input.addEventListener('input', () => { numeInsotitori[input.name] = input.value; });
      input.disabled = document.getElementById('prezenta').value === 'Nu';
      container.appendChild(div);
    }
  } else {
    container.style.display = 'none';
  }

  sincronizeazaMeniuri();
}

// Meniul standard se completează automat: persoane - vegetarian - copil
function sincronizeazaMeniuri() {
  const n = Math.max(1, parseInt(document.getElementById('nrPersoane').value) || 1);
  const veg = parseInt(document.getElementById('nrVegetarian').value) || 0;
  const copil = parseInt(document.getElementById('nrCopil').value) || 0;
  document.getElementById('nrStandard').value = Math.max(0, n - veg - copil);
}

document.getElementById('nrVegetarian').addEventListener('input', sincronizeazaMeniuri);
document.getElementById('nrCopil').addEventListener('input', sincronizeazaMeniuri);

// Ascunde/Arată câmpurile dacă bifează "Din pacate, nu pot ajunge".
// Câmpurile ascunse sunt dezactivate, ca să nu mai blocheze trimiterea formularului.
function togglePrezenta(val) {
  const sectiune = document.getElementById('sectiunePrezenti');
  const nuVine = (val === 'Nu');
  sectiune.style.display = nuVine ? 'none' : 'block';
  sectiune.querySelectorAll('input, select, textarea').forEach(el => {
    el.disabled = nuVine;
  });
}

// Trimiterea datelor
document.getElementById('rsvpForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const statusMsg = document.getElementById('statusMessage');

  submitBtn.disabled = true;
  submitBtn.innerText = "Se trimite...";
  statusMsg.style.display = 'none';

  const formData = new FormData(this);

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.result === 'success') {
      statusMsg.style.display = 'block';
      statusMsg.style.color = 'green';
      statusMsg.innerText = "❤️ Îți mulțumim! " + (data.message || "Răspunsul tău a fost salvat.");
      document.getElementById('rsvpForm').reset();
      Object.keys(numeInsotitori).forEach(k => delete numeInsotitori[k]);
      togglePrezenta('Da');
      generateGuestFields(1);
    } else {
      // Afișăm mesajul exact trimis de server (ex: numărul de meniuri nu se potrivește)
      statusMsg.style.display = 'block';
      statusMsg.style.color = 'red';
      statusMsg.innerText = data.message || "A apărut o eroare. Te rugăm să încerci din nou!";
    }
  })
  .catch(error => {
    statusMsg.style.display = 'block';
    statusMsg.style.color = 'red';
    statusMsg.innerText = "A apărut o eroare. Te rugăm să încerci din nou!";
    console.error('Eroare:', error);
  })
  .finally(() => {
    submitBtn.disabled = false;
    submitBtn.innerText = "Trimite Confirmarea";
  });
});
