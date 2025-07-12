# Database Setup for Kingdom Incremental

## Current Status
The app currently uses **in-memory storage** which resets on every deploy. To add persistence, choose one of these options:

## Option 1: Vercel KV (Redis) - RECOMMENDED
Best for incremental games - fast, simple, generous free tier.

### Setup:
1. Go to your Vercel dashboard
2. Select your `kingdom-incremental` project
3. Go to "Storage" tab
4. Click "Create Database" → "KV"
5. Follow the setup wizard

### Install:
```bash
npm install @vercel/kv
```

### Environment Variables (auto-added by Vercel):
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### Free Limits:
- 30k requests/month
- 256MB storage
- Perfect for thousands of players

## Option 2: Supabase (PostgreSQL)
Best if you want SQL queries and future features.

### Setup:
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database

### Install:
```bash
npm install @supabase/supabase-js
```

### Schema:
```sql
CREATE TABLE kingdoms (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kingdoms_name ON kingdoms(name);
```

## Option 3: MongoDB Atlas
Best if you prefer NoSQL.

### Setup:
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string

### Install:
```bash
npm install mongodb
```

## Implementation Steps

1. **Choose your database**
2. **Update KingdomController.ts**:
```typescript
// Replace MockKingdomRepository with real one
import { VercelKVRepository } from '../../infrastructure/repositories/VercelKVRepository';
// or
import { SupabaseRepository } from '../../infrastructure/repositories/SupabaseRepository';

constructor() {
  this.kingdomRepository = new VercelKVRepository();
  // ... rest of constructor
}
```

3. **Add connection check**:
```typescript
// In server.ts
app.get('/health', async (_req, res) => {
  const dbConnected = await checkDatabaseConnection();
  res.json({ 
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});
```

4. **Deploy and test**

## Local Development

For local testing without a database:
```typescript
const repository = process.env.NODE_ENV === 'production' 
  ? new VercelKVRepository()
  : new MockKingdomRepository();
```

## Migration from In-Memory

No migration needed - new players will automatically use the database. Old game states are lost (expected for early development).

## Costs

All options have generous free tiers:
- **Vercel KV**: Free up to 30k requests/month
- **Supabase**: Free up to 500MB
- **MongoDB Atlas**: Free up to 512MB
- **PlanetScale**: Free up to 5GB

For an incremental game, any of these will support thousands of players for free.