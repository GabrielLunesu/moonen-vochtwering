import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Valid URLs array is required' },
        { status: 400 }
      );
    }

    // IndexNow key - must match the key in your key file
    const key = 'ac50e2ecdf51df75e6ed4d84a1cbe80c';
    const site = 'https://moonenvochtwering.nl';
    
    // Submit to multiple search engines
    const engines = [
      'https://www.bing.com/indexnow',
      'https://api.indexnow.org/indexnow'
    ];
    
    const results = await Promise.allSettled(
      engines.map(async (engine) => {
        const response = await fetch(engine, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            host: new URL(site).hostname,
            key: key,
            urlList: urls,
          })
        });
        
        return {
          engine,
          status: response.status,
          ok: response.ok,
          data: await response.text()
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      results: results.map(r => r.value || r.reason)
    });
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit URLs to search engines' },
      { status: 500 }
    );
  }
} 