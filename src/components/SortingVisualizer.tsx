import React, { useState, useEffect, useRef } from 'react';

type SortingAlgorithm = 'bubble' | 'insertion' | 'merge' | 'quick';

interface SortingVisualizerProps {
  algorithm?: SortingAlgorithm;
}

interface BarState {
  value: number;
  isComparing: boolean;
  isSwapping: boolean;
}

const SortingVisualizer: React.FC<SortingVisualizerProps> = ({ algorithm = 'bubble' }) => {
  const [array, setArray] = useState<BarState[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [speed, setSpeed] = useState(25);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SortingAlgorithm>('bubble');
  const [inputVector, setInputVector] = useState('');
  const [error, setError] = useState('');
  const shouldStop = useRef(false);

  // Constants for visualization
  const MIN_NUMBER = 5;
  const MAX_NUMBER = 100;
  const ARRAY_SIZE = 20;
  const MIN_SPEED = 1;
  const MAX_SPEED = 300;
  const MAX_ELEMENTS = 100;

  // Generate a new random array
  const resetArray = () => {
    const newArray: BarState[] = [];
    for (let i = 0; i < ARRAY_SIZE; i++) {
      newArray.push({
        value: Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER,
        isComparing: false,
        isSwapping: false
      });
    }
    setArray(newArray);
    shouldStop.current = false;
  };

  // Initialize array on component mount
  useEffect(() => {
    resetArray();
  }, []);

  // Helper function to delay execution
  const delay = () => new Promise(resolve => setTimeout(resolve, speed));

  // Helper function to update bar states
  const updateBarStates = (indices: number[], states: Partial<BarState>) => {
    setArray(prevArray => {
      const newArray = [...prevArray];
      indices.forEach(index => {
        newArray[index] = { ...newArray[index], ...states };
      });
      return newArray;
    });
  };

  // Helper function to swap bars with animation
  const swapBars = async (index1: number, index2: number) => {
    // Lift both bars
    updateBarStates([index1, index2], { isComparing: true });
    await delay();

    // Swap values
    setArray(prevArray => {
      const newArray = [...prevArray];
      [newArray[index1].value, newArray[index2].value] = [newArray[index2].value, newArray[index1].value];
      return newArray;
    });

    // Mark as swapping
    updateBarStates([index1, index2], { isSwapping: true });
    await delay();

    // Lower bars
    updateBarStates([index1, index2], { isComparing: false, isSwapping: false });
    await delay();
  };

  // Bubble Sort Implementation
  const bubbleSort = async () => {
    const n = array.length;
    setIsSorting(true);
    shouldStop.current = false;
    let newArray = [...array];

    for (let i = 0; i < n - 1; i++) {
      if (shouldStop.current) break;
      
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (shouldStop.current) break;
        
        // Compare bars
        updateBarStates([j, j + 1], { isComparing: true });
        await delay();

        if (newArray[j].value > newArray[j + 1].value) {
          // Swap values
          const temp = newArray[j].value;
          newArray[j].value = newArray[j + 1].value;
          newArray[j + 1].value = temp;
          setArray([...newArray]);
          
          // Show swapping animation
          updateBarStates([j, j + 1], { isSwapping: true });
          await delay();
          swapped = true;
        }
        
        // Reset states
        updateBarStates([j, j + 1], { isComparing: false, isSwapping: false });
      }

      if (!swapped) break;
    }

    setIsSorting(false);
  };

  // Insertion Sort Implementation
  const insertionSort = async () => {
    setIsSorting(true);
    shouldStop.current = false;
    let newArray = [...array];

    for (let i = 1; i < newArray.length; i++) {
      if (shouldStop.current) break;

      const current = newArray[i].value;
      let j = i - 1;

      // Highlight the current element being inserted
      updateBarStates([i], { isComparing: true });
      await delay();

      while (j >= 0 && newArray[j].value > current) {
        if (shouldStop.current) break;

        // Compare and swap
        updateBarStates([j, j + 1], { isComparing: true });
        await delay();

        // Move the larger element up
        newArray[j + 1].value = newArray[j].value;
        setArray([...newArray]);
        
        // Show swapping animation
        updateBarStates([j, j + 1], { isSwapping: true });
        await delay();
        
        j--;
      }

      // Place the current element in its correct position
      newArray[j + 1].value = current;
      setArray([...newArray]);

      // Reset states
      updateBarStates([j + 1], { isComparing: false, isSwapping: false });
    }

    setIsSorting(false);
  };

  // Merge Sort Implementation
  const merge = async (arr: BarState[], left: number, mid: number, right: number) => {
    const n1 = mid - left + 1;
    const n2 = right - mid;
    
    // Create temporary arrays with complete bar state
    const L: BarState[] = arr.slice(left, mid + 1).map(bar => ({ ...bar }));
    const R: BarState[] = arr.slice(mid + 1, right + 1).map(bar => ({ ...bar }));

    let i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
      if (shouldStop.current) return;
      
      // Highlight the elements being compared
      updateBarStates([left + i, mid + 1 + j], { isComparing: true });
      await delay();

      if (L[i].value <= R[j].value) {
        arr[k] = { ...L[i] };
        i++;
      } else {
        arr[k] = { ...R[j] };
        j++;
      }
      
      // Update the array state
      setArray([...arr]);
      updateBarStates([k], { isComparing: false });
      k++;
    }

    // Copy remaining elements of L[]
    while (i < n1) {
      if (shouldStop.current) return;
      arr[k] = { ...L[i] };
      setArray([...arr]);
      updateBarStates([k], { isComparing: false });
      i++;
      k++;
    }

    // Copy remaining elements of R[]
    while (j < n2) {
      if (shouldStop.current) return;
      arr[k] = { ...R[j] };
      setArray([...arr]);
      updateBarStates([k], { isComparing: false });
      j++;
      k++;
    }
  };

  const mergeSortHelper = async (arr: BarState[], left: number, right: number) => {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      
      // Visualize the division
      updateBarStates([left, right], { isComparing: true });
      await delay();
      updateBarStates([left, right], { isComparing: false });
      
      await mergeSortHelper(arr, left, mid);
      await mergeSortHelper(arr, mid + 1, right);
      await merge(arr, left, mid, right);
    }
  };

  const mergeSort = async () => {
    setIsSorting(true);
    shouldStop.current = false;
    const newArray = array.map(bar => ({ ...bar })); // Create a deep copy of the array
    await mergeSortHelper(newArray, 0, newArray.length - 1);
    setIsSorting(false);
  };

  // Quick Sort Implementation
  const partition = async (arr: BarState[], low: number, high: number) => {
    const pivot = arr[high].value;
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (shouldStop.current) return -1;

      updateBarStates([j, high], { isComparing: true });
      await delay();

      if (arr[j].value < pivot) {
        i++;
        // Swap values
        const temp = arr[i].value;
        arr[i].value = arr[j].value;
        arr[j].value = temp;
        setArray([...arr]);
        
        // Show swapping animation
        updateBarStates([i, j], { isSwapping: true });
        await delay();
      }
    }

    // Swap pivot
    const temp = arr[i + 1].value;
    arr[i + 1].value = arr[high].value;
    arr[high].value = temp;
    setArray([...arr]);
    
    // Show swapping animation
    updateBarStates([i + 1, high], { isSwapping: true });
    await delay();

    return i + 1;
  };

  const quickSortHelper = async (arr: BarState[], low: number, high: number) => {
    if (low < high) {
      const pi = await partition(arr, low, high);
      if (pi === -1) return;
      await quickSortHelper(arr, low, pi - 1);
      await quickSortHelper(arr, pi + 1, high);
    }
  };

  const quickSort = async () => {
    setIsSorting(true);
    shouldStop.current = false;
    const newArray = [...array];
    await quickSortHelper(newArray, 0, newArray.length - 1);
    setIsSorting(false);
  };

  const handleSort = () => {
    switch (selectedAlgorithm) {
      case 'bubble':
        bubbleSort();
        break;
      case 'insertion':
        insertionSort();
        break;
      case 'merge':
        mergeSort();
        break;
      case 'quick':
        quickSort();
        break;
    }
  };

  const handleStop = () => {
    shouldStop.current = true;
    setIsSorting(false);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseInt(e.target.value);
    setSpeed(newSpeed);
  };

  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlgorithm(e.target.value as SortingAlgorithm);
  };

  const generateNewArray = () => {
    const newArray = [];
    const numElements = Math.floor(Math.random() * (MAX_ELEMENTS - 10)) + 10; // Random number between 10 and MAX_ELEMENTS
    for (let i = 0; i < numElements; i++) {
      newArray.push(Math.floor(Math.random() * 100) + 1);
    }
    setArray(newArray.map(value => ({
      value,
      isComparing: false,
      isSwapping: false
    })));
    setError('');
  };

  const handleInputVector = () => {
    try {
      // Parse the input string into an array of numbers
      const numbers = inputVector.split(',')
        .map(num => num.trim())
        .filter(num => num !== '')
        .map(num => {
          const parsed = parseInt(num);
          if (isNaN(parsed)) {
            throw new Error('Invalid number in input');
          }
          if (parsed < 1 || parsed > 100) {
            throw new Error('Numbers must be between 1 and 100');
          }
          return parsed;
        });

      if (numbers.length === 0) {
        throw new Error('Please enter at least one number');
      }
      if (numbers.length > MAX_ELEMENTS) {
        throw new Error(`Maximum ${MAX_ELEMENTS} elements allowed`);
      }

      setArray(numbers.map(value => ({
        value,
        isComparing: false,
        isSwapping: false
      })));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-center text-blue-400">
            Sorting Algorithm Visualizer
          </h1>
          
          <div className="flex flex-col items-center gap-6">
            <div className="flex justify-center gap-4">
              <button
                onClick={resetArray}
                disabled={isSorting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
              >
                Generate New Array
              </button>
              {!isSorting ? (
                <button
                  onClick={handleSort}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-green-500/25"
                >
                  Sort
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
                  disabled={isSorting}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="bubble">Bubble Sort</option>
                  <option value="insertion">Insertion Sort</option>
                  <option value="merge">Merge Sort</option>
                  <option value="quick">Quick Sort</option>
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
                  disabled={isSorting}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
            </div>

            <div className="w-full max-w-md">
              <label htmlFor="inputVector" className="block text-sm font-medium text-gray-300 mb-2">
                Input Vector (comma-separated numbers, 1-100)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="inputVector"
                  value={inputVector}
                  onChange={(e) => setInputVector(e.target.value)}
                  placeholder="e.g., 45, 23, 67, 12, 89"
                  disabled={isSorting}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleInputVector}
                  disabled={isSorting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Apply
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
          <div className="flex items-end justify-center gap-2 h-[400px]">
            {array.map((bar, index) => (
              <div
                key={index}
                className={`w-8 bg-blue-500 rounded-t-lg transition-all duration-300 ease-in-out ${
                  bar.isComparing ? 'bg-yellow-500' : 
                  bar.isSwapping ? 'bg-red-500' : 
                  'bg-blue-500'
                }`}
                style={{
                  height: `${(bar.value / MAX_NUMBER) * 350}px`
                }}
              >
                <span className="text-xs text-white text-center block mt-1">{bar.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortingVisualizer; 