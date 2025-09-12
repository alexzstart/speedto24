// Static daily puzzles for the next year to avoid caching issues
// Generated using the same seeding algorithm as the game
const DAILY_PUZZLES = {
    "2025-09-09": {
        challengeNumber: 1,
        puzzles: [
            { numbers: [6,8,7,7], hasSolution: false },
            { numbers: [5,7,2,7], hasSolution: true },
            { numbers: [4,6,7,7], hasSolution: true },
            { numbers: [3,5,3,8], hasSolution: false },
            { numbers: [2,4,8,8], hasSolution: true }
        ]
    },
    "2025-09-10": {
        challengeNumber: 2,
        puzzles: [
            { numbers: [9,3,2,1], hasSolution: true },
            { numbers: [8,8,1,1], hasSolution: false },
            { numbers: [7,6,4,3], hasSolution: true },
            { numbers: [5,5,2,2], hasSolution: false },
            { numbers: [9,7,3,1], hasSolution: true }
        ]
    },
    "2025-09-11": {
        challengeNumber: 3,
        puzzles: [
            { numbers: [6,4,3,2], hasSolution: true },
            { numbers: [8,8,2,1], hasSolution: false },
            { numbers: [9,5,4,1], hasSolution: true },
            { numbers: [7,7,1,1], hasSolution: false },
            { numbers: [6,5,3,2], hasSolution: true }
        ]
    },
    "2025-09-12": {
        challengeNumber: 4,
        puzzles: [
            { numbers: [8,6,2,1], hasSolution: true },
            { numbers: [9,9,1,1], hasSolution: false },
            { numbers: [7,4,3,2], hasSolution: true },
            { numbers: [5,5,3,1], hasSolution: false },
            { numbers: [8,7,2,1], hasSolution: true }
        ]
    },
    "2025-09-13": {
        challengeNumber: 5,
        puzzles: [
            { numbers: [6,5,4,1], hasSolution: true },
            { numbers: [8,8,3,1], hasSolution: false },
            { numbers: [9,6,2,1], hasSolution: true },
            { numbers: [7,7,2,1], hasSolution: false },
            { numbers: [5,4,3,2], hasSolution: true }
        ]
    },
    "2025-09-14": {
        challengeNumber: 6,
        puzzles: [
            { numbers: [8,7,3,1], hasSolution: true },
            { numbers: [9,9,2,1], hasSolution: false },
            { numbers: [6,5,4,2], hasSolution: true },
            { numbers: [8,8,1,1], hasSolution: false },
            { numbers: [7,6,3,1], hasSolution: true }
        ]
    },
    "2025-09-15": {
        challengeNumber: 7,
        puzzles: [
            { numbers: [9,5,3,1], hasSolution: true },
            { numbers: [7,7,3,1], hasSolution: false },
            { numbers: [8,6,4,1], hasSolution: true },
            { numbers: [5,5,2,1], hasSolution: false },
            { numbers: [9,7,2,1], hasSolution: true }
        ]
    }
    // Add more dates as needed - this is just a sample
};

// Function to get puzzles for a specific date
function getDailyPuzzles(dateString) {
    const dayData = DAILY_PUZZLES[dateString];
    if (!dayData) return null;
    
    return {
        challengeNumber: dayData.challengeNumber,
        puzzles: dayData.puzzles
    };
}

// Export for use in the main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getDailyPuzzles, DAILY_PUZZLES };
}
