const Database = require('../src/database');
const fs = require('fs');
const path = require('path');

describe('Database', () => {
  let database;
  const testDbPath = './test-data/test-ideas.db';

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
  });

  afterEach(async () => {
    await database.close();
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Ideas', () => {
    test('should create a new idea', async () => {
      const idea = await database.createIdea('test-id', 'Test Idea', 'Test Description');
      
      expect(idea).toEqual({
        id: 'test-id',
        title: 'Test Idea',
        description: 'Test Description',
        votes: 0
      });
    });

    test('should retrieve all ideas', async () => {
      await database.createIdea('id1', 'Idea 1', 'Description 1');
      await database.createIdea('id2', 'Idea 2', 'Description 2');
      
      const ideas = await database.getAllIdeas();
      
      expect(ideas).toHaveLength(2);
      // Should contain both ideas
      const titles = ideas.map(idea => idea.title);
      expect(titles).toContain('Idea 1');
      expect(titles).toContain('Idea 2');
    });

    test('should retrieve idea by id', async () => {
      await database.createIdea('test-id', 'Test Idea', 'Test Description');
      
      const idea = await database.getIdeaById('test-id');
      
      expect(idea.title).toBe('Test Idea');
      expect(idea.description).toBe('Test Description');
      expect(idea.votes).toBe(0);
    });

    test('should return null for non-existent idea', async () => {
      const idea = await database.getIdeaById('non-existent');
      
      expect(idea).toBeUndefined();
    });

    test('should vote for an idea', async () => {
      await database.createIdea('test-id', 'Test Idea', 'Test Description');
      
      await database.voteForIdea('test-id');
      const idea = await database.getIdeaById('test-id');
      
      expect(idea.votes).toBe(1);
    });

    test('should handle voting for non-existent idea', async () => {
      await expect(database.voteForIdea('non-existent')).rejects.toThrow('Idea not found');
    });

    test('should order ideas by votes then by created_at', async () => {
      await database.createIdea('id1', 'Idea 1', 'Description 1');
      await database.createIdea('id2', 'Idea 2', 'Description 2');
      await database.createIdea('id3', 'Idea 3', 'Description 3');
      
      // Vote for idea 2 twice and idea 3 once
      await database.voteForIdea('id2');
      await database.voteForIdea('id2');
      await database.voteForIdea('id3');
      
      const ideas = await database.getAllIdeas();
      
      expect(ideas[0].id).toBe('id2'); // 2 votes
      expect(ideas[1].id).toBe('id3'); // 1 vote
      expect(ideas[2].id).toBe('id1'); // 0 votes
    });
  });

  describe('Notes', () => {
    beforeEach(async () => {
      await database.createIdea('test-idea', 'Test Idea', 'Test Description');
    });

    test('should add a note to an idea', async () => {
      const note = await database.addNote('note-id', 'test-idea', 'This is a note');
      
      expect(note).toEqual({
        id: 'note-id',
        ideaId: 'test-idea',
        content: 'This is a note'
      });
    });

    test('should retrieve notes for an idea', async () => {
      await database.addNote('note1', 'test-idea', 'First note');
      await database.addNote('note2', 'test-idea', 'Second note');
      
      const notes = await database.getNotesByIdeaId('test-idea');
      
      expect(notes).toHaveLength(2);
      expect(notes[0].content).toBe('First note');
      expect(notes[1].content).toBe('Second note');
    });

    test('should return empty array for idea with no notes', async () => {
      const notes = await database.getNotesByIdeaId('test-idea');
      
      expect(notes).toEqual([]);
    });
  });

  describe('Files', () => {
    beforeEach(async () => {
      await database.createIdea('test-idea', 'Test Idea', 'Test Description');
    });

    test('should add a file to an idea', async () => {
      const file = await database.addFile(
        'file-id',
        'test-idea',
        'stored-filename.jpg',
        'original-filename.jpg',
        '/path/to/file.jpg',
        'image/jpeg',
        1024
      );
      
      expect(file).toEqual({
        id: 'file-id',
        ideaId: 'test-idea',
        filename: 'stored-filename.jpg',
        originalName: 'original-filename.jpg',
        filePath: '/path/to/file.jpg',
        mimeType: 'image/jpeg',
        size: 1024
      });
    });

    test('should retrieve files for an idea', async () => {
      await database.addFile('file1', 'test-idea', 'file1.jpg', 'orig1.jpg', '/path1', 'image/jpeg', 1024);
      await database.addFile('file2', 'test-idea', 'file2.jpg', 'orig2.jpg', '/path2', 'image/jpeg', 2048);
      
      const files = await database.getFilesByIdeaId('test-idea');
      
      expect(files).toHaveLength(2);
      expect(files[0].filename).toBe('file1.jpg');
      expect(files[1].filename).toBe('file2.jpg');
    });

    test('should return empty array for idea with no files', async () => {
      const files = await database.getFilesByIdeaId('test-idea');
      
      expect(files).toEqual([]);
    });
  });
});

