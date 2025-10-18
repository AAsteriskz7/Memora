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
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
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

  const handlePastEntriesClick = () => {
    if (showPastEntries) {
      // Start closing animation
      setIsClosingPastEntries(true);
      // After animation completes, hide the component
      setTimeout(() => {
        setShowPastEntries(false);
        setIsClosingPastEntries(false);
        setSelectedEntry(null); // Reset selected entry when closing
      }, 500); // Match the animation duration
    } else {
      // Open past entries
      setShowPastEntries(true);
    }
  };

  const handleViewEntry = (entryIndex: number) => {
    setSelectedEntry(entryIndex);
  };

  const handleBackToList = () => {
    setSelectedEntry(null);
  };

  // Dummy entry data
  const dummyEntries = [
    {
      date: "10/7/2025",
      preview: "I woke up very late, then went to the coffee shop downtown and spent the entire morning working on my new project while enjoying the peaceful atmosphere...",
      fullContent: "I woke up very late today, around 11 AM. I had stayed up until 3 AM working on my new project, and I was completely exhausted. After finally getting out of bed, I made myself a quick breakfast and then headed to my favorite coffee shop downtown.\n\nThe atmosphere there was so peaceful - it's this little place with big windows that let in lots of natural light. I ordered my usual cappuccino and found a quiet corner table. I spent the entire morning there, working on my project while listening to the gentle hum of conversation around me.\n\nThere's something about working in a coffee shop that just feels different from working at home. The background noise, the smell of freshly ground coffee, the occasional clinking of cups - it all creates this perfect environment for creativity. I made more progress in those few hours than I had in the entire previous week.\n\nI'm really excited about where this project is heading. It's something I've been thinking about for months, and now that I'm finally putting it into action, I can see the potential. Sometimes you just need to step away from your usual environment to gain a fresh perspective."
    },
    {
      date: "10/6/2025",
      preview: "Had an amazing day at the beach with friends, we played volleyball, had a picnic, and watched the sunset together. It was one of those perfect summer days...",
      fullContent: "What an incredible day! Sarah, Mike, and I decided to drive out to the beach early this morning, and it turned out to be one of those perfect days that you remember forever.\n\nWe arrived around 9 AM, just as the morning fog was lifting. The beach was practically empty, and we had our pick of spots. We set up our towels and immediately started playing volleyball. I'm not great at it, but it was so much fun just running around in the sand, laughing at our terrible serves and celebrating every point.\n\nAround noon, we had the most amazing picnic. Sarah had made these incredible sandwiches with fresh ingredients from the farmers market, and Mike brought homemade lemonade. We sat on our towels, eating and talking about everything - work, relationships, our dreams for the future.\n\nAs the afternoon wore on, more people started arriving, but we didn't mind. We took a long walk along the shore, collecting interesting shells and rocks. I found this beautiful piece of sea glass that's now sitting on my desk.\n\nThe sunset was absolutely breathtaking. We sat together in silence, watching the sky turn from blue to orange to pink. It's moments like these that remind me how lucky I am to have such wonderful friends. We promised to do this again soon - maybe make it a monthly tradition."
    },
    {
      date: "10/5/2025",
      preview: "Feeling grateful for all the opportunities that have come my way recently. Started a new job this week and I'm really excited about the challenges ahead...",
      fullContent: "I'm feeling incredibly grateful today. This week marked the beginning of my new job, and I can't believe how everything has fallen into place.\n\nJust three months ago, I was feeling stuck in my previous role. The work was repetitive, and I wasn't learning anything new. I felt like I was just going through the motions, counting down the hours until I could go home. But then this opportunity came along, and it felt like the universe was giving me exactly what I needed.\n\nThe new company is everything I hoped for. The team is collaborative and supportive, the projects are challenging and interesting, and there's so much room for growth. My manager seems genuinely invested in my development, and I've already learned more in this first week than I did in months at my old job.\n\nWhat I'm most excited about is the chance to work on projects that actually matter. We're developing software that helps small businesses streamline their operations, and knowing that my work could help someone run their business more efficiently gives me a real sense of purpose.\n\nI know there will be challenges ahead - there always are with new roles. But I'm ready for them. I feel like I'm exactly where I'm supposed to be, doing exactly what I'm supposed to be doing. Sometimes life has a way of working out perfectly, even when you can't see it at the time."
    },
    {
      date: "10/4/2025",
      preview: "Started reading a new book today, really enjoying the author's writing style and the way they develop their characters. Can't wait to see how it ends...",
      fullContent: "I started reading 'The Midnight Library' today, and I'm already completely hooked. There's something about Matt Haig's writing style that just draws you in from the very first page.\n\nThe concept is fascinating - a library between life and death where you can try out different versions of your life. The main character, Nora, gets to see what her life would have been like if she had made different choices. It's making me think about all the 'what ifs' in my own life.\n\nThe way Haig develops his characters is incredible. Nora feels so real, so relatable. Her regrets, her fears, her hopes - they all resonate with me. I find myself thinking about her even when I'm not reading, wondering what choice she'll make next.\n\nWhat I love most about this book is how it explores the idea that every life has value, even the ones that seem ordinary or disappointing. It's a reminder that we don't need to be extraordinary to be happy, that sometimes the simple things - a good cup of coffee, a conversation with a friend, a beautiful sunset - are what make life worth living.\n\nI'm trying to pace myself with this one, but it's hard. I want to know how it ends, but I also don't want it to end. There's something magical about getting lost in a good book, about feeling like you're living another life for a little while."
    },
    {
      date: "10/3/2025",
      preview: "Went for a long walk in the park, nature is so healing and peaceful. Saw some beautiful birds and flowers that I'd never noticed before...",
      fullContent: "I took a long walk in Central Park today, and it was exactly what I needed. Sometimes I forget how healing nature can be, how it can reset your mind and calm your soul.\n\nI started my walk around 7 AM, when the park was still quiet and the morning light was soft and golden. The air was crisp and clean, and I could hear birds singing in the trees. I saw a cardinal - bright red against the green leaves - and it reminded me of my grandmother, who always said cardinals were messengers from loved ones who had passed.\n\nAs I walked deeper into the park, I noticed flowers I'd never seen before. There were these tiny purple wildflowers growing near a small stream, and delicate white blossoms on a tree I couldn't identify. It's amazing how much beauty exists in the world when you take the time to really look.\n\nI sat by the lake for a while, watching ducks paddle around and listening to the gentle lapping of water against the shore. There were a few other people there - an elderly couple feeding the birds, a young mother pushing a stroller, a man reading a book under a tree. Everyone seemed peaceful, content.\n\nI walked for almost two hours, and by the time I headed home, I felt completely refreshed. My mind was clear, my stress had melted away, and I felt ready to tackle whatever the day might bring. There's something about being in nature that puts everything in perspective."
    },
    {
      date: "10/2/2025",
      preview: "Had dinner with my family tonight, it's been too long since we all got together. Mom made her famous lasagna and we talked for hours...",
      fullContent: "Family dinner tonight was exactly what I needed. It's been weeks since we all sat down together, and I didn't realize how much I'd missed it until we were all gathered around the table.\n\nMom made her famous lasagna - the one with three types of cheese and her secret sauce recipe. The whole house smelled incredible from the moment I walked in. Dad was in the kitchen helping her, which is always a sight to see since he's usually banned from cooking duties.\n\nMy sister brought her new boyfriend, and I have to say, I really like him. He's funny and genuine, and most importantly, he makes her laugh in a way I haven't seen in a long time. It's nice to see her happy.\n\nWe talked about everything - work, relationships, Dad's latest woodworking project, Mom's garden. Time just flew by, and before I knew it, it was past 10 PM. These are the moments that remind me what's really important in life.\n\nI'm making a promise to myself to do this more often. Life gets busy, but family time shouldn't be something we squeeze in when we have a free moment. It should be a priority."
    },
    {
      date: "10/1/2025",
      preview: "Started a new workout routine today, feeling motivated and energized. The gym was surprisingly empty this morning...",
      fullContent: "I finally got back to the gym today, and I'm feeling so much better for it. It's been months since I had a consistent workout routine, and I can already feel the difference in my energy levels.\n\nI arrived at 6 AM, expecting the usual morning rush, but the gym was surprisingly quiet. I had my pick of machines and could really focus on my workout without feeling rushed or self-conscious. There's something peaceful about an empty gym in the early morning.\n\nI started with some light cardio to get my heart rate up, then moved on to strength training. My muscles are definitely weaker than they used to be, but that's okay. Every journey starts with a single step, and I'm just happy to be moving again.\n\nThe endorphin rush after my workout was incredible. I felt energized and ready to tackle the day. It's amazing how much regular exercise can improve not just your physical health, but your mental state as well.\n\nI'm planning to make this a regular thing - three times a week to start, then maybe more as I build up my stamina. I've forgotten how good it feels to take care of my body."
    },
    {
      date: "9/30/2025",
      preview: "Watched an incredible documentary about space exploration tonight. It made me think about how small we are in the universe...",
      fullContent: "I watched 'The Overview Effect' tonight, and it completely blew my mind. The documentary explores how seeing Earth from space changes astronauts' perspectives on life, humanity, and our place in the universe.\n\nThere's this incredible moment where one astronaut describes looking down at Earth and realizing that all the conflicts, borders, and divisions we create are completely artificial. From space, there are no visible boundaries - just one beautiful, fragile planet floating in the vast darkness.\n\nIt made me think about how we get so caught up in our daily problems and forget about the bigger picture. We worry about traffic, deadlines, and social media drama, but we're all just tiny specks on a tiny planet in an unimaginably vast universe.\n\nThat's not meant to be depressing - it's actually incredibly freeing. It puts everything in perspective. The things that seem so important today might not matter at all in the grand scheme of things. It's a reminder to focus on what truly matters: love, connection, and making the most of our brief time here.\n\nI think I'll watch more documentaries like this. There's something humbling and inspiring about learning about the cosmos and our place in it."
    },
    {
      date: "9/29/2025",
      preview: "Had a video call with my college friends today, we're planning a reunion trip. It's been years since we all saw each other...",
      fullContent: "Video call with the college crew today was such a blast! We're planning a reunion trip for next summer, and I'm already getting excited about it.\n\nIt's crazy to think it's been almost five years since we all graduated. We've all gone in such different directions - Sarah's working in tech in San Francisco, Mike's teaching high school in Chicago, and Emma just moved to London for a job opportunity. But somehow, when we're all on screen together, it feels like no time has passed at all.\n\nWe spent two hours just catching up and laughing about old memories. Remembering that time we got lost on a road trip and ended up in a tiny town with one gas station, or the all-nighter we pulled to finish our group project. Those were such simpler times.\n\nPlanning the reunion trip is going to be fun. We're thinking somewhere warm with good food and lots of activities. Maybe Costa Rica or Portugal? We'll figure it out, but the important thing is that we're all committed to making it happen.\n\nIt's easy to lose touch with people as life gets busy, but these friendships are worth maintaining. There's something special about people who knew you when you were still figuring out who you wanted to be."
    },
    {
      date: "9/28/2025",
      preview: "Tried a new recipe today - homemade pasta from scratch. It was messy and took forever, but the result was amazing...",
      fullContent: "I attempted to make fresh pasta from scratch today, and what an adventure it was! I've been watching cooking shows and decided I needed to try it myself.\n\nThe process was much more involved than I expected. First, I had to make the dough - just flour and eggs, but getting the right consistency took several attempts. My first batch was too dry, the second too sticky. By the third try, I was getting the hang of it.\n\nRolling out the pasta was the real challenge. I don't have a pasta machine, so I was doing it by hand with a rolling pin. Let me tell you, getting pasta thin enough without tearing it is an art form. My kitchen looked like a flour bomb had gone off.\n\nBut when I finally cooked the pasta and tossed it with a simple tomato sauce, the difference was incredible. Fresh pasta has this amazing texture that you just can't get from the dried stuff. It was chewy but tender, and it actually tasted like something.\n\nIt took me three hours to make what would have been a 15-minute meal with store-bought pasta, but it was totally worth it. There's something satisfying about making food from scratch, even when it's messy and time-consuming. I think I'll try it again next weekend."
    }
  ];
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
                <div className="past-entries-content">
                  {dummyEntries.map((entry, index) => (
                    <div key={index} className="entry-item">
                      <div className="entry-date">{entry.date}</div>
                      <div className="entry-text">{entry.preview}</div>
                      <button
                        className="view-btn"
                        onClick={() => handleViewEntry(index)}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="entry-view">
                  <div className="entry-view-header">
                    <button className="back-btn" onClick={handleBackToList}>
                      ← Back
                    </button>
                    <div className="entry-view-date">{dummyEntries[selectedEntry].date}</div>
                    <button className="edit-btn">
                      Edit
                    </button>
                  </div>
                  <div className="entry-view-content">
                    {dummyEntries[selectedEntry].fullContent.split('\n').map((paragraph, index) => (
                      <p key={index} className="entry-paragraph">
                        {paragraph}
                      </p>
                    ))}
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