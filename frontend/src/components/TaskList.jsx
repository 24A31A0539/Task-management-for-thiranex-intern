// src/components/TaskList.jsx – Premium Dashboard and Tasks list
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000');

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'
  
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || 'User';
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  // Load tasks initially
  const loadTasks = async () => {
    try {
      const res = await api.get('/api/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    loadTasks();
    
    // Listen for real‑time updates
    socket.on('tasks-updated', (payload) => {
      if (payload.userId === currentUserId) {
        loadTasks();
      }
    });

    return () => {
      socket.off('tasks-updated');
    };
  }, [currentUserId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      if (editingId) {
        // Edit Mode
        await api.put(`/api/tasks/${editingId}`, {
          title,
          description,
          due_date: dueDate || null,
          status: tasks.find(t => t.id === editingId)?.status || 'pending'
        });
        setEditingId(null);
      } else {
        // Create Mode
        await api.post('/api/tasks', {
          title,
          description,
          due_date: dueDate || null,
          status: 'pending'
        });
      }
      
      // Reset form fields
      setTitle('');
      setDescription('');
      setDueDate('');
      loadTasks();
    } catch (err) {
      console.error('Submit task error', err);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/api/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        status: newStatus
      });
      loadTasks();
    } catch (err) {
      console.error('Update status error', err);
    }
  };

  const handleEditClick = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.due_date || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDueDate('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      loadTasks();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  // Helper check for overdue tasks
  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Filtered & Searched Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  // Calculate Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="animated-fade-in">
      {/* Header bar */}
      <header className="nav-bar">
        <div className="brand-logo">
          <span>FocusBoard</span>
          <span>✨</span>
        </div>
        <div className="user-badge">
          <span className="user-email">{userEmail}</span>
          <button id="logout-btn" className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Stats Board */}
      <section className="stats-container">
        <div className="stat-box">
          <div className="stat-val">{totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: 'var(--warning)' }}>{pendingTasks}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: 'var(--success)' }}>{completedTasks}</div>
          <div className="stat-label">Completed</div>
        </div>
      </section>

      {/* Main Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Left Column: Form Card */}
        <aside>
          <div className="glass-card">
            <h3 className="form-title">
              {editingId ? '✏️ Edit Task' : '➕ Add Task'}
            </h3>
            <form onSubmit={handleFormSubmit}>
              <div className="input-group">
                <label className="input-label" htmlFor="task-title-input">Task Title</label>
                <input
                  id="task-title-input"
                  className="input-field"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="task-desc-input">Description</label>
                <textarea
                  id="task-desc-input"
                  className="input-field"
                  placeholder="Add details (optional)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="task-date-input">Due Date</label>
                <input
                  id="task-date-input"
                  className="input-field"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button id="task-submit-btn" className="btn-primary" type="submit" style={{ flexGrow: 1 }}>
                  {editingId ? 'Save Changes' : 'Create Task'}
                </button>
                {editingId && (
                  <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </aside>

        {/* Right Column: Search, Filter, and Card List */}
        <main>
          {/* Filters and Search */}
          <div className="filters-bar">
            {/* Search Input */}
            <input
              id="search-tasks-input"
              className="input-field"
              placeholder="🔍 Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '300px' }}
            />

            {/* Filter Toggle Buttons */}
            <div className="filter-btn-group">
              <button
                id="filter-all-btn"
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button
                id="filter-pending-btn"
                className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </button>
              <button
                id="filter-completed-btn"
                className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Cards List */}
          {filteredTasks.length === 0 ? (
            <div className="no-tasks animated-fade-in">
              <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No tasks found</p>
              <p style={{ fontSize: '0.95rem' }}>Use the left panel to create a new task or try clearing filters.</p>
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map((t) => {
                const overdue = isOverdue(t.due_date, t.status);
                return (
                  <div key={t.id} className="task-card animated-fade-in">
                    <div>
                      <div className="task-header">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={t.status === 'completed'}
                            onChange={() => handleToggleStatus(t)}
                          />
                          <span className="custom-checkbox"></span>
                        </label>
                        <span className={`badge badge-${t.status}`}>
                          {t.status}
                        </span>
                      </div>
                      
                      <h4 className={`task-title ${t.status === 'completed' ? 'completed' : ''}`}>
                        {t.title}
                      </h4>
                      {t.description && <p className="task-description">{t.description}</p>}
                    </div>

                    <div className="task-footer">
                      <div className="task-meta">
                        {t.due_date && (
                          <span className={`task-due-date ${overdue ? 'overdue' : ''}`}>
                            📅 {overdue ? 'Overdue: ' : 'Due: '}{t.due_date}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleEditClick(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(t.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
