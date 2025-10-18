# Requirements Document

## Introduction

The AI Journal is a hackathon project that enables users to write journal entries on a website and converse with past versions of themselves through their historical entries. The core feature is the Past-Self Conversation Agent, which allows users to query their historical thoughts and receive responses synthesized from their actual past journal entries, reflecting how their younger self would have responded.

## Glossary

- **AI Journal System**: The web application that provides journaling and past-self conversation capabilities
- **Past-Self Agent**: The conversational component that synthesizes responses from historical journal entries
- **Journal Entry**: A single dated text entry written by the user through the web interface
- **Temporal Query**: A user question directed at a specific time period or past version of themselves
- **Database**: The persistent storage system for journal entries

## Requirements

### Requirement 1

**User Story:** As a journal user, I want to write and save journal entries on the website, so that I can build a history of my thoughts over time

#### Acceptance Criteria

1. THE AI Journal System SHALL provide a text editor interface for composing journal entries
2. WHEN the user saves an entry, THE AI Journal System SHALL store the entry with the current date and timestamp
3. THE AI Journal System SHALL allow entries to contain at least 10,000 characters of text
4. THE AI Journal System SHALL confirm successful save with a visual notification
5. THE AI Journal System SHALL persist entries in a database for future retrieval

### Requirement 2

**User Story:** As a journal user, I want to view my past journal entries, so that I can review what I've written

#### Acceptance Criteria

1. THE AI Journal System SHALL display a list of journal entries sorted by date with newest first
2. WHEN the user selects an entry from the list, THE AI Journal System SHALL display the full entry content
3. THE AI Journal System SHALL show the date and time for each entry in the list
4. THE AI Journal System SHALL support pagination when there are more than 20 entries
5. THE AI Journal System SHALL provide a search function to filter entries by date range

### Requirement 3

**User Story:** As a journal user, I want to edit or delete my existing entries, so that I can correct mistakes or remove content

#### Acceptance Criteria

1. WHEN viewing an entry, THE AI Journal System SHALL provide an edit button that opens the entry in the text editor
2. WHEN the user saves an edited entry, THE AI Journal System SHALL update the stored entry while preserving the original creation date
3. THE AI Journal System SHALL provide a delete button for each entry
4. WHEN the user deletes an entry, THE AI Journal System SHALL prompt for confirmation before permanent deletion
5. THE AI Journal System SHALL remove deleted entries from both the entry list and past-self conversation context

### Requirement 4

**User Story:** As a journal user, I want to ask questions to my past self from specific time periods, so that I can understand how my younger self would have responded

#### Acceptance Criteria

1. THE AI Journal System SHALL provide an API endpoint that accepts temporal queries
2. WHEN a temporal query is submitted, THE Past-Self Agent SHALL identify the target time period from the query text
3. THE Past-Self Agent SHALL perform semantic search across journal entries from the specified time period
4. THE Past-Self Agent SHALL retrieve the most relevant journal entries for the query context
5. THE Past-Self Agent SHALL generate a response that synthesizes information from the retrieved entries and return it as JSON

### Requirement 5

**User Story:** As a journal user, I want to see which journal entries informed the past-self response, so that I can verify the authenticity

#### Acceptance Criteria

1. WHEN the Past-Self Agent generates a response, THE AI Journal System SHALL return references to the source journal entries in the API response
2. THE API response SHALL include the entry ID and date for each referenced entry
3. THE API response SHALL include quoted excerpts from entries that were most relevant to the response
4. THE AI Journal System SHALL return at least 1 and no more than 5 entry references per response
5. THE AI Journal System SHALL provide an API endpoint to retrieve full entry content by entry ID

### Requirement 6

**User Story:** As a journal user, I want the system to handle queries when I have limited journal history, so that I can still get value from the feature early on

#### Acceptance Criteria

1. WHEN there are fewer than 5 journal entries, THE Past-Self Agent SHALL include a message in the API response indicating that responses will improve with more entries
2. THE Past-Self Agent SHALL generate responses based on available entries regardless of quantity
3. WHEN no relevant entries exist for a time period, THE Past-Self Agent SHALL return a response indicating that no entries were found for that period
4. THE Past-Self Agent SHALL include suggestions to write more entries in the API response when applicable
5. WHEN there are no entries, THE API SHALL return an error response prompting to write the first entry


