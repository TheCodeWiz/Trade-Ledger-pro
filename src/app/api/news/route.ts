import { NextResponse } from 'next/server';

interface GoogleNewsItem {
  title?: string;
  snippet?: string;
  newsUrl?: string;
  publisher?: {
    name?: string;
    url?: string;
  };
  timestamp?: number;
  images?: {
    thumbnail?: string;
    thumbnailProxied?: string;
  };
}

// Function to fetch full article content from URL
async function fetchFullArticle(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    
    if (!response.ok) return '';
    
    const html = await response.text();
    
    // Extract article content using regex patterns for common news sites
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Try to find article content in common containers
    const articlePatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*story[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ];
    
    let articleContent = '';
    for (const pattern of articlePatterns) {
      const match = pattern.exec(html);
      if (match && match[1]) {
        articleContent = match[1];
        break;
      }
    }
    
    // If no article container found, try to get paragraph content
    if (!articleContent) {
      const paragraphs = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
      articleContent = paragraphs.slice(0, 15).join(' ');
    }
    
    // Clean HTML tags and decode entities
    articleContent = articleContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    // Return first 2000 characters
    return articleContent.slice(0, 2000);
  } catch (error) {
    console.error('Error fetching article:', error);
    return '';
  }
}

export async function GET() {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        articles: getMockNews(),
        message: 'Using mock data. Configure RAPIDAPI_KEY for live news.',
      });
    }

    // Try Google News API (India Business/Stock news)
    const response = await fetch(
      'https://google-news13.p.rapidapi.com/business?lr=en-IN&geo=IN',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'google-news13.p.rapidapi.com',
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error('RapidAPI Error:', response.status, response.statusText);
      return NextResponse.json({
        articles: getMockNews(),
        message: 'API unavailable. Showing cached news.',
      });
    }

    const data = await response.json();
    
    // Transform the API response
    const items: GoogleNewsItem[] = data.items || data.articles || [];
    
    // Process articles and fetch full content
    const articlesPromises = items.slice(0, 15).map(async (item: GoogleNewsItem, index: number) => {
      const url = item.newsUrl || '';
      
      // Extract source name from publisher or URL
      let sourceName = item.publisher?.name || '';
      if (!sourceName && url) {
        try {
          const urlObj = new URL(url);
          sourceName = urlObj.hostname
            .replace('www.', '')
            .replace('.com', '')
            .replace('.in', '')
            .replace('.co', '')
            .split('.')[0];
          // Capitalize first letter
          sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
        } catch {
          sourceName = 'News Source';
        }
      }
      
      // Fetch full article content
      let fullContent = item.snippet || '';
      if (url) {
        const fetchedContent = await fetchFullArticle(url);
        if (fetchedContent && fetchedContent.length > fullContent.length) {
          fullContent = fetchedContent;
        }
      }
      
      // Format timestamp
      let publishedAt = new Date().toISOString();
      if (item.timestamp) {
        publishedAt = new Date(item.timestamp).toISOString();
      }
      
      return {
        id: `news-${index}-${Date.now()}`,
        title: item.title || 'Untitled',
        content: fullContent || item.snippet || 'No content available. Click "Read Original Article" to view the full story.',
        source: sourceName || 'News Source',
        publishedAt,
        url,
        imageUrl: item.images?.thumbnailProxied || item.images?.thumbnail || '',
      };
    });

    const articles = await Promise.all(articlesPromises);

    if (articles.length === 0) {
      return NextResponse.json({ articles: getMockNews() });
    }

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json({
      articles: getMockNews(),
      message: 'Error fetching news. Showing cached data.',
    });
  }
}

function getMockNews() {
  return [
    {
      id: 'mock-1',
      title: 'Sensex, Nifty Rally on Strong FII Inflows; Banking Stocks Lead Gains',
      content: 'Indian equity markets witnessed a strong rally today as Sensex surged over 500 points while Nifty crossed the 22,000 mark for the first time. Foreign Institutional Investors (FIIs) turned net buyers after weeks of selling, infusing over ₹3,500 crore into Indian equities. Banking stocks led the charge with HDFC Bank, ICICI Bank, and SBI gaining between 2-4%. The positive sentiment was driven by better-than-expected quarterly results and optimism around the upcoming Budget.\n\nAnalysts suggest that the market momentum is likely to continue in the near term, supported by strong domestic macroeconomic indicators and cooling inflation. The IT sector also saw buying interest following upbeat guidance from major players. Small and mid-cap indices outperformed the benchmark indices, gaining over 2% each.\n\nTraders are advised to maintain a bullish outlook while keeping appropriate stop losses in place given the elevated volatility levels.',
      source: 'Economic Times',
      publishedAt: new Date().toISOString(),
      url: 'https://economictimes.indiatimes.com',
      imageUrl: '',
    },
    {
      id: 'mock-2',
      title: 'RBI Holds Repo Rate Steady at 6.5%; GDP Growth Forecast Revised Upward',
      content: 'The Reserve Bank of India (RBI) in its latest monetary policy meeting decided to keep the repo rate unchanged at 6.5% for the eighth consecutive time. However, the central bank revised its GDP growth forecast for FY25 to 7.2% from the earlier estimate of 7%, citing robust domestic demand and improving rural consumption.\n\nRBI Governor emphasized that while inflation has moderated, the central bank remains vigilant about food price pressures. The MPC voted 4-2 to maintain the status quo, with two members preferring a rate cut. The decision was largely in line with market expectations, though some participants had hoped for a dovish tilt.\n\nThe bond markets reacted positively to the growth-supportive stance, with 10-year yields declining by 5 basis points. Equity markets remained range-bound post the announcement, with banking stocks seeing mild profit booking.',
      source: 'Mint',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      url: 'https://livemint.com',
      imageUrl: '',
    },
    {
      id: 'mock-3',
      title: 'IT Stocks Surge as TCS, Infosys Report Strong Q3 Results; Deal Pipeline Robust',
      content: 'Information Technology stocks rallied sharply today after industry bellwethers TCS and Infosys reported better-than-expected Q3 results. TCS posted a 12% year-on-year growth in net profit at ₹12,380 crore, while Infosys raised its revenue guidance for FY25 to 4-5% from 3-4% earlier.\n\nThe strong performance was attributed to revival in discretionary spending by clients and increased deal wins in the BFSI and retail segments. TCS reported deal TCV of $8.1 billion for the quarter, its second-highest ever. Infosys also reported strong large deal wins worth $3.2 billion.\n\nAnalysts at major brokerages have upgraded their ratings on both stocks, citing improving demand environment and margin expansion. The Nifty IT index jumped over 3%, with mid-tier IT companies like L&T Tech and Persistent Systems also seeing significant buying interest.',
      source: 'Business Standard',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      url: 'https://business-standard.com',
      imageUrl: '',
    },
    {
      id: 'mock-4',
      title: 'Auto Sector Shows Mixed Performance; EV Sales Continue Upward Trajectory',
      content: 'The Indian automobile sector reported mixed sales numbers for December 2025, with passenger vehicles showing modest growth while two-wheelers faced headwinds. Maruti Suzuki reported a 5% year-on-year increase in sales, while Tata Motors saw a surge of 15% driven by strong demand for its electric vehicle portfolio.\n\nThe electric vehicle segment continued its impressive growth trajectory, with EV sales crossing 1 lakh units in a single month for the first time. Tata Motors led the charge with over 50,000 units sold, followed by Mahindra and MG Motors. The government\'s push for EV adoption through incentives and charging infrastructure development has been a key driver.\n\nHowever, the commercial vehicle segment showed signs of slowdown, with major players reporting single-digit growth. Rising fuel prices and infrastructure bottlenecks were cited as concerns by industry body SIAM.',
      source: 'Financial Express',
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      url: 'https://financialexpress.com',
      imageUrl: '',
    },
    {
      id: 'mock-5',
      title: 'Gold Prices Hit All-Time High; Silver Also Rallies on Safe-Haven Demand',
      content: 'Gold prices touched a fresh all-time high of ₹68,500 per 10 grams in the domestic market today, driven by safe-haven demand amid global uncertainties. Silver also rallied to ₹85,000 per kg, its highest level in three years.\n\nThe precious metals rally was fueled by geopolitical tensions, expectations of Federal Reserve rate cuts, and robust buying by central banks globally. India\'s gold imports surged 30% in December, indicating strong consumer demand ahead of the wedding season.\n\nAnalysts recommend maintaining a portion of investment portfolio in gold as a hedge against inflation and currency depreciation. However, they caution against chasing prices at current levels and suggest accumulating on dips. The MCX Gold futures are trading at a premium, indicating bullish sentiment among traders.',
      source: 'Moneycontrol',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      url: 'https://moneycontrol.com',
      imageUrl: '',
    },
    {
      id: 'mock-6',
      title: 'Pharma Stocks in Focus as US FDA Approvals Boost Sentiment',
      content: 'Pharmaceutical stocks witnessed strong buying interest as several Indian companies received key approvals from the US FDA. Sun Pharma gained 4% after receiving approval for a generic version of a blockbuster drug, while Dr. Reddy\'s surged 3% on positive inspection outcomes.\n\nThe sector has been an outperformer in recent months, benefiting from steady domestic demand and improving export prospects. Companies are increasingly focusing on complex generics and specialty products to drive growth.\n\nAnalysts remain bullish on the sector, citing favorable currency movements and increasing healthcare spending. However, they advise caution regarding potential regulatory headwinds and pricing pressures in the US market.',
      source: 'CNBC-TV18',
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      url: 'https://cnbctv18.com',
      imageUrl: '',
    },
    {
      id: 'mock-7',
      title: 'Adani Stocks Rally as Group Plans Major Capex Push in Green Energy',
      content: 'Shares of Adani Group companies surged up to 8% following the announcement of a massive capital expenditure plan focused on green energy and infrastructure. Adani Green Energy led the gains, rising 8% after the company announced plans to invest ₹50,000 crore in renewable energy projects.\n\nThe conglomerate aims to achieve 45 GW of renewable energy capacity by 2030, making it one of the largest green energy producers globally. The group is also investing heavily in green hydrogen production and battery storage.\n\nMarket experts view the investment positively, noting that it aligns with India\'s commitment to achieving net-zero emissions by 2070. However, they advise investors to remain cautious given the high debt levels across group companies.',
      source: 'Bloomberg Quint',
      publishedAt: new Date(Date.now() - 21600000).toISOString(),
      url: 'https://bloombergquint.com',
      imageUrl: '',
    },
    {
      id: 'mock-8',
      title: 'Rupee Strengthens Against Dollar; FII Inflows Support Currency',
      content: 'The Indian rupee appreciated by 25 paise to close at 82.75 against the US dollar, supported by strong foreign portfolio inflows and weakness in the greenback. The currency has gained nearly 1% this week, its best weekly performance in three months.\n\nThe RBI has been actively managing volatility through market interventions, maintaining forex reserves at comfortable levels above $600 billion. Exporters have been advised to hedge their positions given the currency\'s appreciation.\n\nAnalysts expect the rupee to trade in a range of 82.50-83.50 in the near term, with any significant depreciation likely to trigger RBI intervention. The outlook remains positive supported by improving current account dynamics and robust FDI inflows.',
      source: 'Reuters India',
      publishedAt: new Date(Date.now() - 25200000).toISOString(),
      url: 'https://reuters.com/india',
      imageUrl: '',
    },
    {
      id: 'mock-9',
      title: 'SEBI Tightens IPO Disclosure Norms; New Rules Effective from April',
      content: 'Markets regulator SEBI has announced stricter disclosure requirements for companies planning to raise funds through Initial Public Offerings. The new rules, effective from April 2026, mandate enhanced disclosure of risk factors, related party transactions, and promoter background.\n\nThe changes come after several IPO-related concerns in recent times, including issues with financial disclosures and corporate governance. SEBI Chairman stated that the new norms aim to protect retail investor interests while maintaining market efficiency.\n\nInvestment bankers have welcomed the move, noting that it will improve market credibility. However, they expect some delays in IPO timelines as companies adapt to the new requirements.',
      source: 'Economic Times',
      publishedAt: new Date(Date.now() - 28800000).toISOString(),
      url: 'https://economictimes.indiatimes.com',
      imageUrl: '',
    },
    {
      id: 'mock-10',
      title: 'Real Estate Stocks Gain as Housing Sales Hit Record High in 2025',
      content: 'Real estate stocks rallied sharply after data showed housing sales in top 7 cities hit a record high in calendar year 2025. Total sales volume exceeded 3.5 lakh units, driven by strong demand in the mid-premium segment and improving affordability.\n\nDLF, Godrej Properties, and Prestige Estates were among the top gainers, rising between 3-5%. The sector has benefited from stable interest rates, government incentives, and rising disposable incomes.\n\nProperty consultants expect the momentum to continue in 2026, with prices likely to appreciate 5-8% across major markets. However, they caution that any sharp rise in interest rates could dampen demand.',
      source: 'Housing.com',
      publishedAt: new Date(Date.now() - 32400000).toISOString(),
      url: 'https://housing.com',
      imageUrl: '',
    },
    {
      id: 'mock-11',
      title: 'PSU Banks Outperform as Asset Quality Improves; Credit Growth Robust',
      content: 'Public sector bank stocks continued their outperformance with the Nifty PSU Bank index gaining over 2%. State Bank of India, Bank of Baroda, and Punjab National Bank led the gains on the back of improving asset quality metrics.\n\nGross NPA ratios for most PSU banks have declined to multi-year lows, aided by aggressive recovery efforts and write-offs. Credit growth remains robust at 15-16% driven by retail and MSME segments.\n\nBrokerages have turned increasingly positive on PSU banks, citing attractive valuations compared to private peers. Dividend yields of 3-4% provide additional cushion for investors.',
      source: 'Mint',
      publishedAt: new Date(Date.now() - 36000000).toISOString(),
      url: 'https://livemint.com',
      imageUrl: '',
    },
    {
      id: 'mock-12',
      title: 'Crude Oil Prices Decline 3%; Relief for Indian Oil Marketing Companies',
      content: 'Brent crude oil prices declined 3% to $78 per barrel, providing relief to oil importing countries like India. The fall was attributed to higher-than-expected US inventory builds and concerns over Chinese demand slowdown.\n\nIndian Oil Marketing Companies (OMCs) - IOC, BPCL, and HPCL - rallied up to 4% on expectations of improved marketing margins. The companies had been facing pressure due to elevated crude prices and subdued refining margins.\n\nAnalysts expect oil prices to remain range-bound between $75-85 per barrel in the near term. A sustained decline below $75 could trigger positive earnings revisions for OMCs.',
      source: 'Business Standard',
      publishedAt: new Date(Date.now() - 39600000).toISOString(),
      url: 'https://business-standard.com',
      imageUrl: '',
    },
    {
      id: 'mock-13',
      title: 'Mutual Fund Industry AUM Crosses ₹60 Lakh Crore Milestone',
      content: 'The Indian mutual fund industry achieved a historic milestone as Assets Under Management (AUM) crossed ₹60 lakh crore for the first time. Systematic Investment Plan (SIP) contributions continued to grow, reaching a record ₹19,000 crore in the latest month.\n\nEquity funds witnessed inflows of ₹15,000 crore, while debt funds saw outflows due to redemption pressures. New fund offers (NFOs) continued to attract investor interest, with several thematic and sectoral funds launching.\n\nAMFI has projected the industry AUM to reach ₹100 lakh crore by 2030, driven by increasing financialization of household savings and growing investor awareness.',
      source: 'Value Research',
      publishedAt: new Date(Date.now() - 43200000).toISOString(),
      url: 'https://valueresearchonline.com',
      imageUrl: '',
    },
    {
      id: 'mock-14',
      title: 'Metal Stocks Under Pressure on China Demand Concerns',
      content: 'Metal and mining stocks faced selling pressure as concerns over Chinese demand resurfaced. Tata Steel, JSW Steel, and Hindalco declined 2-3% amid fears of weakening steel demand in the world\'s largest consumer.\n\nChina\'s property sector continues to struggle, impacting demand for construction-related commodities. Global steel prices have corrected 10% from recent highs, putting pressure on domestic producers.\n\nHowever, analysts remain cautiously optimistic on the sector, noting that domestic demand remains healthy and capacity additions are limited. Any stimulus measures from China could trigger a sharp recovery in metal stocks.',
      source: 'CNBC-TV18',
      publishedAt: new Date(Date.now() - 46800000).toISOString(),
      url: 'https://cnbctv18.com',
      imageUrl: '',
    },
    {
      id: 'mock-15',
      title: 'Budget 2026 Expectations: Markets Eye Fiscal Consolidation and Capex Push',
      content: 'As Union Budget 2026 approaches, market participants are closely watching for signals on fiscal policy direction. The consensus expectation is for continued focus on capital expenditure while maintaining fiscal consolidation targets.\n\nKey expectations include increased allocation for infrastructure, railways, and defense sectors. Tax rationalization, particularly in personal income tax, is also anticipated. The budget is expected to provide roadmap for achieving the fiscal deficit target of 4.5% of GDP.\n\nMarket experts suggest that a growth-oriented budget could push Nifty towards 25,000 levels, while any negative surprises could trigger correction. Sectors likely to benefit include infrastructure, capital goods, and defense.',
      source: 'Financial Express',
      publishedAt: new Date(Date.now() - 50400000).toISOString(),
      url: 'https://financialexpress.com',
      imageUrl: '',
    },
  ];
}

