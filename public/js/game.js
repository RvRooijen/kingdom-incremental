// Game state
let gameState = {
    kingdomId: null,
    kingdom: null,
    updateInterval: null,
    statistics: {
        startTime: null,
        totalGoldGenerated: 0,
        totalInfluenceGenerated: 0,
        eventsCompleted: 0,
        resourceHistory: [],
        factionHistory: {},
        lastUpdate: Date.now()
    },
    charts: {}
};

// API base URL
const API_BASE = '/api';

// Helper function to check if API is accessible
async function checkAPIConnection() {
    try {
        const response = await fetch('/health', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    } catch (error) {
        console.error('API connection check failed:', error);
        return false;
    }
}

// DOM elements - will be populated after DOM loads
let elements = {};

// Initialize statistics
function initializeStatistics() {
    if (!gameState.statistics.startTime) {
        gameState.statistics.startTime = Date.now();
    }
    
    // Initialize faction history for all factions
    const factionTypes = ['Nobility', 'Merchants', 'Military', 'Clergy', 'Commoners'];
    for (const faction of factionTypes) {
        if (!gameState.statistics.factionHistory[faction]) {
            gameState.statistics.factionHistory[faction] = [];
        }
    }
}

// Check API connection
async function checkAPIConnection() {
    try {
        const response = await fetch('/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('API health check:', data);
            return true;
        }
        
        console.error('API health check failed:', response.status);
        return false;
    } catch (error) {
        console.error('API connection error:', error);
        return false;
    }
}

// Initialize DOM elements
function initializeElements() {
    elements = {
        status: document.getElementById('status'),
        startScreen: document.getElementById('start-screen'),
        gameScreen: document.getElementById('game-screen'),
        createKingdomForm: document.getElementById('create-kingdom-form'),
        
        // Resources
        gold: document.getElementById('gold'),
        goldRate: document.getElementById('gold-rate'),
        influence: document.getElementById('influence'),
        influenceRate: document.getElementById('influence-rate'),
        loyalty: document.getElementById('loyalty'),
        population: document.getElementById('population'),
        militaryPower: document.getElementById('military-power'),
        
        // Court
        kingName: document.getElementById('king-name'),
        queenName: document.getElementById('queen-name'),
        advisors: document.getElementById('advisors'),
        
        // Other
        factions: document.getElementById('factions'),
        events: document.getElementById('events'),
        kingdomDisplayName: document.getElementById('kingdom-display-name'),
        prestigeLevel: document.getElementById('prestige-level'),
        calculateTickBtn: document.getElementById('calculate-tick'),
        
        // Modal
        eventModal: document.getElementById('event-modal'),
        eventTitle: document.getElementById('event-title'),
        eventDescription: document.getElementById('event-description'),
        eventChoices: document.getElementById('event-choices')
    };
}

// Update status message
function updateStatus(message, type = 'info') {
    if (!elements.status) {
        console.error('Status element not found!');
        return;
    }
    
    elements.status.textContent = message;
    elements.status.className = 'status';
    
    if (type === 'error') {
        elements.status.classList.add('error');
    } else if (type === 'success') {
        elements.status.classList.add('success');
    }
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (elements.status.textContent === message) {
                elements.status.textContent = 'Connected';
                elements.status.className = 'status';
            }
        }, 5000);
    }
}

// Initialize game
async function init() {
    try {
        console.log('Starting game initialization...');
        console.log('Current URL:', window.location.href);
        console.log('API Base:', API_BASE);
        
        // Initialize DOM elements
        initializeElements();
        console.log('DOM elements initialized');
        console.log('Status element:', elements.status);
        
        // Check API connection
        console.log('Checking API connection...');
        const apiConnected = await checkAPIConnection();
        if (!apiConnected) {
            console.warn('API connection check failed - continuing anyway');
        }
        
        // Initialize statistics
        initializeStatistics();
        console.log('Statistics initialized');
        
        // Setup event listeners
        if (elements.createKingdomForm) {
            elements.createKingdomForm.addEventListener('submit', handleCreateKingdom);
            console.log('Create kingdom form listener added');
        } else {
            console.error('Create kingdom form not found!');
        }
        
        if (elements.calculateTickBtn) {
            elements.calculateTickBtn.addEventListener('click', calculateTick);
            console.log('Calculate tick button listener added');
        }
        
        // Check if we have a saved kingdom ID
        const savedKingdomId = localStorage.getItem('currentKingdomId');
        console.log('Saved kingdom ID:', savedKingdomId);
        
        if (savedKingdomId) {
            gameState.kingdomId = savedKingdomId;
            try {
                await loadKingdom();
                // Status will be updated by loadKingdom
            } catch (error) {
                console.error('Failed to load saved kingdom:', error);
                localStorage.removeItem('currentKingdomId');
                updateStatus('Ready to play');
            }
        } else {
            updateStatus('Ready to play');
        }
        
        console.log('Game initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
        console.error('Error stack:', error.stack);
        updateStatus('Initialization error. Please refresh the page.', 'error');
    }
}

// Create new kingdom
async function handleCreateKingdom(e) {
    e.preventDefault();
    
    const kingdomName = document.getElementById('kingdom-name').value;
    
    try {
        updateStatus('Creating kingdom...');
        
        const response = await fetch(`${API_BASE}/kingdoms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kingdomName: kingdomName, rulerName: 'King' })
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to create kingdom';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If JSON parsing fails, use status text
                errorMessage = `Server error: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (!data.kingdomId) {
            throw new Error('Server returned invalid data. Please try again.');
        }
        
        gameState.kingdomId = data.kingdomId;
        localStorage.setItem('currentKingdomId', gameState.kingdomId);
        
        updateStatus('Kingdom created successfully!', 'success');
        await loadKingdom();
    } catch (error) {
        console.error('Create kingdom error:', error);
        
        // User-friendly error messages
        let userMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            userMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.message.includes('NetworkError')) {
            userMessage = 'Network error. Please try again.';
        } else if (error.message.includes('kingdom name')) {
            userMessage = 'Please enter a valid kingdom name.';
        }
        
        updateStatus(userMessage, 'error');
    }
}

// Load kingdom data
async function loadKingdom() {
    try {
        updateStatus('Loading kingdom...');
        
        const response = await fetch(`${API_BASE}/kingdoms/${gameState.kingdomId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Kingdom not found. It may have been deleted.');
            } else {
                throw new Error(`Failed to load kingdom (${response.status})`);
            }
        }
        
        gameState.kingdom = await response.json();
        
        // Update UI
        showGameScreen();
        updateKingdomDisplay();
        
        // Start update loop
        startUpdateLoop();
        
        // Load events
        await loadEvents();
        
        updateStatus('Connected', 'success');
    } catch (error) {
        console.error('Load kingdom error:', error);
        
        let userMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            userMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.message.includes('NetworkError')) {
            userMessage = 'Network error. Please refresh the page and try again.';
        }
        
        updateStatus(userMessage, 'error');
        
        // Clear invalid kingdom ID
        localStorage.removeItem('currentKingdomId');
        gameState.kingdomId = null;
        
        // Show start screen again
        showStartScreen();
    }
}

// Show game screen
function showGameScreen() {
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    elements.calculateTickBtn.classList.remove('hidden');
    document.getElementById('show-statistics').classList.remove('hidden');
    updatePrestigeButton();
}

// Show start screen
function showStartScreen() {
    elements.gameScreen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
    elements.calculateTickBtn.classList.add('hidden');
    const statsBtn = document.getElementById('show-statistics');
    if (statsBtn) statsBtn.classList.add('hidden');
}

// Update kingdom display
function updateKingdomDisplay() {
    const kingdom = gameState.kingdom;
    if (!kingdom) return;
    
    // Resources
    elements.gold.textContent = Math.floor(kingdom.resources.gold);
    elements.influence.textContent = Math.floor(kingdom.resources.influence);
    elements.loyalty.textContent = Math.floor(kingdom.resources.loyalty);
    elements.population.textContent = kingdom.resources.population;
    elements.militaryPower.textContent = Math.floor(kingdom.resources.militaryPower);
    
    // Court
    elements.kingName.textContent = kingdom.court.king.name;
    elements.queenName.textContent = kingdom.court.queen.name;
    
    // Advisors
    updateAdvisors(kingdom.court.advisors);
    
    // Update generation rates with advisor bonuses
    updateGenerationRates();
    
    // Factions
    updateFactions(kingdom.factions);
    
    // Info
    elements.kingdomDisplayName.textContent = kingdom.name;
    elements.prestigeLevel.textContent = kingdom.prestigeLevel || 0;
    
    // Update advisor affordability
    updateAdvisorAffordability();
}

// Update advisors display
function updateAdvisors(advisors) {
    if (!advisors || advisors.length === 0) {
        elements.advisors.innerHTML = '<p class="no-advisors">No advisors recruited yet</p>';
        return;
    }
    
    elements.advisors.innerHTML = advisors.map(advisor => {
        const icon = getAdvisorIcon(advisor.type);
        return `
            <div class="advisor">
                <span class="advisor-icon">${icon}</span>
                <span>${advisor.name} (${advisor.type})</span>
            </div>
        `;
    }).join('');
    
    // Update recruited advisors in recruitment panel
    updateRecruitmentPanel();
}

// Get advisor icon based on type
function getAdvisorIcon(type) {
    const icons = {
        'TREASURER': '💰',
        'CHANCELLOR': '🤝',
        'MARSHAL': '⚔️',
        'SPYMASTER': '🕵️',
        'COURT_CHAPLAIN': '⛪',
        'Economic': '💰',
        'Diplomatic': '🤝',
        'Military': '⚔️',
        'Religious': '⛪',
        'Administrative': '📜'
    };
    return icons[type] || '🎓';
}

// Update factions display
function updateFactions(factions) {
    elements.factions.innerHTML = factions.map(faction => {
        const moodClass = faction.mood.toLowerCase();
        const moodEmoji = getMoodEmoji(faction.mood);
        
        return `
            <div class="faction ${moodClass}">
                <div class="faction-header">
                    <span class="faction-name">${faction.name}</span>
                    <span class="faction-mood">${moodEmoji} ${faction.mood}</span>
                </div>
                <div class="faction-approval">
                    <div class="approval-bar">
                        <div class="approval-fill" style="width: ${faction.approvalRating}%"></div>
                    </div>
                    <span class="approval-text">${faction.approvalRating}%</span>
                </div>
            </div>
        `;
    }).join('');
}

// Get mood emoji
function getMoodEmoji(mood) {
    const moods = {
        'Hostile': '😡',
        'Unhappy': '😠',
        'Neutral': '😐',
        'Content': '🙂',
        'Loyal': '😊'
    };
    return moods[mood] || '😐';
}

// Load active events
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/kingdoms/${gameState.kingdomId}/events`);
        if (!response.ok) throw new Error('Failed to load events');
        
        const events = await response.json();
        updateEventsDisplay(events);
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Update events display
function updateEventsDisplay(events) {
    if (!events || events.length === 0) {
        elements.events.innerHTML = '<p class="no-events">No active events</p>';
        return;
    }
    
    elements.events.innerHTML = events.map(event => `
        <div class="event" onclick="showEvent('${event.id}')">
            <div class="event-header">
                <span class="event-type ${event.type.toLowerCase()}">${event.type}</span>
                <span class="event-title">${event.title}</span>
            </div>
            <p class="event-preview">${event.description.substring(0, 100)}...</p>
            <button class="btn-primary">View Event</button>
        </div>
    `).join('');
}

// Show event modal
async function showEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE}/kingdoms/${gameState.kingdomId}/events`);
        const events = await response.json();
        const event = events.find(e => e.id === eventId);
        
        if (!event) return;
        
        elements.eventTitle.textContent = event.title;
        elements.eventDescription.textContent = event.description;
        
        elements.eventChoices.innerHTML = event.choices.map(choice => {
            const disabled = !choice.available ? 'disabled' : '';
            const requirements = formatRequirements(choice.requirements);
            
            return `
                <div class="event-choice ${disabled}">
                    <h4>${choice.description}</h4>
                    ${requirements ? `<p class="requirements">Requires: ${requirements}</p>` : ''}
                    ${choice.preview ? `<p class="preview">${choice.preview.immediate}</p>` : ''}
                    <button 
                        class="btn-primary" 
                        ${disabled}
                        onclick="makeChoice('${eventId}', '${choice.id}')"
                    >
                        Choose
                    </button>
                </div>
            `;
        }).join('');
        
        elements.eventModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error showing event:', error);
    }
}

// Format requirements
function formatRequirements(requirements) {
    if (!requirements) return '';
    
    const parts = [];
    if (requirements.gold) parts.push(`${requirements.gold} Gold`);
    if (requirements.influence) parts.push(`${requirements.influence} Influence`);
    if (requirements.loyalty) parts.push(`${requirements.loyalty} Loyalty`);
    
    return parts.join(', ');
}

// Make event choice
async function makeChoice(eventId, choiceId) {
    try {
        updateStatus('Processing choice...');
        
        const response = await fetch(`${API_BASE}/kingdoms/${gameState.kingdomId}/events/${eventId}/choose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ choiceId })
        });
        
        if (!response.ok) throw new Error('Failed to process choice');
        
        const result = await response.json();
        
        // Close modal
        elements.eventModal.classList.add('hidden');
        
        // Update statistics
        gameState.statistics.eventsCompleted++;
        saveStatistics();
        
        // Reload kingdom and events
        await loadKingdom();
        await loadEvents();
        
        updateStatus('Choice processed successfully');
    } catch (error) {
        updateStatus('Error: ' + error.message, 'error');
    }
}

// Calculate tick manually
async function calculateTick() {
    try {
        const response = await fetch(`${API_BASE}/kingdoms/${gameState.kingdomId}/calculate`, {
            method: 'PUT'
        });
        
        if (!response.ok) throw new Error('Failed to calculate tick');
        
        gameState.kingdom = await response.json();
        updateKingdomDisplay();
        
        updateStatus('Resources updated');
    } catch (error) {
        updateStatus('Error: ' + error.message, 'error');
    }
}

// Start update loop
function startUpdateLoop() {
    // Clear existing interval
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
    }
    
    // Update every second
    gameState.updateInterval = setInterval(async () => {
        // Update local resources based on generation rates
        if (gameState.kingdom && gameState.kingdom.generationRates) {
            const rates = gameState.kingdom.generationRates;
            gameState.kingdom.resources.gold += (rates.gold || 0);
            gameState.kingdom.resources.influence += (rates.influence || 0);
            updateKingdomDisplay();
        }
        
        // Update statistics
        updateStatistics();
        
        // Sync with server every 10 seconds
        if (Date.now() % 10000 < 1000) {
            await calculateTick();
            await loadEvents();
        }
    }, 1000);
}

// Update status message
function updateStatus(message, type = 'info') {
    elements.status.textContent = message;
    elements.status.className = `status ${type}`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === elements.eventModal) {
        elements.eventModal.classList.add('hidden');
    }
    if (event.target === document.getElementById('statistics-modal')) {
        document.getElementById('statistics-modal').classList.add('hidden');
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Recruit advisor
async function recruitAdvisor(advisorType) {
    try {
        // Map frontend advisor types to backend types
        const typeMapping = {
            'treasurer': { type: 'TREASURER', specialty: 'Economic', name: 'Royal Treasurer' },
            'diplomat': { type: 'CHANCELLOR', specialty: 'Diplomatic', name: 'Chancellor' },
            'general': { type: 'MARSHAL', specialty: 'Military', name: 'Marshal' },
            'spymaster': { type: 'SPYMASTER', specialty: 'Administrative', name: 'Spymaster' },
            'chaplain': { type: 'COURT_CHAPLAIN', specialty: 'Religious', name: 'Court Chaplain' }
        };
        
        const advisorData = typeMapping[advisorType];
        if (!advisorData) {
            updateStatus('Invalid advisor type', 'error');
            return;
        }
        
        // Check if already recruited
        if (gameState.kingdom && gameState.kingdom.court.advisors) {
            const alreadyRecruited = gameState.kingdom.court.advisors.some(
                advisor => advisor.type === advisorData.type
            );
            if (alreadyRecruited) {
                updateStatus('This advisor position is already filled', 'error');
                return;
            }
        }
        
        updateStatus('Recruiting advisor...');
        
        const response = await fetch(`${API_BASE}/kingdoms/${gameState.kingdomId}/advisors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                advisorName: advisorData.name,
                specialty: advisorData.specialty,
                advisorType: advisorData.type
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to recruit advisor');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            updateStatus(result.message || 'Failed to recruit advisor', 'error');
            return;
        }
        
        // Reload kingdom to get updated state
        await loadKingdom();
        
        updateStatus(`Successfully recruited ${advisorData.name}!`);
        
        // Show visual feedback
        const card = document.querySelector(`[data-advisor-type="${advisorType}"]`);
        if (card) {
            card.classList.add('recruited');
            const button = card.querySelector('.btn-recruit');
            if (button) {
                button.textContent = 'Recruited';
                button.disabled = true;
            }
        }
    } catch (error) {
        updateStatus('Error: ' + error.message, 'error');
    }
}

// Update recruitment panel to show already recruited advisors
function updateRecruitmentPanel() {
    if (!gameState.kingdom || !gameState.kingdom.court.advisors) return;
    
    const recruitedTypes = gameState.kingdom.court.advisors.map(advisor => {
        // Map backend types to frontend types
        const typeMap = {
            'TREASURER': 'treasurer',
            'CHANCELLOR': 'diplomat',
            'MARSHAL': 'general',
            'SPYMASTER': 'spymaster',
            'COURT_CHAPLAIN': 'chaplain'
        };
        return typeMap[advisor.type] || advisor.type.toLowerCase();
    });
    
    // Update UI for recruited advisors
    recruitedTypes.forEach(type => {
        const card = document.querySelector(`[data-advisor-type="${type}"]`);
        if (card) {
            card.classList.add('recruited');
            const button = card.querySelector('.btn-recruit');
            if (button) {
                button.textContent = 'Recruited';
                button.disabled = true;
            }
        }
    });
    
    // Update UI for locked advisors (insufficient resources)
    updateAdvisorAffordability();
}

// Update advisor cards based on affordability
function updateAdvisorAffordability() {
    if (!gameState.kingdom) return;
    
    const costs = {
        'treasurer': { gold: 200, influence: 15 },
        'diplomat': { gold: 100, influence: 25 },
        'general': { gold: 150, influence: 10 },
        'spymaster': { gold: 150, influence: 20 },
        'chaplain': { gold: 100, influence: 20 }
    };
    
    Object.entries(costs).forEach(([type, cost]) => {
        const card = document.querySelector(`[data-advisor-type="${type}"]`);
        if (!card || card.classList.contains('recruited')) return;
        
        const canAfford = gameState.kingdom.resources.gold >= cost.gold && 
                         gameState.kingdom.resources.influence >= cost.influence;
        
        if (canAfford) {
            card.classList.remove('locked');
            const button = card.querySelector('.btn-recruit');
            if (button) button.disabled = false;
        } else {
            card.classList.add('locked');
            const button = card.querySelector('.btn-recruit');
            if (button) button.disabled = true;
        }
    });
}

// Update generation rates display with advisor bonuses
function updateGenerationRates() {
    if (!gameState.kingdom) return;
    
    let goldRate = 1; // Base rate
    let influenceRate = 0.5; // Base rate
    let loyaltyRate = 0; // Base rate
    
    // Apply advisor bonuses
    if (gameState.kingdom.court.advisors) {
        gameState.kingdom.court.advisors.forEach(advisor => {
            switch (advisor.type) {
                case 'TREASURER':
                case 'Economic':
                    goldRate *= 1.5; // +50% gold generation
                    break;
                case 'CHANCELLOR':
                case 'Diplomatic':
                    influenceRate += 2; // +2 influence per second
                    break;
                case 'COURT_CHAPLAIN':
                case 'Religious':
                    loyaltyRate += 1; // +1 loyalty per second
                    break;
            }
        });
    }
    
    // Update display
    elements.goldRate.textContent = goldRate.toFixed(1);
    elements.influenceRate.textContent = influenceRate.toFixed(1);
    
    // Store rates for local updates
    gameState.kingdom.generationRates = {
        gold: goldRate,
        influence: influenceRate,
        loyalty: loyaltyRate
    };
}

// Initialize statistics
function initializeStatistics() {
    const saved = localStorage.getItem('kingdomStatistics');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState.statistics = { ...gameState.statistics, ...parsed };
        } catch (e) {
            console.error('Failed to load statistics:', e);
        }
    }
    
    // Set start time if not set
    if (!gameState.statistics.startTime) {
        gameState.statistics.startTime = Date.now();
        saveStatistics();
    }
}

function saveStatistics() {
    localStorage.setItem('kingdomStatistics', JSON.stringify(gameState.statistics));
}

function updateStatistics() {
    if (!gameState.kingdom) return;
    
    const now = Date.now();
    const timeDelta = (now - gameState.statistics.lastUpdate) / 1000; // in seconds
    
    // Update total resources generated
    if (gameState.kingdom.generationRates) {
        gameState.statistics.totalGoldGenerated += (gameState.kingdom.generationRates.gold || 0) * timeDelta;
        gameState.statistics.totalInfluenceGenerated += (gameState.kingdom.generationRates.influence || 0) * timeDelta;
    }
    
    // Record resource snapshot every 10 seconds
    if (now - gameState.statistics.lastUpdate > 10000) {
        const snapshot = {
            timestamp: now,
            gold: gameState.kingdom.resources.gold,
            influence: gameState.kingdom.resources.influence,
            loyalty: gameState.kingdom.resources.loyalty,
            population: gameState.kingdom.resources.population,
            militaryPower: gameState.kingdom.resources.militaryPower
        };
        
        gameState.statistics.resourceHistory.push(snapshot);
        
        // Keep only last 100 snapshots
        if (gameState.statistics.resourceHistory.length > 100) {
            gameState.statistics.resourceHistory.shift();
        }
        
        // Record faction approval
        gameState.kingdom.factions.forEach(faction => {
            if (!gameState.statistics.factionHistory[faction.name]) {
                gameState.statistics.factionHistory[faction.name] = [];
            }
            gameState.statistics.factionHistory[faction.name].push({
                timestamp: now,
                approval: faction.approvalRating
            });
            
            // Keep only last 50 entries per faction
            if (gameState.statistics.factionHistory[faction.name].length > 50) {
                gameState.statistics.factionHistory[faction.name].shift();
            }
        });
        
        gameState.statistics.lastUpdate = now;
        saveStatistics();
    }
}

function calculateStatistics() {
    const stats = gameState.statistics;
    
    // Calculate time played
    const timePlayed = Date.now() - stats.startTime;
    const hours = Math.floor(timePlayed / 3600000);
    const minutes = Math.floor((timePlayed % 3600000) / 60000);
    const seconds = Math.floor((timePlayed % 60000) / 1000);
    
    return {
        timePlayed: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        totalGold: Math.floor(stats.totalGoldGenerated),
        totalInfluence: Math.floor(stats.totalInfluenceGenerated),
        eventsCompleted: stats.eventsCompleted
    };
}

function showStatistics() {
    const modal = document.getElementById('statistics-modal');
    const stats = calculateStatistics();
    
    // Update overview stats
    document.getElementById('stat-time-played').textContent = stats.timePlayed;
    document.getElementById('stat-total-gold').textContent = stats.totalGold.toLocaleString();
    document.getElementById('stat-total-influence').textContent = stats.totalInfluence.toLocaleString();
    document.getElementById('stat-events-completed').textContent = stats.eventsCompleted;
    
    // Create/update charts
    createResourceGrowthChart();
    createFactionApprovalChart();
    createResourceDistributionChart();
    
    modal.classList.remove('hidden');
}

function closeStatistics() {
    document.getElementById('statistics-modal').classList.add('hidden');
}

function createResourceGrowthChart() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }
    
    const ctx = document.getElementById('resource-growth-chart').getContext('2d');
    const history = gameState.statistics.resourceHistory;
    
    if (gameState.charts.resourceGrowth) {
        gameState.charts.resourceGrowth.destroy();
    }
    
    const data = {
        labels: history.map(h => new Date(h.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: 'Gold',
                data: history.map(h => h.gold),
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                tension: 0.1
            },
            {
                label: 'Influence',
                data: history.map(h => h.influence),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.1
            }
        ]
    };
    
    gameState.charts.resourceGrowth = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#eee'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#eee',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#eee'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function createFactionApprovalChart() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }
    
    const ctx = document.getElementById('faction-approval-chart').getContext('2d');
    const factionHistory = gameState.statistics.factionHistory;
    
    if (gameState.charts.factionApproval) {
        gameState.charts.factionApproval.destroy();
    }
    
    const datasets = [];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
    let colorIndex = 0;
    
    for (const [factionName, history] of Object.entries(factionHistory)) {
        if (history.length > 0) {
            datasets.push({
                label: factionName,
                data: history.map(h => h.approval),
                borderColor: colors[colorIndex % colors.length],
                backgroundColor: `${colors[colorIndex % colors.length]}20`,
                tension: 0.1
            });
            colorIndex++;
        }
    }
    
    gameState.charts.factionApproval = new Chart(ctx, {
        type: 'line',
        data: {
            labels: factionHistory[Object.keys(factionHistory)[0]]?.map(h => 
                new Date(h.timestamp).toLocaleTimeString()
            ) || [],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#eee'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#eee',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: '#eee'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function createResourceDistributionChart() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }
    
    const ctx = document.getElementById('resource-distribution-chart').getContext('2d');
    
    if (gameState.charts.resourceDistribution) {
        gameState.charts.resourceDistribution.destroy();
    }
    
    if (!gameState.kingdom) return;
    
    const resources = gameState.kingdom.resources;
    const data = {
        labels: ['Gold', 'Influence', 'Loyalty', 'Population', 'Military Power'],
        datasets: [{
            data: [
                resources.gold,
                resources.influence,
                resources.loyalty,
                resources.population,
                resources.militaryPower
            ],
            backgroundColor: [
                '#f39c12',
                '#3498db',
                '#e74c3c',
                '#2ecc71',
                '#9b59b6'
            ]
        }]
    };
    
    gameState.charts.resourceDistribution = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#eee'
                    }
                }
            }
        }
    });
}

function exportStatistics() {
    const exportData = {
        kingdom: {
            name: gameState.kingdom?.name,
            id: gameState.kingdomId
        },
        statistics: gameState.statistics,
        currentResources: gameState.kingdom?.resources,
        currentFactions: gameState.kingdom?.factions,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `kingdom-stats-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Prestige System Functions
function showPrestigeModal() {
    updatePrestigeModal();
    document.getElementById('prestige-modal').classList.remove('hidden');
}

// Alias for showPrestigeModal (used in HTML onclick)
function openPrestigeModal() {
    showPrestigeModal();
}

function closePrestigeModal() {
    document.getElementById('prestige-modal').classList.add('hidden');
}

async function updatePrestigeModal() {
    if (!gameState.kingdom) return;

    const kingdom = gameState.kingdom;
    const completedEvents = kingdom.completedEventsCount || gameState.statistics.eventsCompleted || 0;
    const canPrestige = completedEvents >= 10;
    
    // Update requirements
    document.getElementById('prestige-events-count').textContent = completedEvents;
    const requirementStatus = document.getElementById('prestige-requirement-status');
    
    if (canPrestige) {
        requirementStatus.textContent = 'You can prestige!';
        requirementStatus.style.color = '#4CAF50';
        document.getElementById('confirm-prestige').disabled = false;
    } else {
        requirementStatus.textContent = `Need ${10 - completedEvents} more events`;
        requirementStatus.style.color = '#f44336';
        document.getElementById('confirm-prestige').disabled = true;
    }
    
    // Current prestige level
    const currentLevel = kingdom.prestigeLevel || 0;
    document.getElementById('modal-prestige-level').textContent = currentLevel;
    document.getElementById('prestige-level').textContent = currentLevel;
    
    // Current bonuses
    document.getElementById('current-resource-bonus').textContent = currentLevel * 10;
    document.getElementById('current-advisor-slots').textContent = currentLevel;
    document.getElementById('current-faction-retention').textContent = Math.min(currentLevel * 10, 90);
    
    // Next level bonuses
    const nextLevel = currentLevel + 1;
    document.getElementById('next-prestige-level').textContent = nextLevel;
    document.getElementById('next-resource-bonus').textContent = nextLevel * 10;
    document.getElementById('next-advisor-slots').textContent = nextLevel;
    document.getElementById('next-faction-retention').textContent = Math.min(nextLevel * 10, 90);
}

async function performPrestige() {
    if (!gameState.kingdomId) return;
    
    const confirmMsg = 'Are you sure you want to prestige? This will reset most of your progress but grant permanent bonuses.';
    if (!confirm(confirmMsg)) return;
    
    try {
        const response = await fetch(`${API_BASE}/kingdoms/${gameState.kingdomId}/prestige`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to prestige');
        }
        
        const result = await response.json();
        
        // Close modal
        closePrestigeModal();
        
        // Show success message
        updateStatus(`Prestige successful! You are now prestige level ${result.prestigeLevel}`, 'success');
        
        // Reload kingdom state
        await loadKingdom();
        
    } catch (error) {
        console.error('Prestige error:', error);
        updateStatus(error.message || 'Failed to perform prestige', 'error');
    }
}

// Update the prestige button visibility
function updatePrestigeButton() {
    const prestigeButton = document.getElementById('prestige-button');
    if (gameState.kingdom && prestigeButton) {
        prestigeButton.classList.remove('hidden');
    }
}

// Open prestige modal (alias for showPrestigeModal)
function openPrestigeModal() {
    showPrestigeModal();
}

// Initialize the game when the script loads
init().catch(error => {
    console.error('Failed to initialize game:', error);
    updateStatus('Failed to initialize game. Please refresh the page.', 'error');
});
