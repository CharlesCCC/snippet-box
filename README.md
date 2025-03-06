# Snippet Box

![Snippet library screenshot](./.github/img/snippets.png)

## Description

Snippet Box is a simple self-hosted app for organizing your code snippets. It allows you to easily create, edit, browse and manage your snippets in various languages. With built-in Markdown support, Snippet Box makes it very easy to add notes or simple documentation to your code.

### Features

- Create, edit, and delete code snippets
- Organize snippets with tags
- Syntax highlighting for various programming languages
- Markdown support for notes and documentation
- Pin important snippets for quick access
- Public and private snippets
- Automatic loading of more snippets when scrolling (when 9+ snippets are available)
- Responsive design for desktop and mobile devices

## Technology

- Backend
  - Node.js
  - Typescript
  - Express.js
  - Sequelize ORM + SQLite
- Frontend
  - React
  - TypeScript
  - Bootstrap
- Deployment
  - Docker

## Development

```sh
# clone repository
git clone https://github.com/pawelmalak/snippet-box
cd snippet-box

# install dependencies (run only once)
npm run init

# start backend and frontend development servers
npm run dev
```

### Data Loading Tools

Snippet Box includes tools to load sample data into the database. These tools are located in the `data/data-load-tool` directory.

Currently supported data loading tools:

- **Prompt Loader**: Loads AI prompts from a CSV file into the database as snippets with appropriate tags.

For more information, see the [Data Loader README](./data/data-load-tool/README.md).

## Installation

### With Docker

#### Docker Hub

[Docker Hub image link](https://hub.docker.com/r/pawelmalak/snippet-box).
For arm platforms use `:arm` tag.

#### Building image

```sh
# Building image for Linux
docker build -t snippet-box .

# Build image for ARM
docker buildx build \
  --platform linux/arm/v7,linux/arm64 \
  -f Dockerfile.arm \
  -t snippet-box:arm .
```

#### Deployment

```sh
# run container
# for ARM use snippet-box:arm tag
docker run -p 5000:5000 -v /path/to/data:/app/data snippet-box
```

#### Docker Compose

```yaml
version: '3'
services:
  snippet-box:
    image: pawelmalak/snippet-box:latest
    container_name: snippet-box
    volumes:
      - /path/to/host/data:/app/data
    ports:
      - 5000:5000
    restart: unless-stopped
```

### Without Docker

Follow instructions from wiki - [Installation without Docker](https://github.com/pawelmalak/snippet-box/wiki/Installation-without-Docker)

## Functionality

- Search
  - Search your snippets with built-in tags and language filters
- Pinned snippets
  - Pin your favorite / important snippets to home screen for easy and quick access
- Like snippets
  - Like snippets to show appreciation for useful code
  - See how many users have liked each snippet
- Save snippets
  - Save snippets (including those created by others) to your personal collection
  - Access your saved snippets from the "Saved" page

![Homescreen screenshot](./.github/img/home.png)

- Snippet library
  - Manage your snippets through snippet library
  - Easily filter and access your code using tags

![Snippet library screenshot](./.github/img/snippets.png)

- Snippet
  - View your code, snippet details and documentation
  - Built-in syntax highlighting
  - Easily perform snippet actions like edit, pin or delete from a single place

![Snippet screenshot](./.github/img/snippet.png)

- Editor
  - Create and edit your snippets from simple and easy to use editor

![Editor screenshot](./.github/img/editor.png)

## Usage

### Search functionality

Visit wiki for search functionality and available filters reference: [Search functionality](https://github.com/pawelmalak/snippet-box/wiki/Search-functionality)

### Search UI

The search bar supports two types of searches:

1. **Simple Text Search**: Just type your search terms and press Enter.
   ```
   javascript function
   ```

2. **Advanced Search with Filters**: Use special syntax for filtering by tags and languages.
   ```
   database lang:sql tags:postgresql,query
   ```

   Available filters:
   - `lang:` - Filter by programming language (e.g., `lang:javascript`)
   - `tags:` - Filter by tags, comma-separated (e.g., `tags:api,auth`)

You can combine text search with filters:
```
connection lang:javascript tags:database,mongodb
```

## Known Issues and Fixes

### Infinite Loop When Editing Snippets (Fixed)

We identified and fixed an issue where opening the editor for an existing snippet (`/editor/:id`) would cause infinite API calls to `getSnippet`. The issue was in the interaction between the `Editor` component and the `SnippetsContext`:

1. The `setSnippet` function was always calling `getSnippetById`, which made an API request regardless of whether the snippet was already loaded
2. When the API response came back, it would update the state, causing a re-render
3. This would trigger the `useEffect` in the `Editor` component again, creating an infinite loop

The fix involved three changes:
- In `SnippetsContext`: Modified `setSnippet` to check if the current snippet is already the requested one
- In `SnippetsContext`: Enhanced `getSnippetById` to compare new data with current data before setting state
- In `Editor.tsx`: Added a condition to the `useEffect` to prevent unnecessary calls

These changes ensure that API calls are only made when needed, preventing the infinite loop.

### Data Type Conversions

- **isPinned Field**: The `isPinned` field is stored as an INTEGER in the database (0 for false, 1 for true), but is handled as a boolean in the API requests. The controllers automatically convert between these formats.
- **Boolean Fields**: The `favorite` and `is_public` fields are stored as BOOLEAN in the database but may be passed as strings in API requests. The controllers handle this conversion.

If you encounter an error like `invalid input syntax for type integer: "false"` when creating or updating snippets, it's likely due to a type mismatch between the API request and the database schema.

### Database Naming Conventions

The application follows PostgreSQL naming conventions for database fields while maintaining JavaScript/TypeScript conventions in the codebase:

- **Database Fields**: Use snake_case (e.g., `user_id`, `is_pinned`, `created_at`)
- **JavaScript/TypeScript Properties**: Use camelCase (e.g., `userId`, `isPinned`, `createdAt`)

This approach is implemented using Sequelize's `field` option to map between camelCase property names and snake_case database column names. Additionally, the `underscored: true` option is set on model definitions to automatically convert timestamps.

Examples of this mapping:
- JS Property `userId` → DB Column `user_id`
- JS Property `isPinned` → DB Column `is_pinned`
- JS Property `createdAt` → DB Column `created_at`

### UUID Implementation

The application uses UUIDs (Universally Unique Identifiers) for all primary and foreign keys instead of sequential integers. This provides several benefits:

- **Global Uniqueness**: UUIDs are globally unique across all tables and databases, eliminating ID collisions.
- **Security**: UUIDs are non-sequential and harder to guess, improving security.
- **Distributed Systems**: Makes it easier to merge data from different database instances.
- **Parallel Processing**: Allows for parallel inserts without ID conflicts.

Technical implementation details:
- PostgreSQL's `uuid-ossp` extension is used to generate UUIDs on the database side.
- IDs are stored as UUID type in the database and as strings in the TypeScript interfaces.
- The Sequelize ORM uses `DataTypes.UUID` type with `UUIDV4` default values.
- Foreign key relationships maintain referential integrity using UUID types.

## Authentication

Snippet Box now includes a comprehensive authentication system that allows users to:

- Register with email and password
- Login to access their snippets
- Logout to end their session
- Reset forgotten passwords
- Update their account details and username
- Manage their profile with a unique username

### Authentication Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/auth/register` | POST | Register a new user | No |
| `/api/auth/login` | POST | Login with email and password | No |
| `/api/auth/logout` | GET | Logout and clear cookie | No |
| `/api/auth/me` | GET | Get current user details | Yes |
| `/api/auth/updatedetails` | PUT | Update user email and username | Yes |
| `/api/auth/updatepassword` | PUT | Update user password | Yes |
| `/api/auth/forgotpassword` | POST | Request password reset | No |
| `/api/auth/resetpassword/:resettoken` | PUT | Reset password with token | No |

### Snippet Privacy

With authentication enabled, snippets are now private by default and only visible to their creator. Users can make snippets public by setting the `is_public` field to `true` when creating or updating a snippet.

### Public vs Private Snippets

- **Public Snippets**: Snippets with `is_public` set to `true` are accessible to anyone, even without authentication. These can be accessed directly via URL (e.g., `http://localhost:3000/snippet/6`) or through the API (`http://localhost:3000/api/snippets/6`).

- **Private Snippets**: Snippets with `is_public` set to `false` (default) are only accessible to their creator. Users must be authenticated to access their own private snippets.

### Accessing Snippets

- **Unauthenticated Users**: Can only access public snippets.
- **Authenticated Users**: Can access their own private snippets and all public snippets.

#### API Access

- **Public Snippets**: Can be accessed directly via API without authentication: `/api/snippets/{id}`
- **Private Snippets**: Require authentication to access. The user must be logged in and have a valid token.

#### Web Access

- **Public Snippets**: Can be accessed directly via URL: `/snippet/{id}`
- **Private Snippets**: Require the user to be logged in. If not logged in, the user will be redirected to the login page.

### Troubleshooting Access Issues

If you're having trouble accessing snippets:

1. **For Public Snippets**: 
   - Ensure the snippet has `is_public` set to `true` in the database.
   - Check the browser console for any API errors.

2. **For Private Snippets**:
   - Make sure you're logged in as the creator of the snippet.
   - Check that your authentication token is valid and not expired.
   - Try logging out and logging back in to refresh your token.
   - Verify that the snippet's `userId` matches your user ID.

3. **Common Issues**:
   - **403 Forbidden**: This means you're authenticated but don't have permission to access the snippet. Check if you're the owner of the snippet.
   - **401 Unauthorized**: This means you're not authenticated. Try logging in again.
   - **Redirect to Login**: This happens when you try to access a private snippet without being logged in.
   - **Redirect to Root**: This can happen if there's an issue with your authentication token. Try logging out and logging back in.

### Authentication Flow

1. Register a user with email and password
2. Login to receive a JWT token (stored in an HTTP-only cookie)
3. Access protected routes with the token
4. Logout to invalidate the token

### User Profiles

Snippet Box now includes public user profiles that allow users to:

- View a user's basic information (username, join date)
- See statistics about a user's contributions (number of snippets, total likes received)
- Browse all public snippets created by a user

#### Accessing User Profiles

User profiles can be accessed directly via URL using the username:
```
http://localhost:3000/{username}
```

For example, to view the profile of a user with the username "john_doe":
```
http://localhost:3000/john_doe
```

You can also access user profiles by clicking on a username anywhere in the application.

### Environment Variables

The authentication system uses the following environment variables:

- `JWT_SECRET`: Secret key for JWT token generation (default: 'snippetboxsecret')
- `JWT_EXPIRE`: JWT token expiration time (default: '30d')
- `JWT_COOKIE_EXPIRE`: Cookie expiration time in days (default: 30)

## Full-Text Search

Snippet Box now includes a powerful full-text search feature that allows you to search across:

- Snippet titles
- Snippet descriptions
- Tag names

The search uses PostgreSQL's built-in full-text search capabilities with the following features:

- **Case-Insensitive**: Searches are not case-sensitive, so "JavaScript", "javascript", and "JAVASCRIPT" will all return the same results.
- **Weighted Search**: Results are ranked by relevance, with matches in titles given higher priority than matches in descriptions or tags.
- **Stemming**: Searches for "running" will also match "run" and "runs".
- **Stop Words**: Common words like "the", "and", "or" are ignored in searches.
- **Partial Word Matching**: Searches will match parts of words.

### Search API

The search API (`/api/snippets/search`) now supports multiple formats:

1. **Simple Text Search**:
   ```json
   "javascript function"
   ```
   or
   ```json
   { "searchText": "javascript function" }
   ```

2. **Structured Search**:
   ```json
   {
     "query": "database",
     "tags": ["postgresql", "sql"],
     "languages": ["javascript", "typescript"]
   }
   ```

### Search Syntax

The search supports the following syntax:

- **Simple search**: Just type your search terms (e.g., "javascript function")
- **Phrase search**: Use quotes for exact phrases (e.g., "database connection")
- **AND/OR operators**: Use AND/OR between terms (e.g., "javascript AND function")
- **Negation**: Use - or NOT before terms you want to exclude (e.g., "javascript -jquery" or "javascript NOT jquery")

### Performance Optimization

The search is optimized for performance with:

- **GIN Indexes**: Fast lookup for full-text search queries
- **Materialized Columns**: Pre-computed search vectors for quick matching
- **Ranked Results**: Most relevant results appear first

### Snippet Ownership and Permissions

Snippet Box implements a permission system to control who can edit or delete snippets:

- **Snippet Owners**: Only the creator of a snippet can edit or delete it. The Edit and Delete buttons are only visible to the snippet owner.
- **Public Snippets**: Even if a snippet is public, only the owner can edit or delete it. Other users can view and copy the snippet but cannot modify it.
- **Private Snippets**: Private snippets are only visible to their owners and cannot be accessed by other users.

This ensures that users can safely share their snippets without worrying about unauthorized modifications.

### Accessing Raw Snippet Code

Snippet Box provides an API endpoint to access the raw code of a snippet: `/api/snippets/raw/:id`. This endpoint follows the same access rules as regular snippet access:

- **Public Snippets**: Can be accessed by anyone, even without authentication
- **Private Snippets**: Can only be accessed by the snippet owner

If you're having trouble accessing raw snippet code and receiving HTML instead of the actual code, it could be due to one of these issues:

1. **Authentication**: You might not be authenticated, and the snippet is private
2. **Permissions**: You might be authenticated but don't own the private snippet
3. **Server Configuration**: The server might be incorrectly routing API requests to the client-side application

To fix these issues:

1. Make sure you're logged in if trying to access a private snippet
2. Check that the snippet is either public or owned by you
3. If you're a server administrator, ensure that API routes are properly configured in the server.ts file

### Likes Functionality

Snippet Box includes a like system that allows users to like snippets and see how many likes each snippet has received.

#### Like API Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/likes/:id` | POST | Like a snippet | Yes |
| `/api/likes/:id` | DELETE | Unlike a snippet | Yes |
| `/api/likes/check/:id` | GET | Check if user has liked a snippet | Optional |

#### How Likes Work

1. **Liking a Snippet**: Authenticated users can like a snippet by sending a POST request to `/api/likes/:id`. This increments the snippet's like count and records the user's like.
2. **Unliking a Snippet**: Users can remove their like by sending a DELETE request to `/api/likes/:id`. This decrements the snippet's like count and removes the user's like record.
3. **Checking Like Status**: The `/api/likes/check/:id` endpoint returns whether the current user has liked a snippet and the total number of likes.

#### Authentication for Likes

- **Liking/Unliking**: Requires authentication. The `protect` middleware ensures that only authenticated users can like or unlike snippets.
- **Checking Like Status**: Authentication is optional. The endpoint will return the total like count for all users, but will only show the user's personal like status (`liked: true/false`) if they are authenticated.

#### Troubleshooting Like Issues

If you're having trouble with the likes functionality:

1. **Like Status Not Showing Correctly**: 
   - For authenticated users: Make sure your authentication token is valid.
   - For unauthenticated users: The `liked` field will always be `false`, but you should still see the total `likes_count`.
2. **Unable to Like**: Ensure you're authenticated and have a valid token. Check the browser console for any API errors.
3. **Like Count Not Updating**: The like count is stored in the snippet record. If it's not updating, there might be an issue with the transaction that updates both the like record and the snippet's like count.

#### Recent Fixes

- Added the `optionalProtect` middleware to the `/api/likes/check/:id` route to allow both authenticated and unauthenticated users to check the like count. Authenticated users will see their personal like status, while unauthenticated users will only see the total like count.

## Data Import Tools

### CSV to PostgreSQL Import Tool

The repository includes a data import tool that allows you to load prompts from a CSV file into the Snippet Box PostgreSQL database.

#### Tool Location
`data/data-load-tool/csv-to-postgres-python.py`

#### CSV Format
The CSV file should have the following columns:
- `act`: The name/title of the prompt (used as the snippet title)
- `prompt`: The text content of the prompt (used as both description and code content)
- `for_devs`: A boolean flag indicating if the prompt is for developers (TRUE/FALSE)

#### Database Schema
The tool imports data into the following PostgreSQL tables:

1. **snippets**: Main table for code snippets
   - `id`: UUID (Primary Key)
   - `title`: The prompt's act/title
   - `description`: The prompt text
   - `language`: Determined based on act name mapping
   - `code`: The prompt text
   - `docs`: Empty string
   - `isPinned`: Set to false by default
   - `favorite`: Set to false by default  
   - `is_public`: Set to true by default
   - `userId`: Always set to "1"
   - `likes_count`: Random number between 1-100

2. **tags**: Table for snippet tags
   - `id`: UUID (Primary Key)
   - `name`: Unique tag name

3. **snippets_tags**: Junction table for snippet-tag relationship
   - `snippet_id`: Foreign key to snippets table
   - `tag_id`: Foreign key to tags table

#### How To Use
Run the script from the command line, providing the path to your CSV file:

```sh
python data/data-load-tool/csv-to-postgres-python.py data/data-load-tool/prompts.csv
```

The tool will:
1. Create the necessary tables if they don't exist
2. Read data from the CSV file
3. Map each prompt's "act" to an appropriate programming language
4. Create tags for each act type and dev status
5. Import each prompt as a snippet with appropriate tags
6. Show progress during the import process

#### Language Mapping
The tool maps the "act" field to programming languages using a predefined mapping. For example:
- "Ethereum Developer" → solidity
- "Linux Terminal" → bash
- "JavaScript Developer" → javascript

If no mapping exists for an act, it defaults to "plaintext".

#### Tag Structure
Each imported snippet will have two tags:
1. The act name (e.g., "Ethereum Developer")
2. A dev status tag ("dev-true" or "dev-false") based on the "for_devs" column
