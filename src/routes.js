const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|md/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = /image\/(jpeg|jpg|png|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/(plain|markdown)/;
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    if (mimetype || extname) { // Allow if either mimetype or extension matches
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

function createRoutes(database) {
  const router = express.Router();
  
  // Get all ideas
  router.get('/api/ideas', async (req, res) => {
    try {
      const ideas = await database.getAllIdeas();
      res.json(ideas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new idea
  router.post('/api/ideas', async (req, res) => {
    try {
      const { title, description } = req.body;
      
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
      }

      const id = uuidv4();
      const idea = await database.createIdea(id, title.trim(), description?.trim() || '');
      res.status(201).json(idea);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific idea with notes and files
  router.get('/api/ideas/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const idea = await database.getIdeaById(id);
      
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      const notes = await database.getNotesByIdeaId(id);
      const files = await database.getFilesByIdeaId(id);
      
      res.json({ ...idea, notes, files });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vote for an idea
  router.post('/api/ideas/:id/vote', async (req, res) => {
    try {
      const { id } = req.params;
      await database.voteForIdea(id);
      const updatedIdea = await database.getIdeaById(id);
      res.json(updatedIdea);
    } catch (error) {
      if (error.message === 'Idea not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Add a note to an idea
  router.post('/api/ideas/:id/notes', async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Note content is required' });
      }

      // Check if idea exists
      const idea = await database.getIdeaById(id);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      const noteId = uuidv4();
      const note = await database.addNote(noteId, id, content.trim());
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add a file to an idea
  router.post('/api/ideas/:id/files', upload.single('file'), async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      // Check if idea exists
      const idea = await database.getIdeaById(id);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      const fileId = uuidv4();
      const fileRecord = await database.addFile(
        fileId,
        id,
        req.file.filename,
        req.file.originalname,
        req.file.path,
        req.file.mimetype,
        req.file.size
      );
      
      res.status(201).json(fileRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve uploaded files
  router.get('/api/files/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  return router;
}

module.exports = createRoutes;

