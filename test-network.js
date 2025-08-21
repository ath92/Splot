import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  const page = await browser.newPage();
  
  // Track network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
    console.log('REQUEST:', request.method(), request.url());
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    });
    console.log('RESPONSE:', response.status(), response.url());
  });
  
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });
  
  page.on('console', msg => {
    if (msg.text().includes('error') || msg.text().includes('Error') || msg.text().includes('fail')) {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait a bit for the map to load
    await page.waitForTimeout(10000);
    
    // Look for any PMTiles/tile related requests
    const tileRequests = requests.filter(req => 
      req.url.includes('tiles') || 
      req.url.includes('pmtiles') || 
      req.url.includes('world-tiles')
    );
    
    console.log('\n=== TILE-RELATED REQUESTS ===');
    tileRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
    });
    
    const tileResponses = responses.filter(resp => 
      resp.url.includes('tiles') || 
      resp.url.includes('pmtiles') || 
      resp.url.includes('world-tiles')
    );
    
    console.log('\n=== TILE-RELATED RESPONSES ===');
    tileResponses.forEach(resp => {
      console.log(`${resp.status} ${resp.url}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
})();