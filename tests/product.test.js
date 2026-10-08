const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Product = require('../src/models/product.model');

let mongoServer;

beforeAll(async () => {
  // If MONGO_URI is already provided (e.g. in GitHub Actions container), use it.
  // Otherwise spin up MongoMemoryServer for standalone execution.
  let uri = process.env.MONGO_URI;
  if (!uri || uri.includes('localhost:27017')) {
    try {
      // Test if local mongodb is available, else fallback to memory server
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
      return;
    } catch (e) {
      console.log('Local MongoDB not running, starting MongoMemoryServer for tests...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }
  }

  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Product.deleteMany({});
});

describe('Product RESTful API - CRUD Operations', () => {
  const sampleProduct = {
    pid: 'P001',
    pname: 'Asus ROG Strix Laptop',
    price: 1500.5,
    quantity: 10,
  };

  describe('POST /api/products (Create)', () => {
    it('should create a new product successfully with 201 status', async () => {
      const res = await request(app)
        .post('/api/products')
        .send(sampleProduct);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pid).toBe('P001');
      expect(res.body.data.pname).toBe('Asus ROG Strix Laptop');
      expect(res.body.data.price).toBe(1500.5);
      expect(res.body.data.quantity).toBe(10);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ pid: 'P002', pname: 'Keyboard' }); // missing price, quantity

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 if product with same pid already exists', async () => {
      await request(app).post('/api/products').send(sampleProduct);
      const res = await request(app).post('/api/products').send(sampleProduct);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('GET /api/products (Read all)', () => {
    it('should retrieve an empty list when no products exist', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('should retrieve all existing products', async () => {
      await Product.create(sampleProduct);
      await Product.create({
        pid: 'P002',
        pname: 'Logitech MX Master 3S',
        price: 99.99,
        quantity: 25,
      });

      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });

    it('should filter products by search query parameter', async () => {
      await Product.create(sampleProduct);
      await Product.create({
        pid: 'P002',
        pname: 'Dell Monitor',
        price: 299,
        quantity: 5,
      });

      const res = await request(app).get('/api/products?search=Monitor');
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].pname).toBe('Dell Monitor');
    });
  });

  describe('GET /api/products/:pid (Read one)', () => {
    it('should retrieve a product by pid', async () => {
      await Product.create(sampleProduct);

      const res = await request(app).get('/api/products/P001');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pid).toBe('P001');
      expect(res.body.data.pname).toBe('Asus ROG Strix Laptop');
    });

    it('should return 404 for non-existent pid', async () => {
      const res = await request(app).get('/api/products/NON_EXISTENT');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/products/:pid (Update)', () => {
    it('should update product price and quantity successfully', async () => {
      await Product.create(sampleProduct);

      const res = await request(app)
        .put('/api/products/P001')
        .send({ price: 1399.99, quantity: 8 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(1399.99);
      expect(res.body.data.quantity).toBe(8);
      expect(res.body.data.pname).toBe('Asus ROG Strix Laptop'); // unchanged
    });

    it('should return 404 when updating non-existent product', async () => {
      const res = await request(app)
        .put('/api/products/NON_EXISTENT')
        .send({ price: 100 });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/products/:pid (Delete)', () => {
    it('should delete an existing product successfully', async () => {
      await Product.create(sampleProduct);

      const res = await request(app).delete('/api/products/P001');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Product.findOne({ pid: 'P001' });
      expect(check).toBeNull();
    });

    it('should return 404 when deleting non-existent product', async () => {
      const res = await request(app).delete('/api/products/NON_EXISTENT');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
