# Arkknights Roguelike Tactics Frontend

## Getting Started

### Prerequisites

#### Packages
```
node >= 20
yarn
```

#### Environment

- Full Stack Development

```angular2html
# .env.development
VITE_API_BASE_URL=http://localhost:5174
```

- Frontend Only
- Be really careful that this is the production environment
```angular2html
# .env.development
VITE_API_BASE_URL=https://arkrog.com/api
VITE_WASM_URL=http://localhost:8080  # optional for wasm developer
```

### Installation

Install the dependencies:

```bash
yarn install
```

### Development

Start the development server with HMR:

```bash
yarn start
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
yarn build
```