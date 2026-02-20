onst FOOTBALL_DATA_API_KEY = 'c47c59dc3cee4ce1b8373b8fb4edfec0'; // 👈 CANVIA AQUÍ

const leagueMapping = {
  'La Liga': { code: 'PD', country: '🇪🇸' },
  'Premier League': { code: 'PL', country: '🇬🇧' },
  'Bundesliga': { code: 'BL1', country: '🇩🇪' },
  'Serie A': { code: 'SA', country: '🇮🇹' },
  'Ligue 1': { code: 'FL1', country: '🇫🇷' },
  'Eredivisie': { code: 'DivisionA', country: '🇳🇱' },
  'La Liga 2': { code: 'DivisionB2', country: '🇪🇸' },
  'Lliga Portugal': { code: 'PPL', country: '🇵🇹' },
  'EFL Championship': { code: 'ELC', country: '🇬🇧' }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Cal proporcionar startDate i endDate' });
    }

    const matchesByLeague = {};

    for (const [leagueName, leagueInfo] of Object.entries(leagueMapping)) {
      try {
        const url = `https://api.football-data.org/v4/competitions/${leagueInfo.code}/matches?dateFrom=${startDate}&dateTo=${endDate}`;
        
        const response = await fetch(url, {
          headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
        });

        if (!response.ok) {
          console.warn(`⚠️ Error amb ${leagueName}: ${response.status}`);
          matchesByLeague[leagueName] = [];
          continue;
        }

        const data = await response.json();
        
        matchesByLeague[leagueName] = (data.matches || [])
          .filter(m => m.status !== 'CANCELLED')
          .map(m => ({
            home: m.homeTeam.name,
            away: m.awayTeam.name,
            time: new Date(m.utcDate).toLocaleTimeString('ca-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: m.status.toLowerCase(),
            result: m.score.fullTime.home !== null ? 
              `${m.score.fullTime.home}-${m.score.fullTime.away}` : 
              null
          }));

      } catch (error) {
        console.error(`Error amb ${leagueName}:`, error.message);
        matchesByLeague[leagueName] = [];
      }
    }

    res.status(200).json(matchesByLeague);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
