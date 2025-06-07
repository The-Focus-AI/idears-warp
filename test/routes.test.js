const request = require('supertest');
const express = require('express');
const createRoutes = require('../src/routes');
const Database = require('../src/database');
const fs = require('fs');
const path = require('path');

describe('API Routes', () => {
  let app;
  let database;
  const testDbPath = './test-data/test-routes.db';

  beforeEach(async () => {
    // Ensure test directory exists
    const dir = path.dirname(testDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    database = new Database(testDbPath);
    await database.init();
    
    app = express();
    app.use(express.json());
    app.use(createRoutes(database));
  });

  afterEach(async () => {
    await database.close();
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('GET /api/ideas', () => {
    test('should return empty array when no ideas exist', async () => {
      const response = await request(app)
        .get('/api/ideas')
        .expect(200);
        
      expect(response.body).toEqual([]);
    });

    test('should return all ideas', async () => {
      await database.createIdea('id1', 'Idea 1', 'Description 1');
      await database.createIdea('id2', 'Idea 2', 'Description 2');
      
      const response = await request(app)
        .get('/api/ideas')
        .expect(200);
        
      expect(response.body).toHaveLength(2);
      const titles = response.body.map(idea => idea.title);
      expect(titles).toContain('Idea 1');
      expect(titles).toContain('Idea 2');
    });
  });

  describe('POST /api/ideas', () => {
    test('should create a new idea', async () => {
      const ideaData = {
        title: 'New Idea',
        description: 'New Description'
      };
      
      const response = await request(app)
        .post('/api/ideas')
        .send(ideaData)
        .expect(201);
        
      expect(response.body.title).toBe('New Idea');
      expect(response.body.description).toBe('New Description');
      expect(response.body.votes).toBe(0);
      expect(response.body.id).toBeDefined();
    });

    test('should create idea with empty description', async () => {
      const ideaData = {
        title: 'Title Only'
      };
      
      const response = await request(app)
        .post('/api/ideas')
        .send(ideaData)
        .expect(201);
        
      expect(response.body.title).toBe('Title Only');
      expect(response.body.description).toBe('');
    });

    test('should trim whitespace from title and description', async () => {
      const ideaData = {
        title: '  Trimmed Title  ',
        description: '  Trimmed Description  '
      };
      
      const response = await request(app)
        .post('/api/ideas')
        .send(ideaData)
        .expect(201);
        
      expect(response.body.title).toBe('Trimmed Title');
      expect(response.body.description).toBe('Trimmed Description');
    });

    test('should return 400 for missing title', async () => {
      const response = await request(app)
        .post('/api/ideas')
        .send({})
        .expect(400);
        
      expect(response.body.error).toBe('Title is required');
    });

    test('should return 400 for empty title', async () => {
      const response = await request(app)
        .post('/api/ideas')
        .send({ title: '   ' })
        .expect(400);
        
      expect(response.body.error).toBe('Title is required');
    });
  });

  describe('GET /api/ideas/:id', () => {
    test('should return idea with notes and files', async () => {
      const idea = await database.createIdea('test-id', 'Test Idea', 'Test Description');
      await database.addNote('note1', 'test-id', 'Test note');
      await database.addFile('file1', 'test-id', 'test.jpg', 'original.jpg', '/path', 'image/jpeg', 1024);
      
      const response = await request(app)
        .get('/api/ideas/test-id')
        .expect(200);
        
      expect(response.body.title).toBe('Test Idea');
      expect(response.body.notes).toHaveLength(1);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.notes[0].content).toBe('Test note');
      expect(response.body.files[0].original_name).toBe('original.jpg');
    });

    test('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .get('/api/ideas/non-existent')
        .expect(404);
        
      expect(response.body.error).toBe('Idea not found');
    });
  });

  describe('POST /api/ideas/:id/vote', () => {
    test('should vote for an idea', async () => {
      await database.createIdea('test-id', 'Test Idea', 'Test Description');
      
      const response = await request(app)
        .post('/api/ideas/test-id/vote')
        .expect(200);
        
      expect(response.body.votes).toBe(1);
    });

    test('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .post('/api/ideas/non-existent/vote')
        .expect(404);
        
      expect(response.body.error).toBe('Idea not found');
    });
  });

  describe('POST /api/ideas/:id/notes', () => {
    beforeEach(async () => {
      await database.createIdea('test-id', 'Test Idea', 'Test Description');
    });

    test('should add a note to an idea', async () => {
      const noteData = {
        content: 'This is a test note'
      };
      
      const response = await request(app)
        .post('/api/ideas/test-id/notes')
        .send(noteData)
        .expect(201);
        
      expect(response.body.content).toBe('This is a test note');
      expect(response.body.ideaId).toBe('test-id');
      expect(response.body.id).toBeDefined();
    });

    test('should trim whitespace from note content', async () => {
      const noteData = {
        content: '  Trimmed note  '
      };
      
      const response = await request(app)
        .post('/api/ideas/test-id/notes')
        .send(noteData)
        .expect(201);
        
      expect(response.body.content).toBe('Trimmed note');
    });

    test('should return 400 for missing content', async () => {
      const response = await request(app)
        .post('/api/ideas/test-id/notes')
        .send({})
        .expect(400);
        
      expect(response.body.error).toBe('Note content is required');
    });

    test('should return 400 for empty content', async () => {
      const response = await request(app)
        .post('/api/ideas/test-id/notes')
        .send({ content: '   ' })
        .expect(400);
        
      expect(response.body.error).toBe('Note content is required');
    });

    test('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .post('/api/ideas/non-existent/notes')
        .send({ content: 'Test note' })
        .expect(404);
        
      expect(response.body.error).toBe('Idea not found');
    });
  });

  describe('POST /api/ideas/:id/files', () => {
    beforeEach(async () => {
      await database.createIdea('test-id', 'Test Idea', 'Test Description');
    });

    test('should return 400 for missing file', async () => {
      const response = await request(app)
        .post('/api/ideas/test-id/files')
        .expect(400);
        
      expect(response.body.error).toBe('File is required');
    });

    test('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .post('/api/ideas/non-existent/files')
        .attach('file', Buffer.from('test file content'), { filename: 'test.txt', contentType: 'text/plain' })
        .expect(404);
        
      expect(response.body.error).toBe('Idea not found');
    });
  });

  describe('GET /api/files/:filename', () => {
    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/files/non-existent.txt')
        .expect(404);
        
      expect(response.body.error).toBe('File not found');
    });
  });
});

