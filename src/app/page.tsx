'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<'new-entry' | 'back-in-time'>('new-entry');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [entryContent, setEntryContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedContent, setSavedContent] = useState<string>('');
  
  // Get current date in MM/DD/YYYY format
  const getCurrentDate = () => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Set date on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    setCurrentDate(getCurrentDate());
  }, []);

  // Handle editing saved entry
  const handleEditEntry = () => {
    setIsEditing(true);
    setEntryContent(savedContent); // Restore the saved content for editing
  };

  // Handle updating existing entry
  const handleUpdateEntry = async () => {
    if (!entryContent.trim()) {
      setSaveMessage('Please write something before saving.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch(`/api/entries/${savedEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: entryContent.trim(),
        }),
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        setSavedContent(entryContent.trim()); // Update saved content
        setIsEditing(false); // Exit edit mode
        setSaveMessage(''); // Clear any previous messages
      } else {
        const errorData = await response.json();
        setSaveMessage(errorData.error || 'Failed to update entry. Please try again.');
        setTimeout(() => setSaveMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      setSaveMessage('Network error. Please check your connection and try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEntryContent(savedContent); // Restore original content
    setSaveMessage('');
  };



  // Handle saving entry to database
  const handleSaveEntry = async () => {
    if (!entryContent.trim()) {
      setSaveMessage('Please write something before saving.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: entryContent.trim(),
        }),
      });

      if (response.ok) {
        const savedEntry = await response.json();
        setSavedEntryId(savedEntry.id);
        setSavedContent(entryContent.trim()); // Store the saved content
        setIsEditing(false); // Not in edit mode after saving
        setSaveMessage(''); // Clear any previous messages
      } else {
        const errorData = await response.json();
        setSaveMessage(errorData.error || 'Failed to save entry. Please try again.');
        setTimeout(() => setSaveMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setSaveMessage('Network error. Please check your connection and try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ap-container">
      <div className="header">
        Memora
      </div>

      <div className="switch-bar">
        <div 
          className={`switch-option ${selectedTab === 'new-entry' ? 'selected' : 'unselected new-entry'}`}
          onClick={() => setSelectedTab('new-entry')}
        >
          New Entry
        </div>
        <div 
          className={`switch-option ${selectedTab === 'back-in-time' ? 'selected' : 'unselected back-in-time'}`}
          onClick={() => setSelectedTab('back-in-time')}
        >
          Back In Time
        </div>
      </div>


    <div className="new-entry-section">
      <div className="new-entry-header">
        <div className="new-entry-date">{isMounted ? currentDate : ''}</div>
        <div className="new-entry-caption"> Today's Entry </div>
      </div>
      
      <div className="new-entry-container">
        <textarea 
          placeholder={savedEntryId && !isEditing ? "" : "What's on your mind today?"}
          className="new-entry-content"
          value={savedEntryId && !isEditing ? savedContent : entryContent}
          onChange={(e) => setEntryContent(e.target.value)}
          disabled={isSaving || (savedEntryId !== null && !isEditing)}
        />
      </div>
      
      {savedEntryId ? (
        isEditing ? (
          <div className="edit-actions">
            <button 
              className="save-entry-btn"
              onClick={handleUpdateEntry}
              disabled={isSaving || !entryContent.trim()}
            >
              {isSaving ? 'Updating...' : 'Update Entry'}
            </button>
            <button 
              className="cancel-edit-btn"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            className="view-entry-btn"
            onClick={handleEditEntry}
          >
            Edit Entry
          </button>
        )
      ) : (
        <button 
          className="save-entry-btn"
          onClick={handleSaveEntry}
          disabled={isSaving || !entryContent.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Entry'}
        </button>
      )}
      
      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}
    </div>
    
    <div className="past-entries-tab">
      Past Entries
    </div>
    </div>
  );
}