document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  let currentClass = params.get('class') || 'jss1';
  let currentSubject = params.get('subject') || 'mathematics';
  let currentTerm = parseInt(params.get('term') || '1');
  let currentWeek = parseInt(params.get('week') || '1');

  const classSelect = document.getElementById('class-select');
  const subjectSelect = document.getElementById('subject-select');
  const weekSelect = document.getElementById('week-select');
  const loadBtn = document.getElementById('load-btn');
  const weekDisplay = document.getElementById('current-week-display');
  const mainEl = document.getElementById('main-content');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  window.currentWeekData = null;
  let catalog = {};

  fetch('data/catalog.json')
    .then(res => res.json())
    .then(data => {
      catalog = data;
      populateSelectors();
      populateWeeks();
      loadWeek();
    })
    .catch(() => mainEl.innerHTML = `<div class="loader" style="color:var(--error)">❌ Failed to load catalog. Run on a local server.</div>`);

  function populateSelectors() {
    classSelect.innerHTML = '';
    Object.keys(catalog).forEach(cls => {
      const opt = document.createElement('option');
      opt.value = cls; opt.textContent = cls.toUpperCase().replace('SSS', 'SS ');
      if(cls === currentClass) opt.selected = true;
      classSelect.appendChild(opt);
    });
    updateSubjectSelector();
  }

  function updateSubjectSelector() {
    subjectSelect.innerHTML = '';
    const subjects = catalog[currentClass] || [];
    subjects.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub; opt.textContent = sub.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if(sub === currentSubject) opt.selected = true;
      subjectSelect.appendChild(opt);
    });
  }

  function populateWeeks() {
    weekSelect.innerHTML = '';
    for(let w = 1; w <= 12; w++) {
      const opt = document.createElement('option');
      opt.value = w;
      opt.textContent = `Week ${w}`;
      if(w === currentWeek) opt.selected = true;
      weekSelect.appendChild(opt);
    }
  }

  function updateURL() {
    history.replaceState(null, '', `?class=${currentClass}&subject=${currentSubject}&term=${currentTerm}&week=${currentWeek}`);
  }

  function loadWeek() {
    weekDisplay.textContent = `📅 ${currentClass.toUpperCase().replace('SSS','SS ')} | ${currentSubject.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} | Term ${currentTerm} | Week ${currentWeek}`;
    prevBtn.disabled = currentWeek <= 1;
    nextBtn.disabled = currentWeek >= 12;
    mainEl.innerHTML = '<div class="loader">Loading content...</div>';

    fetch(`data/${currentClass}/${currentSubject}/term${currentTerm}/week${currentWeek}.json`)
      .then(res => { if(!res.ok) throw new Error('Content not found'); return res.json(); })
      .then(data => {
        window.currentWeekData = data;
        renderCourse(data);
      })
      .catch(err => mainEl.innerHTML = `<div class="loader" style="color:var(--error)">❌ Week ${currentWeek} content missing.</div>`);
    updateURL();
  }

  function renderCourse(data) {
    mainEl.innerHTML = '';

    // Display Weekly Topic
    const topicHeader = document.createElement('div');
    topicHeader.className = 'weekly-topic-header';
    topicHeader.innerHTML = `<span class="topic-label">📚 Weekly Topic</span><h2>${data.topic || 'Untitled Topic'}</h2>`;
    mainEl.appendChild(topicHeader);

    data.subUnits.forEach((su) => {
      const el = document.createElement('div');
      el.className = `sub-unit`;
      el.id = `unit-${su.id}`;

      el.innerHTML = `
        <h2>${su.title}</h2>
        <ul class="notes">${su.notes.map(n => `<li>${n}</li>`).join('')}</ul>
        ${su.videoId ? `<div class="video-wrapper"><iframe src="https://www.youtube-nocookie.com/embed/${su.videoId}" allowfullscreen loading="lazy"></iframe></div>` : '<p style="color:var(--text-light); margin:12px 0; text-align:center;">📹 Video coming soon</p>'}
        <div class="quiz-area" id="quiz-area-${su.id}">
          <div class="quiz-placeholder" id="placeholder-${su.id}">
            <p>📝 Test your understanding (70% recommended to pass).</p>
            <button class="btn primary" id="btn-start-${su.id}">Take Quiz</button>
          </div>
          <div id="quiz-form-${su.id}" style="display:none;"></div>
          <div class="feedback" id="fb-${su.id}"></div>
        </div>
      `;
      mainEl.appendChild(el);

      const startBtn = document.getElementById(`btn-start-${su.id}`);
      if(startBtn) startBtn.addEventListener('click', () => showQuiz(su.id));
    });
  }

  function showQuiz(suId) {
    const data = window.currentWeekData;
    if(!data) return;
    const su = data.subUnits.find(s => s.id === suId);
    if(!su) return;

    document.getElementById(`placeholder-${suId}`).style.display = 'none';
    const formEl = document.getElementById(`quiz-form-${suId}`);
    formEl.style.display = 'block';

    let html = `<form id="form-${suId}">`;
    su.quiz.forEach((q, i) => {
      html += `<div class="question"><p>Q${i+1}. ${q.q}</p>
        <div class="options">${q.opts.map((opt, j) => `<label><input type="radio" name="q${i}" value="${j}" required> <span>${opt}</span></label>`).join('')}</div>
        <div class="explanation" id="exp-${suId}-${i}"></div></div>`;
    });
    html += `<button type="submit" class="btn primary">Submit Answers</button></form>`;
    formEl.innerHTML = html;

    document.getElementById(`form-${suId}`).onsubmit = handleQuizSubmit(suId, su);
  }

  function handleQuizSubmit(suId, su) {
    return (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      let correct = 0;

      su.quiz.forEach((q, i) => {
        const sel = fd.get(`q${i}`);
        const ok = parseInt(sel) === q.ans;
        if(ok) correct++;
        const expEl = document.getElementById(`exp-${suId}-${i}`);
        expEl.textContent = ok ? '✅ Correct!' : `💡 ${q.explanation}`;
        expEl.style.display = 'block';
        document.querySelectorAll(`input[name="q${i}"]`).forEach(r => {
          const isCorrectOpt = parseInt(r.value) === q.ans;
          r.parentElement.style.background = isCorrectOpt ? '#dcfce7' : (r.checked ? '#fee2e2' : '#f1f5f9');
          r.disabled = true;
        });
      });

      const pct = Math.round((correct / su.quiz.length) * 100);
      const fbEl = document.getElementById(`fb-${suId}`);
      fbEl.className = `feedback ${pct >= 70 ? 'pass' : 'fail'}`;
      fbEl.textContent = pct >= 70 ? `✅ Great job! Score: ${pct}%` : `❌ Score: ${pct}%. Review notes & try again.`;
      fbEl.style.display = 'block';

      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.textContent = `Result: ${pct}%`;
      submitBtn.disabled = true;
    };
  }

  // Event Listeners
  classSelect.addEventListener('change', e => { currentClass = e.target.value; updateSubjectSelector(); populateWeeks(); currentWeek = 1; loadWeek(); });
  subjectSelect.addEventListener('change', e => { currentSubject = e.target.value; populateWeeks(); currentWeek = 1; loadWeek(); });
  weekSelect.addEventListener('change', e => { currentWeek = parseInt(e.target.value); loadWeek(); });
  loadBtn.addEventListener('click', () => loadWeek());
  prevBtn.addEventListener('click', () => { if(currentWeek > 1) { currentWeek--; weekSelect.value = currentWeek; loadWeek(); } });
  nextBtn.addEventListener('click', () => { if(currentWeek < 12) { currentWeek++; weekSelect.value = currentWeek; loadWeek(); } });
});