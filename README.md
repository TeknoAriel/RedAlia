# Redalia — Red de Alianzas Inmobiliarias

Sitio institucional (Next.js 16, App Router, Tailwind).

## Desarrollo

```bash
npm ci
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno (Vercel)

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SITE_URL` | URL pública (ej. `https://redalia.vercel.app`) |
| `KITEPROP_PROPERTIES_URL` | JSON de difusión KiteProp. Si falta, se usa `data/kiteprop-sample.json` |
| `LEADS_WEBHOOK_URL` | Opcional: POST de formularios Contacto / Únete |

Copiá `.env.example` como referencia.

## Deploy

- Conectá el repo a [Vercel](https://vercel.com): root del proyecto = raíz del repo, framework **Next.js**.
- Tras cada push a `main`, Vercel despliega. La pestaña **Actions** en GitHub ejecuta CI (`build` + `lint`).
