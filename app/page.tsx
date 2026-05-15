'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import SpinningWheel from './components/SpinningWheel';

const MAX_OPTIONS = 14;
const STORAGE_KEY = 'spin:decision:v2';

type Preset = {
  name: string;
  title: string;
  options: string[];
};

type SavedDecision = {
  title: string;
  options: string[];
};

type SpinResult = {
  option: string;
  at: number;
};

const PRESETS: Preset[] = [
  {
    name: 'Dinner',
    title: 'Where should we eat?',
    options: ['Ramen', 'Tacos', 'Pizza', 'Sushi', 'Burgers', 'Thai'],
  },
  {
    name: 'Hangout',
    title: 'What are we doing tonight?',
    options: ['Movie', 'Board games', 'Walk', 'Cafe', 'Arcade', 'Cook together'],
  },
  {
    name: 'Chores',
    title: 'Who takes this one?',
    options: ['Alex', 'Sam', 'Jordan', 'Taylor'],
  },
];

const DEFAULT_DECISION: SavedDecision = PRESETS[0];

function normalizeOptions(options: string[]) {
  const seen = new Set<string>();

  return options
    .map((option) => option.trim())
    .filter(Boolean)
    .filter((option) => {
      const key = option.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, MAX_OPTIONS);
}

function encodeDecision(decision: SavedDecision) {
  const json = JSON.stringify({
    t: decision.title.trim(),
    o: normalizeOptions(decision.options),
  });
  const bytes = new TextEncoder().encode(json);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeDecision(encoded: string): SavedDecision | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as {
      t?: unknown;
      o?: unknown;
    };

    if (typeof parsed.t !== 'string' || !Array.isArray(parsed.o)) {
      return null;
    }

    const options = normalizeOptions(parsed.o.filter((option): option is string => typeof option === 'string'));

    if (options.length < 2) {
      return null;
    }

    return {
      title: parsed.t.slice(0, 80),
      options,
    };
  } catch {
    return null;
  }
}

function createDecisionUrl(decision: SavedDecision) {
  const url = new URL(window.location.href);
  url.searchParams.set('spin', encodeDecision(decision));
  url.hash = '';

  return url.toString();
}

function shuffle<T>(items: T[]) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

export default function Home() {
  const [title, setTitle] = useState(DEFAULT_DECISION.title);
  const [options, setOptions] = useState<string[]>(DEFAULT_DECISION.options);
  const [pendingOption, setPendingOption] = useState('');
  const [spinKey, setSpinKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready when you are.');
  const [history, setHistory] = useState<SpinResult[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const cleanOptions = useMemo(() => normalizeOptions(options), [options]);
  const canSpin = cleanOptions.length >= 2 && !isSpinning;
  const titleValue = title.trim() || 'What should we pick?';

  useEffect(() => {
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const sharedDecision = params.get('spin');

      if (sharedDecision) {
        const decoded = decodeDecision(sharedDecision);

        if (decoded) {
          setTitle(decoded.title);
          setOptions(decoded.options);
          setStatus('Loaded a shared wheel.');
          setIsHydrated(true);
          return;
        }
      }

      const savedDecision = window.localStorage.getItem(STORAGE_KEY);

      if (savedDecision) {
        try {
          const parsed = JSON.parse(savedDecision) as SavedDecision;
          const savedOptions = Array.isArray(parsed.options) ? normalizeOptions(parsed.options) : [];

          if (typeof parsed.title === 'string' && savedOptions.length >= 2) {
            setTitle(parsed.title);
            setOptions(savedOptions);
            setStatus('Restored your last wheel.');
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        title,
        options: cleanOptions,
      }),
    );
  }, [cleanOptions, isHydrated, title]);

  const addOption = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const nextOption = pendingOption.trim();

    if (!nextOption) {
      return;
    }

    if (cleanOptions.length >= MAX_OPTIONS) {
      setStatus(`Keep it tight: ${MAX_OPTIONS} options is the limit.`);
      return;
    }

    if (cleanOptions.some((option) => option.toLowerCase() === nextOption.toLowerCase())) {
      setStatus('That option is already on the wheel.');
      return;
    }

    setOptions([...cleanOptions, nextOption]);
    setPendingOption('');
    setWinner(null);
    setStatus('Option added.');
  };

  const removeOption = (optionToRemove: string) => {
    setOptions(cleanOptions.filter((option) => option !== optionToRemove));
    setWinner(null);
    setStatus('Option removed.');
  };

  const applyPreset = (preset: Preset) => {
    setTitle(preset.title);
    setOptions(preset.options);
    setWinner(null);
    setHistory([]);
    setStatus(`${preset.name} wheel loaded.`);
  };

  const handleSpin = () => {
    if (!canSpin) {
      setStatus('Add at least two options before spinning.');
      return;
    }

    setWinner(null);
    setIsSpinning(true);
    setStatus('Spinning...');
    setSpinKey((current) => current + 1);
  };

  const handleSpinComplete = useCallback((winningOption: string) => {
    setWinner(winningOption);
    setIsSpinning(false);
    setStatus(`Picked ${winningOption}.`);
    setHistory((current) => [{ option: winningOption, at: Date.now() }, ...current].slice(0, 5));
  }, []);

  const copyShareLink = async () => {
    const url = createDecisionUrl({
      title: titleValue,
      options: cleanOptions,
    });

    window.history.replaceState(null, '', url);

    try {
      await navigator.clipboard.writeText(url);
      setStatus('Share link copied.');
    } catch {
      setStatus('Share link is in the address bar.');
    }
  };

  const startFresh = () => {
    setTitle('');
    setOptions([]);
    setPendingOption('');
    setWinner(null);
    setHistory([]);
    setStatus('Fresh wheel started.');
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      setStatus('Fullscreen is not available in this browser.');
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#120d1f] text-orange-50">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[25rem_minmax(0,1fr)] lg:px-8">
        <aside className="flex flex-col gap-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <section className="rounded-[1.25rem] border border-white/10 bg-[#211832]/88 p-5 shadow-2xl shadow-black/25 backdrop-blur">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">SPIN</p>
              <h1 className="mt-2 text-3xl font-black tracking-normal text-orange-50">
                Start picking instead of negotiating.
              </h1>
            </div>

            <label className="text-sm font-bold text-orange-100" htmlFor="decision-title">
              Question
            </label>
            <input
              id="decision-title"
              maxLength={80}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d1f] px-4 py-3 text-base font-semibold text-orange-50 outline-none transition placeholder:text-orange-100/38 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
              placeholder="What should we pick?"
              disabled={isSpinning}
            />

            <div className="mt-5 flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-orange-100" htmlFor="new-option">
                Options
              </label>
              <span className="text-xs font-bold text-orange-100/55">
                {cleanOptions.length}/{MAX_OPTIONS}
              </span>
            </div>

            <form className="mt-2 flex gap-2" onSubmit={addOption}>
              <input
                id="new-option"
                value={pendingOption}
                onChange={(event) => setPendingOption(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#120d1f] px-4 py-3 text-base text-orange-50 outline-none transition placeholder:text-orange-100/38 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
                placeholder="Add an option"
                disabled={isSpinning || cleanOptions.length >= MAX_OPTIONS}
              />
              <button
                className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-orange-100/40"
                disabled={isSpinning || !pendingOption.trim() || cleanOptions.length >= MAX_OPTIONS}
                type="submit"
              >
                Add
              </button>
            </form>

            <div className="mt-4 grid gap-2">
              {cleanOptions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/18 px-4 py-5 text-center text-sm font-semibold text-orange-100/55">
                  Add two or more choices to build the wheel.
                </p>
              ) : (
                cleanOptions.map((option) => (
                  <div
                    className="flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3"
                    key={option}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-orange-50">{option}</span>
                    <button
                      aria-label={`Remove ${option}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-lg font-black text-orange-100/45 transition hover:bg-rose-400/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={isSpinning}
                      onClick={() => removeOption(option)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-white/10 bg-[#211832]/88 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-orange-100/55">Quick starts</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm font-black text-orange-50 transition hover:border-cyan-300 hover:bg-cyan-300/12 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSpinning}
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  type="button"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="flex min-h-[calc(100vh-2rem)] flex-col rounded-[1.5rem] border border-white/10 bg-[#1a1328]/92 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-100/50">Decision room</p>
              <h2 className="truncate text-xl font-black text-orange-50 sm:text-2xl">{titleValue}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm font-black text-orange-50 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSpinning || cleanOptions.length < 2}
                onClick={() => setOptions(shuffle(cleanOptions))}
                type="button"
              >
                Shuffle
              </button>
              <button
                className="rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm font-black text-orange-50 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSpinning || cleanOptions.length < 2}
                onClick={copyShareLink}
                type="button"
              >
                Copy link
              </button>
              <button
                className="rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm font-black text-orange-50 transition hover:border-cyan-300"
                onClick={toggleFullscreen}
                type="button"
              >
                Fullscreen
              </button>
            </div>
          </div>

          <div className="grid flex-1 gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:p-6">
            <div className="flex flex-col items-center justify-center">
              <SpinningWheel options={cleanOptions} spinKey={spinKey} onSpinComplete={handleSpinComplete} />

              <div className="mt-6 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row">
                <button
                  className="min-h-14 flex-1 rounded-2xl bg-rose-500 px-6 py-4 text-lg font-black text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-orange-100/40 disabled:shadow-none"
                  disabled={!canSpin}
                  onClick={handleSpin}
                  type="button"
                >
                  {isSpinning ? 'Spinning...' : 'Spin the wheel'}
                </button>
                <button
                  className="min-h-14 rounded-2xl border border-white/12 bg-white/[0.04] px-6 py-4 text-sm font-black text-orange-50 transition hover:border-rose-300 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSpinning}
                  onClick={startFresh}
                  type="button"
                >
                  New wheel
                </button>
              </div>

              <p className="mt-3 min-h-6 text-center text-sm font-bold text-orange-100/58" role="status">
                {status}
              </p>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-100/50">Result</p>
                <div className="mt-4 min-h-28 rounded-2xl bg-[#120d1f] p-5 shadow-sm">
                  {winner ? (
                    <>
                      <p className="text-sm font-bold text-cyan-200">The wheel picked</p>
                      <p className="mt-2 break-words text-3xl font-black text-orange-50">{winner}</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold leading-6 text-orange-100/58">
                      Spin when the list looks right. The winner will appear here.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-100/50">Recent picks</p>
                <div className="mt-4 grid gap-2">
                  {history.length === 0 ? (
                    <p className="text-sm font-semibold leading-6 text-orange-100/58">No spins yet.</p>
                  ) : (
                    history.map((result) => (
                      <div className="rounded-xl bg-[#120d1f] px-3 py-2 shadow-sm" key={`${result.option}-${result.at}`}>
                        <p className="truncate text-sm font-black text-orange-50">{result.option}</p>
                        <p className="text-xs font-semibold text-orange-100/48">
                          {new Date(result.at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
