// ============================================================================
// 🔐 THE VAULT: ANONYMOUS ACCESS CODES
// ============================================================================
// HOW TO USE:
// 1. Generate a random code (use the tool provided below).
// 2. Assign the access rules below.
// 3. Write the code and the student's name in your private offline notebook.
// 4. Give ONLY the code to the student.
// ============================================================================

const ADMIN_CODE = VIRTUE2024//"TVC-ADMIN-2024"; // Your personal master code

const ACCESS_CODES = {
    // ─── EXAMPLES (Replace these with your generated codes) ───
    
    // JSS1 Math - Term 1 Only
    "X7F9-Q2M4-P8L1": { jss1: { mathematics: { terms: [1] } } },
    
    // SS1 - All Subjects
    "B3N8-K9V2-X4P7": { ss1: "ALL_SUBJECTS" },
    
    // JSS3 - Full Mathematics
    "M5T1-R8Y6-W2Q9": { jss3: { mathematics: "ALL_TERMS", english: "ALL_TERMS" } },
    
    
    // SS2 - Chemistry Term 3 Only
    "T8V3-N7P2-L9K4": { ss2: { chemistry: { terms: [3] }, } },

    // ─── ADD YOUR GENERATED CODES BELOW THIS LINE ───
};

// ============================================================================
// 🛠️ CORE APPLICATION LOGIC
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // ─── DOM ELEMENTS ───
    const accessOverlay = document.getElementById('access-overlay');
    const accessInput = document.getElementById('access-code-input');
    const accessSubmitBtn = document.getElementById('access-submit-btn');
    const accessError = document.getElementById('access-error');
    const logoutBtn = document.getElementById('logout-btn');

    const classSelect = document.getElementById('class-select');
    const subjectSelect = document.getElementById('subject-select');
    const termSelect = document.getElementById('term-select');
    const weekSelect = document.getElementById('week-select');
    const contentArea = document.getElementById('content-area');
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');

    // ─── REFERENCE DATA ───
    const CLASS_NAMES = {
        'jss1': 'JSS1', 'jss2': 'JSS2', 'jss3': 'JSS3',
        'ss1': 'SS1', 'ss2': 'SS2', 'ss3': 'SS3'
    };

    const SUBJECT_NAMES = {
        'chemistry': 'Chemistry', 'biology': 'Biology', 'physics': 'Physics',
        'mathematics': 'Mathematics', 'english': 'English', 'government': 'Government',
        'economics': 'Economics', 'yoruba': 'Yoruba', 'geography': 'Geography',
        'islamic': 'Islamic Studies', 'financial': 'Financial Accounting',
        'commerce': 'Commerce', 'literature': 'Literature', 'french': 'French'
    };

    const TERM_NAMES = { 1: 'First Term', 2: 'Second Term', 3: 'Third Term' };

    // ─── SESSION MANAGEMENT ───
    function getSession() {
        const data = sessionStorage.getItem('virtueSession');
        return data ? JSON.parse(data) : null;
    }

    function setSession(code, access, isAdmin = false) {
        sessionStorage.setItem('virtueSession', JSON.stringify({ code, access, isAdmin }));
    }

    function clearSession() {
        sessionStorage.removeItem('virtueSession');
    }

    // ─── ACCESS VALIDATION (ANONYMOUS) ───
    function validateCode(inputCode) {
        const code = inputCode.trim().toUpperCase();

        if (code === ADMIN_CODE) {
            return { valid: true, isAdmin: true, access: "ALL" };
        }

        if (ACCESS_CODES[code]) {
            return {
                valid: true,
                isAdmin: false,
                access: ACCESS_CODES[code]
            };
        }

        return { valid: false };
    }

    // ─── PERMISSION CHECKING ───
    function getAllowedClasses(access) {
        if (access === "ALL") return Object.keys(CLASS_NAMES);
        return Object.keys(access);
    }

    function getAllowedSubjects(access, selectedClass) {
        if (access === "ALL") return Object.keys(SUBJECT_NAMES);
        const classAccess = access[selectedClass];
        if (!classAccess) return [];
        if (classAccess === "ALL_SUBJECTS") return Object.keys(SUBJECT_NAMES);
        return Object.keys(classAccess);
    }

    function getAllowedTerms(access, selectedClass, selectedSubject) {
        if (access === "ALL") return [1, 2, 3];
        const classAccess = access[selectedClass];
        if (!classAccess || classAccess === "ALL_SUBJECTS") return [1, 2, 3];
        const subjectAccess = classAccess[selectedSubject];
        if (!subjectAccess) return [];
        if (subjectAccess === "ALL_TERMS") return [1, 2, 3];
        if (subjectAccess.terms) return subjectAccess.terms;
        return [];
    }

    // ─── UI POPULATION ───
    function populateClasses() {
        const session = getSession();
        if (!session) return;
        classSelect.innerHTML = '';
        getAllowedClasses(session.access).forEach(cls => {
            const opt = document.createElement('option');
            opt.value = cls; opt.textContent = CLASS_NAMES[cls];
            classSelect.appendChild(opt);
        });
        populateSubjects();
    }

    function populateSubjects() {
        const session = getSession();
        if (!session) return;
        subjectSelect.innerHTML = '';
        getAllowedSubjects(session.access, classSelect.value).forEach(subj => {
            const opt = document.createElement('option');
            opt.value = subj; opt.textContent = SUBJECT_NAMES[subj];
            subjectSelect.appendChild(opt);
        });
        populateTerms();
    }

    function populateTerms() {
        const session = getSession();
        if (!session) return;
        termSelect.innerHTML = '';
        getAllowedTerms(session.access, classSelect.value, subjectSelect.value).forEach(term => {
            const opt = document.createElement('option');
            opt.value = term; opt.textContent = TERM_NAMES[term];
            termSelect.appendChild(opt);
        });
        populateWeeks();
    }

    function populateWeeks() {
        weekSelect.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const opt = document.createElement('option');
            opt.value = i; opt.textContent = `Week ${i}`;
            weekSelect.appendChild(opt);
        }
    }

    // ─── NAVIGATION & CONTENT ───
    function updateNavButtons() {
        const currentWeek = parseInt(weekSelect.value);
        prevBtn.disabled = currentWeek <= 1;
        nextBtn.disabled = currentWeek >= 12;
    }

    function changeWeek(direction) {
        const currentWeek = parseInt(weekSelect.value);
        const newWeek = currentWeek + direction;
        if (newWeek >= 1 && newWeek <= 12) {
            weekSelect.value = newWeek;
            loadContent();
        }
    }
    window.changeWeek = changeWeek;

    function loadContent() {
        const jsonPath = `data/${classSelect.value}/${subjectSelect.value}/term${termSelect.value}/week${weekSelect.value}.json`;
        contentArea.innerHTML = '<p class="loading">Loading content...</p>';
        updateNavButtons();

        fetch(jsonPath)
            .then(response => response.ok ? response.json() : Promise.reject('Content not found'))
            .then(data => renderContent(data))
            .catch(error => {
                contentArea.innerHTML = `<div class="error"><h3>Content Not Available</h3><p>${error}</p></div>`;
            });
    }

    function renderContent(data) {
        let html = `<div class="content-card"><h2>${data.course} | Term ${data.term} | Week ${data.week}</h2><h3>${data.topic}</h3>`;
        data.subUnits.forEach(unit => {
            html += `<div class="sub-unit"><h4>${unit.title}</h4><div class="notes">`;
            unit.notes.forEach(line => {
                if (line.trim() === '') html += `<br>`;
                else if (line.trim().startsWith('•') || line.trim().startsWith('-')) html += `<li>${line.trim().substring(1).trim()}</li>`;
                else html += `<p>${line}</p>`;
            });
            html += `</div>`;
            html += unit.videoId 
                ? `<div class="video-container"><iframe src="https://www.youtube.com/embed/${unit.videoId}" frameborder="0" allowfullscreen></iframe></div>`
                : `<div class="video-placeholder"><div class="placeholder-icon">🎬</div><p>Video Coming Soon</p></div>`;
            
            html += `<div class="quiz-section"><button class="quiz-toggle-btn" onclick="toggleQuiz('${unit.id}')"><span class="btn-icon">📝</span> Start Quiz</button><div id="quiz-${unit.id}" class="quiz-container" style="display: none;"><h5>Week ${data.week} Quiz</h5>`;
            unit.quiz.forEach((q, index) => {
                html += `<div class="question" id="q-${unit.id}-${index}"><p><strong>${index + 1}. ${q.q}</strong></p><div class="options">`;
                q.opts.forEach((opt, i) => {
                    html += `<button onclick="checkAnswer('${unit.id}', ${index}, ${i}, ${q.ans}, '${q.explanation.replace(/'/g, "\\'")}')">${opt}</button>`;
                });
                html += `</div><p class="feedback" id="fb-${unit.id}-${index}" style="display:none;"></p></div>`;
            });
            html += `</div></div></div>`;
        });
        contentArea.innerHTML = html + `</div>`;
    }

    // ─── AUTH FLOW ───
    function handleLogin() {
        const result = validateCode(accessInput.value);
        if (result.valid) {
            setSession(accessInput.value.trim().toUpperCase(), result.access, result.isAdmin);
            hideOverlay();
            showAccessGranted(result.isAdmin);
            populateClasses();
            loadContent();
        } else {
            accessError.classList.add('show');
            accessInput.value = '';
            accessInput.focus();
        }
    }

    function showAccessGranted(isAdmin) {
        const badge = document.querySelector('.academic-badge .session');
        if (badge) {
            badge.textContent = isAdmin ? '🔓 Administrator Mode' : '✅ Access Granted';
        }
    }

    function showOverlay() {
        accessOverlay.classList.remove('hidden');
        accessInput.value = '';
        accessError.classList.remove('show');
        setTimeout(() => accessInput.focus(), 100);
    }

    function hideOverlay() {
        accessOverlay.classList.add('hidden');
    }

    function handleLogout() {
        clearSession();
        location.reload();
    }

    // ─── EVENT LISTENERS ───
    accessSubmitBtn.addEventListener('click', handleLogin);
    accessInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
    logoutBtn.addEventListener('click', handleLogout);
    classSelect.addEventListener('change', populateSubjects);
    subjectSelect.addEventListener('change', populateTerms);
    termSelect.addEventListener('change', () => { populateWeeks(); loadContent(); });
    weekSelect.addEventListener('change', loadContent);

    // ─── INITIALIZATION ───
    function init() {
        const session = getSession();
        if (session) {
            hideOverlay();
            showAccessGranted(session.isAdmin);
            populateClasses();
            loadContent();
        } else {
            showOverlay();
        }
    }
    init();
});

// ─── GLOBAL QUIZ FUNCTIONS ───
function toggleQuiz(unitId) {
    const quizContainer = document.getElementById(`quiz-${unitId}`);
    const toggleBtn = document.querySelector(`button[onclick="toggleQuiz('${unitId}')"]`);
    if (quizContainer.style.display === 'none') {
        quizContainer.style.display = 'block';
        toggleBtn.innerHTML = '<span class="btn-icon">📝</span> Hide Quiz';
    } else {
        quizContainer.style.display = 'none';
        toggleBtn.innerHTML = '<span class="btn-icon">📝</span> Start Quiz';
    }
}

function checkAnswer(unitId, questionIndex, selectedOptionIndex, correctAnswerIndex, explanation) {
    const feedbackEl = document.getElementById(`fb-${unitId}-${questionIndex}`);
    const parent = document.getElementById(`q-${unitId}-${questionIndex}`);
    const buttons = parent.querySelectorAll('.options button');
    buttons.forEach(btn => btn.disabled = true);

    if (selectedOptionIndex === correctAnswerIndex) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = 'var(--success)';
        feedbackEl.innerHTML = `<strong>✅ Correct!</strong><br><em>${explanation}</em>`;
        buttons[selectedOptionIndex].classList.add('correct');
    } else {
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = 'var(--error)';
        feedbackEl.innerHTML = `<strong>❌ Incorrect.</strong><br><em>${explanation}</em>`;
        buttons[selectedOptionIndex].classList.add('incorrect');
        buttons[correctAnswerIndex].classList.add('correct');
    }
}