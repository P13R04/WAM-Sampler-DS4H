/**
 * Serveur API REST pour WAM Sampler
 * 
 * Endpoints :
 * - GET    /api/health              : Health check
 * - GET    /api/presets             : Liste tous les presets (filtres : ?q=search&user=username)
 * - GET    /api/presets/:id         : Récupère un preset par ID
 * - POST   /api/presets             : Crée un nouveau preset
 * - PUT    /api/presets/:id         : Met à jour un preset existant
 * - DELETE /api/presets/:id         : Supprime un preset
 * - POST   /api/samples             : Upload un fichier audio (multipart/form-data)
 * - GET    /samples/:filename       : Télécharge un sample (fichier statique)
 * 
 * Stockage :
 * - Presets : ./data/presets/*.json
 * - Samples : ./data/samples/*.{wav,mp3,ogg,etc}
 * 
 * Format preset :
 * {
 *   "id": "uuid-v4",
 *   "name": "Mon Preset",
 *   "user": "username",     // pour auth future
 *   "isPublic": false,      // pour partage futur
 *   "created": "ISO date",
 *   "updated": "ISO date",
 *   "parameters": { ... },  // état WAM (getState)
 *   "samples": [            // références aux samples
 *     { "padIndex": 0, "url": "/samples/kick.wav", "name": "kick.wav" },
 *     ...
 *   ]
 * }
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */

import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import crypto from "crypto";
import multer from "multer";

export const app = express();
app.use(express.json({ limit: "10mb" }));

// CORS : localhost seulement pour dev local
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // non-browser clients (curl, etc.)
    const ok = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    cb(ok ? null : new Error("CORS non autorisé"), ok);
  }
}));

// ------- Chemins ---------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.resolve(__dirname, "../data");
export const PRESETS_DIR = path.join(DATA_DIR, "presets");
export const SAMPLES_DIR = path.join(DATA_DIR, "samples");
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// Servir les samples en statique
app.use("/samples", express.static(SAMPLES_DIR));

// Servir les fichiers du projet (src/, host/, @webaudiomodules/, etc.)
app.use(express.static(PROJECT_ROOT));

// Créer les répertoires au démarrage
await fs.mkdir(PRESETS_DIR, { recursive: true }).catch(() => {});
await fs.mkdir(SAMPLES_DIR, { recursive: true }).catch(() => {});

// ------- Configuration Multer (upload samples) -------
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      await fs.mkdir(SAMPLES_DIR, { recursive: true }).catch(() => {});
      cb(null, SAMPLES_DIR);
    },
    filename: (req, file, cb) => {
      // Nom unique : timestamp + random + extension originale
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      const uniqueName = `${basename}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(wav|mp3|ogg|m4a|flac|aiff)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Format audio non supporté"));
    }
  }
});

// ------- Utilitaires -------
const readJSON = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));
const writeJSON = async (filePath, data) => fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
const fileExists = async (p) => {
  try { await fs.access(p); return true; } catch { return false; }
};

const listPresetFiles = async () => {
  const items = await fs.readdir(PRESETS_DIR).catch(() => []);
  return items.filter((f) => f.endsWith(".json"));
};

const generateId = () => crypto.randomUUID();

// ------- Routes -------

/**
 * Health check
 */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, server: "wam-sampler", now: new Date().toISOString() });
});

/**
 * GET /api/presets
 * Liste tous les presets avec filtres optionnels :
 * - ?q=search : recherche texte dans name
 * - ?user=username : filtre par utilisateur (pour auth future)
 * - ?isPublic=true : filtre publics uniquement
 */
app.get("/api/presets", async (req, res, next) => {
  try {
    const { q, user, isPublic } = req.query;
    const files = await listPresetFiles();
    let presets = await Promise.all(
      files.map((f) => readJSON(path.join(PRESETS_DIR, f)))
    );

    // Filtres
    if (q) {
      const needle = String(q).toLowerCase();
      presets = presets.filter((p) => p.name?.toLowerCase().includes(needle));
    }
    if (user) {
      presets = presets.filter((p) => p.user === user);
    }
    if (isPublic !== undefined) {
      const want = String(isPublic) === "true";
      presets = presets.filter((p) => p.isPublic === want);
    }

    res.json(presets);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/presets/:id
 * Récupère un preset par ID
 */
app.get("/api/presets/:id", async (req, res, next) => {
  try {
    const file = path.join(PRESETS_DIR, `${req.params.id}.json`);
    if (!(await fileExists(file))) {
      return res.status(404).json({ error: "Preset non trouvé" });
    }
    res.json(await readJSON(file));
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/presets
 * Crée un nouveau preset
 * Body : { name, parameters, samples, user?, isPublic? }
 */
app.post("/api/presets", async (req, res, next) => {
  try {
    const { name, parameters, samples, user, isPublic } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Le champ 'name' est requis" });
    }

    const preset = {
      id: generateId(),
      name: name.trim(),
      user: user || "anonymous",
      isPublic: Boolean(isPublic),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      parameters: parameters || {},
      samples: samples || []
    };

    const file = path.join(PRESETS_DIR, `${preset.id}.json`);
    await writeJSON(file, preset);

    res.status(201).json(preset);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/presets/:id
 * Met à jour un preset existant (remplace complètement)
 */
app.put("/api/presets/:id", async (req, res, next) => {
  try {
    const file = path.join(PRESETS_DIR, `${req.params.id}.json`);
    if (!(await fileExists(file))) {
      return res.status(404).json({ error: "Preset non trouvé" });
    }

    const existing = await readJSON(file);
    const { name, parameters, samples, user, isPublic } = req.body;

    const updated = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      parameters: parameters !== undefined ? parameters : existing.parameters,
      samples: samples !== undefined ? samples : existing.samples,
      user: user !== undefined ? user : existing.user,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : existing.isPublic,
      updated: new Date().toISOString()
    };

    await writeJSON(file, updated);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/presets/:id
 * Supprime un preset
 */
app.delete("/api/presets/:id", async (req, res, next) => {
  try {
    const file = path.join(PRESETS_DIR, `${req.params.id}.json`);
    if (!(await fileExists(file))) {
      return res.status(404).json({ error: "Preset non trouvé" });
    }

    await fs.unlink(file);
    res.json({ ok: true, deleted: req.params.id });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/samples
 * Upload un fichier audio
 * Multipart/form-data avec champ "audio"
 * Retourne : { url, filename, size }
 */
app.post("/api/samples", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier reçu" });
  }

  res.status(201).json({
    url: `/samples/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// ------- Middleware erreurs -------
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);
  res.status(err.status || 500).json({
    error: err.message || "Erreur interne du serveur"
  });
});

// 404 pour routes non trouvées
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});
