const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzN8yG3kctTG_NRCwvqmK_6B3po1L5iuvfjC-RumUPKOLVAbA7uf7VpnrXks4xZQUBhSA/exec";

// Generare dinamică câmpuri însoțitori (Persoana 2, Persoana 3...)
function generateGuestFields(total) {
  const container = document.getElementById('containerInsotitori');
  container.innerHTML = '';
  
  const nrInsotitori = parseInt(total) - 1;
  
  if (nrInsotitori > 0) {
    container.style.display = 'block';
    
    for (let i = 2; i <= parseInt(total); i++) {
      const div = document.createElement('div');
      div.style.marginBottom = '10px';
      
      div.innerHTML = `
        <label style="font-size: 0.9em; color: #444;">Persoana ${i}:</label>
        <input type="text" name="persoana_${i}" placeholder="Nume Prenume" required>
      `;
      container.appendChild(div);
    }
  } else {
    container.style.display = 'none';
  }
}

// Ascunde/Arată câmpurile dacă bifează "Nu vin"
function togglePrezenta(val) {
  const sectiune = document.getElementById('sectiunePrezenti');
  sectiune.style.display = (val === 'Nu') ? 'none' : 'block';
}

// Trimiterea datelor
document.getElementById('rsvpForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const statusMsg = document.getElementById('statusMessage');
  
  submitBtn.disabled = true;
  submitBtn.innerText = "Se trimite...";
  
  const formData = new FormData(this);
  
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if(data.result === 'success') {
      statusMsg.style.display = 'block';
      statusMsg.style.color = 'green';
      statusMsg.innerText = "❤️ Îți mulțumim! Răspunsul tău a fost salvat.";
      document.getElementById('rsvpForm').reset();
      generateGuestFields(1);
    } else {
      throw new Error(data.error);
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
