import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // IndexNow key - must match the key in your key file
    const key = 'ac50e2ecdf51df75e6ed4d84a1cbe80c';
    const site = 'https://moonenvochtwering.nl';
    const url = site; // Submit homepage
    
    // Submit to multiple search engines
    const engines = [
      'https://www.bing.com/indexnow',
      'https://api.indexnow.org/indexnow'
    ];
    
    const results = await Promise.allSettled(
      engines.map(async (engine) => {
        const response = await fetch(`${engine}?url=${encodeURIComponent(url)}&key=${key}`, {
          method: 'GET'
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
      message: "Submitted homepage to IndexNow-compatible search engines",
      results: results.map(r => r.value || r.reason)
    });
  } catch (error) {
    console.error('IndexNow manual submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit URL to search engines' },
      { status: 500 }
    );
  }
} 