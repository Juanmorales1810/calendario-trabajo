# 🚀 Next.js Template - Devanthos

Una plantilla moderna y lista para producción de **Next.js 15** con **Tailwind CSS 4**, **shadcn/ui** y **TypeScript**. Diseñada por **Devanthos** para acelerar el desarrollo de aplicaciones web modernas.

![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Características

- 🔥 **Next.js 16** con App Router y React 19
- 🎨 **Tailwind CSS 4** para diseño moderno y responsivo
- 🧩 **shadcn/ui** - Componentes UI accesibles y customizables
- 📝 **TypeScript** para desarrollo type-safe
- 🔍 **ESLint** y **Prettier** para código limpio
- 🚀 **Turbopack** para compilación ultra-rápida
- 🎭 **Lucide React** para iconografía moderna
- 🎯 **CVA (Class Variance Authority)** para variantes de componentes
- 📱 **Responsive** y **Mobile-first** por defecto

## 🛠️ Stack Tecnológico

### Core

- **Framework**: Next.js 16.0.0
- **React**: 19.2.0
- **TypeScript**: 5
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm

### UI y Componentes

- **shadcn/ui**: Componentes accesibles con Radix UI
- **Radix UI**: Primitivos accesibles (Accordion, Dialog, Navigation Menu)
- **Lucide React**: Iconos SVG optimizados
- **CVA**: Gestión de variantes de componentes

### Herramientas de Desarrollo

- **ESLint**: Linting con configuración de Next.js
- **Prettier**: Formateo de código con plugin de Tailwind
- **Turbopack**: Bundler de desarrollo ultra-rápido

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18.0 o superior
- pnpm (recomendado) o npm/yarn

### Instalación

1. **Clona el repositorio**

    ```bash
    git clone https://github.com/devanthos/next-template-devanthos.git
    cd next-template-devanthos
    ```

2. **Instala las dependencias**

    ```bash
    pnpm install
    ```

3. **Ejecuta el servidor de desarrollo**

    ```bash
    pnpm dev
    ```

4. **¡Abre tu navegador!**

    Visita [http://localhost:3000](http://localhost:3000) para ver tu aplicación en funcionamiento.

## 📁 Estructura del Proyecto

```
next-template-devanthos/
├── src/
│   ├── app/                 # App Router de Next.js
│   │   ├── layout.tsx       # Layout raíz
│   │   └── page.tsx         # Página principal
│   ├── components/          # Componentes reutilizables
│   │   ├── interfaces/      # Componentes de interfaz
│   │   │   ├── hero.tsx     # Componente Hero
│   │   │   ├── navbar.tsx   # Barra de navegación
│   │   │   └── footer.tsx   # Pie de página
│   │   └── ui/              # Componentes UI de shadcn
│   │       ├── button.tsx   # Componente Button
│   │       ├── accordion.tsx
│   │       └── ...
│   ├── lib/                 # Utilidades y configuraciones
│   │   └── utils.ts         # Funciones auxiliares
│   └── styles/              # Estilos globales
│       └── globals.css      # CSS global con Tailwind
├── public/                  # Archivos estáticos
├── components.json          # Configuración de shadcn/ui
├── tailwind.config.js       # Configuración de Tailwind
├── tsconfig.json           # Configuración de TypeScript
└── package.json            # Dependencias y scripts
```

## 📜 Scripts Disponibles

```bash
# Desarrollo con Turbopack
pnpm dev

# Construcción para producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Linting
pnpm lint
```

## 🎨 Personalización

### Colores y Temas

El template utiliza un sistema de variables CSS para fácil personalización. Puedes modificar los colores en `src/styles/globals.css`:

```css
:root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    /* ... más variables */
}
```

### Componentes shadcn/ui

Para agregar nuevos componentes de shadcn/ui:

```bash
npx shadcn@latest add [component-name]
```

Ejemplo:

```bash
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
```

### Fuentes

El template utiliza la fuente **Geist** de Vercel, optimizada automáticamente por Next.js. Puedes cambiarla en `src/app/layout.tsx`.

## 🧩 Componentes Incluidos

### Interfaces

- **Hero**: Sección principal con call-to-action
- **Navbar**: Barra de navegación responsiva
- **Footer**: Pie de página con enlaces

### UI (shadcn/ui)

- **Button**: Botón con múltiples variantes
- **Accordion**: Componente desplegable
- **Navigation Menu**: Menú de navegación avanzado
- **Sheet**: Panel lateral deslizante

## 📱 Responsive Design

El template está construido con un enfoque **mobile-first** utilizando las utilidades responsivas de Tailwind CSS:

```jsx
<div className="text-sm sm:text-base md:text-lg lg:text-xl">Texto responsivo</div>
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a [Vercel](https://vercel.com)
2. Vercel detectará automáticamente que es un proyecto Next.js
3. ¡Despliega con un clic!

### Otros Proveedores

```bash
# Construir para producción
pnpm build

# Los archivos estáticos se generan en .next/
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## 🙋‍♂️ Soporte

Si tienes preguntas o necesitas ayuda:

- 📧 Email: soporte@devanthos.com
- 🐛 Issues: [GitHub Issues](https://github.com/devanthos/next-template-devanthos/issues)
- 📖 Documentación: [Docs](https://devanthos.com/docs)

## 🔗 Enlaces Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Desarrollado con ❤️ por [Devanthos](https://devanthos.com)**
