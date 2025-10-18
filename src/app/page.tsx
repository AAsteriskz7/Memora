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
  const [isEntrySaved, setIsEntrySaved] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [showPastEntries, setShowPastEntries] = useState(false);
  const [isClosingPastEntries, setIsClosingPastEntries] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [pastEntries, setPastEntries] = useState<any[]>([]);
  const [isLoadingPastEntries, setIsLoadingPastEntries] = useState(false);
  const [pastEntriesPage, setPastEntriesPage] = useState(1);
  const [hasMoreEntries, setHasMoreEntries] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingPastEntry, setIsEditingPastEntry] = useState(false);
  const [editingEntryContent, setEditingEntryContent] = useState('');
  const [isSavingPastEntry, setIsSavingPastEntry] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Check if today's entry exists and fetch it
  const fetchTodaysEntry = async () => {
    try {
      // Get today's date in the user's timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // Fetch recent entries and filter for today on the client side
      const response = await fetch(`/api/entries?limit=10`);
      if (response.ok) {
        const data = await response.json();

        if (data.entries && data.entries.length > 0) {
          // Find entry created today
          const todaysEntry = data.entries.find((entry: any) => {
            const entryDate = new Date(entry.createdAt);
            const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
            return entryDateStr === todayStr;
          });

          if (todaysEntry) {
            setNewEntryContent(todaysEntry.content);
            setIsEntrySaved(true);
            setSavedEntryId(todaysEntry.id);
            setIsEditingEntry(false);
          } else {
            // No entry for today, reset state
            setNewEntryContent('');
            setIsEntrySaved(false);
            setSavedEntryId(null);
            setIsEditingEntry(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch today\'s entry:', error);
    }
  };

  // Fetch available years from user's journal entries
  const fetchAvailableYears = async () => {
    try {
      const response = await fetch('/api/entries?limit=1000');
      if (response.ok) {
        const data = await response.json();
        const entries = data.entries;

        if (entries.length > 0) {
          const years = entries
            .map((entry: any) => new Date(entry.createdAt).getFullYear())
            .filter((year: number, index: number, arr: number[]) => arr.indexOf(year) === index)
            .sort((a: number, b: number) => b - a); // Most recent first

          setAvailableYears(years);
        }
      }
    } catch (error) {
      console.error('Failed to fetch available years:', error);
    }
  };

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
    setCurrentDate(new Date().toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    }));

    // Fetch available years for the custom date picker
    fetchAvailableYears();

    // Check if today's entry exists
    fetchTodaysEntry();

    // Cleanup function to handle component unmounting
    return () => {
      setIsMounted(false);
    };
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

  // Dynamic loading messages
  const loadingMessages = [
    'Analyzing your journal entries...',
    'Understanding your personality from this time...',
    'Building your past self...',
    'Almost ready to chat...',
    'Finalizing your persona...'
  ];

  // Generate persona for selected time period with progressive loading
  const generatePersona = async (timePeriodId: string) => {
    setIsLoadingPersona(true);
    setError(null);

    let loadingInterval: NodeJS.Timeout | null = null;

    try {
      const timePeriodConfig = timePeriods.find(tp => tp.id === timePeriodId);
      if (!timePeriodConfig) {
        throw new Error('Invalid time period');
      }

      const dateRange = timePeriodConfig.getDateRange();
      const cacheKey = `persona-${timePeriodId}-${dateRange.start.getTime()}-${dateRange.end.getTime()}`;

      // Check localStorage cache first
      if (isMounted) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            const cacheAge = Date.now() - cachedData.timestamp;
            // Cache for 1 hour
            if (cacheAge < 60 * 60 * 1000) {
              console.log('Using cached persona');
              setPersonaData(cachedData.data);
              setChatMessages([]);
              setIsLoadingPersona(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue with API call
            localStorage.removeItem(cacheKey);
          }
        }
      }

      // Start dynamic loading text
      let messageIndex = 0;
      setLoadingText(loadingMessages[0]);
      loadingInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[messageIndex]);
      }, 2000); // Faster changes for perceived speed

      // First: Fast initial persona (3-5 entries)
      const fastResponse = await fetch('/api/past-self/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fast-mode': 'true'
        },
        body: JSON.stringify({
          timePeriod: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          }
        })
      });

      if (loadingInterval) clearInterval(loadingInterval);

      if (!fastResponse.ok) {
        const errorData = await fastResponse.json();
        throw new Error(errorData.error || 'Failed to generate persona');
      }

      const fastPersonaResponse = await fastResponse.json();

      // Show the fast persona immediately
      setPersonaData(fastPersonaResponse);
      setChatMessages([]);
      setIsLoadingPersona(false);

      // Cache the fast response
      if (isMounted) {
        try {
          localStorage.setItem(cacheKey + '-fast', JSON.stringify({
            data: fastPersonaResponse,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to cache fast persona:', e);
        }
      }

      // Background: Enhanced persona (more entries) - don't await this
      setTimeout(async () => {
        try {
          const enhancedResponse = await fetch('/api/past-self/persona', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timePeriod: {
                start: dateRange.start.toISOString(),
                end: dateRange.end.toISOString(),
              }
            })
          });

          if (enhancedResponse.ok) {
            const enhancedPersonaResponse = await enhancedResponse.json();

            // Silently upgrade the persona if user is still on same time period
            if (selectedTimePeriod === timePeriodId) {
              setPersonaData(enhancedPersonaResponse);

              // Cache the enhanced version
              if (isMounted) {
                try {
                  localStorage.setItem(cacheKey, JSON.stringify({
                    data: enhancedPersonaResponse,
                    timestamp: Date.now()
                  }));
                } catch (e) {
                  console.warn('Failed to cache enhanced persona:', e);
                }
              }
            }
          }
        } catch (error) {
          // Silently fail background enhancement
          console.log('Background persona enhancement failed:', error);
        }
      }, 100); // Start background enhancement after 100ms

      return; // Exit here for fast path

      // This code path should not be reached due to fast path above
      console.warn('Unexpected code path in generatePersona');

    } catch (error) {
      console.error('Error generating persona:', error);
      // Don't show AbortError to user, it's usually from component unmounting
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    } finally {
      if (loadingInterval) clearInterval(loadingInterval);
      setIsLoadingPersona(false);
    }
  };

  const handleNewChat = () => {
    setSelectedTimePeriod(null);
    setPersonaData(null);
    setChatMessages([]);
    setCurrentMessage('');
    setError(null);
    setLoadingText('');
  };

  const handleTimePeriodClick = async (period: string) => {
    setSelectedTimePeriod(period);
    await generatePersona(period);
  };

  const handleCustomDateSubmit = async () => {
    if (!selectedSeason || !selectedYear) {
      setError('Please select both season and year');
      return;
    }

    const year = parseInt(selectedYear);
    let startDate: Date;
    let endDate: Date;

    // Define season date ranges (from beginning of time to end of that season)
    startDate = new Date(2000, 0, 1); // Beginning of time (January 1, 2000)

    switch (selectedSeason) {
      case 'spring':
        endDate = new Date(year, 4, 31); // End of May
        break;
      case 'summer':
        endDate = new Date(year, 7, 31); // End of August
        break;
      case 'fall':
        endDate = new Date(year, 10, 30); // End of November
        break;
      case 'winter':
        endDate = new Date(year, 11, 31); // End of December
        break;
      default:
        setError('Invalid season selected');
        return;
    }

    if (endDate > new Date()) {
      setError('Selected period cannot be in the future');
      return;
    }

    // Generate persona with custom dates
    setSelectedTimePeriod('custom');
    await generatePersonaWithCustomDates(startDate, endDate);
  };

  const generatePersonaWithCustomDates = async (startDate: Date, endDate: Date) => {
    setIsLoadingPersona(true);
    setError(null);

    let loadingInterval: NodeJS.Timeout | null = null;

    try {
      const cacheKey = `persona-custom-${startDate.getTime()}-${endDate.getTime()}`;

      // Check localStorage cache first
      if (isMounted) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            const cacheAge = Date.now() - cachedData.timestamp;
            if (cacheAge < 60 * 60 * 1000) {
              setPersonaData(cachedData.data);
              setChatMessages([]);
              setIsLoadingPersona(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem(cacheKey);
          }
        }
      }

      // Start loading animation
      let messageIndex = 0;
      setLoadingText(loadingMessages[0]);
      loadingInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[messageIndex]);
      }, 2000);

      // Generate persona
      const response = await fetch('/api/past-self/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fast-mode': 'true'
        },
        body: JSON.stringify({
          timePeriod: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          }
        })
      });

      if (loadingInterval) clearInterval(loadingInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate persona');
      }

      const personaResponse = await response.json();
      setPersonaData(personaResponse);
      setChatMessages([]);
      setIsLoadingPersona(false);

      // Cache the response
      if (isMounted) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: personaResponse,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to cache persona:', e);
        }
      }

    } catch (error) {
      console.error('Error generating custom persona:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    } finally {
      if (loadingInterval) clearInterval(loadingInterval);
      setIsLoadingPersona(false);
    }
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
      let response;

      if (savedEntryId) {
        // Update existing entry
        response = await fetch(`/api/entries/${savedEntryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newEntryContent.trim()
          }),
        });
      } else {
        // Create new entry
        response = await fetch('/api/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newEntryContent.trim()
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save entry');
      }

      const savedEntry = await response.json();

      // Set saved state
      setIsEntrySaved(true);
      setSavedEntryId(savedEntry.id);
      setIsEditingEntry(false);

      // Show "Saved!" briefly
      setTimeout(() => {
        setIsSavingEntry(false);
      }, 1000);

    } catch (error) {
      console.error('Error saving entry:', error);
      setError(error instanceof Error ? error.message : 'Failed to save entry');
      setIsSavingEntry(false);
    }
  };

  const handleUpdateEntry = async () => {
    if (!newEntryContent.trim() || !savedEntryId || isSavingEntry) {
      return;
    }

    setIsSavingEntry(true);
    setError(null);

    try {
      const response = await fetch(`/api/entries/${savedEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newEntryContent.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update entry');
      }

      // Set saved state
      setIsEntrySaved(true);
      setIsEditingEntry(false);

      // Show "Saved!" briefly
      setTimeout(() => {
        setIsSavingEntry(false);
      }, 1000);

    } catch (error) {
      console.error('Error updating entry:', error);
      setError(error instanceof Error ? error.message : 'Failed to update entry');
      setIsSavingEntry(false);
    }
  };

  const handleEditEntry = () => {
    setIsEditingEntry(true);
    setIsEntrySaved(false);
  };

  const handleCancelEdit = () => {
    // Revert to saved content
    fetchTodaysEntry();
    setIsEditingEntry(false);
    setError(null);
  };

  const handleNewEntry = () => {
    setNewEntryContent('');
    setIsEntrySaved(false);
    setIsEditingEntry(false);
    setSavedEntryId(null);
    setError(null);
  };

  // Fetch past entries from API
  const fetchPastEntries = async (page = 1, search = '') => {
    setIsLoadingPastEntries(true);
    try {
      let url = `/api/entries?page=${page}&limit=20`;
      if (search.trim()) {
        // For search, we'll fetch more entries and filter client-side
        // In a real app, you'd want server-side search
        url = `/api/entries?page=1&limit=100`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        let entries = data.entries || [];

        // Client-side search filtering
        if (search.trim()) {
          entries = entries.filter((entry: any) =>
            entry.content.toLowerCase().includes(search.toLowerCase())
          );
        }

        // Format entries for display
        const formattedEntries = entries.map((entry: any) => ({
          id: entry.id,
          date: new Date(entry.createdAt).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
          }),
          preview: entry.content.length > 150
            ? entry.content.substring(0, 150) + '...'
            : entry.content,
          fullContent: entry.content,
          createdAt: entry.createdAt
        }));

        if (page === 1) {
          setPastEntries(formattedEntries);
        } else {
          setPastEntries(prev => [...prev, ...formattedEntries]);
        }

        setHasMoreEntries(data.pagination?.totalPages > page);
      }
    } catch (error) {
      console.error('Failed to fetch past entries:', error);
    } finally {
      setIsLoadingPastEntries(false);
    }
  };

  const handlePastEntriesClick = () => {
    if (showPastEntries) {
      // Start closing animation
      setIsClosingPastEntries(true);
      // After animation completes, hide the component
      setTimeout(() => {
        setShowPastEntries(false);
        setIsClosingPastEntries(false);
        setSelectedEntry(null);
        setSearchQuery('');
        setPastEntriesPage(1);
      }, 500);
    } else {
      // Open past entries and fetch data
      setShowPastEntries(true);
      fetchPastEntries(1);
    }
  };

  const handleViewEntry = (entry: any) => {
    setSelectedEntry(entry);
    setEditingEntryContent(entry.fullContent);
    setIsEditingPastEntry(false);
  };

  const handleBackToList = () => {
    setSelectedEntry(null);
    setIsEditingPastEntry(false);
  };

  const handleEditPastEntry = () => {
    setIsEditingPastEntry(true);
  };

  const handleSavePastEntry = async () => {
    if (!selectedEntry || !editingEntryContent.trim() || isSavingPastEntry) {
      return;
    }

    setIsSavingPastEntry(true);
    try {
      const response = await fetch(`/api/entries/${selectedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingEntryContent.trim()
        }),
      });

      if (response.ok) {
        // Update the entry in the list and selected entry
        const updatedEntry = {
          ...selectedEntry,
          fullContent: editingEntryContent.trim(),
          preview: editingEntryContent.length > 150
            ? editingEntryContent.substring(0, 150) + '...'
            : editingEntryContent
        };

        setSelectedEntry(updatedEntry);
        setPastEntries(prev =>
          prev.map(entry =>
            entry.id === selectedEntry.id ? updatedEntry : entry
          )
        );
        setIsEditingPastEntry(false);
      } else {
        console.error('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    } finally {
      setIsSavingPastEntry(false);
    }
  };

  const handleCancelEditPastEntry = () => {
    setEditingEntryContent(selectedEntry?.fullContent || '');
    setIsEditingPastEntry(false);
  };

  const handleLoadMoreEntries = () => {
    const nextPage = pastEntriesPage + 1;
    setPastEntriesPage(nextPage);
    fetchPastEntries(nextPage, searchQuery);
  };

  const handleSearchEntries = (query: string) => {
    setSearchQuery(query);
    setPastEntriesPage(1);
    fetchPastEntries(1, query);
  };


  // Get current date for display (calculate immediately since it's just math)
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
            <div className="new-entry-caption">Today's Entry</div>
            <div className="new-entry-date" suppressHydrationWarning={true}>
              {getCurrentDate()}
            </div>
          </div>

          <div className={`new-entry-container ${isEntrySaved && !isEditingEntry ? 'saved-container' : ''}`}>
            <textarea
              placeholder="What's on your mind today?"
              className={`new-entry-content ${isEntrySaved && !isEditingEntry ? 'saved-entry' : ''}`}
              value={newEntryContent}
              onChange={(e) => setNewEntryContent(e.target.value)}
              readOnly={isEntrySaved && !isEditingEntry}
            />
          </div>

          <div className="entry-buttons">
            {isEntrySaved && !isEditingEntry ? (
              <button
                className="edit-entry-btn"
                onClick={handleEditEntry}
              >
                Edit Entry
              </button>
            ) : isEditingEntry ? (
              <>
                <button
                  className="update-entry-btn"
                  onClick={handleSaveEntry}
                  disabled={!newEntryContent.trim() || isSavingEntry}
                >
                  {isSavingEntry ? 'Updating...' : 'Update'}
                </button>
                <button
                  className="cancel-entry-btn"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="save-entry-btn"
                onClick={handleSaveEntry}
                disabled={!newEntryContent.trim() || isSavingEntry}
              >
                {isSavingEntry ? 'Saving...' : 'Save Entry'}
              </button>
            )}
          </div>

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

          <div className="custom-date-section">
            <div className="custom-date-caption">or</div>
            <div className="custom-date-container">
              <div className="date-inputs">
                <div className="date-input-group">
                  <label>Season:</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="date-input"
                  >
                    <option value="">Select Season</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>
                <div className="date-input-group">
                  <label>Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="date-input"
                  >
                    <option value="">Select Year</option>
                    <option value="2020">2020</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
              <button
                className="custom-date-btn"
                onClick={handleCustomDateSubmit}
                disabled={!selectedSeason || !selectedYear}
              >
                Chat with This Period
              </button>
            </div>
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
              <div className="loading-text">{loadingText}</div>
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

      {selectedTab === 'new-entry' && !showPastEntries && (
        <div className="past-entries-tab" onClick={handlePastEntriesClick}>
          Past Entries
        </div>
      )}

      {selectedTab === 'new-entry' && showPastEntries && (
        <>
          <div className={`past-entries-background-overlay ${isClosingPastEntries ? 'closing' : ''}`}></div>
          <div className={`past-entries-section ${isClosingPastEntries ? 'closing' : ''}`}>
            <div className="past-entries-label" onClick={handlePastEntriesClick}>
              Past Entries
            </div>
            <div className="past-entries-container">
              {selectedEntry === null ? (
                <>
                  {/* Search Bar */}
                  <div className="past-entries-search">
                    <input
                      type="text"
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(e) => handleSearchEntries(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  {/* Entries List */}
                  <div className="past-entries-content">
                    {isLoadingPastEntries && pastEntries.length === 0 ? (
                      <div className="loading-entries">Loading entries...</div>
                    ) : pastEntries.length === 0 ? (
                      <div className="no-entries">No entries found</div>
                    ) : (
                      <>
                        {pastEntries.map((entry, index) => (
                          <div key={entry.id} className="entry-item">
                            <div className="entry-date">{entry.date}</div>
                            <div className="entry-text">{entry.preview}</div>
                            <button
                              className="view-btn"
                              onClick={() => handleViewEntry(entry)}
                            >
                              View
                            </button>
                          </div>
                        ))}

                        {/* Load More Button */}
                        {hasMoreEntries && (
                          <button
                            className="load-more-btn"
                            onClick={handleLoadMoreEntries}
                            disabled={isLoadingPastEntries}
                          >
                            {isLoadingPastEntries ? 'Loading...' : 'Load More'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="entry-view">
                  <div className="entry-view-header">
                    <button className="back-btn" onClick={handleBackToList}>
                      ← Back
                    </button>
                    <div className="entry-view-date">{selectedEntry.date}</div>
                    {isEditingPastEntry ? (
                      <div className="edit-buttons">
                        <button
                          className="save-btn"
                          onClick={handleSavePastEntry}
                          disabled={isSavingPastEntry}
                        >
                          {isSavingPastEntry ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={handleCancelEditPastEntry}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="edit-btn" onClick={handleEditPastEntry}>
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="entry-view-content">
                    {isEditingPastEntry ? (
                      <textarea
                        className="edit-entry-textarea"
                        value={editingEntryContent}
                        onChange={(e) => setEditingEntryContent(e.target.value)}
                      />
                    ) : (
                      selectedEntry.fullContent.split('\n').map((paragraph: string, index: number) => (
                        <p key={index} className="entry-paragraph">
                          {paragraph}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}