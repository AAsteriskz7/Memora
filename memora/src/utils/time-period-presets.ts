import { TimePeriodPreset, TimePeriodPresetConfig, TimePeriod } from '../types';

/**
 * Utility class for managing time period presets
 * Supports both relative presets (1-year-ago) and contextual presets (college-years)
 */
export class TimePeriodPresets {
  private static readonly PRESET_CONFIGS: TimePeriodPresetConfig[] = [
    // Relative presets
    {
      id: '1-month-ago',
      label: '1 Month Ago',
      description: 'Entries from approximately 1 month ago',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: '3-months-ago',
      label: '3 Months Ago',
      description: 'Entries from approximately 3 months ago',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setMonth(start.getMonth() - 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: '6-months-ago',
      label: '6 Months Ago',
      description: 'Entries from approximately 6 months ago',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setMonth(start.getMonth() - 6);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: '1-year-ago',
      label: '1 Year Ago',
      description: 'Entries from approximately 1 year ago',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setFullYear(start.getFullYear() - 1);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: '2-years-ago',
      label: '2 Years Ago',
      description: 'Entries from approximately 2 years ago',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setFullYear(start.getFullYear() - 2);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: '3-years-ago',
      label: '3 Years Ago',
      description: 'Entries from approximately 3 years ago',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setFullYear(start.getFullYear() - 3);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: '5-years-ago',
      label: '5 Years Ago',
      description: 'Entries from approximately 5 years ago',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setFullYear(start.getFullYear() - 5);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: '10-years-ago',
      label: '10 Years Ago',
      description: 'Entries from approximately 10 years ago',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setFullYear(start.getFullYear() - 10);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    // Contextual presets
    {
      id: 'college-years',
      label: 'College Years',
      description: 'Typical college years (ages 18-22, approximately 2018-2022 for current 24-year-olds)',
      calculateRange: (currentDate: Date) => {
        // Assume typical college years are 4 years, ending about 2-6 years ago
        // This is a rough approximation - in a real app, this might be user-configurable
        const currentYear = currentDate.getFullYear();
        const collegeEndYear = currentYear - 3; // Assume graduated 3 years ago
        const collegeStartYear = collegeEndYear - 3; // 4-year college duration
        
        const start = new Date(collegeStartYear, 8, 1); // September 1st
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(collegeEndYear, 4, 31); // May 31st
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: 'high-school-years',
      label: 'High School Years',
      description: 'Typical high school years (ages 14-18, approximately 2014-2018 for current 24-year-olds)',
      calculateRange: (currentDate: Date) => {
        const currentYear = currentDate.getFullYear();
        const highSchoolEndYear = currentYear - 7; // Assume graduated 7 years ago
        const highSchoolStartYear = highSchoolEndYear - 3; // 4-year high school duration
        
        const start = new Date(highSchoolStartYear, 8, 1); // September 1st
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(highSchoolEndYear, 5, 30); // June 30th
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: 'early-career',
      label: 'Early Career',
      description: 'First few years of professional career (approximately 2-5 years ago)',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setFullYear(start.getFullYear() - 5);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(currentDate);
        end.setFullYear(end.getFullYear() - 2);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    },
    {
      id: 'last-decade',
      label: 'Last Decade',
      description: 'Entries from the past 10 years',
      calculateRange: (currentDate: Date) => {
        const start = new Date(currentDate);
        start.setFullYear(start.getFullYear() - 10);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      }
    }
  ];

  /**
   * Get all available preset configurations
   */
  static getAllPresets(): TimePeriodPresetConfig[] {
    return [...this.PRESET_CONFIGS];
  }

  /**
   * Get a specific preset configuration by ID
   */
  static getPresetConfig(presetId: TimePeriodPreset): TimePeriodPresetConfig | null {
    return this.PRESET_CONFIGS.find(config => config.id === presetId) || null;
  }

  /**
   * Validate if a preset ID is valid
   */
  static isValidPreset(presetId: string): presetId is TimePeriodPreset {
    return this.PRESET_CONFIGS.some(config => config.id === presetId);
  }

  /**
   * Convert a preset to a date range
   */
  static presetToDateRange(presetId: TimePeriodPreset, currentDate: Date = new Date()): TimePeriod {
    const config = this.getPresetConfig(presetId);
    if (!config) {
      throw new Error(`Invalid preset: ${presetId}`);
    }

    try {
      const range = config.calculateRange(currentDate);
      
      // Validate the calculated range
      if (range.start >= range.end) {
        throw new Error(`Invalid date range calculated for preset ${presetId}: start date must be before end date`);
      }

      return range;
    } catch (error) {
      throw new Error(`Failed to calculate date range for preset ${presetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get relative presets (time-based like "1-year-ago")
   */
  static getRelativePresets(): TimePeriodPresetConfig[] {
    const relativePresetIds: TimePeriodPreset[] = [
      '1-month-ago', '3-months-ago', '6-months-ago', '1-year-ago', 
      '2-years-ago', '3-years-ago', '5-years-ago', '10-years-ago'
    ];
    
    return this.PRESET_CONFIGS.filter(config => 
      relativePresetIds.includes(config.id)
    );
  }

  /**
   * Get contextual presets (life-stage based like "college-years")
   */
  static getContextualPresets(): TimePeriodPresetConfig[] {
    const contextualPresetIds: TimePeriodPreset[] = [
      'college-years', 'high-school-years', 'early-career', 'last-decade'
    ];
    
    return this.PRESET_CONFIGS.filter(config => 
      contextualPresetIds.includes(config.id)
    );
  }

  /**
   * Get preset suggestions based on a query string
   * This can be used to suggest relevant presets based on user input
   */
  static suggestPresets(query: string): TimePeriodPresetConfig[] {
    const lowerQuery = query.toLowerCase();
    const suggestions: TimePeriodPresetConfig[] = [];

    // Check for specific keywords
    if (lowerQuery.includes('college') || lowerQuery.includes('university')) {
      const collegePreset = this.getPresetConfig('college-years');
      if (collegePreset) suggestions.push(collegePreset);
    }

    if (lowerQuery.includes('high school') || lowerQuery.includes('highschool')) {
      const highSchoolPreset = this.getPresetConfig('high-school-years');
      if (highSchoolPreset) suggestions.push(highSchoolPreset);
    }

    if (lowerQuery.includes('career') || lowerQuery.includes('job') || lowerQuery.includes('work')) {
      const careerPreset = this.getPresetConfig('early-career');
      if (careerPreset) suggestions.push(careerPreset);
    }

    // Check for time-based keywords
    if (lowerQuery.includes('year ago') || lowerQuery.includes('last year')) {
      const yearPreset = this.getPresetConfig('1-year-ago');
      if (yearPreset) suggestions.push(yearPreset);
    }

    if (lowerQuery.includes('month ago') || lowerQuery.includes('last month')) {
      const monthPreset = this.getPresetConfig('1-month-ago');
      if (monthPreset) suggestions.push(monthPreset);
    }

    // If no specific suggestions, return some common ones
    if (suggestions.length === 0) {
      const commonPresets = ['1-year-ago', '2-years-ago', 'college-years'] as TimePeriodPreset[];
      commonPresets.forEach(presetId => {
        const preset = this.getPresetConfig(presetId);
        if (preset) suggestions.push(preset);
      });
    }

    return suggestions;
  }
}