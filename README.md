# Ideas Collection Webapp

A simple, feature-rich webapp for collecting, voting, and collaborating on ideas. Built with Node.js, Express, SQLite, and vanilla JavaScript frontend.

## Features

- ✨ **Add Ideas**: Create new ideas with title and description
- 🗳️ **Voting System**: Vote on ideas to prioritize them
- 📝 **Notes**: Add detailed notes to ideas for better collaboration
- 📎 **File Attachments**: Attach files (images, documents) to ideas
- 🎯 **Auto-sorting**: Ideas automatically sort by vote count
- 💾 **Persistent Storage**: SQLite database with file storage
- 🐳 **Docker Ready**: Containerized with persistent volumes
- 🧪 **Fully Tested**: Comprehensive unit test coverage

## Quick Start

### Using Docker (Recommended)

1. **Clone and run with Docker Compose:**
   ```bash
   git clone <repository-url>
   cd ideas-webapp
   docker-compose up --build
   ```

2. **Access the app:**
   Open your browser to `http://localhost:3000`

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the application:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the app:**
   Open your browser to `http://localhost:3000`

## API Endpoints

### Ideas
- `GET /api/ideas` - Get all ideas (sorted by votes, then by date)
- `POST /api/ideas` - Create a new idea
- `GET /api/ideas/:id` - Get specific idea with notes and files
- `POST /api/ideas/:id/vote` - Vote for an idea

### Notes
- `POST /api/ideas/:id/notes` - Add a note to an idea

### Files
- `POST /api/ideas/:id/files` - Upload a file to an idea
- `GET /api/files/:filename` - Download/view an uploaded file

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
ideas-webapp/
├── src/
│   ├── app.js          # Main Express application
│   ├── database.js     # SQLite database service
│   └── routes.js       # API route handlers
├── public/
│   ├── index.html      # Frontend HTML
│   └── app.js          # Frontend JavaScript
├── test/
│   ├── database.test.js # Database tests
│   ├── routes.test.js   # API route tests
│   └── setup.js         # Test configuration
├── uploads/            # File upload directory (created at runtime)
├── data/              # SQLite database directory (created at runtime)
├── Dockerfile         # Docker container definition
├── docker-compose.yml # Docker Compose configuration
└── package.json       # Node.js dependencies and scripts
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `DB_PATH` - SQLite database file path (default: ./data/ideas.db)
- `NODE_ENV` - Environment (development/production)

### File Upload Limits

- **File size limit**: 10MB
- **Allowed file types**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.pdf`, `.doc`, `.docx`, `.txt`, `.md`

## Docker Deployment

### Persistent Volumes

The Docker setup includes persistent volumes for:
- **Database**: `ideas-data` volume mounted to `/app/data`
- **Uploads**: `ideas-uploads` volume mounted to `/app/uploads`

### Production Deployment

```bash
# Build and run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **File validation**: Type and size restrictions
- **Input sanitization**: SQL injection prevention
- **Non-root container**: Runs as nodejs user

## Database Schema

### Ideas Table
```sql
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  votes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Notes Table
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE
);
```

### Files Table
```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE
);
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## Health Check

The application includes a health check endpoint that verifies the API is responding correctly. In Docker, this is used for container health monitoring.

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in docker-compose.yml or use `PORT` environment variable
2. **Permission errors**: Ensure proper file permissions for data and uploads directories
3. **Database locked**: Make sure only one instance is running

### Logs

```bash
# View application logs
docker-compose logs ideas-app

# Follow logs in real-time
docker-compose logs -f ideas-app
```

## License

MIT License - see LICENSE file for details.

