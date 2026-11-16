# Cueva: los acertijos siempre se ven

**Problema:** en la cueva (oscuridad total fuera del círculo de la antorcha) los objetos de los acertijos —faroles con las opciones, dianas, bloques,
antorchas, piedras numeradas, plataformas de la carreta— quedaban a oscuras, con su número, y no se podían leer ni apuntar.
Medido en el navegador antes del arreglo: 0 de 9 etiquetas legibles en faroles, 0 de 13 en dianas, 0 de 9 en la carreta, 1 de 9 en piedras.

**Causa:** todo se dibujaba *antes* de la capa de oscuridad y solo se iluminaban los faroles ya encendidos y las antorchas ya prendidas;
además solo se consideraban estaciones con el centro a menos de 1.100 px del héroe, así que un objeto al borde de la pantalla podía quedar a oscuras.

**Arreglo (en `engine/nivel1/motor.js`):**
1. `lucesAcertijos()`: **todo** objeto del acertijo que esté en pantalla emite su propia luz (r ≈ 130–155 px), esté apagado, encendido o sin tocar.
   Aplica a las 6 mecánicas (farol, bloques, diana, antorchas, piedras numeradas y plataformas + carreta).
2. Halo cálido encima de la oscuridad: los objetos se ven como "letreros luminosos".
3. `etiquetasAcertijos()`: los números se vuelven a escribir **por encima** de la oscuridad y de la viñeta, así no pierden brillo en los bordes de la pantalla.

El resto de la cueva sigue oscuro: solo se ilumina lo que hay que leer o tocar. Los enunciados ya se mostraban arriba, fuera de la oscuridad.

**Prueba:** `node tests/navegador/cueva-visible.mjs` recorre todas las estaciones de la cueva de 3 semillas, con el héroe en 3 puntos de cada una,
y exige que **todas** las etiquetas en pantalla sean legibles.
