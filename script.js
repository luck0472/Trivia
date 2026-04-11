const API_BASE_URL = 'https://opentdb.com/api.php';
const q = selector => document.querySelector(selector);
const qAll = selector => document.querySelectorAll(selector);
const DIFFICULTY_TIMERS = { easy: 5, medium: 8, hard: 12 };
const quizState = { questions: [], results: [], answeredCount: 0, timerId: null, timeLeft: 0 };

const getQuizSettings = () => {
    const amount = Number(q('#question-count').value);
    const difficulty = q('#question-difficulty').value;
    return { amount, difficulty };
};

const formatTime = seconds => {
    const min = Math.floor(seconds / 60);
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
};

const getTimerSeconds = () => quizState.questions.reduce((sum, question) => {
    return sum + (DIFFICULTY_TIMERS[question.difficulty] || DIFFICULTY_TIMERS.medium);
}, 0);

const updateTimerDisplay = () => {
    const timer = q('#quiz-timer');
    if (!timer) return;
    timer.textContent = quizState.timeLeft > 0
        ? `Time left: ${formatTime(quizState.timeLeft)}`
        : 'Time over';
};

const stopTimer = () => {
    if (quizState.timerId) {
        clearInterval(quizState.timerId);
        quizState.timerId = null;
    }
};

const startTimer = seconds => {
    stopTimer();
    quizState.timeLeft = seconds;
    updateTimerDisplay();
    quizState.timerId = setInterval(() => {
        quizState.timeLeft -= 1;
        updateTimerDisplay();
        if (quizState.timeLeft <= 0) {
            stopTimer();
            endQuizByTimeout();
        }
    }, 1000);
};

const revealCorrectAnswers = () => {
    quizState.questions.forEach((question, index) => {
        qAll(`[data-question-index='${index}']`).forEach(btn => {
            if (btn.dataset.answer === question.correct_answer) {
                btn.classList.replace('btn-outline-primary', 'btn-success');
            }
            btn.disabled = true;
        });
    });
};

const endQuizByTimeout = () => {
    revealCorrectAnswers();
    const status = q('#quiz-status');
    if (status) {
        status.textContent = "Time's up. Review Answers.";
        status.hidden = false;
    }
    q('#quiz-buttons').hidden = false;
};


const buildApiUrl = () => {
    const { amount, difficulty } = getQuizSettings();
    const params = new URLSearchParams({ amount, type: 'multiple' });
    if (difficulty) params.set('difficulty', difficulty);
    return `${API_BASE_URL}?${params}`;
};

const decodeHtml = html => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
};

const shuffle = array => array.slice().sort(() => Math.random() - 0.5);

function updateDarkModeButton() {
    const btn = q('.dark-mode-btn');
    if (btn) btn.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    updateDarkModeButton();
}

function createQuiz(questions) {
    const container = q('#quiz-container');
    container.innerHTML = '';

    const timerText = document.createElement('p');
    timerText.id = 'quiz-timer';
    timerText.className = 'text-center text-primary fw-bold';
    timerText.textContent = 'Time left: 0:00';

    const statusText = document.createElement('p');
    statusText.id = 'quiz-status';
    statusText.className = 'text-center text-muted';
    statusText.hidden = true;

    container.append(timerText, statusText);

    questions.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card mb-3';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h3');
        title.className = 'card-title fs-5';
        title.textContent = `Question ${index + 1}`;

        const questionText = document.createElement('p');
        questionText.textContent = decodeHtml(item.question);

        const answersRow = document.createElement('div');
        answersRow.className = 'row g-2';

        shuffle([item.correct_answer, ...item.incorrect_answers]).forEach(answer => {
            const col = document.createElement('div');
            col.className = 'col-md-6';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-outline-primary w-100';
            button.textContent = decodeHtml(answer);
            button.dataset.questionIndex = index;
            button.dataset.answer = answer;
            button.addEventListener('click', handleAnswerClick);

            col.appendChild(button);
            answersRow.appendChild(col);
        });

        const resultText = document.createElement('p');
        resultText.id = `answer-status-${index}`;
        resultText.className = 'text-center fw-bold mt-3';

        cardBody.append(title, questionText, answersRow, resultText);
        card.appendChild(cardBody);
        container.appendChild(card);
    });

    const buttonDiv = document.createElement('div');
    buttonDiv.id = 'quiz-buttons';
    buttonDiv.className = 'text-center mt-4';
    buttonDiv.hidden = true;

    const reviewBtn = document.createElement('button');
    reviewBtn.className = 'btn btn-secondary me-2';
    reviewBtn.type = 'button';
    reviewBtn.textContent = 'Review Answers';
    reviewBtn.addEventListener('click', showReview);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-danger';
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset Quiz';
    resetBtn.addEventListener('click', resetQuiz);

    buttonDiv.append(reviewBtn, resetBtn);
    container.appendChild(buttonDiv);
}

function handleAnswerClick(event) {
    const button = event.currentTarget;
    const questionIndex = Number(button.dataset.questionIndex);
    const question = quizState.questions[questionIndex];
    const selectedAnswer = button.dataset.answer;
    const status = q(`#answer-status-${questionIndex}`);

    qAll(`[data-question-index='${questionIndex}']`).forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.answer === question.correct_answer) {
            btn.classList.replace('btn-outline-primary', 'btn-success');
        }
    });

    if (selectedAnswer === question.correct_answer) {
        button.classList.replace('btn-outline-primary', 'btn-success');
        status.textContent = 'Correct!';
        quizState.results[questionIndex] = true;
    } else {
        button.classList.replace('btn-outline-primary', 'btn-danger');
        status.textContent = `Incorrect — correct answer: ${decodeHtml(question.correct_answer)}`;
        quizState.results[questionIndex] = false;
    }

    if (++quizState.answeredCount === quizState.questions.length) {
        const status = q('#quiz-status');
        if (status) {
            status.textContent = 'Review Answers.';
            status.hidden = false;
        }
        q('#quiz-buttons').hidden = false;
        stopTimer();
    }
}

async function loadQuizQuestions(apiUrl) {
    const container = q('#quiz-container');
    let status = q('#quiz-status');

    if (!status) {
        container.innerHTML = '<p id="quiz-status" class="text-center text-muted">Loading questions...</p>';
        status = q('#quiz-status');
    }

    status.textContent = 'Loading questions…';
    status.className = 'text-center text-muted';

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.response_code && data.response_code !== 0) {
            const apiErrors = {
                1: 'No questions matched your filters. Try a different difficulty or fewer questions.',
                2: 'Invalid API request. Please verify quiz settings and try again.',
                3: 'Session token not found. Please try again.',
                4: 'No more questions available for this session. Please try again later.',
                5: 'Too many requests. Please wait a moment and retry.'
            };
            throw new Error(apiErrors[data.response_code] || 'Unexpected API response.');
        }

        if (!Array.isArray(data.results) || data.results.length === 0) {
            throw new Error('No questions returned from the API.');
        }

        quizState.questions = data.results;
        quizState.answeredCount = 0;
        quizState.results = new Array(quizState.questions.length).fill(false);
        createQuiz(quizState.questions);
        q('#settings-card').style.display = 'none';
        startTimer(getTimerSeconds());
    } catch (error) {
        container.innerHTML = `<p class="text-center text-danger">Unable to load quiz questions. ${error.message}</p>`;
        console.error(error);
    }
}

function loadQuizQuestionsFromSettings() {
    const { amount } = getQuizSettings();
    const container = q('#quiz-container');

    if (!Number.isInteger(amount) || amount < 1 || amount > 50) {
        container.innerHTML = '<p id="quiz-status" class="text-center text-danger">Please select between 1 to 50 questions.</p>';
        return;
    }

    loadQuizQuestions(buildApiUrl());
}

function showReview() {
    const correctCount = quizState.results.filter(Boolean).length;
    alert(`You got ${correctCount} out of ${quizState.questions.length} correct!`);
}

function resetQuiz() {
    stopTimer();
    q('#settings-card').style.display = 'block';
    q('#question-count').value = 10;
    q('#question-difficulty').value = '';
    q('#quiz-container').innerHTML = '<p id="quiz-status" class="text-center text-muted">Click "Load Questions" to start!</p>';
    q('#quiz-buttons')?.setAttribute('hidden', '');
    quizState.questions = [];
    quizState.results = [];
    quizState.answeredCount = 0;
    quizState.timeLeft = 0;
}

document.addEventListener('DOMContentLoaded', updateDarkModeButton);
