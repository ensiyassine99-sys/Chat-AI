const request = require('supertest');
const { app } = require('../server');
const { User, Chat, Message } = require('../src/models');
const { generateTokens } = require('../src/utils/jwt');

describe('Chat Endpoints', () => {
  let user;
  let authToken;
  let chatId;
  
  beforeAll(async () => {
    // Create test user
    user = await User.create({
      username: 'chatuser',
      email: 'chat@example.com',
      password: 'Test1234!',
      language: 'en',
    });
    
    const tokens = generateTokens(user.id);
    authToken = tokens.accessToken;
  });
  
  afterAll(async () => {
    await Message.destroy({ where: {} });
    await Chat.destroy({ where: {} });
    await User.destroy({ where: {} });
  });
  
  describe('POST /api/v1/chat/message', () => {
    it('should send a message and create new chat', async () => {
      const res = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello, AI!',
          model: 'gpt-4',
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('chatId');
      expect(res.body.message).toHaveProperty('content');
      
      chatId = res.body.chatId;
    });
    
    it('should add message to existing chat', async () => {
      const res = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Another message',
          model: 'gpt-4',
          chatId: chatId,
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.chatId).toBe(chatId);
    });
    
    it('should validate message content', async () => {
      const res = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: '',
          model: 'gpt-4',
        });
      
      expect(res.statusCode).toBe(400);
    });
    
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/chat/message')
        .send({
          message: 'Hello',
          model: 'gpt-4',
        });
      
      expect(res.statusCode).toBe(401);
    });
  });
  
  describe('GET /api/v1/chat/history', () => {
    it('should return user chat history', async () => {
      const res = await request(app)
        .get('/api/v1/chat/history')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.chats).toBeInstanceOf(Array);
      expect(res.body.chats.length).toBeGreaterThan(0);
    });
    
    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/chat/history?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });
    
    it('should support search', async () => {
      const res = await request(app)
        .get('/api/v1/chat/history?search=Hello')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.chats).toBeInstanceOf(Array);
    });
  });
  
  describe('GET /api/v1/chat/chat/:chatId', () => {
    it('should return specific chat with messages', async () => {
      const res = await request(app)
        .get(`/api/v1/chat/chat/${chatId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.chat.id).toBe(chatId);
      expect(res.body.chat.messages).toBeInstanceOf(Array);
    });
    
    it('should return 404 for non-existent chat', async () => {
      const res = await request(app)
        .get('/api/v1/chat/chat/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('DELETE /api/v1/chat/chat/:chatId', () => {
    it('should delete a chat', async () => {
      const res = await request(app)
        .delete(`/api/v1/chat/chat/${chatId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify chat is deleted
      const getRes = await request(app)
        .get(`/api/v1/chat/chat/${chatId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getRes.statusCode).toBe(404);
    });
  });
});
