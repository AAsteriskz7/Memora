#!/usr/bin/env tsx

/**
 * Import Script for Custom Journal Entries
 * 
 * Imports journal entries from JSON, CSV, or text files
 * Generates embeddings and seeds the database
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createLLMService } from '../src/services/llm.service';
import { createEmbeddingService } from '../src/services/embedding.service';
import { createEntryService } from '../src/services/entry.service';
import * as fs from 'fs';
import * as path from 'path';

interface EntryData {
  date: string;
  content: string;
  topic?: string;
  mood?: string;
}

class EntryImporter {
  private prisma: PrismaClient;
  private entryService: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async initialize() {
    try {
      const llmService = createLLMService();
      const embeddingService = createEmbeddingService(llmService, this.prisma);
      this.entryService = createEntryService(this.prisma, embeddingService);
      console.log('✅ Services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Parse JSON file
   */
  private parseJSON(filePath: string): EntryData[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of entries');
    }
    
    return data;
  }

  /**
   * Parse CSV file
   */
  private parseCSV(filePath: string): EntryData[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have header and at least one entry');
    }
    
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const entries: EntryData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const entry: any = {};
      
      header.forEach((key, index) => {
        if (values[index]) {
          entry[key] = values[index].replace(/"/g, '');
        }
      });
      
      if (entry.date && entry.content) {
        entries.push(entry);
      }
    }
    
    return entries;
  }

  /**
   * Parse CSV line handling quoted content
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Parse text file
   */
  private parseText(filePath: string): EntryData[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entries: EntryData[] = [];
    
    const sections = content.split(/DATE:\s*/i).filter(s => s.trim());
    
    for (const section of sections) {
      const lines = section.split('\n');
      const date = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      if (date && content) {
        entries.push({ date, content });
      }
    }
    
    return entries;
  }

  /**
   * Validate entry data
   */
  private validateEntry(entry: EntryData, index: number): void {
    if (!entry.date) {
      throw new Error(`Entry ${index + 1}: Missing date`);
    }
    
    if (!entry.content) {
      throw new Error(`Entry ${index + 1}: Missing content`);
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(entry.date)) {
      throw new Error(`Entry ${index + 1}: Invalid date format. Use YYYY-MM-DD`);
    }
    
    // Validate date range
    const entryDate = new Date(entry.date);
    const minDate = new Date('2020-01-01');
    const maxDate = new Date('2025-12-31');
    
    if (entryDate < minDate || entryDate > maxDate) {
      throw new Error(`Entry ${index + 1}: Date must be between 2020-01-01 and 2025-12-31`);
    }
    
    // Validate content length
    if (entry.content.length < 10) {
      throw new Error(`Entry ${index + 1}: Content too short (minimum 10 characters)`);
    }
    
    if (entry.content.length > 10000) {
      throw new Error(`Entry ${index + 1}: Content too long (maximum 10,000 characters)`);
    }
  }

  /**
   * Import entries from file
   */
  async importFromFile(filePath: string): Promise<void> {
    console.log(`📁 Reading entries from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const ext = path.extname(filePath).toLowerCase();
    let entries: EntryData[] = [];
    
    try {
      switch (ext) {
        case '.json':
          entries = this.parseJSON(filePath);
          break;
        case '.csv':
          entries = this.parseCSV(filePath);
          break;
        case '.txt':
          entries = this.parseText(filePath);
          break;
        default:
          throw new Error(`Unsupported file format: ${ext}. Use .json, .csv, or .txt`);
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log(`📝 Found ${entries.length} entries`);
    
    // Validate all entries
    console.log('🔍 Validating entries...');
    for (let i = 0; i < entries.length; i++) {
      this.validateEntry(entries[i], i);
    }
    console.log('✅ All entries validated successfully');
    
    // Sort entries by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Import entries
    await this.importEntries(entries);
  }

  /**
   * Import multiple files
   */
  async importFromFiles(filePaths: string[]): Promise<void> {
    let allEntries: EntryData[] = [];
    
    for (const filePath of filePaths) {
      console.log(`📁 Reading entries from: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found, skipping: ${filePath}`);
        continue;
      }
      
      const ext = path.extname(filePath).toLowerCase();
      let entries: EntryData[] = [];
      
      try {
        switch (ext) {
          case '.json':
            entries = this.parseJSON(filePath);
            break;
          case '.csv':
            entries = this.parseCSV(filePath);
            break;
          case '.txt':
            entries = this.parseText(filePath);
            break;
          default:
            console.warn(`⚠️  Unsupported file format, skipping: ${filePath}`);
            continue;
        }
        
        console.log(`   Found ${entries.length} entries`);
        allEntries = allEntries.concat(entries);
        
      } catch (error) {
        console.error(`❌ Failed to parse ${filePath}:`, error);
        continue;
      }
    }
    
    if (allEntries.length === 0) {
      throw new Error('No valid entries found in any files');
    }
    
    console.log(`📝 Total entries found: ${allEntries.length}`);
    
    // Validate all entries
    console.log('🔍 Validating entries...');
    for (let i = 0; i < allEntries.length; i++) {
      this.validateEntry(allEntries[i], i);
    }
    console.log('✅ All entries validated successfully');
    
    // Remove duplicates based on date and content
    const uniqueEntries = allEntries.filter((entry, index, self) => 
      index === self.findIndex(e => e.date === entry.date && e.content === entry.content)
    );
    
    if (uniqueEntries.length !== allEntries.length) {
      console.log(`🔄 Removed ${allEntries.length - uniqueEntries.length} duplicate entries`);
    }
    
    // Sort entries by date
    uniqueEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Import entries
    await this.importEntries(uniqueEntries);
  }

  /**
   * Import entries to database
   */
  private async importEntries(entries: EntryData[]): Promise<void> {
    console.log('💾 Importing entries to database...');
    
    const batchSize = 25; // Smaller batches for better error handling
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(entries.length / batchSize);
      
      console.log(`   Processing batch ${batchNumber}/${totalBatches} (${batch.length} entries)...`);
      
      for (const entry of batch) {
        try {
          const createdAt = new Date(entry.date + 'T12:00:00Z'); // Set to noon UTC
          await this.entryService.createEntry(entry.content, createdAt);
          successCount++;
          
          if (successCount % 10 === 0) {
            console.log(`     Processed ${successCount}/${entries.length} entries`);
          }
        } catch (error) {
          errorCount++;
          console.error(`     ❌ Failed to import entry from ${entry.date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Small delay between batches
      if (i + batchSize < entries.length) {
        console.log('     Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Successfully imported: ${successCount} entries`);
    console.log(`   ❌ Failed to import: ${errorCount} entries`);
    console.log(`   📈 Success rate: ${((successCount / entries.length) * 100).toFixed(1)}%`);
    
    if (successCount > 0) {
      console.log('\n🎉 Import completed successfully!');
    } else {
      console.log('\n⚠️  No entries were imported successfully.');
    }
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run import:entries <file1> [file2] [file3] ...');
    console.log('');
    console.log('Supported formats: .json, .csv, .txt');
    console.log('');
    console.log('Examples:');
    console.log('  npm run import:entries journal-entries.json');
    console.log('  npm run import:entries entries-2020.json entries-2021.json');
    console.log('  npm run import:entries my-entries.csv');
    process.exit(1);
  }
  
  const importer = new EntryImporter();
  
  try {
    await importer.initialize();
    
    if (args.length === 1) {
      await importer.importFromFile(args[0]);
    } else {
      await importer.importFromFiles(args);
    }
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await importer.cleanup();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { EntryImporter };