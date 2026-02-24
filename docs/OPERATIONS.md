# ParkSentry Operations Notes

## Local startup

1. Ensure PostgreSQL is running
2. Set env:
   - `DATABASE_URL=postgresql://parksentry:parksentry@127.0.0.1:5432/parksentry`
3. Run migrations:
   - `npm run migrate`
4. Start API:
   - `npm run dev`
5. Start worker loop (separate terminal):
   - `npm run worker`

## Authentication

- Set `API_KEYS` in env (comma-separated values)
- Send one key via `x-api-key` header (or `Authorization: Bearer <key>`)
- Health endpoints (`/health`, `/ready`) remain public

## Health checks

- `GET /health` basic liveness
- `GET /ready` readiness including DB connectivity

## Upload storage

- Uploaded files stored under `var/uploads/<cameraId>/...`
- Served via static prefix `/files/`

## Production hardening checklist

- Move uploads to object storage (S3/R2)
- Add authn/authz for all API routes
- Enable request rate limiting
- Add retention policy worker for media cleanup
- Add structured metrics and alerting
- Replace dev worker endpoints with queue workers
