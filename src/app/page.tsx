'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<'new-entry' | 'back-in-time'>('new-entry');

  // Get current date in MM/DD/YYYY format
  const getCurrentDate = () => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
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
          <div className="new-entry-date">{getCurrentDate()}</div>
          <div className="new-entry-caption"> Today's Entry </div>
        </div>

        <div className="new-entry-container">
          <textarea
            placeholder="What's on your mind today?"
            className="new-entry-content"
          />
        </div>

        <button className="save-entry-btn">
          Save Entry
        </button>
      </div>

      <div className="past-entries-tab">
        Past Entries
      </div>
    </div>
  );
}