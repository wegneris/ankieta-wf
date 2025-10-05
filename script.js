/* BRAMKA STARTOWA – imię wymagane przed startem + scroll do formularza */
(function initGate(){
  const form = document.getElementById('ankieta');
  const startBtn = document.getElementById('startBtn');
  const nameInput = document.getElementById('userName');
  const hiddenName = document.getElementById('hiddenName');
  const nameError = document.getElementById('nameError');

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

    form.classList.remove('locked');
    ctrls.forEach(el => el.disabled = false);

    const ts = document.getElementById('ts_input');
    if (ts) ts.value = new Date().toISOString();

    const top = form.getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  });
})();

/* REVEAL on scroll + Pasek postępu + Mikroanimacje wyboru */
(function (){
  const sections = Array.from(document.querySelectorAll('#ankieta .split'));
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const form = document.getElementById('ankieta');

  // Pojawianie się sekcji
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('show');
        io.unobserve(e.target);
      }
    });
  }, {threshold: .2});
  sections.forEach(s => io.observe(s));

  // Mikroanimacje – po wyborze odpowiedzi
  form.addEventListener('change', (e)=>{
    const input = e.target;
    if (input.matches('input[type="radio"], input[type="checkbox"]')){
      const label = input.closest('label.choice');
      if (label){
        label.classList.remove('pop'); // restart animacji
        void label.offsetWidth;
        label.classList.add('pop');
      }
    }
    updateProgress();
  });

  // Liczenie postępu: sekcja zaliczona jeśli ma jakikolwiek zaznaczony input/niepuste textarea
  function isSectionAnswered(section){
    const radios = section.querySelectorAll('input[type="radio"]');
    const checkboxes = section.querySelectorAll('input[type="checkbox"]');
    const textareas = section.querySelectorAll('textarea, input[type="text"]');

    const anyRadioNameChecked = (() => {
      const byName = {};
      radios.forEach(r => {
        byName[r.name] ||= [];
        byName[r.name].push(r);
      });
      return Object.values(byName).some(group => group.some(r => r.checked));
    })();

    const anyCheckboxChecked = Array.from(checkboxes).some(c => c.checked);
    const anyTextFilled = Array.from(textareas).some(t => (t.value || '').trim().length > 0);

    return anyRadioNameChecked || anyCheckboxChecked || anyTextFilled;
  }

  function updateProgress(){
    const total = sections.length;
    const answered = sections.filter(isSectionAnswered).length;
    const pct = Math.round((answered / total) * 100);
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${pct}%`;
  }

  // pierwsze przeliczenie
  updateProgress();
})();

/* WYSYŁKA DO FORMSPREE + STATUS + EKRAN DZIĘKUJEMY z konfetti */
(function () {
  const form = document.getElementById('ankieta');
  const statusEl = document.getElementById('status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const tsInput = document.getElementById('ts_input');
  const thanks = document.getElementById('thanks');

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
        // Ekran podziękowania z konfetti
        showThanks();
        form.reset();
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

  function showThanks(){
    // Konfetti
    const confettiWrap = thanks.querySelector('.confetti');
    confettiWrap.innerHTML = '';
    const COLORS = ['#111', '#222', '#444', '#666', '#999', '#000'];
    const COUNT = 120;
    for (let i=0;i<COUNT;i++){
      const piece = document.createElement('i');
      piece.style.left = Math.random()*100 + 'vw';
      piece.style.background = COLORS[Math.floor(Math.random()*COLORS.length)];
      piece.style.animationDelay = (Math.random()*0.7) + 's';
      piece.style.transform = `translateY(${-20 - Math.random()*40}px) rotate(${Math.random()*360}deg)`;
      confettiWrap.appendChild(piece);
    }
    thanks.classList.remove('hidden');
    // przycisk w kartce
    const btn = thanks.querySelector('.btn');
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      thanks.classList.add('hidden');
      window.scrollTo({top:0, behavior:'smooth'});
    }, { once:true });
  }
})();

