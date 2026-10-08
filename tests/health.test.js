const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');

let mongoServer;

beforeAll(async () => {
  let uri = process.env.MONGO_URI;
  if (!uri || uri.includes('localhost:27017')) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
      return;
    } catch (e) {
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Healthcheck Endpoint Tests', () => {
  it('GET /health should return 200 UP when MongoDB is connected', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('product-api');
    expect(res.body.mongodb.status).toBe('CONNECTED');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('GET /api/health alias should also return 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});
