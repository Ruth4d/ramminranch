exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Fetch all matches from the free World Cup 2026 API
    const response = await fetch("https://worldcup26.ir/get/games", {
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "World Cup API returned " + response.status })
      };
    }

    const games = await response.json();

    // Build a map of team -> { goals, stage }
    const teamData = {};

    const stageMap = {
      "group": "Group stage",
      "round_of_32": "Round of 32",
      "round_of_16": "Round of 16",
      "quarterfinal": "Quarterfinals",
      "semifinal": "Semifinals",
      "final": "Final",
      "third_place": "Semifinals"
    };

    for (const game of games) {
      if (game.status !== "completed") continue;

      const homeTeam = game.home_team?.name || game.home_team;
      const awayTeam = game.away_team?.name || game.away_team;
      const homeGoals = parseInt(game.home_score ?? game.home_goals ?? 0);
      const awayGoals = parseInt(game.away_score ?? game.away_goals ?? 0);
      const round = (game.stage || game.round || game.phase || "group").toLowerCase().replace(/\s+/g, "_");
      const stage = stageMap[round] || "Group stage";

      for (const [team, goals] of [[homeTeam, homeGoals], [awayTeam, awayGoals]]) {
        if (!team) continue;
        if (!teamData[team]) teamData[team] = { goals: 0, stage: "Group stage" };
        teamData[team].goals += goals;

        // Keep the furthest stage reached
        const stageOrder = ["Group stage","Round of 32","Round of 16","Quarterfinals","Semifinals","Final","Champion"];
        const current = stageOrder.indexOf(teamData[team].stage);
        const newStage = stageOrder.indexOf(stage);
        if (newStage > current) teamData[team].stage = stage;
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
