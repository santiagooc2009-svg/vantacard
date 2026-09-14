# VantaCard — sitio web

Sitio estático (HTML/CSS/JS plano, sin build step) para VantaCard,
tarjetas de presentación digitales NFC.

## Estructura

```
vantacard-web/
├── index.html
├── compromiso.html
├── css/
│   ├── styles.css       (shared design system)
│   ├── fonts.css        (self-hosted @font-face rules)
│   └── compromiso.css   (page-specific)
├── js/
│   ├── main.js          (index.html only)
│   ├── compromiso.js    (compromiso.html only)
│   └── vendor/          (GSAP + ScrollTrigger, vendored)
├── assets/
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

Los dos planes en `#planes` mostraban antes un precio sin rellenar
(`$[completar] MXN`) — como el precio real todavía no está definido,
se reemplazó por un tier de "Cotización personalizada / según tu
equipo" en vez de inventar una cifra. Si en algún momento se define
un precio fijo por plan, hay que reemplazar `.plan__price--quote` en
`index.html` (y ajustar el estilo en `css/styles.css` si se vuelve a
un número en vez de una frase).

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
