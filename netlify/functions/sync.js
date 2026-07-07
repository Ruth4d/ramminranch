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

    if (!Array.isArray(games)) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Unexpected data format", keys: Object.keys(raw) })
      };
    }

    const stageOrder = ["Group stage","Round of 32","Round of 16","Quarterfinals","Semifinals","Final","Champion"];

    const stageMap = {
      "group":          "Group stage",
      "r32":            "Round of 32",
      "round_of_32":    "Round of 32",
      "roundof32":      "Round of 32",
      "round of 32":    "Round of 32",
      "r16":            "Round of 16",
      "round_of_16":    "Round of 16",
      "roundof16":      "Round of 16",
      "round of 16":    "Round of 16",
      "qf":             "Quarterfinals",
      "quarterfinal":   "Quarterfinals",
      "quarter_final":  "Quarterfinals",
      "quarterfinals":  "Quarterfinals",
      "sf":             "Semifinals",
      "semifinal":      "Semifinals",
      "semi_final":     "Semifinals",
      "semifinals":     "Semifinals",
      "third_place":    "Semifinals",
      "final":          "Final",
      "f":              "Final"
    };

    function normalize(name) {
      return (name || "").toLowerCase()
        .replace(/^united states$/, "usa")
        .replace(/^czech republic$/, "czechia")
        .replace(/côte d.ivoire|cote d.ivoire|ivory coast/g, "ivory coast")
        .replace(/bosnia and herzegovina|bosnia & herzegovina|bosnia-herzegovina/g, "bosnia/herz")
        .replace(/congo dr|dr congo|congo, dr|democratic republic of congo/g, "congo")
        .replace(/korea republic|republic of korea/g, "south korea")
        .replace(/cabo verde/g, "cape verde")
        .replace(/turkiye|türkiye/g, "turkiye")
        .trim();
    }

    const teamData = {};

    for (const game of games) {
      if ((game.finished || "").toString().toUpperCase() !== "TRUE") continue;

      const homeTeam = game.home_team_name_en;
      const awayTeam = game.away_team_name_en;
      const homeGoals = parseInt(game.home_score) || 0;
      const awayGoals = parseInt(game.away_score) || 0;
      const roundRaw = (game.type || game.stage || game.round || "group").toLowerCase().trim();
      const stage = stageMap[roundRaw] || "Group stage";

      for (const [team, goals] of [[homeTeam, homeGoals], [awayTeam, awayGoals]]) {
        if (!team) continue;
        const key = normalize(team);
        if (!teamData[key]) teamData[key] = { goals: 0, stage: "Group stage" };
        teamData[key].goals += goals;
        const current = stageOrder.indexOf(teamData[key].stage);
        const next = stageOrder.indexOf(stage);
        if (next > current) teamData[key].stage = stage;
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teams: teamData, matchCount: games.length })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
