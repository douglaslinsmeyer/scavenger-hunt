# Software Design Plan

This document provides a detailed software design for the Scavenger Hunt application. It translates the high-level architecture into actionable guidance for developers, with a strong emphasis on modularity, the SOLID principles, and long-term maintainability.

## 1. Overall Design Philosophy

The design of this application will adhere to the following core principles:

*   **Modularity:** The system will be divided into distinct, independent modules. This reduces cognitive load for developers, allows for parallel development, and simplifies maintenance.
*   **SOLID Principles:** Each component, from backend services to frontend UI elements, will be designed following the SOLID principles to create a robust and decoupled codebase.
*   **DRY (Don't Repeat Yourself):** Business logic and common utilities will be abstracted into reusable components and services to avoid code duplication.
*   **KISS (Keep It Simple, Stupid):** The design will favor simplicity and clarity over unnecessary complexity. We will only introduce complexity when it is justified by a clear requirement.

## 2. Backend Software Design (Modular Monolith)

The backend will be built as a modular monolith. This design provides the simplicity of a single deployment unit while enforcing a clean separation of concerns, making the codebase easy to navigate and test.

### 2.1. Directory Structure

A feature-based directory structure will be used to enforce modularity:

```
/src
  /modules
    /hunts
      /hunts.controller.ts  # Handles HTTP req/res
      /hunts.service.ts     # Handles business logic
      /hunts.repository.ts  # Handles database queries
      /hunts.routes.ts      # Defines API routes for this module
      /hunts.dto.ts         # Data Transfer Objects for validation
      /hunts.interfaces.ts  # Type definitions for this module
    /tasks
      # ... similar structure ...
    /auth
      # ... similar structure ...
  /core
    /middleware           # Global middleware (auth, error handling)
    /logging              # Logging configuration (Winston)
    /config               # Environment configuration
  /shared
    /interfaces           # Interfaces shared across modules
    /utils                # Shared utility functions
  /app.ts                 # Express app setup and middleware wiring
  /server.ts              # Server initialization
```

### 2.2. Application of SOLID Principles

This diagram illustrates the dependency flow, adhering to the Dependency Inversion Principle.

```mermaid
graph TD
    A[Routes] --> B[Controller];
    B --> C[Service (Interface)];
    D[Service (Implementation)] -- implements --> C;
    D --> E[Repository (Interface)];
    F[Repository (Implementation)] -- implements --> E;
    F --> G[Prisma ORM];

    subgraph "Dependency Injection Container Manages Lifecycles"
        direction LR
        C; D; E; F;
    end
```

*   **Single Responsibility Principle (SRP):**
    *   **Controller:** Its only responsibility is to handle the HTTP request and response cycle. It parses input, calls the appropriate service, and formats the output. It contains no business logic.
    *   **Service:** Contains all business logic for a feature (e.g., calculating scores, validating if a hunt can be started). It knows nothing about HTTP.
    *   **Repository:** Its only job is to execute database queries for a specific data model (e.g., `findHuntById`, `createTask`). It contains no business logic.

*   **Open/Closed Principle (OCP):**
    *   The system is open to extension but closed for modification. New features will be added by creating new modules. New middleware can be added to the `app.ts` file to extend functionality without altering existing code.

*   **Liskov Substitution Principle (LSP):**
    *   By using interfaces for our services and repositories, we can substitute implementations (e.g., a mock repository for testing) without affecting the correctness of the system.

*   **Interface Segregation Principle (ISP):**
    *   Interfaces will be specific to the client that needs them. For example, the `TaskCompletion` logic will be in its own service, rather than bloating a generic `TaskService` with unrelated methods.

*   **Dependency Inversion Principle (DIP):**
    *   High-level modules (like controllers) will depend on abstractions (service interfaces), not on concrete low-level implementations. A **Dependency Injection (DI) container** (like `tsyringe` or `InversifyJS`) will be used to manage the lifecycle and injection of these dependencies. This decouples our modules and makes them highly testable.

## 3. Frontend Software Design (React / Next.js)

The frontend design will focus on creating a scalable and maintainable component architecture.

### 3.1. Component Directory Structure

We will adopt a hybrid approach inspired by Atomic Design, organizing components by feature and reusability.

```
/src
  /components
    /ui                   # Reusable, "dumb" components (Button, Input, Card)
    /layout               # Page layouts, Navbar, Sidebar
  /features
    /hunts
      /components         # Components specific to the hunts feature (HuntCard, HuntDetails)
      /hooks              # Custom hooks for hunt logic (useHuntData, useJoinHunt)
    /tasks
      # ... similar structure ...
  /pages (or /app for Next.js App Router)
  /hooks                  # Global custom hooks
  /lib                    # API client, utility functions
  /store                  # State management (Zustand/Redux)
```

### 3.2. Application of Design Principles

*   **Single Responsibility Principle (SRP):**
    *   **UI Components (`/ui`):** Are responsible only for presentation. They receive props and render UI. They are stateless where possible.
    *   **Feature Components (`/features/.../components`):** Are responsible for composing UI components and managing feature-specific state.
    *   **Custom Hooks (`/features/.../hooks`):** Encapsulate all logic for data fetching, state manipulation, and side effects related to a feature.

*   **Open/Closed Principle (OCP):**
    *   We can add new functionality to a component by wrapping it in a Higher-Order Component (HOC) or by composing it with other components, without modifying its source code. Custom hooks are inherently open to extension.

*   **Dependency Inversion Principle (DIP):**
    *   UI components will not directly use `axios` or `fetch`. Instead, they will depend on an abstraction—a custom hook (e.g., `useHuntData`). This hook encapsulates the data-fetching logic and can be easily mocked for testing in Storybook or Jest.

    ```mermaid
    graph TD
        A[React Component] --> B[Custom Hook (e.g., useHuntData)];
        B --> C[API Client (Abstraction)];
        D[Axios/Fetch (Implementation)] -- implements --> C;
    ```

### 3.3. State Management Design

As defined in the architecture, we will maintain a strict separation between server and client state:

*   **Server State (TanStack Query / RTK Query):** Will be the single source of truth for any data that comes from the backend. All caching, refetching, and mutation logic will be handled by this library.
*   **Client State (Zustand / Redux):** Will be used *only* for UI-specific state that is not persisted on the server (e.g., is a modal open, the current theme, form state).
