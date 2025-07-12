// Game state
let gameState = {
    kingdomId: null,
    kingdom: null,
    updateInterval: null
};

// API base URL
const API_BASE = '/api';

// DOM elements
const elements = {
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

// Initialize game
async function init() {
    // Check if we have a saved kingdom ID
    const savedKingdomId = localStorage.getItem('kingdomId');
    if (savedKingdomId) {
        gameState.kingdomId = savedKingdomId;
        await loadKingdom();
    }
    
    // Setup event listeners
    elements.createKingdomForm.addEventListener('submit', handleCreateKingdom);
    elements.calculateTickBtn.addEventListener('click', calculateTick);
    
    updateStatus('Ready to play');
}

// Create new kingdom
async function handleCreateKingdom(e) {
    e.preventDefault();
    
    const kingdomName = document.getElementById('kingdom-name').value;
    const rulerName = document.getElementById('ruler-name').value;
    
    try {
        updateStatus('Creating kingdom...');
        
        const response = await fetch(`${API_BASE}/kingdoms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kingdomName, rulerName })
        });
        
        if (!response.ok) throw new Error('Failed to create kingdom');
        
        const data = await response.json();
        gameState.kingdomId = data.kingdomId;
        localStorage.setItem('kingdomId', gameState.kingdomId);
        
        await loadKingdom();
    } catch (error) {
        updateStatus('Error: ' + error.message, 'error');
    }
}

// Load kingdom data
async function loadKingdom() {
    try {
        updateStatus('Loading kingdom...');
        
        const response = await fetch(`${API_BASE}/kingdoms/${gameState.kingdomId}`);
        if (!response.ok) throw new Error('Failed to load kingdom');
        
        gameState.kingdom = await response.json();
        
        // Update UI
        showGameScreen();
        updateKingdomDisplay();
        
        // Start update loop
        startUpdateLoop();
        
        // Load events
        await loadEvents();
        
        updateStatus('Kingdom loaded');
    } catch (error) {
        updateStatus('Error: ' + error.message, 'error');
        // Clear invalid kingdom ID
        localStorage.removeItem('kingdomId');
        gameState.kingdomId = null;
    }
}

// Show game screen
function showGameScreen() {
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    elements.calculateTickBtn.classList.remove('hidden');
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
    
    // Generation rates
    if (kingdom.generationRates) {
        elements.goldRate.textContent = kingdom.generationRates.gold || 0;
        elements.influenceRate.textContent = kingdom.generationRates.influence || 0;
    }
    
    // Court
    elements.kingName.textContent = kingdom.court.king.name;
    elements.queenName.textContent = kingdom.court.queen.name;
    
    // Advisors
    updateAdvisors(kingdom.court.advisors);
    
    // Factions
    updateFactions(kingdom.factions);
    
    // Info
    elements.kingdomDisplayName.textContent = kingdom.name;
    elements.prestigeLevel.textContent = kingdom.prestigeLevel || 0;
}

// Update advisors display
function updateAdvisors(advisors) {
    if (!advisors || advisors.length === 0) {
        elements.advisors.innerHTML = '<p class="no-advisors">No advisors recruited yet</p>';
        return;
    }
    
    elements.advisors.innerHTML = advisors.map(advisor => `
        <div class="advisor">
            <span class="advisor-icon">🎓</span>
            <span>${advisor.name} (${advisor.type})</span>
        </div>
    `).join('');
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
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);