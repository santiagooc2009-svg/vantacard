# Fotos de producto — buzón de entrada

Arrastra aquí las fotos tal como salieron de la cámara o del proveedor.
**No hace falta renombrarlas, recortarlas ni comprimirlas.** De aquí las
tomo yo, las convierto a WebP con el tamaño que pide cada ficha y las
dejo en `assets/` con el nombre que usa `catalogo.html`.

Esta carpeta es solo el buzón: los archivos que la página sirve viven un
nivel arriba, en `assets/`.

## Qué falta

| Producto | Cómo lo reconozco |
|---|---|
| Tarjeta de madera | Las que ya me enseñaste: la de la mano con el teléfono, la del fondo negro, la de los cinco acabados |
| Placa de Instagram | El caballete rosa con el QR y "Tap or Scan" |
| Placa de reseñas de Google | Aún no la he visto |

## Qué ayuda, si lo tienes a la mano

- **Dos o tres fotos por producto.** Yo elijo cuál queda mejor en la
  ficha; el resto quedan disponibles por si después hacemos una galería.
- Una foto **del producto solo**, sin manos ni escenografía, sirve para
  la ficha; las de ambiente sirven para redes y para la parte de arriba
  de la página.
- Si una foto tiene el logo de un cliente o un QR que apunta a una
  cuenta real, dímelo y la recorto o la sustituyo antes de publicarla.

## Lo que necesito por escrito, además de las fotos

Para que la ficha no diga nada que no sea cierto:

1. **Acabados de madera** que manejas (en las fotos veo cinco, pero no
   quiero inventar los nombres).
2. **Las placas**, ¿son solo de mostrador o también van en pared?
3. Cualquier otro producto NFC que quieras en la página.

---

## Ya procesadas

| Original | Se publica como | Dónde |
|---|---|---|
| `(6)` nogal sobre fondo negro | `assets/producto-madera.webp` | ficha Tarjeta de madera |
| `(12)` mostrador de mármol | `assets/producto-placa-instagram.webp` | ficha Placa de Instagram |

Las demás quedan aquí guardadas por si luego hacemos galería:
`(4)` los cinco acabados, `(5)` el saco con la tarjeta, `(3)` el bolso,
`(10)` y `(11)` la placa sobre blanco y sobre la mesa del jardín.

**Esta carpeta no se publica.** `netlify.toml` pone `base = "vantacard-web"`,
así que lo que está aquí arriba queda versionado pero nunca se sirve —
son 8.7MB de PNG que no tienen por qué viajar al sitio.

### Segunda tanda — tarjetas estilo fibra de carbono

`(base)` el saco en la cafetería es la que se publica, recortada a
`assets/producto-fibra.webp` (ventana 760x950 desde 162,202: a encuadre
completo el tejido no se distinguía al tamaño del mosaico).
`(1)` las dos sobre blanco y `(2)` la del bolso naranja quedan guardadas.

**No son fibra de carbono**, son plástico con ese acabado, así que la
ficha dice "estilo fibra de carbono" y nunca el material a secas.
