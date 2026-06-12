exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const response = await fetch("https://worldcup26.ir/get/games", {
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "World Cup API returned " + response.status })
      };
    }

    const raw = await response.json();

    // Return the raw structure so we can see what it looks like
    const sample = Array.isArray(raw)
      ? { type: "array", length: raw.length, first: raw[0] }
      : { type: typeof raw, keys: Object.keys(raw).slice(0, 10), sample: JSON.stringify(raw).substring(0, 500) };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debug: sample })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
