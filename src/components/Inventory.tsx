'use client';

import React, { useState } from 'react';
import type { PS5Console, Controller, InventorySubTab } from '@/lib/types';
import ConsoleSection from './ConsoleSection';
import ControllerSection from './ControllerSection';

interface InventoryProps {
  consoles: PS5Console[];
  controllers: Controller[];
  setConsoles: (c: PS5Console[]) => void;
  setControllers: (c: Controller[]) => void;
  showToast: (msg: string) => void;
}

export default function Inventory({
  consoles,
  controllers,
  setConsoles,
  setControllers,
  showToast,
}: InventoryProps) {
  const [subTab, setSubTab] = useState<InventorySubTab>('consoles');

  return (
    <>
      {/* Sub-tab toggle */}
      <div className="bg-surface border border-bdr rounded-[10px] p-1.5 mb-4">
        <div className="flex gap-1.5">
          <button
            className={`flex-1 bg-transparent border border-bdr text-txt-dim px-3.5 py-2 rounded-lg text-[13px] font-inter cursor-pointer transition-all duration-150 hover:border-txt-faint hover:text-txt ${
              subTab === 'consoles' ? 'bg-surface-3 !text-accent !border-accent-dim' : ''
            }`}
            onClick={() => setSubTab('consoles')}
          >
            PS5 Consoles ({consoles.length})
          </button>
          <button
            className={`flex-1 bg-transparent border border-bdr text-txt-dim px-3.5 py-2 rounded-lg text-[13px] font-inter cursor-pointer transition-all duration-150 hover:border-txt-faint hover:text-txt ${
              subTab === 'controllers' ? 'bg-surface-3 !text-accent !border-accent-dim' : ''
            }`}
            onClick={() => setSubTab('controllers')}
          >
            Controllers ({controllers.length})
          </button>
        </div>
      </div>

      {subTab === 'consoles' ? (
        <ConsoleSection consoles={consoles} setConsoles={setConsoles} showToast={showToast} />
      ) : (
        <ControllerSection controllers={controllers} setControllers={setControllers} showToast={showToast} />
      )}
    </>
  );
}
