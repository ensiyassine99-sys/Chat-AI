const request = require('supertest');
const { app } = require('../server');
const { User } = require('../src/models');
const jwt = require('jsonwebtoken');

describe('Authentication Endpoints', () => {
  let testUser;
  let authToken;
  
  beforeAll(async () => {
    // Clean up database
    await User.destroy({ where: {} });
  });
  
  afterAll(async () => {
    await User.destroy({ where: {} });
  });
  
  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test1234!',
          language: 'en',
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body).toHaveProperty('token');
      
      testUser = res.body.user;
      authToken = res.body.token;
    });
    
    it('should not create user with existing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'Test1234!',
          language: 'en',
        });
      
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBeFalsy();
    });
    
    it('should validate password requirements', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'weak',
          language: 'en',
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });
  
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234!',
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });
    
    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBeFalsy();
    });
    
    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBeFalsy();
    });
  });
  
  describe('GET /api/v1/auth/me', () => {
    it('should return user data with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.user.email).toBe('test@example.com');
    });
    
    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(res.statusCode).toBe(401);
    });
    
    it('should return not authenticated without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.authenticated).toBe(false);
    });
  });
});