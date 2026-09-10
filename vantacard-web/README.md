# VantaCard — sitio web

Sitio estático (HTML/CSS/JS plano, sin build step) para VantaCard,
tarjetas de presentación digitales NFC.

## Estructura

```
vantacard-web/
├── index.html
├── css/styles.css
├── js/main.js
├── assets/favicon.svg
└── README.md
```

## Previsualizar en local

No hay proceso de build. Solo se necesita un servidor estático
porque `js/main.js` se carga como script normal y los assets usan
rutas relativas.

```bash
cd vantacard-web
python3 -m http.server 8000
# abrir http://localhost:8000
```

o con Node:

```bash
npx serve vantacard-web
```

## Animación del hero

La sección `#heroScene` está "pineada" con GSAP ScrollTrigger
(`js/main.js`) mientras el usuario hace scroll: el teléfono viaja
hacia la tarjeta (la tarjeta permanece casi fija), con tres capas de
orbes de fondo en distintas velocidades de parallax. Al llegar,
dispara un efecto NFC (ripple + brillo) y un settle en dos tiempos
(`power4.out` + `back.out`). Después, la escena hace zoom hacia la
pantalla del teléfono y revela el contenido real de la página.

Si el usuario tiene activado `prefers-reduced-motion`, se omite el
scroll-jacking y se muestra directamente la composición ya asentada.

## Pendientes de contenido

Dos valores están marcados intencionalmente como placeholder y no
deben inventarse:

- `$[completar] MXN` — precio de los dos planes en `#servicios`.
- El enlace de Instagram en el footer (`#instagramLink`, actualmente `href="#"`).

## Despliegue

Cualquier hosting estático sirve. Solo hay que subir el contenido de
`vantacard-web/`.

### Vercel

```bash
npx vercel --cwd vantacard-web
```

### Netlify

```bash
npx netlify deploy --dir=vantacard-web --prod
```

### GitHub Pages

1. Settings → Pages → Deploy from a branch.
2. Seleccionar la rama y, si `vantacard-web/` no está en la raíz del
   repo, la carpeta `/vantacard-web` (o mover su contenido a la raíz).

### Hosting actual (vantacard.pro)

Sube el contenido de `vantacard-web/` vía el método que use tu
hosting actual (FTP/SFTP, panel de control, etc.), reemplazando los
archivos existentes.
