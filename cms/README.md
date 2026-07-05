# Learn English CMS

Admin interface built with React-admin, TypeScript, Vite and Material UI.

## Development

Start the CMS Spring Boot API on port `8081`, then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with an account whose role is `ADMIN`.

API configuration:

- Local dev: `VITE_API_URL=/api` and `VITE_API_PROXY_TARGET=http://localhost:8081`.
- Deploy: set `VITE_API_URL` to the deployed CMS backend API URL, for example `https://cms-api.example.com/api`.
