export interface Node {
  row: number;
  col: number;
  isStart: boolean;
  isEnd: boolean;
  distance: number;
  isVisited: boolean;
  isWall: boolean;
  isBlock?: boolean;
  previousNode: Node | null;
  fScore?: number;
  isInPath?: boolean;
}

export const dijkstra = (grid: Node[][], startNode: Node, endNode: Node): Node[] => {
  const visitedNodes: Node[] = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);

  while (unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift()!;
    
    if (closestNode.isWall || closestNode.isBlock === true) continue;
    if (closestNode.distance === Infinity) return visitedNodes;
    
    closestNode.isVisited = true;
    visitedNodes.push(closestNode);
    
    if (closestNode === endNode) return visitedNodes;
    updateNeighbors(closestNode, grid);
  }
  
  return visitedNodes;
};

export const aStar = (grid: Node[][], startNode: Node, endNode: Node): Node[] => {
  const visitedNodes: Node[] = [];
  startNode.distance = 0;
  startNode.fScore = heuristic(startNode, endNode);
  const unvisitedNodes = getAllNodes(grid);

  while (unvisitedNodes.length) {
    sortNodesByFScore(unvisitedNodes);
    const closestNode = unvisitedNodes.shift()!;
    
    if (closestNode.isWall || closestNode.isBlock === true) continue;
    if (closestNode.distance === Infinity) return visitedNodes;
    
    closestNode.isVisited = true;
    visitedNodes.push(closestNode);
    
    if (closestNode === endNode) return visitedNodes;
    updateNeighborsAStar(closestNode, grid, endNode);
  }
  
  return visitedNodes;
};

const getAllNodes = (grid: Node[][]): Node[] => {
  const nodes: Node[] = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
};

const sortNodesByDistance = (unvisitedNodes: Node[]): void => {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
};

const sortNodesByFScore = (unvisitedNodes: Node[]): void => {
  unvisitedNodes.sort((nodeA, nodeB) => {
    const scoreA = nodeA.fScore ?? Infinity;
    const scoreB = nodeB.fScore ?? Infinity;
    return scoreA - scoreB;
  });
};

const updateNeighbors = (node: Node, grid: Node[][]): void => {
  const neighbors = getNeighbors(node, grid);
  for (const neighbor of neighbors) {
    neighbor.distance = node.distance + 1;
    neighbor.previousNode = node;
  }
};

const updateNeighborsAStar = (node: Node, grid: Node[][], endNode: Node): void => {
  const neighbors = getNeighbors(node, grid);
  for (const neighbor of neighbors) {
    const tentativeGScore = node.distance + 1;
    if (tentativeGScore < neighbor.distance) {
      neighbor.distance = tentativeGScore;
      neighbor.fScore = tentativeGScore + heuristic(neighbor, endNode);
      neighbor.previousNode = node;
    }
  }
};

const getNeighbors = (node: Node, grid: Node[][]): Node[] => {
  const neighbors: Node[] = [];
  const { row, col } = node;
  
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  
  return neighbors.filter(neighbor => !neighbor.isVisited);
};

const heuristic = (nodeA: Node, nodeB: Node): number => {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
};

export const getNodesInShortestPathOrder = (endNode: Node): Node[] => {
  const nodesInShortestPathOrder: Node[] = [];
  let currentNode: Node | null = endNode;
  
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  
  return nodesInShortestPathOrder;
}; 