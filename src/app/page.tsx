'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: number;
  text: string;
  type: 'incoming' | 'outgoing';
}

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<'new-entry' | 'back-in-time'>('new-entry');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, text: "Hello! How are you doing today?", type: 'incoming' },
    { id: 2, text: "I'm doing great! Just working on some new projects.", type: 'outgoing' },
    { id: 3, text: "That sounds exciting! What kind of projects?", type: 'incoming' },
    { id: 4, text: "Working on a new app called Memora - it's a digital journaling platform.", type: 'outgoing' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleNewChat = () => {
    setSelectedTimePeriod(null);
    setChatMessages([
      { id: 1, text: "Hello! How are you doing today?", type: 'incoming' },
      { id: 2, text: "I'm doing great! Just working on some new projects.", type: 'outgoing' },
      { id: 3, text: "That sounds exciting! What kind of projects?", type: 'incoming' },
      { id: 4, text: "Working on a new app called Memora - it's a digital journaling platform.", type: 'outgoing' }
    ]);
    setCurrentMessage('');
  };

  const handleTimePeriodClick = (period: string) => {
    setSelectedTimePeriod(period);
  };

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now(),
        text: currentMessage.trim(),
        type: 'outgoing'
      };
      
      setChatMessages(prev => [...prev, newMessage]);
      setCurrentMessage('');
      
      // Clear the input field
      const inputElement = document.querySelector('.chat-text-input') as HTMLElement;
      if (inputElement) {
        inputElement.textContent = '';
      }
      
      // Add preset incoming response after a short delay
      setTimeout(() => {
        const response: ChatMessage = {
          id: Date.now() + 1,
          text: "This is a test response and I'm going to keep it going with more text to see how the chat interface handles longer messages that might wrap to multiple lines.",
          type: 'incoming'
        };
        setChatMessages(prev => [...prev, response]);
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
          <div className="new-chat-btn" onClick={handleNewChat}>New Chat</div>
        </div>
        
        <div className="back-in-time-expanded-container">
          <div className="chat-messages" ref={chatMessagesRef}>
            {chatMessages.map((message) => (
              <div key={message.id} className={`chat-message ${message.type}`}>
                <div className="message-text">{message.text}</div>
              </div>
            ))}
          </div>
          
          <div className="chat-input-bar">
            <div className="chat-text-container">
              <div 
                className="chat-text-input" 
                contentEditable="true" 
                data-placeholder="Type your message..."
                onInput={(e) => setCurrentMessage(e.currentTarget.textContent || '')}
                onKeyPress={handleKeyPress}
                suppressContentEditableWarning={true}
              ></div>
            </div>
            <div className="chat-send-container">
              <div className="chat-send-btn" onClick={handleSendMessage}>Send</div>
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