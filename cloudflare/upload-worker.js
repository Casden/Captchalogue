export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method !== "POST") {
      return json(request, env, { error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname !== "/upload") {
      return json(request, env, { error: "Not found" }, 404);
    }

    try {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return json(request, env, { error: "Missing file" }, 400);
      }

      const pinataForm = new FormData();
      pinataForm.append("file", file, file.name || "upload.bin");

      const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PINATA_JWT}`,
        },
        body: pinataForm,
      });

      const payload = await pinataRes.text();
      if (!pinataRes.ok) {
        return json(
          request,
          env,
          { error: "Pinata upload failed", status: pinataRes.status, details: payload },
          502
        );
      }

      let data;
      try {
        data = JSON.parse(payload);
      } catch {
        data = {};
      }

      const cid = data.IpfsHash;
      if (!cid) {
        return json(request, env, { error: "Pinata response missing IpfsHash" }, 502);
      }

      return json(
        request,
        env,
        {
          cid,
          uri: `ipfs://${cid}`,
          gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
        },
        200
      );
    } catch (err) {
      return json(request, env, { error: err?.message || "Unhandled worker error" }, 500);
    }
  },
};

function json(request, env, body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders(request, env),
    },
  });
}

/**
 * Multipart uploads trigger a CORS preflight. The browser's Origin uses a lowercase host
 * (e.g. https://casden.github.io); ALLOWED_ORIGIN must match case-insensitively, and the
 * response must echo that exact Origin — otherwise the browser reports NetworkError.
 */
function corsHeaders(request, env) {
  const configured = (env.ALLOWED_ORIGIN ?? "*").trim();
  const origin = request.headers.get("Origin");
  const reqHdr = request.headers.get("Access-Control-Request-Headers");

  const headers = {
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": reqHdr || "Content-Type",
    "access-control-max-age": "86400",
  };

  if (configured === "*") {
    headers["access-control-allow-origin"] = "*";
  } else if (origin && originsMatch(origin, configured)) {
    headers["access-control-allow-origin"] = origin;
    headers["vary"] = "Origin";
  } else if (!origin) {
    headers["access-control-allow-origin"] = configured;
  }

  return headers;
}

function originsMatch(requestOrigin, allowed) {
  try {
    const a = new URL(requestOrigin);
    const b = new URL(allowed);
    return a.protocol === b.protocol && a.host.toLowerCase() === b.host.toLowerCase();
  } catch {
    return false;
  }
}
