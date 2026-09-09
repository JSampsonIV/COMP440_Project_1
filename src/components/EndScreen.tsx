import React from 'react';
import { GameResult } from '../types';
import { motion } from 'motion/react';

export default function EndScreen({ result, onRestart }: { result: GameResult, onRestart: () => void }) {
  const savedCount = result.npcs.filter(n => n.saved).length;
  const totalCount = result.npcs.length;
  
  let title = '';
  let narrative = '';
  
  if (!result.won) {
    title = 'CONSUMED BY THE BLOOM';
    if (savedCount > 0) {
      narrative = `You died, but you didn't die alone. Your final moments were spent trying to help others. The blast wave overtook you, erasing everything, but your selflessness was a final spark of humanity in a dying world.`;
    } else {
      narrative = `The blast wave caught up to you. Despite leaving everyone behind in your frantic dash for survival, it wasn't enough. The world ends, and you end with it.`;
    }
  } else {
    if (savedCount === totalCount) {
      title = 'A BEACON OF HOPE';
      narrative = `You reached the safety of the bunker, and miraculously, you brought everyone with you. In the face of ultimate destruction, you risked your own life repeatedly. As the heavy doors sealed out the apocalypse, you looked at the faces you saved. You are a true hero.`;
    } else if (savedCount > 0) {
      title = 'THE WEIGHT OF SURVIVAL';
      narrative = `You made it to the bunker, but the heavy doors sealed with a hollow thud. You saved ${savedCount} people, but you had to leave others behind to secure your own survival. The faces of those you couldn't save will haunt your dreams in the dark days to come.`;
    } else {
      title = 'SOLE SURVIVOR';
      narrative = `You survived. The heavy bunker doors slammed shut just as the shockwave washed over the world above. You are safe. But as you sit in the deafening silence, you realize you are entirely alone. You left them all to die. Was it worth it?`;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-[#615547] text-[#FFFEA1] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="max-w-3xl mx-auto py-12"
      >
        <h1 className="text-5xl font-bold mb-8 text-[#FF9212] uppercase tracking-wider">{title}</h1>
        <p className="text-2xl mb-12 leading-relaxed text-[#FFFEA1]">{narrative}</p>
        
        <div className="mb-12 text-left bg-[#997E67] text-[#615547] p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-6 border-b-2 border-[#615547] pb-2 uppercase tracking-wide">The fates of those you met:</h2>
          <ul className="space-y-6">
            {result.npcs.map(npc => (
              <li key={npc.id} className="flex flex-col">
                <span className="font-bold text-xl mb-1">
                  {npc.name} - <span className={npc.saved ? 'text-[#52FC28]' : 'text-red-900'}>{npc.saved ? 'SAVED' : 'LEFT BEHIND'}</span>
                </span>
                <span className="text-lg opacity-80">{npc.desc}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button 
          onClick={onRestart}
          className="px-10 py-5 bg-[#FF9212] text-[#615547] text-2xl font-bold rounded hover:bg-[#FFFEA1] transition-colors cursor-pointer uppercase shadow-lg"
        >
          Play Again
        </button>
      </motion.div>
    </div>
  );
}
