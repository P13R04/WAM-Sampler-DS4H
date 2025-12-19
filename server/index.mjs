/**
 * Point d'entrée du serveur REST pour WAM Sampler
 * 
 * Démarre le serveur Express sur le port 3000 (ou PORT env var)
 * Gère les presets et samples avec stockage JSON local
 * Architecture prête pour authentification future
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */

import { app } from "./src/app.mjs";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🎛️  WAM Sampler Server lancé sur http://localhost:${PORT}`);
  console.log(`📁 API presets: http://localhost:${PORT}/api/presets`);
  console.log(`🎵 API samples: http://localhost:${PORT}/api/samples`);
});
