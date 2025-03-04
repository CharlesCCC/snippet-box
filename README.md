# Snippet Box

![Snippet library screenshot](./.github/img/snippets.png)

## Description

Snippet Box is a simple self-hosted app for organizing your code snippets. It allows you to easily create, edit, browse and manage your snippets in various languages. With built-in Markdown support, Snippet Box makes it very easy to add notes or simple documentation to your code.

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

### Data Type Conversions

- **isPinned Field**: The `isPinned` field is stored as an INTEGER in the database (0 for false, 1 for true), but is handled as a boolean in the API requests. The controllers automatically convert between these formats.
- **Boolean Fields**: The `favorite` and `is_public` fields are stored as BOOLEAN in the database but may be passed as strings in API requests. The controllers handle this conversion.

If you encounter an error like `invalid input syntax for type integer: "false"` when creating or updating snippets, it's likely due to a type mismatch between the API request and the database schema.

## Authentication

Snippet Box now includes a comprehensive authentication system that allows users to:

- Register with email and password
- Login to access their snippets
- Logout to end their session
- Reset forgotten passwords
- Update their account details and password

### Authentication Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/auth/register` | POST | Register a new user | No |
| `/api/auth/login` | POST | Login with email and password | No |
| `/api/auth/logout` | GET | Logout and clear cookie | No |
| `/api/auth/me` | GET | Get current user details | Yes |
| `/api/auth/updatedetails` | PUT | Update user email | Yes |
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
