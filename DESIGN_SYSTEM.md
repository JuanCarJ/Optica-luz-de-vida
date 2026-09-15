# Sistema de diseño — Óptica Luz de Vida

## Dirección

Interfaz editorial y cercana para una óptica local: precisión clínica, calidez y facilidad para contactar una sede. El diseño evita testimonios no verificables, precios inventados y promesas médicas.

## Tokens

| Rol | Token | Uso |
|---|---|---|
| Primario | `#12304A` | navegación, titulares, acciones principales |
| Secundario | `#2CA6A4` | énfasis, estados activos y acciones secundarias |
| Acento | `#E87961` | avisos, indicadores y detalles puntuales |
| Lilac auxiliar | `#8E8CBF` | órbitas e ilustraciones, no texto crítico |
| Superficie | `#FFFFFF` | tarjetas, formularios y contenido |
| Fondo suave | `#F5F1E8` | separación de secciones |
| Texto secundario | `#5D6D73` | descripciones y metadatos |

## Escala

- Contenedor máximo: 1184 px.
- Espaciado base: 8 px; secciones entre 92 y 135 px según viewport.
- Radio: 16–20 px en superficies grandes, 12 px en botones y 999 px solo en pills.
- Tipografía: Manrope para titulares y controles, Inter para lectura larga.

## Interacción y accesibilidad

- Botones y enlaces con objetivos táctiles mínimos de 44 px.
- `focus-visible` visible en teclado.
- `prefers-reduced-motion` respeta a quien solicita menos animación.
- Imágenes con texto alternativo; fotos del equipo y logo vienen del sitio oficial.
- No se muestran testimonios o reseñas que no hayan sido entregados por el cliente.
- El movimiento se limita a entrada suave de secciones, hover corto y marquee informativo; todo se desactiva con `prefers-reduced-motion`.
- La solicitud de cita valida en cliente y deriva a WhatsApp por sede; no afirma disponibilidad real ni guarda datos en el navegador.

## Próximo paso técnico

Conectar el mismo sistema a catálogo real, agenda, WhatsApp por sede y un visor GLB/glTF cuando el cliente entregue inventario y permisos.
