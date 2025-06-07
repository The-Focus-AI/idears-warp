class IdeasApp {
  constructor() {
    this.ideas = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadIdeas();
  }

  setupEventListeners() {
    const ideaForm = document.getElementById('ideaForm');
    ideaForm.addEventListener('submit', this.handleAddIdea.bind(this));
  }

  async loadIdeas() {
    try {
      const response = await fetch('/api/ideas');
      if (!response.ok) throw new Error('Failed to load ideas');
      
      this.ideas = await response.json();
      this.renderIdeas();
    } catch (error) {
      this.showMessage('Error loading ideas: ' + error.message, 'error');
    }
  }

  async handleAddIdea(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();
    
    if (!title) {
      this.showMessage('Title is required', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add idea');
      }
      
      const newIdea = await response.json();
      this.ideas.unshift(newIdea);
      this.renderIdeas();
      event.target.reset();
      this.showMessage('Idea added successfully!', 'success');
    } catch (error) {
      this.showMessage('Error adding idea: ' + error.message, 'error');
    }
  }

  async handleVote(ideaId) {
    try {
      const response = await fetch(`/api/ideas/${ideaId}/vote`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }
      
      const updatedIdea = await response.json();
      const ideaIndex = this.ideas.findIndex(idea => idea.id === ideaId);
      if (ideaIndex !== -1) {
        this.ideas[ideaIndex] = updatedIdea;
        this.sortIdeas();
        this.renderIdeas();
      }
    } catch (error) {
      this.showMessage('Error voting: ' + error.message, 'error');
    }
  }

  async handleAddNote(ideaId, content) {
    try {
      const response = await fetch(`/api/ideas/${ideaId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add note');
      }
      
      await this.loadIdeaDetails(ideaId);
      this.showMessage('Note added successfully!', 'success');
    } catch (error) {
      this.showMessage('Error adding note: ' + error.message, 'error');
    }
  }

  async handleAddFile(ideaId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/ideas/${ideaId}/files`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add file');
      }
      
      await this.loadIdeaDetails(ideaId);
      this.showMessage('File added successfully!', 'success');
    } catch (error) {
      this.showMessage('Error adding file: ' + error.message, 'error');
    }
  }

  async loadIdeaDetails(ideaId) {
    try {
      const response = await fetch(`/api/ideas/${ideaId}`);
      if (!response.ok) throw new Error('Failed to load idea details');
      
      const ideaDetails = await response.json();
      const ideaIndex = this.ideas.findIndex(idea => idea.id === ideaId);
      if (ideaIndex !== -1) {
        this.ideas[ideaIndex] = ideaDetails;
        this.renderIdeas();
      }
    } catch (error) {
      this.showMessage('Error loading idea details: ' + error.message, 'error');
    }
  }

  sortIdeas() {
    this.ideas.sort((a, b) => {
      if (b.votes !== a.votes) {
        return b.votes - a.votes;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  renderIdeas() {
    const container = document.getElementById('ideasContainer');
    
    if (this.ideas.length === 0) {
      container.innerHTML = '<div class="loading">No ideas yet. Add the first one above!</div>';
      return;
    }
    
    container.innerHTML = `
      <div class="ideas-list">
        ${this.ideas.map(idea => this.renderIdeaCard(idea)).join('')}
      </div>
    `;
    
    this.attachIdeaEventListeners();
  }

  renderIdeaCard(idea) {
    const createdDate = new Date(idea.created_at).toLocaleDateString();
    const notes = idea.notes || [];
    const files = idea.files || [];
    
    return `
      <div class="idea-card" data-idea-id="${idea.id}">
        <div class="idea-header">
          <div>
            <h3 class="idea-title">${this.escapeHtml(idea.title)}</h3>
            ${idea.description ? `<p class="idea-description">${this.escapeHtml(idea.description)}</p>` : ''}
          </div>
          <div class="vote-section">
            <button class="vote-btn" data-vote-id="${idea.id}">👍 Vote</button>
            <span class="vote-count">${idea.votes} votes</span>
          </div>
        </div>
        
        ${notes.length > 0 ? `
          <div class="notes-section">
            <div class="section-title">📝 Notes (${notes.length})</div>
            ${notes.map(note => `
              <div class="note">
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                <div class="note-date">${new Date(note.created_at).toLocaleDateString()}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${files.length > 0 ? `
          <div class="files-section">
            <div class="section-title">📎 Files (${files.length})</div>
            ${files.map(file => `
              <div class="file">
                <a href="/api/files/${file.filename}" target="_blank" class="file-name">
                  ${this.escapeHtml(file.original_name)}
                </a>
                <div class="file-meta">${this.formatFileSize(file.size)} • ${new Date(file.created_at).toLocaleDateString()}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="idea-actions">
          <button class="toggle-btn" data-toggle-note="${idea.id}">Add Note</button>
          <button class="toggle-btn" data-toggle-file="${idea.id}">Add File</button>
        </div>
        
        <div class="add-note-form" data-note-form="${idea.id}">
          <textarea placeholder="Add a note..." rows="3"></textarea>
          <button class="btn" data-add-note="${idea.id}">Add Note</button>
        </div>
        
        <div class="add-file-form" data-file-form="${idea.id}">
          <input type="file" class="file-input" accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.md">
          <button class="btn" data-add-file="${idea.id}">Add File</button>
        </div>
        
        <div class="idea-meta">
          <span>Created: ${createdDate}</span>
          <span>ID: ${idea.id.substring(0, 8)}...</span>
        </div>
      </div>
    `;
  }

  attachIdeaEventListeners() {
    // Vote buttons
    document.querySelectorAll('[data-vote-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ideaId = e.target.getAttribute('data-vote-id');
        this.handleVote(ideaId);
      });
    });
    
    // Toggle note form buttons
    document.querySelectorAll('[data-toggle-note]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ideaId = e.target.getAttribute('data-toggle-note');
        const form = document.querySelector(`[data-note-form="${ideaId}"]`);
        form.classList.toggle('active');
      });
    });
    
    // Toggle file form buttons
    document.querySelectorAll('[data-toggle-file]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ideaId = e.target.getAttribute('data-toggle-file');
        const form = document.querySelector(`[data-file-form="${ideaId}"]`);
        form.classList.toggle('active');
      });
    });
    
    // Add note buttons
    document.querySelectorAll('[data-add-note]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ideaId = e.target.getAttribute('data-add-note');
        const form = document.querySelector(`[data-note-form="${ideaId}"]`);
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();
        
        if (content) {
          this.handleAddNote(ideaId, content);
          textarea.value = '';
          form.classList.remove('active');
        }
      });
    });
    
    // Add file buttons
    document.querySelectorAll('[data-add-file]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ideaId = e.target.getAttribute('data-add-file');
        const form = document.querySelector(`[data-file-form="${ideaId}"]`);
        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput.files[0];
        
        if (file) {
          this.handleAddFile(ideaId, file);
          fileInput.value = '';
          form.classList.remove('active');
        }
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="${type}">${message}</div>`;
    
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 5000);
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new IdeasApp();
});

