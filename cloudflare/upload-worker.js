export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, env);
    }

    const url = new URL(request.url);
    if (url.pathname !== "/upload") {
      return json({ error: "Not found" }, 404, env);
    }

    try {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return json({ error: "Missing file" }, 400, env);
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
          { error: "Pinata upload failed", status: pinataRes.status, details: payload },
          502,
          env
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
        return json({ error: "Pinata response missing IpfsHash" }, 502, env);
      }

      return json(
        {
          cid,
          uri: `ipfs://${cid}`,
          gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
        },
        200,
        env
      );
    } catch (err) {
      return json({ error: err?.message || "Unhandled worker error" }, 500, env);
    }
  },
};

function json(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders(env),
    },
  });
}

function corsHeaders(env) {
  const allowedOrigin = env.ALLOWED_ORIGIN || "*";
  return {
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}
