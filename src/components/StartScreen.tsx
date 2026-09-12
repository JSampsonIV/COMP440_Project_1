import React from 'react';
import { motion } from 'motion/react';

export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-[#615547] text-[#FFFEA1]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-3xl w-full"
      >
        <h1 className="text-7xl font-bold mb-4 tracking-widest text-[#FF9212]">BLOOM</h1>
        
        <div className="bg-[#997E67] text-[#615547] p-6 rounded-lg mb-8 max-w-md mx-auto text-left border-4 border-[#52FC28]">
          <h2 className="text-2xl font-bold mb-4 uppercase">Controls</h2>
          <ul className="space-y-2 font-bold text-lg">
            <li>[ A ] / [ D ] - Move Left / Right</li>
            <li>[ E ] - Interact</li>
          </ul>
        </div>
        
        <button 
          onClick={onStart}
          className="px-12 py-6 bg-[#FF9212] text-[#615547] text-4xl font-bold rounded-lg hover:bg-[#FFFEA1] transition-colors uppercase tracking-widest cursor-pointer shadow-lg"
        >
          ESCAPE
        </button>
      </motion.div>
    </div>
  );
}
