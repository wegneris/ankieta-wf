/* BRAMKA STARTOWA – imię wymagane przed startem */
(function initGate(){
  const form = document.getElementById('ankieta');
  const startBtn = document.getElementById('startBtn');
  const nameInput = document.getElementById('userName');
  const hiddenName = document.getElementById('hiddenName');
  const nameError = document.getElementById('nameError');

  // blokujemy tylko kontrolki; obrazki i layout pozostają
  const ctrls = form.querySelectorAll('input, textarea, button');
  ctrls.forEach(el => el.disabled = true);

  startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const nameVal = (nameInput.value || '').trim();
    if (!nameVal) {
      nameError.textContent = '⚠️ Proszę wpisać imię przed rozpoczęciem.';
      nameError.style.display = 'block';
      nameInput.focus();
      return;
    }
    nameError.style.display = 'none';
    hiddenName.value = nameVal;

    // odblokuj tylko po wpisaniu imienia
    form.classList.remove('locked');
    ctrls.forEach(el => el.disabled = false);

    const ts = document.getElementById('ts_input');
    if (ts) ts.value = new Date().toISOString();

    const top = form.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
})();

/* WYSYŁKA DO FORMSPREE + STATUSY + LICZNIK */
(function () {
  const form = document.getElementById('ankieta');
  const statusEl = document.getElementById('status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const tsInput = document.getElementById('ts_input');

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status ' + (type || '');
    statusEl.style.display = 'block';
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    if (tsInput) tsInput.value = new Date().toISOString();
    const data = new FormData(form);

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Wysyłanie…';
    showStatus('Trwa wysyłanie…');

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });

      if (res.ok) {
        form.reset();
        showStatus('✅ Dziękujemy! Odpowiedzi zostały wysłane.', 'ok');
      } else {
        let msg = '❌ Błąd wysyłki. Spróbuj ponownie.';
        try {
          const r = await res.json();
          if (r && r.errors) msg = r.errors.map(e => e.message).join(', ');
        } catch {}
        showStatus(msg, 'err');
      }
    } catch {
      showStatus('❌ Błąd połączenia. Sprawdź internet.', 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // licznik znaków dla sugestii
  const ta = form.querySelector('textarea[name="sugestie"]');
  if (ta) {
    const counter = document.createElement('div');
    counter.style.textAlign = 'right';
    counter.style.fontSize = '12px';
    counter.style.color = '#e5e7eb';
    counter.textContent = '0 / 800';
    ta.maxLength = 800;
    ta.parentElement.appendChild(counter);
    ta.addEventListener('input', () => {
      counter.textContent = `${ta.value.length} / ${ta.maxLength}`;
    });
  }
})();
