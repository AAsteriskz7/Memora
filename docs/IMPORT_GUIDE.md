# Journal Entries Import Guide

This guide explains how to import your existing journal entries into the AI Journal application.

## 📋 Prerequisites

1. **Development server running**: Make sure your server is running with `npm run dev`
2. **Database connected**: Ensure your Supabase database is set up and connected
3. **API keys configured**: Verify your `GOOGLE_API_KEY` is set in `.env`

## 📝 JSON Format

Your journal entries should be in JSON format. The import script supports multiple formats:

### Format 1: Simple Array
```json
[
  {
    "content": "Your journal entry content here...",
    "createdAt": "2024-01-15T09:00:00Z"
  },
  {
    "content": "Another journal entry...",
    "date": "2024-02-10"
  }
]
```

### Format 2: Object with entries array
```json
{
  "entries": [
    {
      "content": "Your journal entry content here...",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### Format 3: Object with data array
```json
{
  "data": [
    {
      "content": "Your journal entry content here...",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

## 📅 Date Formats

The import script supports multiple date field names and formats:

### Field Names (in order of preference):
- `createdAt` - ISO 8601 format (recommended)
- `date` - Various formats supported
- `timestamp` - Various formats supported

### Supported Date Formats:
- `"2024-01-15T09:00:00Z"` (ISO 8601 with timezone)
- `"2024-01-15T09:00:00"` (ISO 8601 without timezone)
- `"2024-01-15"` (Date only)
- `"01/15/2024"` (US format)
- `"15/01/2024"` (European format)

**Note**: Future dates will be rejected. If no date is provided, the current timestamp will be used.

## 🚀 Import Process

### Step 1: Create Sample File (Optional)
```bash
node import-journal-entries.js --create-sample
```
This creates `sample-journal-entries.json` with example entries.

### Step 2: Prepare Your JSON File
1. Create or edit your JSON file with your journal entries
2. Follow one of the supported formats above
3. Ensure each entry has valid content (1-10,000 characters)

### Step 3: Run Import
```bash
node import-journal-entries.js your-journal-file.json
```

### Example:
```bash
# Create sample file
node import-journal-entries.js --create-sample

# Edit the sample file with your entries
# Then import it
node import-journal-entries.js sample-journal-entries.json
```

## ✅ Validation Rules

The import script validates each entry:

### Content Requirements:
- **Required**: Must have `content` field
- **Type**: Must be a string
- **Length**: 1-10,000 characters
- **Not empty**: Cannot be just whitespace

### Date Requirements:
- **Format**: Must be a valid date format
- **Not future**: Cannot be in the future
- **Optional**: If not provided, uses current timestamp

## 📊 Import Features

### Progress Tracking
- Shows real-time progress: `Processing entry 5/100...`
- Displays success/failure counts
- Reports final database statistics

### Error Handling
- **Validation errors**: Shows which entries have issues
- **API errors**: Reports connection or server problems
- **Partial imports**: Continues with valid entries if some fail

### Automatic Processing
- **Embedding generation**: Each entry gets AI embeddings for semantic search
- **Database storage**: Entries are stored in Supabase with proper indexing
- **Duplicate handling**: Each import creates new entries (no deduplication)

## 🔧 Troubleshooting

### Common Issues

#### 1. "Development server is not running"
**Solution**: Start the server first
```bash
npm run dev
```

#### 2. "Invalid JSON structure"
**Solution**: Check your JSON format matches one of the supported structures

#### 3. "GOOGLE_API_KEY" errors
**Solution**: Verify your `.env` file has the correct API key
```env
GOOGLE_API_KEY=your_api_key_here
```

#### 4. "Database connection error"
**Solution**: Check your Supabase connection in `.env`
```env
DATABASE_URL=postgresql://...
```

#### 5. Content validation errors
**Solution**: Ensure each entry has:
- Non-empty `content` field
- Content length between 1-10,000 characters
- Valid date format (if provided)

### Debug Tips

1. **Test with sample data first**:
   ```bash
   node import-journal-entries.js --create-sample
   node import-journal-entries.js sample-journal-entries.json
   ```

2. **Check server logs**: Look at the terminal running `npm run dev` for detailed error messages

3. **Validate JSON**: Use an online JSON validator to check your file format

4. **Start small**: Test with a few entries first, then import larger batches

## 📈 Performance Considerations

### Batch Size
- The script processes entries sequentially
- Includes 100ms delay between entries to avoid overwhelming the API
- For large imports (1000+ entries), consider breaking into smaller files

### API Rate Limits
- Google's Gemini API has rate limits for embedding generation
- If you hit rate limits, the script will show specific error messages
- Wait a few minutes and retry if needed

### Processing Time
- Each entry requires embedding generation (~1-2 seconds)
- 100 entries ≈ 2-3 minutes
- 1000 entries ≈ 20-30 minutes

## 🎯 After Import

### Verify Import
1. Visit `http://localhost:3000`
2. Turn off demo mode
3. Check the "Journal Entries" tab
4. Verify your entries appear with correct dates

### Test Past-Self Conversations
1. Go to "Past-Self Chat" tab
2. Ask a question about your imported entries
3. Verify the AI finds relevant entries and responds appropriately

### Database Check
The import script shows final statistics:
```
🎉 Import completed!
✅ Successfully imported: 95 entries
❌ Failed to import: 5 entries
📊 Total entries in database: 95
```

## 📋 Example Import Session

```bash
$ node import-journal-entries.js my-journal.json
🚀 Starting journal entries import...
✅ Connected to API server
📖 Reading entries from: my-journal.json
📝 Found 150 entries to import
📥 Importing 150 entries...
⏳ Processing entry 150/150...

🎉 Import completed!
✅ Successfully imported: 148 entries
❌ Failed to import: 2 entries
📊 Total entries in database: 148

🚀 Your journal entries are now ready for past-self conversations!
Visit http://localhost:3000 and turn off demo mode to see your entries.
```

## 🔄 Re-importing

**Note**: The import script does not check for duplicates. Each run will create new entries, even if the content is identical. If you need to re-import:

1. **Clean database first** (if needed):
   - Use the web interface to delete entries
   - Or manually clean the database

2. **Import fresh data**:
   - Run the import script with your updated JSON file

## 📚 Additional Resources

- **API Documentation**: See `docs/API.md` for detailed API reference
- **Database Schema**: Check `prisma/schema.prisma` for data structure
- **Error Codes**: See `docs/ERROR_RESPONSES.md` for troubleshooting

## 🤝 Support

If you encounter issues:
1. Check this guide first
2. Verify your JSON format
3. Test with the sample data
4. Check server and database connections
5. Review error messages for specific guidance