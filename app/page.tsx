'use client';

import { useState } from 'react';
import SpinningWheel from './components/SpinningWheel';

export default function Home() {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showWheel, setShowWheel] = useState(false);

  const addOption = () => {
    if (newOption.trim() && options.length < 12) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSpin = () => {
    if (options.length < 2) {
      alert('Please add at least 2 options!');
      return;
    }
    setWinner(null);
    setIsSpinning(true);
    setShowWheel(true);
  };

  const handleSpinComplete = (winningOption: string) => {
    setIsSpinning(false);
    setWinner(winningOption);
  };

  const handleReset = () => {
    setShowWheel(false);
    setWinner(null);
    setIsSpinning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🎯 SPIN
          </h1>
          <p className="text-xl text-white/90 font-semibold tracking-wide">
            Start Picking Instead of Negotiating
          </p>
        </div>

        {!showWheel ? (
          /* Setup Form */
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-gray-700 text-lg font-semibold mb-2">
                Question/Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg text-gray-900"
                placeholder="e.g., Where do we eat?"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-lg font-semibold mb-2">
                Options ({options.length}/12)
              </label>

              <div className="space-y-2 mb-4">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg group hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex-1 text-gray-700 font-medium">
                      {index + 1}. {option}
                    </span>
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700 font-bold px-3 py-1 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addOption()}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                  placeholder="Add new option..."
                  disabled={options.length >= 12}
                />
                <button
                  onClick={addOption}
                  disabled={!newOption.trim() || options.length >= 12}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Minimum 2 options, maximum 12 options
              </p>
            </div>

            <button
              onClick={handleSpin}
              disabled={options.length < 2}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
            >
              🎰 SPIN THE WHEEL!
            </button>
          </div>
        ) : (
          /* Wheel Display */
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                {title}
              </h2>

              <div className="flex flex-col items-center justify-center">
                <SpinningWheel
                  options={options}
                  isSpinning={isSpinning}
                  onSpinComplete={handleSpinComplete}
                />
              </div>

              {winner && (
                <div className="mt-8 text-center animate-bounce">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-xl inline-block">
                    <p className="text-2xl font-bold mb-2">🎉 Winner! 🎉</p>
                    <p className="text-4xl font-black">{winner}</p>
                  </div>
                </div>
              )}

              <div className="mt-8 flex gap-4 justify-center">
                {!isSpinning && (
                  <>
                    <button
                      onClick={handleSpin}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all shadow-lg"
                    >
                      🎰 Spin Again
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-8 py-3 bg-gray-600 text-white text-lg font-bold rounded-xl hover:bg-gray-700 transform hover:scale-105 transition-all shadow-lg"
                    >
                      ← Back to Setup
                    </button>
                  </>
                )}
                {isSpinning && (
                  <div className="text-2xl font-bold text-gray-600 animate-pulse">
                    Spinning...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-white/80 text-sm">
          <p>Make decisions faster. Stop the back-and-forth. Just SPIN!</p>
        </div>
      </div>
    </div>
  );
}
