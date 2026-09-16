import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, Check, ChevronDown, CircleAlert, Download, FileText, Headphones, LoaderCircle, Pause, Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react';

const API = '/api';
const MAX = 5000;
const fallbackLanguages = [
  { code: 'en-US', name: 'English (US)' }, { code: 'en-GB', name: 'English (UK)' }, { code: 'hi-IN', name: 'Hindi' },
  { code: 'gu-IN', name: 'Gujarati' }, { code: 'mr-IN', name: 'Marathi' }, { code: 'es-ES', name: 'Spanish' }, { code: 'fr-FR', name: 'French' }, { code: 'de-DE', name: 'German' }
];
const fallbackVoices = fallbackLanguages.flatMap((language) => [
  { id: `${language.code}-female`, name: `${language.name} · Clara`, language: language.code, gender: 'Female', style: 'Warm' },
  { id: `${language.code}-male`, name: `${language.name} · Theo`, language: language.code, gender: 'Male', style: 'Clear' }
]);

export function App() {
  const [text, setText] = useState('Hello. Welcome to Sonora, a calmer way to listen to the words on your screen.');
  const [language, setLanguage] = useState('en-US');
  const [voice, setVoice] = useState('en-US-female');
  const [languages, setLanguages] = useState(fallbackLanguages);
  const [voices, setVoices] = useState(fallbackVoices);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);
  const filteredVoices = useMemo(() => voices.filter((item) => item.language === language), [voices, language]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    Promise.all([fetch(`${API}/languages`), fetch(`${API}/voices`)]).then(async ([languageResponse, voiceResponse]) => {
      if (languageResponse.ok) setLanguages((await languageResponse.json()).languages);
      if (voiceResponse.ok) setVoices((await voiceResponse.json()).voices);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!filteredVoices.some((item) => item.id === voice)) setVoice(filteredVoices[0]?.id || '');
  }, [filteredVoices, voice]);

  function clearAll() { setText(''); setError(''); setStatus('idle'); stopSpeech(); setAudioUrl(''); }
  function stopSpeech() { window.speechSynthesis?.cancel(); setIsPlaying(false); }

  async function generateSpeech() {
    setError('');
    if (!text.trim()) return setError('Write something first so Sonora has words to speak.');
    if (text.length > MAX) return setError(`Keep your script under ${MAX.toLocaleString()} characters.`);
    setStatus('loading'); stopSpeech();
    try {
      const response = await fetch(`${API}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language, voice }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not generate speech.');
      if (data.mode === 'browser') { setStatus('ready'); return; }
      const blob = await response.blob();
      setAudioUrl(URL.createObjectURL(blob)); setStatus('ready');
    } catch (requestError) { setStatus('idle'); setError(requestError.message || 'The server is unavailable. Start the API and try again.'); }
  }

  function togglePlayback() {
    if (audioUrl) { if (audioRef.current?.paused) { audioRef.current.play(); setIsPlaying(true); } else { audioRef.current?.pause(); setIsPlaying(false); } return; }
    if (!window.speechSynthesis) return setError('Speech synthesis is not supported in this browser.');
    if (isPlaying) return stopSpeech();
    const selectedVoice = filteredVoices.find((item) => item.id === voice);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language; utterance.rate = 0.95; utterance.onend = () => setIsPlaying(false); utterance.onerror = () => setIsPlaying(false);
    utteranceRef.current = utterance; window.speechSynthesis.speak(utterance); setIsPlaying(true); setStatus('ready');
    void selectedVoice;
  }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark"><AudioLines size={20} /></span><span>SONORA</span></a><span className="header-note"><span className="live-dot" /> Browser-ready studio</span></header>
    <section className="hero"><div className="eyebrow"><Sparkles size={14} /> LISTEN DIFFERENTLY</div><h1>Give your words<br /><em>a voice.</em></h1><p>Turn your writing into a listening experience with voices that feel clear, warm, and entirely human.</p></section>
    <section className="workspace">
      <div className="editor-column">
        <div className="section-heading"><div><span className="step-number">01</span><div><h2>Write your script</h2><p>Paste an article, note, or a few words to begin.</p></div></div><button className="quiet-button" onClick={clearAll}><RotateCcw size={15} /> Clear</button></div>
        <div className="editor-wrap"><textarea value={text} maxLength={MAX} onChange={(event) => setText(event.target.value)} placeholder="Start writing here..." aria-label="Text to convert to speech" /><div className="editor-footer"><span><FileText size={14} /> {words} {words === 1 ? 'word' : 'words'}</span><span className={text.length > MAX * 0.9 ? 'near-limit' : ''}>{text.length.toLocaleString()} / {MAX.toLocaleString()}</span></div></div>
        <div className="controls"><div className="section-heading compact"><div><span className="step-number">02</span><div><h2>Choose a voice</h2><p>Set the language and character of your narration.</p></div></div></div><div className="select-grid"><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}>{languages.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select><ChevronDown size={16} /></label><label>Voice<select value={voice} onChange={(event) => setVoice(event.target.value)}>{filteredVoices.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.style}</option>)}</select><ChevronDown size={16} /></label></div></div>
        <button className="generate-button" disabled={status === 'loading'} onClick={generateSpeech}>{status === 'loading' ? <><LoaderCircle className="spin" size={20} /> Preparing your audio...</> : <><Volume2 size={20} /> Generate speech <span>⌘ ↵</span></>}</button>
        {error && <div className="error-message"><CircleAlert size={18} /> {error}</div>}
      </div>
      <aside className={`output-panel ${status === 'ready' ? 'is-ready' : ''}`}><div className="panel-top"><span className="panel-label"><Headphones size={15} /> OUTPUT</span>{status === 'ready' && <span className="ready-label"><Check size={14} /> READY</span>}</div>{status !== 'ready' ? <div className="empty-state"><div className="empty-icon"><AudioLines size={27} /></div><h3>Your audio will appear here</h3><p>Write a script and choose a voice.<br />Your listening preview is one click away.</p></div> : <div className="audio-state"><div className="waveform">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ '--height': `${25 + ((index * 37) % 70)}%` }} />)}</div><div className="audio-meta"><div><strong>{words} {words === 1 ? 'word' : 'words'}</strong><span>{languages.find((item) => item.code === language)?.name} · {filteredVoices.find((item) => item.id === voice)?.style} voice</span></div><button className="play-button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause speech' : 'Play speech'}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button></div>{audioUrl ? <audio ref={audioRef} controls src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} /> : <div className="browser-note">Browser speech synthesis · no API key required</div>}<button className="download-button" disabled={!audioUrl} onClick={() => { const link = document.createElement('a'); link.href = audioUrl; link.download = 'sonora-speech.mp3'; link.click(); }}><Download size={17} /> {audioUrl ? 'Download MP3' : 'Download available with a provider key'}</button></div>}</aside>
    </section>
    <footer><span>SONORA / TEXT TO SPEECH</span><span>Private by default · Your text stays in your browser</span></footer>
  </main>;
}
