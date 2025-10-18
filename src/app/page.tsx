'use client';

import { useState, useEffect } from 'react';
import { JournalEntry, PastSelfQuery, PastSelfResponse, TimePeriodPreset, CreateEntryRequest } from '../types';
import { TimePeriodPresets } from '../utils/time-period-presets';
import { mockEntries, generateMockPastSelfResponse } from '../utils/demo-data';

interface ConversationMessage {
  id: string;
  type: 'user' | 'past-self';
  content: string;
  timestamp: Date;
  references?: PastSelfResponse['references'];
  metadata?: PastSelfResponse['metadata'];
}

export default function Home() {
  // State for journal entries
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryDate, setNewEntryDate] = useState('');
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);

  // State for past-self conversations
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<TimePeriodPreset | ''>('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  // State for UI
  const [activeTab, setActiveTab] = useState<'entries' | 'chat'>('entries');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Load entries on component mount or when demo mode changes
  useEffect(() => {
    loadEntries();
  }, [demoMode]);

  const loadEntries = async () => {
    if (demoMode) {
      setEntries(mockEntries);
      return;
    }

    try {
      const response = await fetch('/api/entries?limit=50');
      if (!response.ok) {
        throw new Error('Failed to load entries');
      }
      const data = await response.json();
      setEntries(data.entries.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      })));
    } catch (err) {
      setError(`Failed to load entries: ${err instanceof Error ? err.message : 'Unknown error'}. Try enabling demo mode.`);
      // Auto-enable demo mode if API fails
      setDemoMode(true);
      setEntries(mockEntries);
    }
  };

  const createEntry = async () => {
    if (!newEntryContent.trim()) {
      setError('Please enter some content for your journal entry');
      return;
    }

    setIsCreatingEntry(true);
    setError(null);

    if (demoMode) {
      // Demo mode: create mock entry
      const newEntry: JournalEntry = {
        id: `demo-${Date.now()}`,
        content: newEntryContent.trim(),
        createdAt: newEntryDate ? new Date(newEntryDate) : new Date(),
        updatedAt: new Date()
      };
      
      setEntries(prev => [newEntry, ...prev]);
      setNewEntryContent('');
      setNewEntryDate('');
      setSuccess('Journal entry created successfully! (Demo mode)');
      setTimeout(() => setSuccess(null), 3000);
      setIsCreatingEntry(false);
      return;
    }

    try {
      const requestBody: CreateEntryRequest = {
        content: newEntryContent.trim(),
        ...(newEntryDate && { createdAt: new Date(newEntryDate).toISOString() })
      };

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create entry');
      }

      const newEntry = await response.json();
      setEntries(prev => [
        { ...newEntry, createdAt: new Date(newEntry.createdAt), updatedAt: new Date(newEntry.updatedAt) },
        ...prev
      ]);
      setNewEntryContent('');
      setNewEntryDate('');
      setSuccess('Journal entry created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setIsCreatingEntry(false);
    }
  };

  const queryPastSelf = async () => {
    if (!currentQuery.trim()) {
      setError('Please enter a question for your past self');
      return;
    }

    setIsQuerying(true);
    setError(null);

    if (demoMode) {
      // Demo mode: generate mock response
      const pastSelfResponse = generateMockPastSelfResponse(currentQuery);
      
      // Add user message
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: currentQuery,
        timestamp: new Date()
      };

      // Add past-self response
      const pastSelfMessage: ConversationMessage = {
        id: `past-self-${Date.now()}`,
        type: 'past-self',
        content: pastSelfResponse.response,
        timestamp: new Date(),
        references: pastSelfResponse.references,
        metadata: pastSelfResponse.metadata
      };

      setConversations(prev => [...prev, userMessage, pastSelfMessage]);
      setCurrentQuery('');
      setIsQuerying(false);
      return;
    }

    try {
      const queryBody: PastSelfQuery = {
        query: currentQuery.trim(),
        ...(selectedPreset && { preset: selectedPreset }),
        ...(!selectedPreset && customStartDate && customEndDate && {
          timePeriod: {
            start: new Date(customStartDate),
            end: new Date(customEndDate)
          }
        })
      };

      const response = await fetch('/api/past-self/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to query past self');
      }

      const pastSelfResponse: PastSelfResponse = await response.json();

      // Add user message
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: currentQuery,
        timestamp: new Date()
      };

      // Add past-self response
      const pastSelfMessage: ConversationMessage = {
        id: `past-self-${Date.now()}`,
        type: 'past-self',
        content: pastSelfResponse.response,
        timestamp: new Date(),
        references: pastSelfResponse.references.map(ref => ({
          ...ref,
          date: new Date(ref.date)
        })),
        metadata: {
          ...pastSelfResponse.metadata,
          timePeriod: {
            start: new Date(pastSelfResponse.metadata.timePeriod.start),
            end: new Date(pastSelfResponse.metadata.timePeriod.end)
          }
        }
      };

      setConversations(prev => [...prev, userMessage, pastSelfMessage]);
      setCurrentQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query past self');
    } finally {
      setIsQuerying(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const presets = TimePeriodPresets.getAllPresets();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Memora</h1>
        <p className="app-subtitle">Your AI-powered journal and past-self conversation companion</p>
        
        <div className="demo-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-slider"></span>
            Demo Mode {demoMode ? '(ON)' : '(OFF)'}
          </label>
          <small className="toggle-help">
            {demoMode 
              ? 'Using mock data for demonstration. Toggle off to connect to real API.' 
              : 'Connect to real database and API. Toggle on for demo with mock data.'
            }
          </small>
        </div>
      </header>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      <nav className="tab-nav">
        <button 
          className={`tab-button ${activeTab === 'entries' ? 'active' : ''}`}
          onClick={() => setActiveTab('entries')}
        >
          Journal Entries ({entries.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Past-Self Chat
        </button>
      </nav>

      {activeTab === 'entries' && (
        <div className="entries-section">
          <div className="entry-form">
            <h2>Write a Journal Entry</h2>
            <div className="form-group">
              <label htmlFor="entry-content">Content:</label>
              <textarea
                id="entry-content"
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                placeholder="What's on your mind today?"
                rows={6}
                maxLength={10000}
                className="entry-textarea"
              />
              <div className="char-count">
                {newEntryContent.length}/10,000 characters
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="entry-date">Date (optional):</label>
              <input
                id="entry-date"
                type="datetime-local"
                value={newEntryDate}
                onChange={(e) => setNewEntryDate(e.target.value)}
                className="date-input"
              />
              <small className="form-help">Leave empty to use current date and time</small>
            </div>
            <button 
              onClick={createEntry}
              disabled={isCreatingEntry || !newEntryContent.trim()}
              className="btn btn-primary"
            >
              {isCreatingEntry ? 'Creating...' : 'Create Entry'}
            </button>
          </div>

          <div className="entries-list">
            <h2>Your Journal Entries</h2>
            {entries.length === 0 ? (
              <div className="empty-state">
                <p>No journal entries yet. Create your first entry above to start conversations with your past self!</p>
              </div>
            ) : (
              <div className="entries-grid">
                {entries.map((entry) => (
                  <div key={entry.id} className="entry-card">
                    <div className="entry-header">
                      <span className="entry-date">{formatDate(entry.createdAt)}</span>
                    </div>
                    <div className="entry-content">
                      {entry.content.length > 200 
                        ? `${entry.content.substring(0, 200)}...`
                        : entry.content
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="chat-section">
          <div className="query-form">
            <h2>Ask Your Past Self</h2>
            <div className="form-group">
              <label htmlFor="query-input">Your Question:</label>
              <textarea
                id="query-input"
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                placeholder="What was I thinking about my career last year?"
                rows={3}
                className="query-textarea"
              />
            </div>

            <div className="time-period-section">
              <h3>Time Period</h3>
              <div className="form-group">
                <label htmlFor="preset-select">Quick Presets:</label>
                <select
                  id="preset-select"
                  value={selectedPreset}
                  onChange={(e) => {
                    setSelectedPreset(e.target.value as TimePeriodPreset | '');
                    if (e.target.value) {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }
                  }}
                  className="preset-select"
                >
                  <option value="">Select a time period...</option>
                  <optgroup label="Recent">
                    {presets.filter(p => ['1-month-ago', '3-months-ago', '6-months-ago'].includes(p.id)).map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Years Ago">
                    {presets.filter(p => ['1-year-ago', '2-years-ago', '3-years-ago', '5-years-ago', '10-years-ago'].includes(p.id)).map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Life Stages">
                    {presets.filter(p => ['high-school-years', 'college-years', 'early-career', 'last-decade'].includes(p.id)).map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="custom-dates">
                <p>Or specify custom date range:</p>
                <div className="date-range">
                  <div className="form-group">
                    <label htmlFor="start-date">Start Date:</label>
                    <input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        if (e.target.value) setSelectedPreset('');
                      }}
                      className="date-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end-date">End Date:</label>
                    <input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        if (e.target.value) setSelectedPreset('');
                      }}
                      className="date-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={queryPastSelf}
              disabled={isQuerying || !currentQuery.trim() || entries.length === 0}
              className="btn btn-primary"
            >
              {isQuerying ? 'Asking...' : 'Ask Past Self'}
            </button>

            {entries.length === 0 && (
              <p className="form-help">Create some journal entries first to start conversations with your past self!</p>
            )}
          </div>

          <div className="conversation-history">
            <h2>Conversation History</h2>
            {conversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet. Ask your past self a question above!</p>
              </div>
            ) : (
              <div className="messages">
                {conversations.map((message) => (
                  <div key={message.id} className={`message ${message.type}`}>
                    <div className="message-header">
                      <span className="message-sender">
                        {message.type === 'user' ? 'You' : 'Past Self'}
                      </span>
                      <span className="message-time">{formatDate(message.timestamp)}</span>
                    </div>
                    <div className="message-content">
                      {message.content}
                    </div>
                    {message.references && message.references.length > 0 && (
                      <div className="message-references">
                        <h4>Based on these journal entries:</h4>
                        {message.references.map((ref, index) => (
                          <div key={ref.entryId} className="reference">
                            <div className="reference-header">
                              <span className="reference-date">{formatDate(ref.date)}</span>
                              <span className="reference-score">
                                Relevance: {Math.round(ref.relevanceScore * 100)}%
                              </span>
                            </div>
                            <div className="reference-excerpt">"{ref.excerpt}"</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.metadata && (
                      <div className="message-metadata">
                        <small>
                          Searched {message.metadata.entriesSearched} entries from{' '}
                          {formatDate(message.metadata.timePeriod.start)} to{' '}
                          {formatDate(message.metadata.timePeriod.end)}
                          {message.metadata.warning && (
                            <span className="metadata-warning"> • {message.metadata.warning}</span>
                          )}
                        </small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
