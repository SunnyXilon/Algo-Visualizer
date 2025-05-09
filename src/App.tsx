import React, { useState } from 'react';
import PathfindingVisualizer from './components/PathfindingVisualizer';
import SortingVisualizer from './components/SortingVisualizer';
import './App.css';

type AlgorithmType = 'sorting' | 'pathfinding';
type PathfindingAlgorithm = 'dijkstra' | 'aStar' | 'bfs' | 'dfs';

function App() {
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>('sorting');
  const [pathfindingAlgorithm, setPathfindingAlgorithm] = useState<PathfindingAlgorithm>('dijkstra');

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">Algorithm Visualizer</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setAlgorithmType('sorting')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  algorithmType === 'sorting'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Sorting
              </button>
              <button
                onClick={() => setAlgorithmType('pathfinding')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  algorithmType === 'pathfinding'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Pathfinding
              </button>
            </div>
          </div>
        </div>
      </nav>

      {algorithmType === 'sorting' && <SortingVisualizer />}
      {algorithmType === 'pathfinding' && <PathfindingVisualizer algorithm={pathfindingAlgorithm} />}
    </div>
  );
}

export default App;
