document.addEventListener('DOMContentLoaded', () => {
    const classSelect = document.getElementById('class-select');
    const subjectSelect = document.getElementById('subject-select');
    const termSelect = document.getElementById('term-select'); // New element
    const weekSelect = document.getElementById('week-select');
    const contentArea = document.getElementById('content-area');

    // Function to update the week dropdown based on selection
    function updateWeekOptions() {
        weekSelect.innerHTML = '';
        // Default to 12 weeks per term
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Week ${i}`;
            weekSelect.appendChild(option);
        }
    }

    // Function to handle URL changes and load content
    function loadContent() {
        const selectedClass = classSelect.value;
        const selectedSubject = subjectSelect.value;
        const selectedTerm = termSelect.value;
        const selectedWeek = weekSelect.value;

        // Update URL without reloading
        const params = new URLSearchParams();
        params.set('class', selectedClass);
        params.set('subject', selectedSubject);
        params.set('term', selectedTerm);
        params.set('week', selectedWeek);
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState({ path: newUrl }, '', newUrl);

        // Construct the JSON path: data/class/subject/term/week.json
        // Example: data/sss1/chemistry/term1/week1.json
        const jsonPath = `data/${selectedClass}/${selectedSubject}/term${selectedTerm}/week${selectedWeek}.json`;

        contentArea.innerHTML = '<p class="loading">Loading content...</p>';

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

    // Function to render the JSON data to HTML
    function renderContent(data) {
        let html = `<h2>${data.course} | Term ${data.term} | Week ${data.week}</h2>`;
        html += `<h3>${data.topic}</h3>`;

        data.subUnits.forEach(unit => {
            html += `<div class="sub-unit">
                <h4>${unit.title}</h4>
                <div class="notes">`;
            
            // Render notes
            unit.notes.forEach(line => {
                if (line.startsWith('•')) {
                    html += `<li>${line.substring(1).trim()}</li>`;
                } else {
                    html += `<p>${line}</p>`;
                }
            });

            html += `</div>`;

            // Video Embed
            if (unit.videoId) {
                html += `<div class="video-container">
                    <iframe src="https://www.youtube.com/embed/${unit.videoId}" 
                            frameborder="0" allowfullscreen></iframe>
                </div>`;
            }

            // Quiz Section
            html += `<div class="quiz-section">
                <h5>Quiz</h5>`;
            
            unit.quiz.forEach((q, index) => {
                html += `<div class="question" id="q-${unit.id}-${index}">
                    <p><strong>${index + 1}. ${q.q}</strong></p>
                    <div class="options">`;
                
                q.opts.forEach((opt, i) => {
                    html += `<button onclick="checkAnswer('${unit.id}', ${index}, ${i}, ${q.ans})">${opt}</button>`;
                });

                html += `</div>
                    <p class="feedback" id="fb-${unit.id}-${index}" style="display:none;"></p>
                </div>`;
            });

            html += `</div></div>`;
        });

        contentArea.innerHTML = html;
    }

    // Event Listeners
    classSelect.addEventListener('change', loadContent);
    subjectSelect.addEventListener('change', loadContent);
    termSelect.addEventListener('change', loadContent); // Listen for term changes
    weekSelect.addEventListener('change', loadContent);

    // Initial load from URL params
    function init() {
        updateWeekOptions();
        
        const params = new URLSearchParams(window.location.search);
        if (params.has('class')) classSelect.value = params.get('class');
        if (params.has('subject')) subjectSelect.value = params.get('subject');
        if (params.has('term')) termSelect.value = params.get('term');
        if (params.has('week')) weekSelect.value = params.get('week');

        loadContent();
    }

    init();
});

// Global function for quiz buttons
function checkAnswer(unitId, questionIndex, selectedOptionIndex, correctAnswerIndex) {
    const feedbackEl = document.getElementById(`fb-${unitId}-${questionIndex}`);
    const parent = feedbackEl.parentElement;
    
    // Get all buttons in this question
    const buttons = parent.querySelectorAll('.options button');
    
    // Disable buttons after selection
    buttons.forEach(btn => btn.disabled = true);

    if (selectedOptionIndex === correctAnswerIndex) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = 'green';
        feedbackEl.textContent = "✅ Correct!";
        buttons[selectedOptionIndex].style.background = '#d4edda';
    } else {
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = 'red';
        feedbackEl.textContent = "❌ Incorrect. Check the explanation.";
        buttons[selectedOptionIndex].style.background = '#f8d7da';
        buttons[correctAnswerIndex].style.background = '#d4edda';
    }
}

// Add these functions to your existing app.js

function changeWeek(direction) {
    const currentWeek = parseInt(weekSelect.value);
    const newWeek = currentWeek + direction;
    
    if (newWeek >= 1 && newWeek <= 12) {
        weekSelect.value = newWeek;
        loadContent();
        updateNavButtons();
    }
}

function updateNavButtons() {
    const currentWeek = parseInt(weekSelect.value);
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');
    
    prevBtn.disabled = currentWeek <= 1;
    nextBtn.disabled = currentWeek >= 12;
}

// Update the loadContent function to call updateNavButtons
// Add this line at the end of your loadContent function:
// updateNavButtons();