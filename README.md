# Figma plugin: Convert to Fiat

A Figma plugin that allows users to select cryptocurrency values in text and convert them to fiat currencies.

## Features

- Select cryptocurrency values in various formats (e.g., "4 ETH", "22k BTC", "5m ETH")
- Convert to USD (additional fiat currencies later)
- Real-time price fetching from CoinGecko API
- Support for common crypto abbreviations (k, m, M, T for thousands, millions, trillions)

## Supported Formats

The plugin recognizes cryptocurrency values in these formats:
- `4 ETH` - Basic format
- `4.5 ETH` - Decimal values
- `22k BTC` - Thousands (k)
- `5m ETH` or `5M ETH` - Millions (m/M)
- `5T ETH` - Trillions (T)

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile TypeScript
4. In Figma, go to Plugins → Development → Import plugin from manifest
5. Select the `manifest.json` file

## Development

1. Run `npm run watch` to automatically compile changes
2. Reload the plugin in Figma after making changes

## Usage

1. Select text containing a cryptocurrency value
2. Right-click and choose "Plugins" → "Crypto to Fiat Converter" → "Convert to USD"
3. The selected text will be replaced with the equivalent USD value

## API

This plugin uses the free CoinGecko API to fetch current cryptocurrency prices.

## License

© 2025 Mike Gowen

MIT License
