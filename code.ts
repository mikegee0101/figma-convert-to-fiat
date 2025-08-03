
interface CryptoValue {
  amount: number;
  ticker: string;
  originalText: string;
}

const CRYPTO_TICKERS = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'MATIC', 'AVAX', 'LINK', 'UNI', 'AAVE'];

const TICKER_TO_COINGECKO_ID: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'SOL': 'solana',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave'
};

function parseMultiplier(value: string): number {
  const multipliers: { [key: string]: number } = {
    'k': 1000,
    'K': 1000,
    'm': 1000000,
    'M': 1000000,
    'b': 1000000000,
    'B': 1000000000,
    't': 1000000000000,
    'T': 1000000000000
  };
  
  const lastChar = value.slice(-1);
  if (multipliers[lastChar]) {
    const number = parseFloat(value.slice(0, -1));
    return number * multipliers[lastChar];
  }
  
  return parseFloat(value);
}

function parseCryptoValue(text: string): CryptoValue | null {
  const regex = /(\d+(?:\.\d+)?[kmbtKMBT]?)\s*([A-Z]{2,5})/gi;
  const match = regex.exec(text);
  
  if (!match) return null;
  
  const [fullMatch, amountStr, ticker] = match;
  const amount = parseMultiplier(amountStr);
  
  if (!CRYPTO_TICKERS.includes(ticker.toUpperCase())) {
    return null;
  }
  
  return {
    amount,
    ticker: ticker.toUpperCase(),
    originalText: fullMatch
  };
}

async function getCryptoPrice(ticker: string): Promise<number | null> {
  const coinId = TICKER_TO_COINGECKO_ID[ticker];
  if (!coinId) return null;
  
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    return data[coinId]?.usd || null;
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return null;
  }
}

async function convertToUSD(cryptoValue: CryptoValue): Promise<string | null> {
  const price = await getCryptoPrice(cryptoValue.ticker);
  if (price === null) return null;
  
  const usdValue = cryptoValue.amount * price;
  return `$${usdValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function getSelectedText(): string | null {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1) return null;
  
  const node = selection[0];
  if (node.type === 'TEXT') {
    return node.characters;
  }
  
  return null;
}

async function replaceSelectedText(newText: string): Promise<void> {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1) return;
  
  const node = selection[0];
  if (node.type === 'TEXT') {
    await figma.loadFontAsync(node.fontName as FontName);
    node.characters = newText;
  }
}

figma.on('run', async (event) => {
  if (event.command === 'convert-to-usd') {
    const selectedText = getSelectedText();
    
    if (!selectedText) {
      figma.notify('Please select a text layer containing cryptocurrency value');
      figma.closePlugin();
      return;
    }
    
    const cryptoValue = parseCryptoValue(selectedText);
    
    if (!cryptoValue) {
      figma.notify('No valid cryptocurrency value found in selected text');
      figma.closePlugin();
      return;
    }
    
    figma.notify('Converting... Please wait');
    
    const usdValue = await convertToUSD(cryptoValue);
    
    if (!usdValue) {
      figma.notify('Failed to fetch cryptocurrency price');
      figma.closePlugin();
      return;
    }
    
    const newText = selectedText.replace(cryptoValue.originalText, usdValue);
    await replaceSelectedText(newText);
    
    figma.notify(`Converted ${cryptoValue.originalText} to ${usdValue}`);
    figma.closePlugin();
  }
});