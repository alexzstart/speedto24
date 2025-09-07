class Game24 {
    constructor() {
        this.currentMode = null; // 'practice' or 'daily'
        this.numbers = [];
        this.selectedNumbers = [];
        this.selectedOperation = null;
        this.history = [];
        this.startTime = Date.now();
        this.timerInterval = null;
        this.gameActive = true;
        this.penaltyTime = 0;
        this.initialNumbers = []; // Store initial numbers for proper undo
        this.combinationCount = {}; // Track how many times each tile has been combined
        this.keyBuffer = ''; // Buffer for multi-digit number input
        this.keyBufferTimeout = null; // Timeout for key buffer
        this.noSolutionPenaltyApplied = false; // Track if penalty has been applied for current puzzle
        
        // Performance optimizations
        this.domCache = {}; // Cache frequently used DOM elements
        this.animationFrameId = null; // For smooth animations
        this.debounceTimers = {}; // For debouncing rapid events
        
        // Daily challenge specific properties
        this.dailyPuzzleCount = 0;
        this.dailyTotalTime = 0;
        this.dailyStartTime = Date.now();
        this.dailyPuzzleTimes = []; // Store individual puzzle times
        this.dailyPuzzleStartTime = Date.now(); // Start time for current puzzle
        this.dailyPuzzlePenalty = 0; // Track penalty for current puzzle
        this.dailyPuzzles = []; // Store current day's puzzles
        this.currentPuzzleIndex = 0; // Track current puzzle in daily challenge
        this.finalDailyTime = 0; // Store final total time for daily challenge
        this.dailyChallengeCompleted = false; // Track if daily challenge is completed
        
        // Setup global keyboard event listener
        this.setupKeyboardListener();
        
        this.setupInitialPage();
        this.cacheDOMElements();
    }
    
    // Performance optimization: Cache frequently used DOM elements
    cacheDOMElements() {
        this.domCache = {
            timer: document.getElementById('timer'),
            dailyTimer: document.getElementById('daily-timer'),
            puzzleCounter: document.getElementById('puzzle-counter'),
            numbersContainer: document.getElementById('numbers-container'),
            dailyNumbersContainer: document.getElementById('daily-numbers-container'),
            historyContainer: document.getElementById('history-container'),
            dailyHistoryContainer: document.getElementById('daily-history-container'),
            result: document.getElementById('result'),
            dailyResult: document.getElementById('daily-result'),
            finalTime: document.getElementById('final-time'),
            dailyFinalTime: document.getElementById('daily-final-time'),
            dailyBreakdown: document.getElementById('daily-breakdown'),
            dailyCountdown: document.getElementById('daily-countdown')
        };
    }
    
    // Performance optimization: Debounce function for rapid events
    debounce(func, wait, key) {
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }
        this.debounceTimers[key] = setTimeout(func, wait);
    }

    setupKeyboardListener() {
        // Remove any existing keyboard listener to prevent duplicates
        document.removeEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Add global keyboard event listener
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    setupInitialPage() {
        // Setup initial page event listeners
        const dailyBtn = document.getElementById('daily-challenge-btn');
        const practiceBtn = document.getElementById('practice-btn');
        
        if (dailyBtn) {
            // Remove any existing listeners by cloning the element
            const newDailyBtn = dailyBtn.cloneNode(true);
            dailyBtn.parentNode.replaceChild(newDailyBtn, dailyBtn);
            
            newDailyBtn.addEventListener('click', () => {
                this.startDailyChallenge();
            });
        }
        
        if (practiceBtn) {
            // Remove any existing listeners by cloning the element
            const newPracticeBtn = practiceBtn.cloneNode(true);
            practiceBtn.parentNode.replaceChild(newPracticeBtn, practiceBtn);
            
            newPracticeBtn.addEventListener('click', () => {
                this.startPracticeMode();
            });
        }
    }

    // Daily puzzle generation system
    generateDailyPuzzles() {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Check if we already have puzzles for today
        if (this.dailyPuzzles.length > 0 && this.dailyPuzzles[0].date === dateString) {
            return; // Already generated for today
        }
        
        // Generate 5 puzzles for today using a seed based on the date
        this.dailyPuzzles = [];
        const seed = this.getDateSeed(dateString);
        
        for (let i = 0; i < 5; i++) {
            const puzzle = this.generateSeededPuzzle(seed + i);
            this.dailyPuzzles.push({
                date: dateString,
                puzzleIndex: i,
                numbers: puzzle.numbers,
                hasSolution: puzzle.hasSolution
            });
        }
    }

    getDateSeed(dateString) {
        // Convert date string to a numeric seed
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Create a deterministic seed from the date
        return year * 10000 + month * 100 + day;
    }

    generateSeededPuzzle(seed) {
        // Use the seed to generate consistent random numbers
        const random = this.seededRandom(seed);
        
        const numbers = [];
        for (let i = 0; i < 4; i++) {
            numbers.push(Math.floor(random() * 9) + 1);
        }
        
        const hasSolution = this.hasSolution(numbers);
        
        // If no solution, try to generate a new puzzle with a slightly different seed
        if (!hasSolution) {
            return this.generateSeededPuzzle(seed + 1000);
        }
        
        return { numbers, hasSolution };
    }

    seededRandom(seed) {
        // Simple seeded random number generator
        let state = seed;
        return function() {
            state = (state * 9301 + 49297) % 233280;
            return state / 233280;
        };
    }

    loadDailyPuzzle() {
        // Load the puzzle for the current index
        const puzzle = this.dailyPuzzles[this.currentPuzzleIndex];
        
        if (puzzle) {
            // Set the numbers from the pre-generated puzzle
            this.numbers = [...puzzle.numbers];
            this.initialNumbers = [...puzzle.numbers];
            this.combinationCount = {};
            
            // Render the numbers
            this.renderNumbers();
            this.updateHistory();
            this.clearResult();
        } else {
            // Fallback to random generation if something goes wrong
        this.initializeGame();
        }
    }

    startDailyChallenge() {
        // Generate daily puzzles for today (if not already generated)
        this.generateDailyPuzzles();
        
        // Check if daily challenge is already completed for today
        if (this.dailyChallengeCompleted && this.dailyPuzzleTimes.length === 5) {
            // Restore completed state
            this.currentMode = 'daily';
            this.setupDailyGame();
            
            // Load the final completed puzzle state
            this.loadCompletedDailyState();
            
            // Show the completion popup
            this.showDailyComplete(this.finalDailyTime);
            
            document.getElementById('initial-page').style.display = 'none';
            document.getElementById('daily-game').style.display = 'block';
            return;
        }
        
        // Clear any existing game state for new challenge
        this.clearGameState();
        
        // Reset all penalty variables
        this.penaltyTime = 0;
        this.dailyPuzzlePenalty = 0;
        
        this.currentMode = 'daily';
        this.dailyPuzzleCount = 0;
        this.currentPuzzleIndex = 0;
        this.dailyTotalTime = 0;
        this.dailyStartTime = Date.now();
        this.dailyPuzzleTimes = [];
        this.dailyPuzzleStartTime = Date.now();
        this.finalDailyTime = 0;
        this.dailyChallengeCompleted = false;
        
        // Reset timer display immediately
        document.getElementById('daily-timer').textContent = '00:00';
        
        document.getElementById('initial-page').style.display = 'none';
        document.getElementById('daily-game').style.display = 'block';
        
        this.setupDailyGame();
        this.nextDailyPuzzle();
    }

    startPracticeMode() {
        // Clear any existing game state
        this.clearGameState();
        
        // Reset all penalty variables
        this.penaltyTime = 0;
        this.dailyPuzzlePenalty = 0;
        
        this.currentMode = 'practice';
        
        // Reset timer display immediately
        document.getElementById('timer').textContent = '00:00';
        
        document.getElementById('initial-page').style.display = 'none';
        document.getElementById('practice-game').style.display = 'block';
        
        this.setupPracticeGame();
        this.initializeGame();
        this.startTimer();
    }

    setupDailyGame() {
        // Cache DOM elements for daily game
        this.operationBtns = document.querySelectorAll('#daily-game .operation-btn');
        this.undoBtn = document.getElementById('daily-undo-btn');
        this.shuffleBtn = document.getElementById('daily-shuffle-btn');
        this.resetBtn = document.getElementById('daily-reset-btn');
        this.noSolutionBtn = document.getElementById('daily-no-solution-btn');
        this.infoBtn = document.getElementById('daily-info-btn');
        this.closeKeyboardBtn = document.getElementById('close-keyboard-btn');
        this.keyboardModal = document.getElementById('keyboard-modal');
        this.copyDailyTimeBtn = document.getElementById('copy-daily-time-btn');
        this.backToMenuBtn = document.getElementById('back-to-menu-btn');

        // Setup event listeners
        this.operationBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectOperation(btn.dataset.operation));
        });

        this.undoBtn.addEventListener('click', () => this.undo());
        this.shuffleBtn.addEventListener('click', () => this.shuffle());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.noSolutionBtn.addEventListener('click', () => this.checkNoSolution());

        this.infoBtn.addEventListener('click', () => this.showKeyboardModal());
        this.closeKeyboardBtn.addEventListener('click', () => this.closeKeyboardModal());
        this.copyDailyTimeBtn.addEventListener('click', () => this.copyDailyTime());
        this.backToMenuBtn.addEventListener('click', () => this.backToMenu());
        
        // Add close button for daily complete modal
        this.closeDailyModalBtn = document.getElementById('close-daily-modal-btn');
        this.closeDailyModalBtn.addEventListener('click', () => this.closeDailyModal());
        
        // Add home button
        this.homeBtn = document.getElementById('daily-home-btn');
        this.homeBtn.addEventListener('click', () => this.goHome());
    }

    setupPracticeGame() {
        // Cache DOM elements for practice game
        this.operationBtns = document.querySelectorAll('#practice-game .operation-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.noSolutionBtn = document.getElementById('no-solution-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.copyTimeBtn = document.getElementById('copy-time-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.infoBtn = document.getElementById('info-btn');
        this.closeKeyboardBtn = document.getElementById('close-keyboard-btn');
        this.keyboardModal = document.getElementById('keyboard-modal');

        // Setup event listeners
        this.operationBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectOperation(btn.dataset.operation));
        });

        this.undoBtn.addEventListener('click', () => this.undo());
        this.shuffleBtn.addEventListener('click', () => this.shuffle());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.noSolutionBtn.addEventListener('click', () => this.checkNoSolution());
        this.newGameBtn.addEventListener('click', () => this.newGame());

        this.infoBtn.addEventListener('click', () => this.showKeyboardModal());
        this.closeKeyboardBtn.addEventListener('click', () => this.closeKeyboardModal());
        this.copyTimeBtn.addEventListener('click', () => this.copyTime());
        this.playAgainBtn.addEventListener('click', () => this.closeModal());
        
        // Add home button
        this.homeBtn = document.getElementById('home-btn');
        this.homeBtn.addEventListener('click', () => this.goHome());
    }

    initializeGame() {
        this.generateNumbers();
        this.renderNumbers();
        this.updateHistory();
        this.clearResult();
    }

    generateNumbers() {
        // Generate 4 random numbers between 1 and 9
        this.numbers = [];
        for (let i = 0; i < 4; i++) {
            this.numbers.push(Math.floor(Math.random() * 9) + 1);
        }
        
        // Store initial numbers for undo functionality
        this.initialNumbers = [...this.numbers];
        this.combinationCount = {};
        
        // Ensure the puzzle has a solution (for better user experience)
        if (!this.hasSolution(this.numbers)) {
            this.generateNumbers(); // Recursively generate until we have a solvable puzzle
        }
    }

    hasSolution(numbers) {
        // Check if the given numbers can reach 24
        const permutations = this.getPermutations(numbers);
        const operators = ['+', '-', '*', '/'];
        
        for (let perm of permutations) {
            for (let op1 of operators) {
                for (let op2 of operators) {
                    for (let op3 of operators) {
                        // Try different evaluation orders
                        const expressions = [
                            `(${perm[0]} ${op1} ${perm[1]}) ${op2} (${perm[2]} ${op3} ${perm[3]})`,
                            `((${perm[0]} ${op1} ${perm[1]}) ${op2} ${perm[2]}) ${op3} ${perm[3]}`,
                            `${perm[0]} ${op1} (${perm[1]} ${op2} (${perm[2]} ${op3} ${perm[3]}))`
                        ];
                        
                        for (let expr of expressions) {
                            try {
                                const result = this.evaluateExpression(expr);
                                if (Math.abs(result - 24) < 0.001) {
                                    return true;
                                }
                            } catch (e) {
                                // Invalid expression (division by zero, etc.)
                                continue;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        
        const perms = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const remainingPerms = this.getPermutations(remaining);
            
            for (let perm of remainingPerms) {
                perms.push([current, ...perm]);
            }
        }
        return perms;
    }

    evaluateExpression(expr) {
        // Custom evaluation to handle division properly
        const tokens = expr.match(/(\d+|\+|\-|\*|\/|\(|\))/g);
        const postfix = this.infixToPostfix(tokens);
        return this.evaluatePostfix(postfix);
    }

    infixToPostfix(tokens) {
        const output = [];
        const operators = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
        
        for (let token of tokens) {
            if (/\d+/.test(token)) {
                output.push(parseFloat(token));
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                if (operators.length && operators[operators.length - 1] === '(') {
                    operators.pop();
                }
            } else {
                while (operators.length && 
                       operators[operators.length - 1] !== '(' && 
                       precedence[operators[operators.length - 1]] >= precedence[token]) {
                    output.push(operators.pop());
                }
                operators.push(token);
            }
        }
        
        while (operators.length) {
            output.push(operators.pop());
        }
        
        return output;
    }

    evaluatePostfix(postfix) {
        const stack = [];
        
        for (let token of postfix) {
            if (typeof token === 'number') {
                stack.push(token);
            } else {
                const b = stack.pop();
                const a = stack.pop();
                
                switch (token) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/': 
                        if (b === 0) throw new Error('Division by zero');
                        if (a % b !== 0) throw new Error('Non-integer division');
                        stack.push(a / b); 
                        break;
                }
            }
        }
        
        return stack[0];
    }

    renderNumbers() {
        const containerId = this.currentMode === 'daily' ? 'daily-numbers-container' : 'numbers-container';
        const container = document.getElementById(containerId);
        const fragment = document.createDocumentFragment();
        
        this.numbers.forEach((number, index) => {
            const tile = document.createElement('div');
            tile.className = 'number-tile';
            tile.dataset.index = index;
            
            // Create a wrapper for the number text
            const numberText = document.createElement('span');
            numberText.className = 'number-text';
            numberText.textContent = number;
            
            tile.appendChild(numberText);
            
            if (this.selectedNumbers.includes(index)) {
                tile.classList.add('selected');
            }
            
            tile.addEventListener('click', () => this.selectNumber(index));
            fragment.appendChild(tile);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    selectNumber(index) {
        if (!this.gameActive) return;
        
        if (this.selectedNumbers.includes(index)) {
            // Deselect if already selected
            this.selectedNumbers = this.selectedNumbers.filter(i => i !== index);
            this.selectedOperation = null;
        } else if (this.selectedNumbers.length === 0) {
            // Select first number
            this.selectedNumbers.push(index);
        } else if (this.selectedNumbers.length === 1 && this.selectedOperation) {
            // Select second number and perform operation
            this.selectedNumbers.push(index);
            this.performOperation(this.selectedOperation);
            return;
        } else if (this.selectedNumbers.length === 1 && !this.selectedOperation) {
            // Select second number but wait for operation
            this.selectedNumbers.push(index);
        }
        
        this.renderNumbers();
        this.updateOperationButtons();
    }

    selectOperation(operation) {
        if (!this.gameActive) return;
        
        if (this.selectedNumbers.length === 1) {
            // Store operation and wait for second number
            this.selectedOperation = operation;
            this.updateOperationButtons();
        } else if (this.selectedNumbers.length === 2) {
            // Perform operation immediately
            this.performOperation(operation);
        }
    }

    updateOperationButtons() {
        // Check if operationBtns exists before using it
        if (!this.operationBtns) {
            return;
        }
        
        const canOperate = this.selectedNumbers.length === 2;
        const waitingForSecondNumber = this.selectedNumbers.length === 1;
        
        this.operationBtns.forEach(btn => {
            const operation = btn.dataset.operation;
            btn.disabled = !canOperate && !waitingForSecondNumber;
            
            if (waitingForSecondNumber && this.selectedOperation === operation) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    setupEventListeners() {
        // Cache DOM elements for better performance
        this.operationBtns = document.querySelectorAll('.operation-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.noSolutionBtn = document.getElementById('no-solution-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.copyTimeBtn = document.getElementById('copy-time-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');

        // Operation buttons
        this.operationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectOperation(btn.dataset.operation);
            });
        });

        // Control buttons
        this.undoBtn.addEventListener('click', () => this.undo());
        this.shuffleBtn.addEventListener('click', () => this.shuffle());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.noSolutionBtn.addEventListener('click', () => this.checkNoSolution());
        this.newGameBtn.addEventListener('click', () => this.newGame());

        // Modal buttons
        this.copyTimeBtn.addEventListener('click', () => this.copyTime());
        this.playAgainBtn.addEventListener('click', () => this.closeModal());
        this.infoBtn = document.getElementById('info-btn');
        this.closeKeyboardBtn = document.getElementById('close-keyboard-btn');
        this.keyboardModal = document.getElementById('keyboard-modal');

        // Info modal
        this.infoBtn.addEventListener('click', () => this.showKeyboardModal());
        this.closeKeyboardBtn.addEventListener('click', () => this.closeKeyboardModal());
    }

    handleKeyPress(e) {
        if (!this.gameActive) return;

        const key = e.key.toLowerCase();
        
        // Prevent default behavior for game keys
        if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '*', 'x', '/', 'enter', 'backspace', 'escape', ' '].includes(key)) {
            e.preventDefault();
        }

        // Number keys (0-9) - add to buffer
        if (/^[0-9]$/.test(key)) {
            this.keyBuffer += key;
            
            // Clear previous timeout
            if (this.keyBufferTimeout) {
                clearTimeout(this.keyBufferTimeout);
            }
            
            // Set timeout to process the buffer
            this.keyBufferTimeout = setTimeout(() => {
                this.processNumberBuffer();
            }, 300); // Wait 300ms for more digits
        }
        
        // Operation keys
        else if (key === '+' || key === '-' || key === '*' || key === 'x' || key === '/') {
            // Process any pending number buffer first
            if (this.keyBuffer) {
                this.processNumberBuffer();
            }
            
            let operation;
            switch (key) {
                case '+': operation = 'add'; break;
                case '-': operation = 'subtract'; break;
                case '*':
                case 'x': operation = 'multiply'; break;
                case '/': operation = 'divide'; break;
            }
            this.selectOperation(operation);
        }
        
        // Enter key to perform operation if ready
        else if (key === 'enter') {
            // Process any pending number buffer first
            if (this.keyBuffer) {
                this.processNumberBuffer();
            }
            
            if (this.selectedNumbers.length === 2 && this.selectedOperation) {
                this.performOperation(this.selectedOperation);
            }
        }
        
        // Escape key to clear selection and buffer
        else if (key === 'escape') {
            this.clearSelection();
        }
        
        // Backspace key to undo
        else if (key === 'backspace') {
            this.undo();
        }
        
        // Spacebar to shuffle
        else if (key === ' ') {
            this.shuffle();
        }
        
        // R key to reset
        else if (key === 'r' || key === 'R') {
            this.reset();
        }
    }

    clearSelection() {
            this.selectedNumbers = [];
            this.selectedOperation = null;
            this.keyBuffer = '';
            if (this.keyBufferTimeout) {
                clearTimeout(this.keyBufferTimeout);
                this.keyBufferTimeout = null;
            }
            this.renderNumbers();
        // Only update operation buttons if they exist
        if (this.operationBtns) {
            this.updateOperationButtons();
        }
    }

    processNumberBuffer() {
        if (!this.keyBuffer) {
            return;
        }
        
        const number = parseInt(this.keyBuffer);
        
        this.keyBuffer = '';
        this.keyBufferTimeout = null;
        
        this.selectNumberByValue(number);
    }

    selectNumberByValue(value) {
        // Find the first available number with the given value
        const availableIndices = this.numbers
            .map((num, index) => ({ num, index }))
            .filter(item => item.num === value && !this.selectedNumbers.includes(item.index));
        
        if (availableIndices.length > 0) {
            const index = availableIndices[0].index;
            this.selectNumber(index);
        } else {
            // If no available number found, clear the buffer
            this.keyBuffer = '';
            if (this.keyBufferTimeout) {
                clearTimeout(this.keyBufferTimeout);
                this.keyBufferTimeout = null;
            }
        }
    }

    performOperation(operation) {
        if (this.selectedNumbers.length !== 2) return;
        
        const [index1, index2] = this.selectedNumbers;
        const num1 = this.numbers[index1];
        const num2 = this.numbers[index2];
        
        let result;
        let operationSymbol;
        
        switch (operation) {
            case 'add':
                result = num1 + num2;
                operationSymbol = '+';
                break;
            case 'subtract':
                result = num1 - num2;
                operationSymbol = '-';
                break;
            case 'multiply':
                result = num1 * num2;
                operationSymbol = '×';
                break;
            case 'divide':
                if (num2 === 0 || num1 % num2 !== 0) {
                    this.showResult('Cannot divide by zero or result would be a fraction!', 'error');
                    return;
                }
                result = num1 / num2;
                operationSymbol = '÷';
                break;
        }
        
        // Update combination count for the result tile
        const currentCombinationCount = (this.combinationCount[index1] || 0) + (this.combinationCount[index2] || 0) + 1;
        
        // Add to history with proper tracking
        this.history.push({
            num1: num1,
            num2: num2,
            operation: operationSymbol,
            result: result,
            indices: [index1, index2],
            resultIndex: index1,
            originalNumbers: [...this.numbers], // Store current state for undo
            originalCombinationCount: { ...this.combinationCount }, // Store combination count for undo
            puzzleId: this.currentMode === 'daily' ? this.dailyPuzzleCount : 'practice' // Track which puzzle this belongs to
        });
        
        // Update numbers array
        this.numbers[index1] = result;
        this.numbers.splice(index2, 1);
        
        // Update combination count
        this.combinationCount[index1] = currentCombinationCount;
        delete this.combinationCount[index2];
        
        // Clear selection
        this.selectedNumbers = [];
        this.selectedOperation = null;
        
        // Update display immediately
            this.renderNumbers();
            this.updateHistory();
            this.updateOperationButtons();
            this.checkWinCondition();
    }

    animateCombination(index1, index2, operation) {
        const tiles = document.querySelectorAll('.number-tile');
        
        if (tiles[index1]) {
            // Target tile gets the merge-target animation
            tiles[index1].classList.add('merge-target');
        }
        
        if (tiles[index2]) {
            // Second tile gets the merging animation (disappears into target)
            tiles[index2].classList.add('merging');
        }
        
        // Remove animation classes after animation completes
        setTimeout(() => {
            tiles.forEach(tile => {
                tile.classList.remove('merge-target', 'merging');
            });
        }, 600);
    }

    undo() {
        if (this.history.length === 0) return;
        
        // For daily challenge, prevent undo after completion
        if (this.currentMode === 'daily' && this.dailyChallengeCompleted) {
            return;
        }
        
        // For daily challenge, ensure we can't undo across puzzle boundaries
        if (this.currentMode === 'daily') {
            const lastOperation = this.history[this.history.length - 1];
            
            // Check if this operation belongs to the current puzzle
            if (lastOperation.puzzleId !== this.dailyPuzzleCount) {
                // This operation belongs to a previous puzzle, don't allow undo
                return;
            }
        }
        
        const lastOperation = this.history.pop();
        
        // Restore the numbers to the state before the last operation
        this.numbers = [...lastOperation.originalNumbers];
        this.combinationCount = { ...lastOperation.originalCombinationCount };
        
        this.renderNumbers();
        this.updateHistory();
        this.updateOperationButtons();
        this.clearResult();
    }

    shuffle() {
        if (!this.gameActive) return;
        
        const numberTexts = document.querySelectorAll('.number-text');
        
        // Add fade out animation to just the number texts
        numberTexts.forEach(text => {
            text.classList.add('number-fade-out');
        });
        
        // After fade out, shuffle and fade in
        setTimeout(() => {
            // Shuffle the current numbers
            for (let i = this.numbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.numbers[i], this.numbers[j]] = [this.numbers[j], this.numbers[i]];
            }
            
            // Clear selection
            this.selectedNumbers = [];
            this.selectedOperation = null;
            
            // Render new numbers with fade in animation
            this.renderNumbers();
            
            // Add fade in animation to new number texts
            const newNumberTexts = document.querySelectorAll('.number-text');
            newNumberTexts.forEach(text => {
                text.classList.add('number-fade-in');
            });
            
            // Remove animation classes after animation completes
            setTimeout(() => {
                newNumberTexts.forEach(text => {
                    text.classList.remove('number-fade-in');
                });
            }, 400);
            
            this.updateOperationButtons();
            this.clearResult();
        }, 400);
    }

    reset() {
        if (!this.gameActive) return;
        
        // For daily challenge, prevent reset after completion
        if (this.currentMode === 'daily' && this.dailyChallengeCompleted) {
            return;
        }
        
        // Reset to initial numbers
        this.numbers = [...this.initialNumbers];
        this.combinationCount = {};
        this.history = [];
        
        // Clear selection
        this.selectedNumbers = [];
        this.selectedOperation = null;
        
        this.renderNumbers();
        this.updateHistory();
        this.updateOperationButtons();
        this.clearResult();
    }

    checkNoSolution() {
        let hasSolution;
        
        if (this.currentMode === 'daily') {
            // Use pre-generated puzzle information for daily challenge
            const puzzle = this.dailyPuzzles[this.currentPuzzleIndex];
            hasSolution = puzzle ? puzzle.hasSolution : this.hasSolution(this.initialNumbers);
        } else {
            // For practice mode, check dynamically
            hasSolution = this.hasSolution(this.initialNumbers);
        }
        
        if (hasSolution) {
            // Wrong guess - add penalty (only once per puzzle)
            if (!this.noSolutionPenaltyApplied) {
            this.penaltyTime += 30;
                if (this.currentMode === 'daily') {
                    this.dailyPuzzlePenalty += 30;
                }
                this.noSolutionPenaltyApplied = true; // Mark penalty as applied
            }
            this.showResult('Wrong! There is a solution. +30 seconds penalty!', 'error');
            const gameBoard = this.currentMode === 'daily' ? document.querySelector('#daily-game .game-board') : document.querySelector('#practice-game .game-board');
            gameBoard.classList.add('shake');
            setTimeout(() => {
                gameBoard.classList.remove('shake');
            }, 500);
        } else {
            // Correct guess
            this.gameActive = false;
            this.showResult('Correct! There is no solution to this puzzle!', 'success');
        }
    }

    checkWinCondition() {
        if (this.currentMode === 'daily') {
            this.checkDailyWinCondition();
        } else {
        if (this.numbers.length === 1 && this.numbers[0] === 24) {
            this.gameActive = false;
                this.showPracticeCongratulations();
        } else if (this.numbers.length === 1 && this.numbers[0] !== 24) {
            this.showResult('You got ' + this.numbers[0] + ', but you need 24!', 'error');
            }
        }
    }

    showPracticeCongratulations() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000) + this.penaltyTime;
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.showResult(`🎉 Congratulations! You reached 24 in ${timeString}! 🎉`, 'success');
    }

    showCongratulations() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000) + this.penaltyTime;
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('final-time').textContent = timeString;
        document.getElementById('congrats-modal').style.display = 'block';
    }

    copyTime() {
        const timeText = document.getElementById('final-time').textContent;
        navigator.clipboard.writeText(`I solved the 24 Game in ${timeText}!`).then(() => {
            const copyBtn = document.getElementById('copy-time-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    closeModal() {
        document.getElementById('congrats-modal').style.display = 'none';
        this.newGame();
    }

    showKeyboardModal() {
        this.keyboardModal.style.display = 'block';
    }

    closeKeyboardModal() {
        this.keyboardModal.style.display = 'none';
    }

    nextDailyPuzzle() {
        this.dailyPuzzleCount++;
        this.currentPuzzleIndex = this.dailyPuzzleCount - 1;
        document.getElementById('puzzle-counter').textContent = `${this.dailyPuzzleCount}/5`;
        
        // Start timing for the new puzzle
        this.dailyPuzzleStartTime = Date.now();
        this.dailyPuzzlePenalty = 0;
        
        // Reset timer display immediately
        document.getElementById('daily-timer').textContent = '00:00';
        
        // Clear any accumulated penalties from previous puzzles
        this.penaltyTime = 0;
        this.noSolutionPenaltyApplied = false; // Reset penalty flag for new puzzle
        
        // Clear history from previous puzzle
        this.history = [];
        this.selectedNumbers = [];
        this.selectedOperation = null;
        
        // Load the pre-generated puzzle for this day
        this.loadDailyPuzzle();
        this.startDailyTimer();
    }

    startDailyTimer() {
        const timerElement = document.getElementById('daily-timer');
        this.timerInterval = setInterval(() => {
            if (this.gameActive) {
                // Calculate current puzzle time
                const currentPuzzleTime = Math.floor((Date.now() - this.dailyPuzzleStartTime) / 1000) + this.dailyPuzzlePenalty;
                
                // Total time = sum of completed puzzle times + current puzzle time
                const completedPuzzleTime = this.dailyPuzzleTimes.reduce((sum, time) => sum + time, 0);
                const totalTime = completedPuzzleTime + currentPuzzleTime;
                
                // Debug: Log timer calculation for last puzzle
                if (this.dailyPuzzleCount === 5) {
                    console.log('Timer debug - Completed puzzles:', completedPuzzleTime, 'Current puzzle:', currentPuzzleTime, 'Total:', totalTime);
                }
                
                const minutes = Math.floor(totalTime / 60);
                const seconds = totalTime % 60;
                timerElement.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    checkDailyWinCondition() {
        if (this.numbers.length === 1 && this.numbers[0] === 24) {
            this.gameActive = false;
            
            // Store the time for the current puzzle (including penalty)
            const puzzleTime = Math.floor((Date.now() - this.dailyPuzzleStartTime) / 1000) + this.dailyPuzzlePenalty;
            this.dailyPuzzleTimes.push(puzzleTime);
            
            if (this.dailyPuzzleCount < 5) {
                // Move to next puzzle immediately
                this.gameActive = true;
                this.nextDailyPuzzle();
            } else {
                // Challenge complete - calculate final time immediately and store it
                const finalTotalTime = this.dailyPuzzleTimes.reduce((sum, time) => sum + time, 0);
                this.finalDailyTime = finalTotalTime; // Store the final time
                this.showDailyComplete(finalTotalTime);
            }
        } else if (this.numbers.length === 1 && this.numbers[0] !== 24) {
            this.showResult('You got ' + this.numbers[0] + ', but you need 24!', 'error');
        }
    }

    loadCompletedDailyState() {
        // Load the final puzzle (5th puzzle) in its completed state
        this.currentPuzzleIndex = 4; // 5th puzzle (0-indexed)
        this.dailyPuzzleCount = 5;
        
        // Load the final puzzle numbers
        const finalPuzzle = this.dailyPuzzles[this.currentPuzzleIndex];
        this.numbers = [24]; // Show the completed state (24)
        this.initialNumbers = [...finalPuzzle.numbers];
        
        // Set puzzle counter to show completion
        document.getElementById('puzzle-counter').textContent = '5/5';
        
        // Display the final total time
        const totalTime = this.finalDailyTime;
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('daily-timer').textContent = timeString;
        
        // Render the completed state
        this.renderNumbers();
        
        // Disable game interactions
        this.gameActive = false;
    }

    showDailyComplete(finalTotalTime) {
        // Use the stored final time to ensure consistency
        const totalTime = this.finalDailyTime || finalTotalTime || this.dailyPuzzleTimes.reduce((sum, time) => sum + time, 0);
        
        // Debug: Log individual puzzle times and total
        console.log('Individual puzzle times:', this.dailyPuzzleTimes);
        console.log('Total calculated time:', totalTime);
        
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Create breakdown of individual puzzle times
        let breakdownHTML = '<div class="puzzle-breakdown">';
        breakdownHTML += '<h4>Puzzle Times:</h4>';
        breakdownHTML += '<ul>';
        this.dailyPuzzleTimes.forEach((time, index) => {
            const puzzleMinutes = Math.floor(time / 60);
            const puzzleSeconds = time % 60;
            const puzzleTimeString = `${puzzleMinutes.toString().padStart(2, '0')}:${puzzleSeconds.toString().padStart(2, '0')}`;
            breakdownHTML += `<li>Puzzle ${index + 1}: ${puzzleTimeString}</li>`;
        });
        breakdownHTML += '</ul>';
        breakdownHTML += '</div>';
        
        document.getElementById('daily-final-time').textContent = timeString;
        document.getElementById('daily-breakdown').innerHTML = breakdownHTML;
        document.getElementById('daily-complete-modal').style.display = 'block';
        
        // Mark daily challenge as completed to disable undo/reset
        this.dailyChallengeCompleted = true;
        
        // Start countdown timer
        this.startDailyCountdown();
    }

    copyDailyTime() {
        const timeText = document.getElementById('daily-final-time').textContent;
        
        // Create breakdown text for individual puzzle times
        let breakdownText = '';
        this.dailyPuzzleTimes.forEach((time, index) => {
            const puzzleMinutes = Math.floor(time / 60);
            const puzzleSeconds = time % 60;
            const puzzleTimeString = `${puzzleMinutes.toString().padStart(2, '0')}:${puzzleSeconds.toString().padStart(2, '0')}`;
            breakdownText += `Puzzle ${index + 1}: ${puzzleTimeString}, `;
        });
        // Remove the last comma and space
        breakdownText = breakdownText.slice(0, -2);
        
        const fullText = `I completed the 24 Game Daily Challenge in ${timeText}! (${breakdownText})`;
        
        navigator.clipboard.writeText(fullText).then(() => {
            const copyBtn = document.getElementById('copy-daily-time-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    startDailyCountdown() {
        const updateCountdown = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0); // Set to midnight
            
            const timeLeft = tomorrow - now;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            const countdownString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const countdownElement = document.getElementById('daily-countdown');
            if (countdownElement) {
                countdownElement.textContent = countdownString;
            }
        };
        
        // Update immediately
        updateCountdown();
        
        // Update every second
        this.countdownInterval = setInterval(updateCountdown, 1000);
    }

    closeDailyModal() {
        document.getElementById('daily-complete-modal').style.display = 'none';
        
        // Clear countdown interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    goHome() {
        // Clear any active timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Clear countdown interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        // Reset all penalty-related variables
        this.penaltyTime = 0;
        this.dailyPuzzlePenalty = 0;
        
        // Clear game state
        this.clearGameState();
        
        // Hide all game pages
        document.getElementById('practice-game').style.display = 'none';
        document.getElementById('daily-game').style.display = 'none';
        document.getElementById('daily-complete-modal').style.display = 'none';
        document.getElementById('congrats-modal').style.display = 'none';
        
        // Show initial page and ensure it's properly displayed
        const initialPage = document.getElementById('initial-page');
        initialPage.style.display = 'flex';
        // Remove inline styles to use CSS-defined positioning
        initialPage.style.alignItems = '';
        initialPage.style.justifyContent = '';
        initialPage.style.minHeight = '';
        
        // Re-setup initial page event listeners to ensure they work
        this.setupInitialPage();
    }

    clearGameState() {
        // Clear selections and game state
        this.clearSelection();
        this.numbers = [];
        this.history = [];
        this.combinationCount = {};
        this.gameActive = true;
        this.penaltyTime = 0;
        this.noSolutionPenaltyApplied = false; // Reset penalty flag
        
        // Reset timers
        this.startTime = Date.now();
        if (this.currentMode === 'daily') {
            this.dailyStartTime = Date.now();
            this.dailyPuzzleStartTime = Date.now();
            this.dailyPuzzlePenalty = 0;
            // Don't clear finalDailyTime or dailyChallengeCompleted - preserve completion state
            // Don't clear dailyPuzzles - keep them for consistency
            // Reset puzzle index when starting fresh
            this.currentPuzzleIndex = 0;
        }
        
        // Clear any displayed results
        this.clearResult();
        
        // Reset operation buttons
        if (this.operationBtns) {
            this.operationBtns.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('selected');
            });
        }
    }

    backToMenu() {
        document.getElementById('daily-complete-modal').style.display = 'none';
        document.getElementById('daily-game').style.display = 'none';
        
        // Show initial page with proper centering
        const initialPage = document.getElementById('initial-page');
        initialPage.style.display = 'flex';
        // Remove inline styles to use CSS-defined positioning
        initialPage.style.alignItems = '';
        initialPage.style.justifyContent = '';
        initialPage.style.minHeight = '';
        
        // Re-setup initial page event listeners to ensure they work
        this.setupInitialPage();
    }

    startTimer() {
        const timerElement = document.getElementById('timer');
        this.timerInterval = setInterval(() => {
            if (this.gameActive) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000) + this.penaltyTime;
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                timerElement.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    updateHistory() {
        const containerId = this.currentMode === 'daily' ? 'daily-history-container' : 'history-container';
        const container = document.getElementById(containerId);
        const fragment = document.createDocumentFragment();
        
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = `${item.num1} ${item.operation} ${item.num2} = ${item.result}`;
            fragment.appendChild(historyItem);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    showResult(message, type) {
        const resultId = this.currentMode === 'daily' ? 'daily-result' : 'result';
        const resultDiv = document.getElementById(resultId);
        resultDiv.textContent = message;
        resultDiv.className = `result ${type}`;
    }

    clearResult() {
        const resultId = this.currentMode === 'daily' ? 'daily-result' : 'result';
        const resultDiv = document.getElementById(resultId);
        resultDiv.textContent = '';
        resultDiv.className = 'result';
    }

    newGame() {
        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Reset game state
        this.numbers = [];
        this.selectedNumbers = [];
        this.selectedOperation = null;
        this.history = [];
        this.startTime = Date.now();
        this.gameActive = true;
        this.penaltyTime = 0;
        this.initialNumbers = [];
        this.combinationCount = {};
        this.keyBuffer = '';
        if (this.keyBufferTimeout) {
            clearTimeout(this.keyBufferTimeout);
            this.keyBufferTimeout = null;
        }
        
        // Initialize new game
        this.initializeGame();
        this.startTimer();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game24();
}); 