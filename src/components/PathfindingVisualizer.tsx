import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { dijkstra, aStar, Node, getNodesInShortestPathOrder } from '../algorithms/pathfinding';

type CellType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path';
type Algorithm = 'dijkstra' | 'aStar' | 'bfs' | 'dfs';
type Tool = 'wall' | 'start' | 'end';

interface Cell {
  row: number;
  col: number;
  type: CellType;
}

interface PathfindingVisualizerProps {
  algorithm?: Algorithm;
}

const PathfindingVisualizer: React.FC<PathfindingVisualizerProps> = ({ algorithm = 'dijkstra' }) => {
  const [grid, setGrid] = useState<Node[][]>([]);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('dijkstra');
  const [speed, setSpeed] = useState(25);
  const [selectedTool, setSelectedTool] = useState<Tool>('wall');
  const shouldStop = useRef(false);
  const [error, setError] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [lastNode, setLastNode] = useState<{row: number, col: number} | null>(null);

  // Constants
  const GRID_ROWS = 20;
  const GRID_COLS = 40;
  const MIN_SPEED = 1;
  const MAX_SPEED = 300;

  // Initialize grid
  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid: Node[][] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const currentRow: Node[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        currentRow.push({
          row,
          col,
          isStart: row === Math.floor(GRID_ROWS / 2) && col === Math.floor(GRID_COLS / 4),
          isEnd: row === Math.floor(GRID_ROWS / 2) && col === Math.floor(3 * GRID_COLS / 4),
          distance: Infinity,
          isVisited: false,
          isWall: false,
          previousNode: null,
          isInPath: false,
        });
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
  };

  const handleCellClick = (row: number, col: number) => {
    if (isVisualizing) return;
    
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      const cell = newGrid[row][col];
      
      // Handle different tools
      switch (selectedTool) {
        case 'wall':
          if (cell.isStart || cell.isEnd) return prevGrid;
          newGrid[row][col] = {
            ...cell,
            isWall: !cell.isWall
          };
          break;
        case 'start':
          // Only allow placing start point on empty cells
          if (cell.isWall) return prevGrid;
          // Remove old start point
          const oldStart = prevGrid.flat().find(cell => cell.isStart);
          if (oldStart) {
            newGrid[oldStart.row][oldStart.col] = {
              ...oldStart,
              isStart: false
            };
          }
          // Set new start point
          newGrid[row][col] = {
            ...cell,
            isStart: true
          };
          break;
        case 'end':
          // Only allow placing end point on empty cells
          if (cell.isWall) return prevGrid;
          // Remove old end point
          const oldEnd = prevGrid.flat().find(cell => cell.isEnd);
          if (oldEnd) {
            newGrid[oldEnd.row][oldEnd.col] = {
              ...oldEnd,
              isEnd: false
            };
          }
          // Set new end point
          newGrid[row][col] = {
            ...cell,
            isEnd: true
          };
          break;
      }
      
      return newGrid;
    });
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!mouseIsPressed || isVisualizing) return;
    
    // Only process if we're moving to a new node
    if (lastNode && (lastNode.row !== row || lastNode.col !== col)) {
      const newGrid = getNewGridWithWallToggled(grid, row, col);
      setGrid(newGrid);
      setLastNode({ row, col });
    }
  };

  const handleMouseDown = (row: number, col: number) => {
    if (isVisualizing) return;
    handleCellClick(row, col);
    setMouseIsPressed(true);
    setLastNode({ row, col });
  };

  const handleMouseUp = () => {
    setMouseIsPressed(false);
    setLastNode(null);
  };

  const getNewGridWithWallToggled = (grid: Node[][], row: number, col: number): Node[][] => {
    const newGrid = grid.map(row => row.map(node => ({ ...node })));
    const node = newGrid[row][col];
    
    // Don't modify start or end nodes
    if (node.isStart || node.isEnd) return newGrid;

    // Toggle wall
    node.isWall = !node.isWall;
    
    return newGrid;
  };

  const clearPath = () => {
    setGrid(prevGrid => 
      prevGrid.map(row => 
        row.map(cell => ({
          ...cell,
          isVisited: false,
          isInPath: false
        }))
      )
    );
  };

  const clearWalls = () => {
    setGrid(prevGrid => 
      prevGrid.map(row => 
        row.map(cell => ({
          ...cell,
          isWall: false
        }))
      )
    );
  };

  const resetGrid = () => {
    initializeGrid();
    shouldStop.current = false;
  };

  const delay = () => new Promise(resolve => setTimeout(resolve, speed));

  const visualizePath = async (endNode: Node, previous: { [key: string]: Node | null }) => {
    let currentNode = endNode;
    const path: Node[] = [];
    
    // First, collect all nodes in the path
    while (currentNode && !currentNode.isStart) {
      path.unshift(currentNode);
      const key = `${currentNode.row},${currentNode.col}`;
      currentNode = previous[key]!;
    }
    
    // Then visualize the path with delays
    for (const node of path) {
      if (shouldStop.current) return;
      
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => 
          row.map(cell => {
            if (cell.row === node.row && cell.col === node.col) {
              return {
                ...cell,
                isInPath: true,
                isVisited: false // Reset visited state to show path more clearly
              };
            }
            return cell;
          })
        );
        return newGrid;
      });
      
      await delay();
    }
  };

  // Update Dijkstra's Algorithm
  const dijkstraAlgorithm = async () => {
    setIsVisualizing(true);
    shouldStop.current = false;
    clearPath();

    const start = grid.flat().find(cell => cell.isStart);
    const end = grid.flat().find(cell => cell.isEnd);
    if (!start || !end) return;

    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: Node | null } = {};
    const unvisited = new PriorityQueue<string>();

    // Initialize distances
    grid.forEach(row => {
      row.forEach(cell => {
        const key = `${cell.row},${cell.col}`;
        distances[key] = Infinity;
        previous[key] = null;
      });
    });

    distances[`${start.row},${start.col}`] = 0;
    unvisited.enqueue(`${start.row},${start.col}`, 0);

    while (!unvisited.isEmpty() && !shouldStop.current) {
      const currentKey = unvisited.dequeue()!;
      const [currentRow, currentCol] = currentKey.split(',').map(Number);
      const currentCell = grid[currentRow][currentCol];

      if (currentCell.isEnd) {
        await visualizePath(currentCell, previous);
        break;
      }

      if (currentCell.isVisited) continue;
      currentCell.isVisited = true;

      // Update neighbors
      const neighbors = [
        { row: currentCell.row - 1, col: currentCell.col },
        { row: currentCell.row + 1, col: currentCell.col },
        { row: currentCell.row, col: currentCell.col - 1 },
        { row: currentCell.row, col: currentCell.col + 1 }
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 && neighbor.row < GRID_ROWS &&
          neighbor.col >= 0 && neighbor.col < GRID_COLS
        ) {
          const neighborCell = grid[neighbor.row][neighbor.col];
          if (neighborCell.isWall || neighborCell.isVisited) continue;

          const neighborKey = `${neighbor.row},${neighbor.col}`;
          const newDistance = distances[currentKey] + 1;

          if (newDistance < distances[neighborKey]) {
            distances[neighborKey] = newDistance;
            previous[neighborKey] = currentCell;
            unvisited.enqueue(neighborKey, newDistance);

            if (neighborCell.isEnd === false) {
              setGrid(prevGrid => {
                const newGrid = prevGrid.map(row => 
                  row.map(cell => {
                    if (cell.row === neighbor.row && cell.col === neighbor.col) {
                      return {
                        ...cell,
                        isVisited: true
                      };
                    }
                    return cell;
                  })
                );
                return newGrid;
              });
              await delay();
            }
          }
        }
      }
    }

    setIsVisualizing(false);
  };

  // Priority Queue implementation for Dijkstra's algorithm
  class PriorityQueue<T> {
    private items: { item: T; priority: number }[] = [];

    enqueue(item: T, priority: number): void {
      this.items.push({ item, priority });
      this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue(): T | undefined {
      return this.items.shift()?.item;
    }

    isEmpty(): boolean {
      return this.items.length === 0;
    }

    has(item: T): boolean {
      return this.items.some(({ item: i }) => i === item);
    }
  }

  // Update A* Algorithm
  const aStarAlgorithm = async () => {
    setIsVisualizing(true);
    shouldStop.current = false;
    clearPath();

    const start = grid.flat().find(cell => cell.isStart);
    const end = grid.flat().find(cell => cell.isEnd);
    if (!start || !end) return;

    const openSet = new PriorityQueue<string>();
    const closedSet = new Set<string>();
    const gScore: { [key: string]: number } = {};
    const fScore: { [key: string]: number } = {};
    const cameFrom: { [key: string]: Node | null } = {};

    // Initialize scores
    grid.forEach(row => {
      row.forEach(cell => {
        const key = `${cell.row},${cell.col}`;
        gScore[key] = Infinity;
        fScore[key] = Infinity;
        cameFrom[key] = null;
      });
    });

    const startKey = `${start.row},${start.col}`;
    gScore[startKey] = 0;
    fScore[startKey] = heuristic(start, end);
    openSet.enqueue(startKey, fScore[startKey]);

    while (!openSet.isEmpty() && !shouldStop.current) {
      const currentKey = openSet.dequeue()!;
      const [currentRow, currentCol] = currentKey.split(',').map(Number);
      const currentCell = grid[currentRow][currentCol];

      if (currentCell.isEnd) {
        await visualizePath(currentCell, cameFrom);
        break;
      }

      closedSet.add(currentKey);

      const neighbors = [
        { row: currentCell.row - 1, col: currentCell.col },
        { row: currentCell.row + 1, col: currentCell.col },
        { row: currentCell.row, col: currentCell.col - 1 },
        { row: currentCell.row, col: currentCell.col + 1 }
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 && neighbor.row < GRID_ROWS &&
          neighbor.col >= 0 && neighbor.col < GRID_COLS
        ) {
          const neighborCell = grid[neighbor.row][neighbor.col];
          if (neighborCell.isWall) continue;

          const neighborKey = `${neighbor.row},${neighbor.col}`;
          if (closedSet.has(neighborKey)) continue;

          const tentativeGScore = gScore[currentKey] + 1;

          if (tentativeGScore < gScore[neighborKey]) {
            cameFrom[neighborKey] = currentCell;
            gScore[neighborKey] = tentativeGScore;
            fScore[neighborKey] = gScore[neighborKey] + heuristic(neighborCell, end);

            if (!openSet.has(neighborKey)) {
              openSet.enqueue(neighborKey, fScore[neighborKey]);
            }

            if (neighborCell.isEnd === false) {
              setGrid(prevGrid => {
                const newGrid = [...prevGrid];
                newGrid[neighbor.row][neighbor.col] = {
                  ...neighborCell,
                  isVisited: true
                };
                return newGrid;
              });
              await delay();
            }
          }
        }
      }
    }

    setIsVisualizing(false);
  };

  // Improved heuristic function for A*
  const heuristic = (a: Node, b: Node): number => {
    // Using Euclidean distance for more accurate heuristic
    const dx = Math.abs(a.row - b.row);
    const dy = Math.abs(a.col - b.col);
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Breadth First Search
  const bfsAlgorithm = async () => {
    setIsVisualizing(true);
    shouldStop.current = false;
    clearPath();

    const start = grid.flat().find(cell => cell.isStart);
    const end = grid.flat().find(cell => cell.isEnd);
    if (!start || !end) return;

    const queue: Node[] = [start];
    const visited = new Set<string>();
    const previous: { [key: string]: Node | null } = {};
    let found = false;

    visited.add(`${start.row},${start.col}`);
    previous[`${start.row},${start.col}`] = null;

    while (queue.length > 0 && !shouldStop.current && !found) {
      const currentCell = queue.shift()!;
      const currentKey = `${currentCell.row},${currentCell.col}`;

      if (currentCell.isEnd) {
        found = true;
        // Reconstruct path
        let pathCell: Node = currentCell;
        while (pathCell && pathCell.isStart === false) {
          const key = `${pathCell.row},${pathCell.col}`;
          const prev = previous[key];
          if (prev) {
            setGrid(prevGrid => {
              const newGrid = [...prevGrid];
              if (newGrid[prev.row][prev.col].isStart === false) {
                newGrid[prev.row][prev.col] = {
                  ...prev,
                  isInPath: true
                };
              }
              return newGrid;
            });
            pathCell = prev;
          } else {
            break;
          }
        }
        break;
      }

      const neighbors = [
        { row: currentCell.row - 1, col: currentCell.col },
        { row: currentCell.row + 1, col: currentCell.col },
        { row: currentCell.row, col: currentCell.col - 1 },
        { row: currentCell.row, col: currentCell.col + 1 }
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 && neighbor.row < GRID_ROWS &&
          neighbor.col >= 0 && neighbor.col < GRID_COLS
        ) {
          const neighborCell = grid[neighbor.row][neighbor.col];
          const neighborKey = `${neighbor.row},${neighbor.col}`;

          if (neighborCell.isWall || visited.has(neighborKey)) continue;

          visited.add(neighborKey);
          previous[neighborKey] = currentCell;
          queue.push(neighborCell);

          if (neighborCell.isEnd === false) {
            setGrid(prevGrid => {
              const newGrid = [...prevGrid];
              newGrid[neighbor.row][neighbor.col] = {
                ...neighborCell,
                isVisited: true
              };
              return newGrid;
            });
            await delay();
          }
        }
      }
    }

    setIsVisualizing(false);
  };

  // Depth First Search
  const dfsAlgorithm = async () => {
    setIsVisualizing(true);
    shouldStop.current = false;
    clearPath();

    const start = grid.flat().find(cell => cell.isStart);
    const end = grid.flat().find(cell => cell.isEnd);
    if (!start || !end) return;

    const visited = new Set<string>();
    const previous: { [key: string]: Node | null } = {};

    const dfs = async (currentCell: Node): Promise<boolean> => {
      if (shouldStop.current) return false;
      
      const currentKey = `${currentCell.row},${currentCell.col}`;
      
      // Skip if already visited or is a wall
      if (visited.has(currentKey) || currentCell.isWall) return false;
      
      // Mark as visited
      visited.add(currentKey);
      
      // Visualize the current cell if it's not start or end
      if (!currentCell.isStart && !currentCell.isEnd) {
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          newGrid[currentCell.row][currentCell.col] = {
            ...currentCell,
            isVisited: true
          };
          return newGrid;
        });
        await delay();
      }

      // Check if we reached the end
      if (currentCell.isEnd) {
        return true;
      }

      // Explore neighbors in order: Up, Right, Down, Left
      const neighbors = [
        { row: currentCell.row - 1, col: currentCell.col }, // Up
        { row: currentCell.row, col: currentCell.col + 1 }, // Right
        { row: currentCell.row + 1, col: currentCell.col }, // Down
        { row: currentCell.row, col: currentCell.col - 1 }  // Left
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 && neighbor.row < GRID_ROWS &&
          neighbor.col >= 0 && neighbor.col < GRID_COLS
        ) {
          const neighborCell = grid[neighbor.row][neighbor.col];
          const neighborKey = `${neighbor.row},${neighbor.col}`;

          if (!visited.has(neighborKey) && !neighborCell.isWall) {
            previous[neighborKey] = currentCell;
            const found = await dfs(neighborCell);
            if (found) {
              // Mark the path as we backtrack
              if (!currentCell.isStart) {
                setGrid(prevGrid => {
                  const newGrid = [...prevGrid];
                  newGrid[currentCell.row][currentCell.col] = {
                    ...currentCell,
                    isInPath: true
                  };
                  return newGrid;
                });
                await delay();
              }
              return true;
            }
          }
        }
      }

      return false;
    };

    // Start DFS from the start node
    const found = await dfs(start);

    setIsVisualizing(false);
  };

  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlgorithm(e.target.value as Algorithm);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseInt(e.target.value);
    setSpeed(newSpeed);
  };

  const handleToolChange = (tool: Tool) => {
    setSelectedTool(tool);
    // Clear any error messages when changing tools
    setError('');
  };

  const handleVisualize = () => {
    switch (selectedAlgorithm) {
      case 'dijkstra':
        dijkstraAlgorithm();
        break;
      case 'aStar':
        aStarAlgorithm();
        break;
      case 'bfs':
        bfsAlgorithm();
        break;
      case 'dfs':
        dfsAlgorithm();
        break;
    }
  };

  const handleStop = () => {
    shouldStop.current = true;
    setIsVisualizing(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-center text-blue-400">Pathfinding Visualizer</h1>
          <p className="text-gray-400 text-center mb-6">Visualize different pathfinding algorithms</p>
          
          <div className="flex flex-col items-center gap-6">
            <div className="flex justify-center gap-4">
              <button
                onClick={resetGrid}
                disabled={isVisualizing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
              >
                Reset Grid
              </button>
              <button
                onClick={clearWalls}
                disabled={isVisualizing}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-yellow-500/25"
              >
                Clear Walls
              </button>
              {!isVisualizing ? (
                <button
                  onClick={handleVisualize}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-green-500/25"
                >
                  Visualize
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-red-500/25"
                >
                  Stop
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-md">
              <div className="flex-1">
                <label htmlFor="algorithm" className="block text-sm font-medium text-gray-300 mb-2">
                  Algorithm
                </label>
                <select
                  id="algorithm"
                  value={selectedAlgorithm}
                  onChange={handleAlgorithmChange}
                  disabled={isVisualizing}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="dijkstra">Dijkstra's Algorithm</option>
                  <option value="aStar">A* Search</option>
                  <option value="bfs">Breadth First Search</option>
                  <option value="dfs">Depth First Search</option>
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="speed" className="block text-sm font-medium text-gray-300 mb-2">
                  Speed: {speed}ms
                </label>
                <input
                  type="range"
                  id="speed"
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  value={speed}
                  onChange={handleSpeedChange}
                  disabled={isVisualizing}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => handleToolChange('wall')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  selectedTool === 'wall'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Wall
              </button>
              <button
                onClick={() => handleToolChange('start')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  selectedTool === 'start'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Start
              </button>
              <button
                onClick={() => handleToolChange('end')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  selectedTool === 'end'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                End
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
          <div 
            className="grid gap-0" 
            style={{ 
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
              gap: '1px',
              backgroundColor: '#4B5563'
            }}
            onMouseUp={handleMouseUp}
          >
            {grid.map((row, rowIndex) => 
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  className={`aspect-square transition-colors duration-150 ${
                    cell.isWall ? 'bg-black' :
                    cell.isStart ? 'bg-green-500' :
                    cell.isEnd ? 'bg-red-500' :
                    cell.isInPath ? 'bg-yellow-500' :
                    cell.isVisited ? 'bg-blue-500' :
                    'bg-gray-700'
                  } hover:opacity-80 cursor-pointer`}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-300">Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-300">End</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black rounded"></div>
            <span className="text-sm text-gray-300">Wall</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-300">Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-300">Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathfindingVisualizer;