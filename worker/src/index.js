/**
 * Hello World Cloudflare Worker
 * Simple worker that responds with a greeting message
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Basic hello world response
    const response = {
      message: "Hello World from Cloudflare Worker!",
      timestamp: new Date().toISOString(),
      path: url.pathname,
      method: request.method
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
};