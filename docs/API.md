# Kingdom Incremental API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Kingdom Management

#### Create Kingdom
```http
POST /kingdoms
Content-Type: application/json

{
  "kingdomName": "Avalon",
  "rulerName": "King Arthur"
}
```

**Response (201 Created):**
```json
{
  "kingdomId": "uuid-here",
  "kingdomName": "Avalon",
  "rulerName": "King Arthur",
  "createdAt": "2024-01-12T10:00:00Z"
}
```

#### Get Kingdom State
```http
GET /kingdoms/:id
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "name": "Avalon",
  "resources": {
    "gold": 100,
    "influence": 10,
    "loyalty": 50,
    "population": 1000,
    "militaryPower": 10
  },
  "court": {
    "king": {
      "name": "The King",
      "title": "King"
    },
    "queen": {
      "name": "The Queen",
      "title": "Queen"
    },
    "advisors": []
  },
  "factions": [
    {
      "type": "Nobility",
      "name": "The Noble Houses",
      "approvalRating": 50,
      "mood": "Neutral"
    },
    {
      "type": "Merchants",
      "name": "The Merchant Guild",
      "approvalRating": 50,
      "mood": "Neutral"
    },
    {
      "type": "Military",
      "name": "The Royal Army",
      "approvalRating": 50,
      "mood": "Neutral"
    },
    {
      "type": "Clergy",
      "name": "The Church",
      "approvalRating": 50,
      "mood": "Neutral"
    },
    {
      "type": "Commoners",
      "name": "The Common Folk",
      "approvalRating": 50,
      "mood": "Neutral"
    }
  ],
  "activeEvents": 0,
  "prestigeLevel": 0,
  "generationRates": {
    "gold": 1,
    "influence": 1,
    "faith": 0,
    "knowledge": 0
  }
}
```

#### Calculate Resource Tick
```http
PUT /kingdoms/:id/calculate
```

**Response (200 OK):**
Returns updated kingdom state (same format as GET /kingdoms/:id)

### Event Management

#### Get Active Events
```http
GET /kingdoms/:id/events
```

**Response (200 OK):**
```json
[
  {
    "id": "event-uuid",
    "title": "Noble Tax Dispute",
    "description": "The nobles are demanding lower taxes...",
    "type": "Political",
    "expiresAt": "2024-01-12T11:00:00Z",
    "choices": [
      {
        "id": "choice-1",
        "description": "Lower taxes for nobles",
        "available": true,
        "requirements": {
          "gold": 0,
          "influence": 10
        },
        "preview": {
          "immediate": "Nobles will be pleased",
          "factionChanges": {
            "Nobility": "+10",
            "Commoners": "-5"
          }
        }
      },
      {
        "id": "choice-2",
        "description": "Maintain current tax rates",
        "available": true,
        "requirements": {},
        "preview": {
          "immediate": "Status quo maintained",
          "factionChanges": {
            "Nobility": "-5"
          }
        }
      }
    ]
  }
]
```

#### Make Event Choice
```http
POST /kingdoms/:id/events/:eventId/choose
Content-Type: application/json

{
  "choiceId": "choice-1"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Choice applied successfully",
  "updatedKingdom": { /* Updated kingdom state */ },
  "consequences": {
    "immediate": {
      "resources": {
        "influence": -10
      },
      "factionChanges": {
        "Nobility": 10,
        "Commoners": -5
      }
    }
  }
}
```

### Advisor Management

#### Recruit Advisor
```http
POST /kingdoms/:id/advisors
Content-Type: application/json

{
  "advisorType": "Treasurer",
  "advisorName": "Lord Goldsworth"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "advisor": {
    "type": "Treasurer",
    "name": "Lord Goldsworth"
  },
  "cost": {
    "gold": 100,
    "influence": 20
  }
}
```

### Faction Status

#### Get Faction Status
```http
GET /kingdoms/:id/factions
```

**Response (200 OK):**
```json
[
  {
    "type": "Nobility",
    "name": "The Noble Houses",
    "approvalRating": 65,
    "mood": "Content",
    "power": "High",
    "description": "The nobles control vast lands and wealth"
  },
  {
    "type": "Merchants",
    "name": "The Merchant Guild",
    "approvalRating": 45,
    "mood": "Unhappy",
    "power": "Medium",
    "description": "Traders and craftsmen seeking profit"
  }
  // ... other factions
]
```

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "message": "Kingdom name and ruler name are required",
    "status": 400
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Kingdom not found",
    "status": 404
  }
}
```

### 409 Conflict
```json
{
  "error": {
    "message": "Advisor already recruited",
    "status": 409
  }
}
```

### 422 Unprocessable Entity
```json
{
  "error": {
    "message": "Insufficient resources",
    "status": 422,
    "details": {
      "required": { "gold": 100 },
      "available": { "gold": 50 }
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "message": "Internal server error",
    "status": 500
  }
}
```

## Testing the API

### Using curl

Create a kingdom:
```bash
curl -X POST http://localhost:3000/api/kingdoms \
  -H "Content-Type: application/json" \
  -d '{"kingdomName":"Avalon","rulerName":"Arthur"}'
```

Get kingdom state:
```bash
curl http://localhost:3000/api/kingdoms/{kingdom-id}
```

Make event choice:
```bash
curl -X POST http://localhost:3000/api/kingdoms/{kingdom-id}/events/{event-id}/choose \
  -H "Content-Type: application/json" \
  -d '{"choiceId":"choice-1"}'
```

### Using Node.js/Axios

```javascript
const axios = require('axios');

// Create kingdom
const { data: kingdom } = await axios.post('http://localhost:3000/api/kingdoms', {
  kingdomName: 'Avalon',
  rulerName: 'Arthur'
});

// Get events
const { data: events } = await axios.get(
  `http://localhost:3000/api/kingdoms/${kingdom.kingdomId}/events`
);

// Make choice
const { data: result } = await axios.post(
  `http://localhost:3000/api/kingdoms/${kingdom.kingdomId}/events/${events[0].id}/choose`,
  { choiceId: events[0].choices[0].id }
);
```