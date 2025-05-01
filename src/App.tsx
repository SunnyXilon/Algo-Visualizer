import React, { useState } from 'react';
import SortingVisualizer from './components/SortingVisualizer';
import PathfindingVisualizer from './components/PathfindingVisualizer';

function App() {
  const [activeTab, setActiveTab] = useState<'sorting' | 'pathfinding'>('sorting');

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white text-center">Algorithm Visualizer</h1>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('sorting')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'sorting'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Sorting Algorithms
            </button>
            <button
              onClick={() => setActiveTab('pathfinding')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'pathfinding'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Pathfinding Algorithms
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'sorting' ? (
          <SortingVisualizer />
        ) : (
          <PathfindingVisualizer />
        )}
      </main>
    </div>
  );
}

export default App;
