## Qué cambia

<!-- Describí brevemente el alcance del PR. -->

## Checklist

- [ ] `npm run lint`, `npm run typecheck` y `npm run build` pasan en local (o confío en **CI — listo para merge**).
- [ ] `npm run sync:pull` contra `main` si venía de una rama vieja.
- [ ] Si toca el feed / env: actualicé documentación o `.env.example` si aplica.
- [ ] Deploy: no mezclo integración Git de Vercel con secretos `VERCEL_*` en Actions sin querer (ver `.github/DEPLOYMENT.md`).

## Notas

<!-- Opcional: capturas, enlaces a issues, consideraciones de producción. -->
