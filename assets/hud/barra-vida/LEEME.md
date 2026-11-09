# hud/barra-vida

Piezas de la barra de vida: marco con casilla de retrato, relleno gris que se tiñe por código y destello. El marco se corta en 3 partes para hacerlo del largo que se necesite.

| Archivo | Qué es | Para qué sirve |
|---|---|---|
| `barra_marco.png` | Cápsula larga de acero azul y dorado con luz cian por dentro y una casilla redonda a la izquierda para el retrato. Los dos huecos (casilla e interior de la barra) son transparentes. | Barra de vida/energía con retrato. Se corta en 3 partes (izquierda 0-300 px, centro 600-700 px que se repite, derecha 1290-1400 px) para hacerla tan larga como se necesite. El relleno va DETRÁS del marco. |
| `barra_relleno.png` | Franja brillante tipo líquido en blanco y grises, con olas suaves y burbujas. Sin color a propósito. | Se estira dentro del hueco de la barra y se tiñe con color (verde, amarillo, rojo) usando fondo de color + multiplicar y un poco de brillo. Sirve para cualquier barra: energía, maná, carga. |
| `barra_brillo.png` | Franja suave con destellos diagonales blancos y azul claro, que se desvanece en los bordes. | Pasarlo de izquierda a derecha sobre la barra con mezcla "pantalla" (screen) y opacidad ~0,7 para dar brillo. |

Catálogo completo: `assets/CATALOGO.md`.