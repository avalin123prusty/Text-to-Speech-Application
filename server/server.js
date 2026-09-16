import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = Number(process.env.PORT || 5000);
const maxCharacters = 5000;
const languages = [
  { code: 'en-US', name: 'English (US)' }, { code: 'en-GB', name: 'English (UK)' },
  { code: 'hi-IN', name: 'Hindi' }, { code: 'gu-IN', name: 'Gujarati' },
  { code: 'mr-IN', name: 'Marathi' }, { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' }, { code: 'de-DE', name: 'German' }
];
const voices = languages.flatMap((language) => [
  { id: `${language.code}-female`, name: `${language.name} · Clara`, language: language.code, gender: 'Female', style: 'Warm' },
  { id: `${language.code}-male`, name: `${language.name} · Theo`, language: language.code, gender: 'Male', style: 'Clear' }
]);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', provider: process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'browser' }));
app.get('/api/languages', (_req, res) => res.json({ languages }));
app.get('/api/voices', (_req, res) => res.json({ voices }));

app.post('/api/tts', async (req, res) => {
  const { text, language, voice } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Enter some text before generating speech.' });
  if (text.length > maxCharacters) return res.status(400).json({ error: `Text must be ${maxCharacters.toLocaleString()} characters or fewer.` });
  if (!languages.some((item) => item.code === language)) return res.status(400).json({ error: 'Choose a supported language.' });
  if (!voices.some((item) => item.id === voice && item.language === language)) return res.status(400).json({ error: 'Choose a voice for the selected language.' });

  if (!process.env.ELEVENLABS_API_KEY) {
    return res.json({ success: true, mode: 'browser', message: 'Ready for browser speech synthesis.' });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY, Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
    });
    if (!response.ok) return res.status(response.status === 429 ? 429 : 503).json({ error: 'The speech provider could not generate audio right now.' });
    const audio = Buffer.from(await response.arrayBuffer());
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Disposition': 'attachment; filename="sonora-speech.mp3"' }).send(audio);
  } catch { res.status(503).json({ error: 'The speech provider is unavailable. Try again shortly.' }); }
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.listen(port, () => console.log(`Sonora API listening on http://localhost:${port}`));
