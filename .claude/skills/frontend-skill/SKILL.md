---
name: frontend-development
description: Build production-grade frontend pages, components, layouts, and interfaces with high design quality. Use this skill when the user asks to create web pages, dashboards, interactive components, responsive layouts, or styled applications (examples include React components, Next.js pages, Vue components, HTML/CSS layouts, or complex frontend systems). Generates practical, polished code while following modern frontend best practices.
---

This skill guides the creation of distinctive, production-ready frontend applications that are functional, maintainable, and visually compelling. It integrates design thinking, modern frontend frameworks, componentization, responsive layouts, and interactive behaviors.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about purpose, audience, platform constraints, or aesthetic direction.

## Design & Development Thinking

Before writing code, focus on understanding the context and committing to a clear approach:

- **Purpose**: Identify the user problem, platform, and target audience.
- **Tone & Style**: Choose a design language aligned with brand, function, or emotional impact (e.g., minimal, playful, luxury, modern, retro, futuristic).
- **Constraints**: Technical (frameworks like React, Vue, Svelte; performance budgets; accessibility standards; cross-browser support).
- **Differentiation**: Decide what makes the UI memorable: unique animations, typography, layouts, or interactions.

**CRITICAL**: Every component or page should have a reason for its layout, style, and interactivity. Intentionality over generic choices.

## Core Frontend Sub-Skills

### 1. Component-Based Architecture
**Goal:** Build modular, reusable, and maintainable components.

- **Concepts:** Atomic design (Atoms, Molecules, Organisms), DRY principle, props and state management.
- **Tools & Frameworks:** React, Vue, Svelte, Angular.
- **Real-World Applications:** 
  - Reusable buttons, cards, form elements across a dashboard.
  - Modal dialogs that can handle any content dynamically.
- **Best Practices:** 
  - Keep components small and focused.
  - Use prop-types or TypeScript for type safety.
  - Encapsulate styles with CSS Modules, Tailwind, or Styled Components.

### 2. Layout & Responsive Design
**Goal:** Design flexible layouts that work across devices and screen sizes.

- **Concepts:** CSS Grid, Flexbox, responsive breakpoints, mobile-first design.
- **Tools & Libraries:** TailwindCSS, Bootstrap, Material-UI.
- **Real-World Applications:** 
  - Multi-column dashboards that adapt from desktop to mobile.
  - Navigation menus that collapse or transform on smaller screens.
- **Best Practices:** 
  - Start with a mobile-first approach.
  - Use relative units (rem, %, vh/vw) over fixed pixels.
  - Test layouts across multiple devices and browsers.

### 3. Styling & Theming
**Goal:** Ensure consistent visual identity and maintainable style.

- **Concepts:** Design tokens, CSS variables, dark/light mode, typography hierarchy.
- **Tools & Libraries:** TailwindCSS, Styled Components, Sass, PostCSS.
- **Real-World Applications:** 
  - Theming a web app to match brand colors and typography.
  - Creating a dynamic style switcher for users (dark/light mode toggle).
- **Best Practices:** 
  - Centralize colors, spacing, and fonts.
  - Use semantic class names or utility classes.
  - Maintain accessibility (contrast ratios, readable fonts).

### 4. Interactivity & State Management
**Goal:** Make UI dynamic and interactive with predictable state.

- **Concepts:** Event handling, form management, conditional rendering, reactive state.
- **Tools & Libraries:** React Hooks, Vue Composition API, Redux, Zustand, Pinia.
- **Real-World Applications:** 
  - A filterable product catalog with real-time search.
  - Multi-step forms with validation and progress tracking.
- **Best Practices:** 
  - Keep state minimal and local unless shared globally.
  - Avoid unnecessary re-renders for performance.
  - Use debouncing or throttling for expensive operations.

### 5. Animations & Micro-Interactions
**Goal:** Delight users with smooth transitions and feedback.

- **Concepts:** CSS transitions, keyframes, hover/focus effects, scroll-triggered animations.
- **Tools & Libraries:** Framer Motion (React), GSAP, Lottie for vector animations.
- **Real-World Applications:** 
  - Animated page loads and element reveals.
  - Button hover effects that provide tactile feedback.
- **Best Practices:** 
  - Animate only what is necessary for context.
  - Prefer GPU-accelerated properties (transform, opacity).
  - Keep animations subtle to enhance UX, not distract.

### 6. Accessibility & Performance
**Goal:** Build inclusive and fast-loading web interfaces.

- **Concepts:** Semantic HTML, ARIA roles, keyboard navigation, lazy loading, code splitting.
- **Tools & Libraries:** Lighthouse, Axe, React.lazy, Next.js image optimization.
- **Real-World Applications:** 
  - Screen-reader friendly forms.
  - Optimized landing pages for mobile users with slow connections.
- **Best Practices:** 
  - Test keyboard and screen reader interactions.
  - Minimize unused CSS and JS.
  - Optimize images and font loading strategies.

### 7. Testing & Debugging
**Goal:** Ensure reliability and maintainability of frontend code.

- **Concepts:** Unit tests, integration tests, visual regression, console/debugging tools.
- **Tools & Libraries:** Jest, React Testing Library, Cypress, Storybook.
- **Real-World Applications:** 
  - Snapshot testing UI components.
  - E2E testing of form flows or shopping carts.
- **Best Practices:** 
  - Write tests alongside development, not after.
  - Use Storybook for interactive component documentation.
  - Use browser dev tools and React/Vue dev tools efficiently.

## Implementation Guidelines

- **Start with a clear design mockup or wireframe.**
- **Componentize early:** Every repeated element should be its own component.
- **Use modern build tools:** Vite, Webpack, or Next.js.
- **Follow a consistent code style:** Prettier, ESLint, Stylelint.
- **Optimize for accessibility and responsiveness from day one.**
- **Integrate state management thoughtfully:** avoid over-engineering.
- **Polish visual and interactive details:** shadows, spacing, typography, hover/active states.
- **Document reusable components and patterns** for long-term maintainability.

## Recommended Learning Flow

1. Start with HTML, CSS, JS fundamentals.
2. Learn responsive layouts with Flexbox and Grid.
3. Explore component-based frameworks (React, Vue).
4. Integrate styling solutions (TailwindCSS, Sass, Styled Components).
5. Add interactivity and state management.
6. Enhance with animations and accessibility.
7. Test, debug, and deploy production-grade frontend applications.

## Key Takeaways

- Build modular, maintainable, and reusable components.
- Prioritize responsive layouts and consistent theming.
- Balance functionality with aesthetic intentionality.
- Use modern frontend frameworks and tooling for productivity.
- Always consider accessibility, performance, and user delight.

---

