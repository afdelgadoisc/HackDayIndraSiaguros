# HackDay Indra - Página Web de Seguros con Asistente Gemini

Este proyecto es una página web de seguros que integra un asistente inteligente alimentado por la API de Gemini. El asistente permite a los usuarios interactuar con la web mediante comandos de voz, facilitando la navegación y la gestión de productos de seguros de manera intuitiva y automatizada.

## ¿Qué ofrece la aplicación?

- Consulta y comparación de productos de seguros.
- Relleno y envío automatizado del formulario de cotización.
- Extracción de testimonios de clientes y datos de contacto.
- Navegación asistida por voz gracias a la integración con Gemini API.

## ¿Cómo funciona el asistente?

El asistente escucha comandos de voz del usuario, los interpreta usando la API de Gemini y ejecuta acciones en la página, como mostrar productos, comparar seguros, rellenar formularios o navegar entre secciones.

## Instrucciones para usar y desplegar en local

1. **Clona este repositorio**  
   Descarga el proyecto en tu máquina local:
   ```bash
   git clone git@github.com:afdelgadoisc/HackDayIndraSiaguros.git
   cd HackDayIndraSiaguros
   ```

2. **Obtén tu API key de Gemini**  
   Regístrate en Google AI Studio y copia tu clave de API.

3. **Inicia un servidor local**  
   Puedes usar Python, Node.js o la extensión Live Server de VS Code:
   - Con Python:
     ```bash
     python -m http.server 8000
     ```
   - Con Node.js:
     ```bash
     npx http-server 8000
     ```
   - O abre la carpeta con VS Code y usa "Open with Live Server".

4. **Abre la aplicación en tu navegador**  
   Ve a [http://localhost:8000](http://localhost:8000) y sigue las instrucciones para pegar tu API key de Gemini en la configuración del asistente.

5. **¡Listo!**  
   Usa comandos de voz para navegar y gestionar seguros en la web.

## Licencia

MIT
