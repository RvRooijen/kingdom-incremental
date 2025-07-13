import { describe, expect, test, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/api/server';

describe('Kingdom Persistence Integration', () => {
  let kingdomId: string;
  const kingdomName = 'Test Persistence Kingdom';

  beforeEach(async () => {
    // Clean up any existing test kingdoms
    const response = await request(app).get('/api/kingdoms');
    if (response.body.kingdoms) {
      for (const kingdom of response.body.kingdoms) {
        if (kingdom.name === kingdomName) {
          await request(app).delete(`/api/kingdoms/${kingdom.id}`);
        }
      }
    }
  });

  test('should persist kingdom after creation', async () => {
    // Create a kingdom
    const createResponse = await request(app)
      .post('/api/kingdoms')
      .send({ kingdomName: kingdomName, rulerName: 'Test Ruler' })
      .expect(201);

    expect(createResponse.body.kingdomId).toBeDefined();
    expect(createResponse.body.kingdomName).toBe(kingdomName);
    kingdomId = createResponse.body.kingdomId;

    // Verify kingdom exists
    const getResponse = await request(app)
      .get(`/api/kingdoms/${kingdomId}`)
      .expect(200);

    expect(getResponse.body.id).toBe(kingdomId);
    expect(getResponse.body.name).toBe(kingdomName);
  });

  test('should maintain kingdom state between requests', async () => {
    // Create a kingdom with unique name
    const uniqueName = `State Test Kingdom ${Date.now()}`;
    const createResponse = await request(app)
      .post('/api/kingdoms')
      .send({ kingdomName: uniqueName, rulerName: 'Test Ruler' })
      .expect(201);

    kingdomId = createResponse.body.kingdomId;

    // Get initial kingdom state
    const initialStateResponse = await request(app)
      .get(`/api/kingdoms/${kingdomId}`)
      .expect(200);
    
    const initialGold = initialStateResponse.body.resources.gold;

    // Wait a bit for resource generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate tick to generate resources
    await request(app)
      .put(`/api/kingdoms/${kingdomId}/calculate`)
      .expect(200);

    // Get kingdom state again
    const afterTickResponse = await request(app)
      .get(`/api/kingdoms/${kingdomId}`)
      .expect(200);

    // Resources should have increased
    expect(afterTickResponse.body.resources.gold).toBeGreaterThan(initialGold);

    // Make another request to ensure state persists
    const finalResponse = await request(app)
      .get(`/api/kingdoms/${kingdomId}`)
      .expect(200);

    expect(finalResponse.body.resources.gold).toBe(afterTickResponse.body.resources.gold);
  });

  test('should handle multiple kingdoms independently', async () => {
    // Create first kingdom
    const kingdom1Response = await request(app)
      .post('/api/kingdoms')
      .send({ kingdomName: 'Kingdom 1', rulerName: 'Ruler 1' })
      .expect(201);

    const kingdom1Id = kingdom1Response.body.kingdomId;

    // Create second kingdom
    const kingdom2Response = await request(app)
      .post('/api/kingdoms')
      .send({ kingdomName: 'Kingdom 2', rulerName: 'Ruler 2' })
      .expect(201);

    const kingdom2Id = kingdom2Response.body.kingdomId;

    // Modify first kingdom
    await request(app)
      .put(`/api/kingdoms/${kingdom1Id}/calculate`)
      .expect(200);

    // Verify second kingdom unchanged
    const kingdom2Check = await request(app)
      .get(`/api/kingdoms/${kingdom2Id}`)
      .expect(200);

    expect(kingdom2Check.body.resources.gold).toBe(100); // Initial value
  });

  test('should handle non-existent kingdom gracefully', async () => {
    const response = await request(app)
      .get('/api/kingdoms/non-existent-id')
      .expect(404);

    expect(response.body.error).toContain('Kingdom not found');
  });
});