import { JournalEntry, PastSelfResponse } from '../types';

// Mock journal entries for demo purposes
export const mockEntries: JournalEntry[] = [
  {
    id: '1',
    content: 'Started my new job today! Feeling excited but also nervous about the challenges ahead. The team seems really welcoming and I think I\'ll learn a lot here.',
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T09:00:00Z')
  },
  {
    id: '2',
    content: 'Had a great weekend hiking with friends. There\'s something so peaceful about being in nature. It really helps clear my mind and puts things in perspective.',
    createdAt: new Date('2024-02-10T14:30:00Z'),
    updatedAt: new Date('2024-02-10T14:30:00Z')
  },
  {
    id: '3',
    content: 'Been thinking a lot about my career goals lately. I want to make sure I\'m growing and not just staying comfortable. Maybe it\'s time to take on more challenging projects.',
    createdAt: new Date('2024-03-05T20:15:00Z'),
    updatedAt: new Date('2024-03-05T20:15:00Z')
  },
  {
    id: '4',
    content: 'Celebrated my birthday today! Getting older feels weird but also exciting. I feel like I\'m becoming more confident in who I am and what I want from life.',
    createdAt: new Date('2024-04-22T16:45:00Z'),
    updatedAt: new Date('2024-04-22T16:45:00Z')
  },
  {
    id: '5',
    content: 'Finally finished that big project at work. It was stressful but so rewarding to see it come together. I learned a lot about project management and working under pressure.',
    createdAt: new Date('2024-05-18T11:20:00Z'),
    updatedAt: new Date('2024-05-18T11:20:00Z')
  }
];

// Mock past-self response for demo purposes
export const generateMockPastSelfResponse = (query: string): PastSelfResponse => {
  const relevantEntries = mockEntries.slice(0, 2); // Use first 2 entries as references
  
  return {
    response: `Based on my journal entries from that time, I was really focused on personal and professional growth. I remember feeling excited about new challenges and opportunities, while also being mindful of staying true to myself. The experiences I was having - like starting new projects and spending time in nature - were helping me gain clarity about what I wanted from life.`,
    references: relevantEntries.map((entry, index) => ({
      entryId: entry.id,
      date: entry.createdAt,
      excerpt: entry.content.substring(0, 100) + '...',
      relevanceScore: 0.85 - (index * 0.1)
    })),
    metadata: {
      entriesSearched: mockEntries.length,
      timePeriod: {
        start: new Date('2024-01-01'),
        end: new Date('2024-05-31')
      },
      warning: 'This is a demo response using mock data. Connect to a real database for actual past-self conversations.'
    }
  };
};