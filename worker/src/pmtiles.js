/**
 * PMTiles serving functionality for Cloudflare Workers
 * Based on the protomaps/PMTiles serverless example
 */

import {
  Compression,
  EtagMismatch,
  PMTiles,
  ResolvedValueCache,
  TileType,
} from 'pmtiles';

class KeyNotFoundError extends Error {}

// Native decompression using web streams
async function nativeDecompress(buf, compression) {
  if (compression === Compression.None || compression === Compression.Unknown) {
    return buf;
  }
  if (compression === Compression.Gzip) {
    const stream = new Response(buf).body;
    const result = stream?.pipeThrough(new DecompressionStream("gzip"));
    return new Response(result).arrayBuffer();
  }
  throw new Error("Compression method not supported");
}

const CACHE = new ResolvedValueCache(25, undefined, nativeDecompress);

// R2 source implementation for PMTiles
class R2Source {
  constructor(env, archiveName) {
    this.env = env;
    this.archiveName = archiveName;
  }

  getKey() {
    return this.archiveName;
  }

  async getBytes(offset, length, signal, etag) {
    const resp = await this.env.TILES.get(
      `${this.archiveName}.pmtiles`,
      {
        range: { offset: offset, length: length },
        onlyIf: etag ? { etagMatches: etag } : undefined,
      }
    );
    
    if (!resp) {
      throw new KeyNotFoundError("Archive not found");
    }

    if (!resp.body) {
      throw new EtagMismatch();
    }

    const data = await resp.arrayBuffer();
    return {
      data: data,
      etag: resp.etag,
      cacheControl: resp.httpMetadata?.cacheControl,
      expires: resp.httpMetadata?.cacheExpiry?.toISOString(),
    };
  }
}

// Parse tile path from URL
function parseTilePath(pathname) {
  // Match /{name}/{z}/{x}/{y}.{ext}
  const tileMatch = pathname.match(/^\/tiles\/([^\/]+)\/(\d+)\/(\d+)\/(\d+)\.([a-z]+)$/);
  if (tileMatch) {
    const [, name, z, x, y, ext] = tileMatch;
    return { ok: true, name, tile: [+z, +x, +y], ext };
  }

  // Match /{name}.json for TileJSON
  const tilesetMatch = pathname.match(/^\/tiles\/([^\/]+)\.json$/);
  if (tilesetMatch) {
    const [, name] = tilesetMatch;
    return { ok: true, name, ext: "json" };
  }

  return { ok: false, name: "", ext: "" };
}

/**
 * Handle PMTiles requests
 */
export async function handlePMTilesRequest(request, env, ctx) {
  if (request.method.toUpperCase() !== "GET") {
    return new Response(undefined, { status: 405 });
  }

  const url = new URL(request.url);
  const { ok, name, tile, ext } = parseTilePath(url.pathname);

  if (!ok) {
    return new Response("Invalid tile URL", { status: 404 });
  }

  // CORS handling
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };

  // Check cache first
  const cache = caches.default;
  const cached = await cache.match(request.url);
  if (cached) {
    const respHeaders = new Headers(cached.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      respHeaders.set(key, value);
    });
    
    return new Response(cached.body, {
      headers: respHeaders,
      status: cached.status,
    });
  }

  const cacheableResponse = (body, headers, status) => {
    headers.set("Cache-Control", "public, max-age=86400");
    
    const cacheable = new Response(body, {
      headers: headers,
      status: status,
    });

    ctx.waitUntil(cache.put(request.url, cacheable));

    const respHeaders = new Headers(headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      respHeaders.set(key, value);
    });
    
    return new Response(body, { headers: respHeaders, status: status });
  };

  try {
    const cacheableHeaders = new Headers();
    const source = new R2Source(env, name);
    const p = new PMTiles(source, CACHE, nativeDecompress);
    
    const pHeader = await p.getHeader();

    if (!tile) {
      // Return TileJSON
      cacheableHeaders.set("Content-Type", "application/json");
      const tileJson = await p.getTileJson(
        `${new URL(request.url).origin}/tiles/${name}`
      );
      return cacheableResponse(JSON.stringify(tileJson), cacheableHeaders, 200);
    }

    // Check zoom level bounds
    if (tile[0] < pHeader.minZoom || tile[0] > pHeader.maxZoom) {
      return cacheableResponse(undefined, cacheableHeaders, 404);
    }

    // Check tile type and extension match
    const typeExtMap = [
      [TileType.Mvt, "mvt"],
      [TileType.Png, "png"],
      [TileType.Jpeg, "jpg"],
      [TileType.Webp, "webp"],
      [TileType.Avif, "avif"],
    ];

    for (const [tileType, expectedExt] of typeExtMap) {
      if (pHeader.tileType === tileType && ext !== expectedExt) {
        if (pHeader.tileType === TileType.Mvt && ext === "pbf") {
          // Allow .pbf for MVT tiles for backwards compatibility
          continue;
        }
        return cacheableResponse(
          `Bad request: requested .${ext} but archive has type .${expectedExt}`,
          cacheableHeaders,
          400
        );
      }
    }

    // Get tile data
    const tiledata = await p.getZxy(tile[0], tile[1], tile[2]);

    // Set appropriate content type
    switch (pHeader.tileType) {
      case TileType.Mvt:
        cacheableHeaders.set("Content-Type", "application/x-protobuf");
        break;
      case TileType.Png:
        cacheableHeaders.set("Content-Type", "image/png");
        break;
      case TileType.Jpeg:
        cacheableHeaders.set("Content-Type", "image/jpeg");
        break;
      case TileType.Webp:
        cacheableHeaders.set("Content-Type", "image/webp");
        break;
    }

    if (tiledata) {
      return cacheableResponse(tiledata.data, cacheableHeaders, 200);
    }
    return cacheableResponse(undefined, cacheableHeaders, 204);
    
  } catch (e) {
    if (e instanceof KeyNotFoundError) {
      return cacheableResponse("Archive not found", new Headers(), 404);
    }
    console.error("PMTiles error:", e);
    return cacheableResponse("Internal server error", new Headers(), 500);
  }
}