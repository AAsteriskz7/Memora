'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: number;
  text: string;
  type: 'incoming' | 'outgoing';
}

interface PersonaData {
  personaPrompt: string;
  summary: string;
  timePeriod: {
    start: string;
    end: string;
  };
  entriesAnalyzed: number;
}

interface TimePeriodConfig {
  id: string;
  label: string;
  getDateRange: () => { start: Date; end: Date };
}

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<'new-entry' | 'back-in-time'>('new-entry');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
    setCurrentDate(new Date().toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    }));
  }, []);

  // Time period configurations
  const timePeriods: TimePeriodConfig[] = [
    {
      id: '5-years',
      label: '5 Years Ago',
      getDateRange: () => {
        const now = new Date();
        // Target: 5 years ago (2020)
        const targetDate = new Date(now);
        targetDate.setFullYear(now.getFullYear() - 5);
        
        // Context window: 2 years before target to target (2018-2020)
        const startDate = new Date(targetDate);
        startDate.setFullYear(targetDate.getFullYear() - 2);
        
        return { start: startDate, end: targetDate };
      }
    },
    {
      id: '3-years',
      label: '3 Years Ago',
      getDateRange: () => {
        const now = new Date();
        // Target: 3 years ago (2022)
        const targetDate = new Date(now);
        targetDate.setFullYear(now.getFullYear() - 3);
        
        // Context window: 2 years before target to target (2020-2022)
        const startDate = new Date(targetDate);
        startDate.setFullYear(targetDate.getFullYear() - 2);
        
        return { start: startDate, end: targetDate };
      }
    },
    {
      id: '1-year',
      label: '1 Year Ago',
      getDateRange: () => {
        const now = new Date();
        // Target: 1 year ago (2024)
        const targetDate = new Date(now);
        targetDate.setFullYear(now.getFullYear() - 1);
        
        // Context window: 2 years before target to target (2022-2024)
        const startDate = new Date(targetDate);
        startDate.setFullYear(targetDate.getFullYear() - 2);
        
        return { start: startDate, end: targetDate };
      }
    }
  ];

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Generate persona for selected time period
  const generatePersona = async (timePeriodId: string) => {
    setIsLoadingPersona(true);
    setError(null);

    try {
      const timePeriodConfig = timePeriods.find(tp => tp.id === timePeriodId);
      if (!timePeriodConfig) {
        throw new Error('Invalid time period');
      }

      const dateRange = timePeriodConfig.getDateRange();

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/api/past-self/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timePeriod: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate persona');
      }

      const personaResponse = await response.json();
      setPersonaData(personaResponse);
      setChatMessages([]);

    } catch (error) {
      console.error('Error generating persona:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timed out. Please try again with a shorter time period.');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to generate persona');
      }
    } finally {
      setIsLoadingPersona(false);
    }
  };

  const handleNewChat = () => {
    setSelectedTimePeriod(null);
    setPersonaData(null);
    setChatMessages([]);
    setCurrentMessage('');
    setError(null);
  };

  const handleTimePeriodClick = async (period: string) => {
    setSelectedTimePeriod(period);
    await generatePersona(period);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !personaData || isLoadingResponse) {
      return;
    }

    const userMessage = currentMessage.trim();
    const newUserMessage: ChatMessage = {
      id: Date.now(),
      text: userMessage,
      type: 'outgoing'
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setCurrentMessage('');
    setIsLoadingResponse(true);

    // Clear the input field
    const inputElement = document.querySelector('.chat-text-input') as HTMLElement;
    if (inputElement) {
      inputElement.textContent = '';
    }

    try {
      // Convert chat messages to API format
      const conversationHistory = chatMessages.map(msg => ({
        role: msg.type === 'outgoing' ? 'user' : 'assistant' as const,
        message: msg.text
      }));

      const response = await fetch('/api/past-self/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          timePeriod: personaData.timePeriod,
          personaPrompt: personaData.personaPrompt,
          conversationHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const chatResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        text: chatResponse.response,
        type: 'incoming'
      };

      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        type: 'incoming'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveEntry = async () => {
    if (!newEntryContent.trim() || isSavingEntry) {
      return;
    }

    setIsSavingEntry(true);
    setError(null);

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newEntryContent.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save entry');
      }

      // Clear the entry content on successful save
      setNewEntryContent('');

      // Show success feedback (you could add a toast notification here)
      console.log('Entry saved successfully!');

    } catch (error) {
      console.error('Error saving entry:', error);
      setError(error instanceof Error ? error.message : 'Failed to save entry');
    } finally {
      setIsSavingEntry(false);
    }
  };

  // Get current date for display (using mounted state to prevent hydration errors)
  const getCurrentDate = () => {
    if (!isMounted) return ''; // Prevent hydration mismatch
    return currentDate;
  };

  // Get persona display text
  const getPersonaDisplayText = () => {
    if (!personaData || !isMounted) return '';

    // Use the END date as the target persona year (not start date)
    const targetDate = new Date(personaData.timePeriod.end);
    return `You from ${targetDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`;
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
            <div className="new-entry-date" suppressHydrationWarning={true}>
              {isMounted ? currentDate : ''}
            </div>
            <div className="new-entry-caption">Today's Entry</div>
          </div>

          <div className="new-entry-container">
            <textarea
              placeholder="What's on your mind today?"
              className="new-entry-content"
              value={newEntryContent}
              onChange={(e) => setNewEntryContent(e.target.value)}
            />
          </div>

          <button
            className="save-entry-btn"
            onClick={handleSaveEntry}
            disabled={!newEntryContent.trim() || isSavingEntry}
          >
            {isSavingEntry ? 'Saving...' : 'Save Entry'}
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
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
            {timePeriods.map((period) => (
              <div
                key={period.id}
                className="time-period-btn"
                onClick={() => handleTimePeriodClick(period.id)}
              >
                {period.label}
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'back-in-time' && selectedTimePeriod && (
        <div className="back-in-time-expanded-section">
          <div className="back-in-time-expanded-header">
            <div className="back-in-time-expanded-caption" suppressHydrationWarning={true}>
              {isLoadingPersona ? 'Loading...' : getPersonaDisplayText()}
            </div>
            <div className="new-chat-btn" onClick={handleNewChat}>New Chat</div>
          </div>

          {isLoadingPersona ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Analyzing your journal entries from this time period...</div>
              <div className="loading-subtext">This may take 30-60 seconds</div>
            </div>
          ) : personaData ? (
            <div className="back-in-time-expanded-container">
              <div className="chat-messages" ref={chatMessagesRef}>
                {chatMessages.length === 0 && isMounted && (
                  <div className="chat-message incoming">
                    <div className="message-text">
                      Hey! I'm you from {new Date(personaData.timePeriod.end).getFullYear()}.
                      What would you like to know about that time in our life?
                    </div>
                  </div>
                )}
                {chatMessages.map((message) => (
                  <div key={message.id} className={`chat-message ${message.type}`}>
                    <div className="message-text">{message.text}</div>
                  </div>
                ))}
                {isLoadingResponse && (
                  <div className="chat-message incoming">
                    <div className="message-text typing">Thinking...</div>
                  </div>
                )}
              </div>

              <div className="chat-input-bar">
                <div className="chat-text-container">
                  <div
                    className="chat-text-input"
                    contentEditable="true"
                    data-placeholder="Type your message..."
                    onInput={(e) => setCurrentMessage(e.currentTarget.textContent || '')}
                    onKeyDown={handleKeyDown}
                    suppressContentEditableWarning={true}
                  ></div>
                </div>
                <div className="chat-send-container">
                  <div
                    className={`chat-send-btn ${isLoadingResponse ? 'disabled' : ''}`}
                    onClick={handleSendMessage}
                  >
                    {isLoadingResponse ? 'Sending...' : 'Send'}
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-text">{error}</div>
              <button className="retry-btn" onClick={() => generatePersona(selectedTimePeriod)}>
                Try Again
              </button>
            </div>
          ) : null}
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