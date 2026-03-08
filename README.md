# Market Data Terminal

An open-source market data interface built with React, Tailwind CSS, and the Financial Data API. This project provides a clean, chat-style UI for exploring financial instruments including stocks, ETFs, and international symbols.

## Features

- **ChatGPT-Style Interface**: A minimalist, conversational UI for data exploration.
- **Real-time Data**: Fetches the latest symbol information from `financialdata.net`.
- **Comprehensive Coverage**: Access to US stocks, International stocks, and ETF symbols.
- **Modern Tech Stack**: Built with React, TypeScript, and Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bxzex/marketdata.git
   cd marketdata
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for GitHub Pages. You can deploy it using:

```bash
npm run build
```

The output will be in the `dist` folder.

## API Key

To use the live data, you will need an API key from [Financial Data](https://financialdata.net). Update the `apiKey` variable in `src/App.tsx` or set it via environment variables.

## License

MIT License - see [LICENSE](LICENSE) for details.

Developed by [bxzex](https://github.com/bxzex).
