'use client';

import { useState } from 'react';
import TestMultipleModels from './TestMultipleModels';
import { useExtraVRMs } from '@/hooks/useExtraVRMs';

export default function MultiModelDebugger() {
  const [showTest, setShowTest] = useState(false);
  const { extraVRMs, loadExtraVRM, unloadExtraVRM } = useExtraVRMs();

  return (
    <div className="p-4 bg-gray-800 rounded-lg space-y-4">
      <h3 className="text-white font-bold">🔧 Multi Model Debug</h3>
      
      {/* Test Basic Multiple Objects */}
      <div>
        <button 
          onClick={() => setShowTest(!showTest)}
          className="btn btn-primary"
        >
          {showTest ? 'Hide' : 'Show'} Multiple Objects Test
        </button>
        {showTest && (
          <div className="mt-4">
            <h4 className="text-white mb-2">Basic Multiple Objects (Should Work):</h4>
            <TestMultipleModels />
          </div>
        )}
      </div>

      {/* Extra VRMs Status */}
      <div>
        <h4 className="text-white mb-2">Extra VRMs Status:</h4>
        <div className="space-y-2">
          {extraVRMs.map((extra, index) => (
            <div key={index} className="p-2 bg-white/10 rounded text-white text-sm">
              <div><strong>Index {index}:</strong> {extra.name}</div>
              <div>Position: ({extra.position.x}, {extra.position.y}, {extra.position.z})</div>
              <div>VRM Loaded: {extra.vrm ? '✅ Yes' : '❌ No'}</div>
              <div>Loading: {extra.isLoading ? '⏳ Yes' : '✅ No'}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* File Upload Test */}
      <div>
        <h4 className="text-white mb-2">Quick VRM Upload Test:</h4>
        <input
          type="file"
          accept=".vrm,.glb"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              console.log('🧪 Testing VRM upload for index 0:', file.name);
              loadExtraVRM(0, file);
            }
          }}
          className="text-white"
        />
      </div>
    </div>
  );
}