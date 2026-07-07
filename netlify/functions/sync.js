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
    const games = raw.games || raw;

    // Return all unique "type" values so we can map them correctly
    const types = {};
    for (const game of games) {
      const t = game.type || game.stage || game.round || "unknown";
      if (!types[t]) types[t] = 0;
      types[t]++;
    }

    const knockoutSample = games.find(g =>
      g.type && !["group","GROUP","Group"].includes(g.type)
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uniqueTypes: types,
        knockoutSample: knockoutSample || null,
        totalGames: games.length
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
