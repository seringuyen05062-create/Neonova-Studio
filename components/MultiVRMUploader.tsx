'use client';

import React, { useCallback, useState } from 'react';
import { useMultiVRM } from '@/hooks/useMultiVRM';
import { log } from '@/lib/utils/logger';

interface MultiVRMUploaderProps {
  onUploadComplete?: (index: number, fileName: string) => void;
  onUploadError?: (index: number, error: string) => void;
}

const MODEL_TYPES = [
  { index: 0, label: 'Main Character', icon: '👤', description: 'Primary model with lip sync' },
  { index: 1, label: 'Assistant 1', icon: '👥', description: 'Left side character' },
  { index: 2, label: 'Assistant 2', icon: '👥', description: 'Right side character' },
];

export function MultiVRMUploader({ onUploadComplete, onUploadError }: MultiVRMUploaderProps) {
  const { vrms, loadingStates, errors, loadVRM, unloadVRM, loadedCount } = useMultiVRM();
  const [dragStates, setDragStates] = useState<boolean[]>(Array(3).fill(false));

  const handleFileSelect = useCallback(async (index: number, file: File) => {
    if (!file.name.toLowerCase().endsWith('.vrm')) {
      const error = 'Please select a VRM file';
      onUploadError?.(index, error);
      return;
    }

    try {
      await loadVRM(index, file);
      onUploadComplete?.(index, file.name);
      log.info('MultiVRMUploader', `Successfully uploaded VRM to slot ${index}`, undefined, {
        fileName: file.name,
        modelType: MODEL_TYPES[index].label
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(index, errorMessage);
      log.error('MultiVRMUploader', `Failed to upload VRM to slot ${index}`, error as Error);
    }
  }, [loadVRM, onUploadComplete, onUploadError]);

  const handleDragEnter = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragStates(prev => {
      const newStates = [...prev];
      newStates[index] = true;
      return newStates;
    });
  }, []);

  const handleDragLeave = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });

    const files = Array.from(e.dataTransfer.files);
    const vrmFile = files.find(file => file.name.toLowerCase().endsWith('.vrm'));
    
    if (vrmFile) {
      handleFileSelect(index, vrmFile);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback((index: number) => {
    unloadVRM(index);
    log.info('MultiVRMUploader', `Removed VRM from slot ${index}`, undefined, {
      modelType: MODEL_TYPES[index].label
    });
  }, [unloadVRM]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Multi-Character Setup
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload up to 3 VRM models ({loadedCount}/3 loaded)
        </p>
      </div>

      {/* Upload Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODEL_TYPES.map(({ index, label, icon, description }) => {
          const vrm = vrms[index];
          const isLoading = loadingStates[index];
          const error = errors[index];
          const isDragging = dragStates[index];

          return (
            <div key={index} className="space-y-2">
              {/* Model Type Label */}
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
                {index === 0 && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                    Lip Sync
                  </span>
                )}
              </div>

              {/* Upload Area */}
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-4 transition-all duration-200
                  ${isDragging 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : vrm 
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                      : error
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                  ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                `}
                onDragEnter={(e) => handleDragEnter(index, e)}
                onDragLeave={(e) => handleDragLeave(index, e)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(index, e)}
                onClick={() => {
                  if (!isLoading && !vrm) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.vrm';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileSelect(index, file);
                    };
                    input.click();
                  }
                }}
              >
                {/* Loading Spinner */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {/* Content */}
                {vrm ? (
                  // Loaded State
                  <div className="text-center">
                    <div className="text-green-600 dark:text-green-400 text-2xl mb-2">✓</div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Model Loaded
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {description}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <span>×</span>
                      Remove
                    </button>
                  </div>
                ) : error ? (
                  // Error State
                  <div className="text-center">
                    <div className="text-red-500 text-xl mb-2">⚠</div>
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Upload Failed
                    </div>
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {error}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Click to retry
                    </div>
                  </div>
                ) : (
                  // Empty State
                  <div className="text-center">
                    <div className="text-4xl mb-2">📤</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {isDragging ? 'Drop VRM file' : 'Upload VRM'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {description}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Drag & drop or click
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      {loadedCount > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              MODEL_TYPES.forEach(({ index }) => {
                if (vrms[index]) unloadVRM(index);
              });
            }}
            className="text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            Clear All Models
          </button>
        </div>
      )}
    </div>
  );
}