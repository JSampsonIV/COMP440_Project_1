/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameView from './components/GameView';
import EndScreen from './components/EndScreen';
import { GameResult } from './types';

export default function App() {
  const [appState, setAppState] = useState<'START' | 'PLAYING' | 'ENDED'>('START');
  const [endState, setEndState] = useState<GameResult | null>(null);

  return (
    <div className="w-full h-screen bg-[#615547] text-[#FFFEA1] font-mono overflow-hidden">
      {appState === 'START' && <StartScreen onStart={() => setAppState('PLAYING')} />}
      {appState === 'PLAYING' && (
        <GameView
          onEnd={(result) => {
            setEndState(result);
            setAppState('ENDED');
          }}
        />
      )}
      {appState === 'ENDED' && endState && <EndScreen result={endState} onRestart={() => setAppState('START')} />}
    </div>
  );
}

