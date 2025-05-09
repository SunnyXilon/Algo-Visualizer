# Algorithm Visualizer

An interactive web application built with React and TypeScript that visualizes various algorithms, including pathfinding and sorting algorithms. This tool helps users understand how different algorithms work by providing visual representations of their operation.

## Features

### Pathfinding Algorithms
- Dijkstra's Algorithm
- A* Search
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Interactive grid with:
  - Wall placement (click and drag)
  - Adjustable start and end points
  - Visual representation of visited nodes and final path

### Sorting Algorithms
- Bubble Sort
- Insertion Sort
- Merge Sort
- Quick Sort
- Features:
  - Random array generation
  - Custom array input
  - Visual representation of comparisons and swaps
  - Adjustable array size and speed

### Common Features
- Adjustable visualization speed
- Clear and intuitive user interface
- Real-time visualization
- Stop/Reset functionality

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser

## Usage

### Pathfinding Visualizer
1. Select a pathfinding algorithm from the dropdown menu
2. Use the wall tool to create obstacles (click and drag)
3. Optionally reposition start (green) and end (red) points
4. Click "Visualize" to see the algorithm in action
5. Adjust the speed slider to control visualization speed
6. Use "Clear Walls" to remove obstacles or "Reset Grid" to start over

### Sorting Visualizer
1. Select a sorting algorithm from the dropdown menu
2. Either:
   - Click "Generate New Array" for a random array
   - Or input your own comma-separated numbers
3. Click "Sort" to start the visualization
4. Adjust the speed slider to control visualization speed
5. Use "Stop" to pause the visualization

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Cursor AI
