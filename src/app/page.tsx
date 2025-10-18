'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<'new-entry' | 'back-in-time'>('new-entry');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string | null>(null);

  const handleTimePeriodClick = (period: string) => {
    setSelectedTimePeriod(period);
  };

  return (
    <div className="ap-container">
      <div className="header">
        Memora
      </div>

      <div className={`switch-bar ${selectedTab === 'back-in-time' && !selectedTimePeriod ? 'back-in-time-margin' : ''}`}>
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


    {selectedTab === 'new-entry' && (
      <div className="new-entry-section">
        <div className="new-entry-header">
          <div className="new-entry-date"> 10/17/2025 </div>
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
    )}

    {selectedTab === 'back-in-time' && !selectedTimePeriod && (
      <div className="back-in-time-section">
        <div className="back-in-time-header">
          <div className="back-in-time-caption">
            What <span className="italic-text">Version of Yourself</span> do you want to chat to?
          </div>
        </div>
        
        <div className="back-in-time-container">
          <div className="time-period-btn" onClick={() => handleTimePeriodClick('5-years')}>5 Years Ago</div>
          <div className="time-period-btn" onClick={() => handleTimePeriodClick('3-years')}>3 Years Ago</div>
          <div className="time-period-btn" onClick={() => handleTimePeriodClick('1-year')}>1 Year Ago</div>
        </div>
      </div>
    )}

    {selectedTab === 'back-in-time' && selectedTimePeriod && (
      <div className="back-in-time-expanded-section">
        <div className="back-in-time-expanded-header">
          <div className="back-in-time-expanded-caption">You from October 18, 2022</div>
        </div>
        
        <div className="back-in-time-expanded-container">
          <div className="chat-messages">
            <div className="chat-message incoming">
              <div className="message-text">Hello! How are you doing today?</div>
            </div>
            
            <div className="chat-message outgoing">
              <div className="message-text">I'm doing great! Just working on some new projects.</div>
            </div>
            
            <div className="chat-message incoming">
              <div className="message-text">That sounds exciting! What kind of projects?</div>
            </div>
            
            <div className="chat-message outgoing">
              <div className="message-text">Working on a new app called Memora - it's a digital journaling platform.</div>
            </div>
          </div>
          
          <div className="chat-input-bar">
            <div className="chat-text-container">
              <div className="chat-text-input" contentEditable="true" data-placeholder="Type your message..."></div>
            </div>
            <div className="chat-send-container">
              <div className="chat-send-btn">Send</div>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {selectedTab === 'new-entry' && (
      <div className="past-entries-tab">
        Past Entries
      </div>
    )}
    </div>
  );
}