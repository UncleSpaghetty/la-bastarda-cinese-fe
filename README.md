# La bastarda cinese — frontend

SPA React/TypeScript/Vite. Il client visualizza proiezioni autorevoli ricevute dal
backend e invia soltanto intenzioni versionate.

```bash
npm install
npm run dev
```

Quality gate: `npm run lint && npm run typecheck && npm test && npm run build`.

## Variabili d'ambiente

Copia `.env.example` in `.env` per lo sviluppo locale. In CI/produzione, `VITE_PUBLIC_SITE_URL`
va impostata come secret/variabile della pipeline (richiesta solo per `npm run build`).

| Variabile | Obbligatoria | Esempio | Note |
| --- | --- | --- | --- |
| `VITE_API_URL` | No (default `http://localhost:8000/api/v1`) | `https://api.game.example.it/api/v1` | Base URL REST del backend. |
| `VITE_WS_URL` | No (default `ws://localhost:8000/ws/v1`) | `wss://api.game.example.it/ws/v1` | Base URL WebSocket realtime; usare `wss://` in produzione. |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | No | `1234567890-abc123.apps.googleusercontent.com` | Se assente, il pulsante "Continua con Google" non viene renderizzato. |
| `VITE_PUBLIC_SITE_URL` | **Sì** (solo per `npm run build`) | `https://game.example.it` | Origin canonico assoluto, HTTPS, senza path/query/hash né slash finale; usato per SEO, sitemap, robots.txt e Open Graph. |
| `VITE_PUBLIC_APP_NAME` | No (default `La bastarda cinese`) | `La bastarda cinese` | Nome pubblico usato nei metadati. |

`npm run test:e2e` imposta già `VITE_PUBLIC_SITE_URL`/`VITE_PUBLIC_APP_NAME` internamente (vedi
`playwright.config.ts`), quindi non serve esportarle a mano per i test end-to-end locali.

