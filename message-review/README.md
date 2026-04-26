# Message Review Catalog

This folder groups all API message types by **sender -> receiver** so they are easy to review before release.

Subfolders:

- `client-to-server` - messages sent by end users/apps to public `/v1/*` endpoints
- `server-to-client` - responses from public `/v1/*` endpoints
- `merchant-to-server` - merchant dashboard/rules requests
- `server-to-merchant` - merchant-facing dashboard/rules responses
- `internal-to-server` - internal ingestion/admin requests (`/internal/*`)
- `server-to-internal` - internal ingestion/admin responses

Each subfolder has a `messages.json` file with representative payloads for every message type currently validated by `apps/api/src/validation.js`.
