const fs = require('fs');

async function importJournalEntries() {
  try {
    console.log('🚀 Starting journal entries import...');
    
    // Check if development server is running
    try {
      const response = await fetch('http://localhost:3000/api/entries');
      if (!response.ok && response.status !== 200) {
        throw new Error('Server not responding');
      }
    } catch (error) {
      console.error('❌ Development server is not running!');
      console.log('Please start the server first: npm run dev');
      return;
    }
    
    console.log('✅ Connected to API server');
    
    // Read the JSON file
    const jsonFilePath = process.argv[2];
    if (!jsonFilePath) {
      console.error('❌ Please provide the path to your JSON file');
      console.log('Usage: node import-journal-entries.js <path-to-json-file>');
      console.log('Example: node import-journal-entries.js ./my-journal-entries.json');
      return;
    }
    
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ File not found: ${jsonFilePath}`);
      return;
    }
    
    console.log(`📖 Reading entries from: ${jsonFilePath}`);
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Handle different JSON structures
    let entries = [];
    if (Array.isArray(jsonData)) {
      entries = jsonData;
    } else if (jsonData.entries && Array.isArray(jsonData.entries)) {
      entries = jsonData.entries;
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      entries = jsonData.data;
    } else {
      console.error('❌ Invalid JSON structure. Expected an array of entries or an object with "entries" or "data" property.');
      console.log('Expected format:');
      console.log('[');
      console.log('  {');
      console.log('    "content": "Your journal entry content...",');
      console.log('    "date": "2024-01-15" or "createdAt": "2024-01-15T09:00:00Z"');
      console.log('  }');
      console.log(']');
      return;
    }
    
    console.log(`📝 Found ${entries.length} entries to import`);
    
    if (entries.length === 0) {
      console.log('⚠️  No entries found in the JSON file');
      return;
    }
    
    // Validate and process entries
    const validEntries = [];
    const errors = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryNum = i + 1;
      
      try {
        // Validate required fields
        if (!entry.content || typeof entry.content !== 'string') {
          throw new Error('Missing or invalid "content" field');
        }
        
        if (entry.content.trim().length === 0) {
          throw new Error('Content cannot be empty');
        }
        
        if (entry.content.length > 10000) {
          throw new Error('Content exceeds 10,000 character limit');
        }
        
        // Parse date - support multiple formats
        let createdAt = new Date();
        if (entry.createdAt) {
          createdAt = new Date(entry.createdAt);
        } else if (entry.date) {
          createdAt = new Date(entry.date);
        } else if (entry.timestamp) {
          createdAt = new Date(entry.timestamp);
        }
        
        if (isNaN(createdAt.getTime())) {
          throw new Error('Invalid date format');
        }
        
        // Don't allow future dates
        if (createdAt > new Date()) {
          throw new Error('Date cannot be in the future');
        }
        
        validEntries.push({
          content: entry.content.trim(),
          createdAt: createdAt
        });
        
      } catch (error) {
        errors.push(`Entry ${entryNum}: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      console.log('⚠️  Found validation errors:');
      errors.forEach(error => console.log(`   ${error}`));
      console.log(`\n📊 ${validEntries.length} valid entries, ${errors.length} errors`);
      
      if (validEntries.length === 0) {
        console.log('❌ No valid entries to import');
        return;
      }
      
      console.log('Continuing with valid entries...\n');
    }
    
    // Import entries with progress tracking
    console.log(`📥 Importing ${validEntries.length} entries...`);
    let imported = 0;
    let failed = 0;
    
    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i];
      const progress = i + 1;
      
      try {
        process.stdout.write(`\r⏳ Processing entry ${progress}/${validEntries.length}...`);
        
        // Create entry via API (this will generate embeddings)
        const response = await fetch('http://localhost:3000/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: entry.content,
            createdAt: entry.createdAt.toISOString()
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        imported++;
        
        // Add a small delay to avoid overwhelming the API
        if (i < validEntries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        failed++;
        console.log(`\n❌ Failed to import entry ${progress}: ${error.message}`);
      }
    }
    
    console.log(`\n\n🎉 Import completed!`);
    console.log(`✅ Successfully imported: ${imported} entries`);
    if (failed > 0) {
      console.log(`❌ Failed to import: ${failed} entries`);
    }
    
    // Show final database stats
    const statsResponse = await fetch('http://localhost:3000/api/entries');
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log(`📊 Total entries in database: ${statsData.pagination.total}`);
    }
    
    console.log('\n🚀 Your journal entries are now ready for past-self conversations!');
    console.log('Visit http://localhost:3000 and turn off demo mode to see your entries.');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    
    if (error.message.includes('GOOGLE_API_KEY')) {
      console.log('\n💡 Make sure your GOOGLE_API_KEY is set in the .env file');
    }
    
    if (error.message.includes('database')) {
      console.log('\n💡 Make sure your database is running and accessible');
    }
  }
}

// Helper function to create a sample JSON file
function createSampleFile() {
  const sampleData = [
    {
      "content": "Started my new job today! Feeling excited but also nervous about the challenges ahead. The team seems really welcoming and I think I'll learn a lot here.",
      "createdAt": "2024-01-15T09:00:00Z"
    },
    {
      "content": "Had a great weekend hiking with friends. There's something so peaceful about being in nature. It really helps clear my mind and puts things in perspective.",
      "date": "2024-02-10"
    },
    {
      "content": "Been thinking a lot about my career goals lately. I want to make sure I'm growing and not just staying comfortable. Maybe it's time to take on more challenging projects.",
      "createdAt": "2024-03-05T20:15:00Z"
    }
  ];
  
  fs.writeFileSync('sample-journal-entries.json', JSON.stringify(sampleData, null, 2));
  console.log('✅ Created sample-journal-entries.json');
  console.log('Edit this file with your journal entries, then run:');
  console.log('node import-journal-entries.js sample-journal-entries.json');
}

// Check if user wants to create a sample file
if (process.argv[2] === '--create-sample') {
  createSampleFile();
} else {
  importJournalEntries();
}