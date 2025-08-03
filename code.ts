
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

function getSelectedTextNodes(): { node: TextNode; text: string }[] {
  const selection = figma.currentPage.selection;
  const textNodes: { node: TextNode; text: string }[] = [];
  
  for (const node of selection) {
    if (node.type === 'TEXT') {
      textNodes.push({ node, text: node.characters });
    }
  }
  
  return textNodes;
}

async function replaceTextInNode(node: TextNode, newText: string): Promise<void> {
  await figma.loadFontAsync(node.fontName as FontName);
  node.characters = newText;
}

figma.on('run', async (event) => {
  if (event.command === 'convert-to-usd') {
    const selectedTextNodes = getSelectedTextNodes();
    
    if (selectedTextNodes.length === 0) {
      figma.notify('Please select text layers containing cryptocurrency values');
      figma.closePlugin();
      return;
    }
    
    let conversionsFound = 0;
    let conversionsCompleted = 0;
    const failedConversions: string[] = [];
    
    figma.notify('Converting... Please wait');
    
    for (const { node, text } of selectedTextNodes) {
      const cryptoValue = parseCryptoValue(text);
      
      if (!cryptoValue) {
        continue;
      }
      
      conversionsFound++;
      
      const usdValue = await convertToUSD(cryptoValue);
      
      if (!usdValue) {
        failedConversions.push(cryptoValue.originalText);
        continue;
      }
      
      const newText = text.replace(cryptoValue.originalText, usdValue);
      await replaceTextInNode(node, newText);
      conversionsCompleted++;
    }
    
    if (conversionsFound === 0) {
      figma.notify('No valid cryptocurrency values found in selected text');
    } else if (conversionsCompleted === 0) {
      figma.notify('Failed to convert any cryptocurrency values');
    } else if (failedConversions.length > 0) {
      figma.notify(`Converted ${conversionsCompleted}/${conversionsFound} values. Failed: ${failedConversions.join(', ')}`);
    } else {
      figma.notify(`Successfully converted ${conversionsCompleted} cryptocurrency value${conversionsCompleted > 1 ? 's' : ''}`);
    }
    
    figma.closePlugin();
  }
});