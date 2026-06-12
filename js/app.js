document.addEventListener('DOMContentLoaded', () => {
    // ================= ACCESS CONTROL =================
    // 🛑 ADMIN: CHANGE THIS CODE TO SET YOUR PASSWORD
    const ADMIN_ACCESS_CODE = "VIRTUE2024"; 

    const accessOverlay = document.getElementById('access-overlay');
    const accessInput = document.getElementById('access-code-input');
    const accessSubmitBtn = document.getElementById('access-submit-btn');
    const accessError = document.getElementById('access-error');

    // Check if user is already authenticated via localStorage
    function checkAccess() {
        const isAuthenticated = localStorage.getItem('virtueCollegeAuth') === 'true';
        if (isAuthenticated) {
            accessOverlay.classList.add('hidden');
            initApp();
        } else {
            accessOverlay.classList.remove('hidden');
            accessInput.focus();
        }
    }

    function handleAccessSubmit() {
        const enteredCode = accessInput.value.trim();
        if (enteredCode === ADMIN_ACCESS_CODE) {
            // Save to localStorage so they don't have to enter it again on this device
            localStorage.setItem('virtueCollegeAuth', 'true');
            accessOverlay.classList.add('hidden');
            accessError.classList.remove('show');
            initApp();
        } else {
            accessError.classList.add('show');
            accessInput.value = '';
            accessInput.focus();
        }
    }

    accessSubmitBtn.addEventListener('click', handleAccessSubmit);
    accessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAccessSubmit();
    });

    // ================= APP LOGIC =================
    const classSelect = document.getElementById('class-select');
    const subjectSelect = document.getElementById('subject-select');
    const termSelect = document.getElementById('term-select');
    const weekSelect = document.getElementById('week-select');
    const contentArea = document.getElementById('content-area');
    
    // Get navigation buttons
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');

    function updateWeekOptions() {
        weekSelect.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Week ${i}`;
            weekSelect.appendChild(option);
        }
    }

    // Smart Navigation: Disables buttons at boundaries
    function updateNavButtons() {
        const currentWeek = parseInt(weekSelect.value);
        prevBtn.disabled = currentWeek <= 1;
        nextBtn.disabled = currentWeek >= 12;
    }

    // Function to handle Previous/Next buttons
    function changeWeek(direction) {
        const currentWeek = parseInt(weekSelect.value);
        const newWeek = currentWeek + direction;
        
        if (newWeek >= 1 && newWeek <= 12) {
            weekSelect.value = newWeek;
            loadContent();
        }
    }
    
    // Make changeWeek globally accessible for the HTML onclick attributes
    window.changeWeek = changeWeek;

    function loadContent() {
        const selectedClass = classSelect.value;
        const selectedSubject = subjectSelect.value;
        const selectedTerm = termSelect.value;
        const selectedWeek = weekSelect.value;

        const params = new URLSearchParams();
        params.set('class', selectedClass);
        params.set('subject', selectedSubject);
        params.set('term', selectedTerm);
        params.set('week', selectedWeek);
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState({ path: newUrl }, '', newUrl);

        const jsonPath = `data/${selectedClass}/${selectedSubject}/term${selectedTerm}/week${selectedWeek}.json`;

        contentArea.innerHTML = '<p class="loading">Loading content...</p>';
        updateNavButtons(); // Update Previous/Next button states

        fetch(jsonPath)
            .then(response => {
                if (!response.ok) throw new Error('Content not found');
                return response.json();
            })
            .then(data => {
                renderContent(data);
            })
            .catch(error => {
                contentArea.innerHTML = `<div class="error">
                    <h3>Content Not Available</h3>
                    <p>Could not load the content for Week ${selectedWeek}.</p>
                    <p>Path tried: ${jsonPath}</p>
                    <p><em>Error: ${error.message}</em></p>
                </div>`;
                console.error('Fetch error:', error);
            });
    }

    function renderContent(data) {
        let html = `<div class="content-card">
            <h2>${data.course} | Term ${data.term} | Week ${data.week}</h2>
            <h3>${data.topic}</h3>`;

        data.subUnits.forEach(unit => {
            html += `<div class="sub-unit">
                <h4>${unit.title}</h4>
                <div class="notes">`;
            
            unit.notes.forEach(line => {
                if (line.startsWith('•')) {
                    html += `<li>${line.substring(1).trim()}</li>`;
                } else {
                    html += `<p>${line}</p>`;
                }
            });

            html += `</div>`;

            if (unit.videoId) {
                html += `<div class="video-container">
                    <iframe src="https://www.youtube.com/embed/${unit.videoId}" 
                            frameborder="0" allowfullscreen></iframe>
                </div>`;
            } else {
                html += `<div class="video-placeholder">
                    <div class="placeholder-icon">🎬</div>
                    <p>Video Coming Soon</p>
                    <p class="placeholder-note">Educational video for this topic will be available soon.</p>
                </div>`;
            }

            html += `<div class="quiz-section">
                <button class="quiz-toggle-btn" onclick="toggleQuiz('${unit.id}')">
                    <span class="btn-icon">📝</span>
                    Start Quiz
                </button>
                
                <div id="quiz-${unit.id}" class="quiz-container" style="display: none;">
                    <h5>Week ${data.week} Quiz</h5>`;
            
            unit.quiz.forEach((q, index) => {
                html += `<div class="question" id="q-${unit.id}-${index}">
                    <p><strong>${index + 1}. ${q.q}</strong></p>
                    <div class="options">`;
                
                q.opts.forEach((opt, i) => {
                    html += `<button onclick="checkAnswer('${unit.id}', ${index}, ${i}, ${q.ans}, '${q.explanation.replace(/'/g, "\\'")}')">${opt}</button>`;
                });

                html += `</div>
                    <p class="feedback" id="fb-${unit.id}-${index}" style="display:none;"></p>
                </div>`;
            });

            html += `</div></div></div>`;
        });

        html += `</div>`;
        contentArea.innerHTML = html;
    }

    // Event Listeners
    classSelect.addEventListener('change', loadContent);
    subjectSelect.addEventListener('change', loadContent);
    termSelect.addEventListener('change', loadContent);
    weekSelect.addEventListener('change', loadContent);

    function initApp() {
        updateWeekOptions();
        
        const params = new URLSearchParams(window.location.search);
        if (params.has('class')) classSelect.value = params.get('class');
        if (params.has('subject')) subjectSelect.value = params.get('subject');
        if (params.has('term')) termSelect.value = params.get('term');
        if (params.has('week')) weekSelect.value = params.get('week');

        loadContent();
    }

    // Initialize Access Check
    checkAccess();
});

// Global function to toggle quiz visibility
function toggleQuiz(unitId) {
    const quizContainer = document.getElementById(`quiz-${unitId}`);
    const toggleBtn = document.querySelector(`button[onclick="toggleQuiz('${unitId}')"]`);
    
    if (quizContainer.style.display === 'none') {
        quizContainer.style.display = 'block';
        toggleBtn.innerHTML = '<span class="btn-icon">📝</span> Hide Quiz';
        toggleBtn.classList.add('active');
    } else {
        quizContainer.style.display = 'none';
        toggleBtn.innerHTML = '<span class="btn-icon">📝</span> Start Quiz';
        toggleBtn.classList.remove('active');
    }
}

// Global function for quiz buttons
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