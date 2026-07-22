<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmare Prezență - Vlad & Iulia</title>

  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
    .menu-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .menu-row input { width: 80px; }
    .sub-container { margin-left: 20px; border-left: 2px solid #ccc; padding-left: 15px; margin-top: 10px; }
  </style>
</head>
<body>

  <form id="rsvpForm">
    <div class="form-group">
      <label for="nume">Nume & Prenume (Invitat principal):</label>
      <input type="text" id="nume" name="nume" required placeholder="ex: Popa Andrei">
    </div>

    <div class="form-group">
      <label for="prezenta">Vei fi alături de noi?</label>
      <select id="prezenta" name="prezenta" required onchange="togglePrezenta(this.value)">
        <option value="Da">Cu mare drag vin / venim</option>
        <option value="Nu">Din păcate nu pot / putem ajunge</option>
      </select>
    </div>

    <div id="sectiunePrezenti">
      <div class="form-group">
        <label for="nrPersoane">Număr total persoane (inclusiv tu):</label>
        <input type="number" id="nrPersoane" name="nrPersoane" min="1" value="1" required oninput="generateGuestFields(this.value)" onchange="generateGuestFields(this.value)">
        
        <div id="containerInsotitori" class="sub-container" style="display: none;">
          </div>
      </div>

      <div class="form-group">
        <label>Selecție Meniu per persoană:</label>
        
        <div class="menu-row">
          <span>Meniu Standard:</span>
          <input type="number" id="nrStandard" name="nrStandard" min="0" value="1">
        </div>

        <div class="menu-row">
          <span>Meniu Vegetarian:</span>
          <input type="number" id="nrVegetarian" name="nrVegetarian" min="0" value="0">
        </div>

        <div class="menu-row">
          <span>Meniu Copil:</span>
          <input type="number" id="nrCopil" name="nrCopil" min="0" value="0">
        </div>
      </div>

      <div class="form-group">
        <label for="alergii">Alergii sau restricții alimentare (opțional):</label>
        <textarea id="alergii" name="alergii" rows="2" placeholder="ex: 1 persoană are alergie la nuci, 1 persoană are intoleranță la lactoză"></textarea>
      </div>

      <div class="form-group">
        <label for="cazare">Ai nevoie de cazare la Conacul Archia?</label>
        <select id="cazare" name="cazare">
          <option value="Nu">Nu am nevoie</option>
          <option value="Da">Da, aș dori cazare</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="mesaj">Dacă dorești să transmiți un mesaj către Vlad și Iulia:</label>
      <textarea id="mesaj" name="mesaj" rows="3" placeholder="Scrie aici un gând sau o urare..."></textarea>
    </div>

    <button type="submit" id="submitBtn">Trimite Confirmarea</button>
  </form>

  <div id="statusMessage" style="display:none; margin-top: 15px;"></div>

  <script src="script.js"></script>
</body>
</html>
