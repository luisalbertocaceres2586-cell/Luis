# types/modulos — un archivo por módulo

Cada módulo global de `engine/` declara su tipo en **su propio archivo** aquí.
Si agregas un módulo nuevo, **crea un archivo nuevo** (copia uno existente) en vez de editar `types/globales.d.ts`:
así dos personas o pestañas que trabajan en módulos distintos nunca tocan las mismas líneas y no hay conflicto.
