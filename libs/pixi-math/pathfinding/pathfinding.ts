import Vector from '../../pixi-component/utils/vector';
import Queue from '../structs/queue';
import PriorityQueue from '../structs/priority-queue';
import { GridMap } from '../structs/gridmap';

/**
 * Context object for pathfinding algorithm
 */
export class PathFinderContext {
  // map with steps from start to goal
  cameFrom = new Map<number, Vector>();
  // set of all visited nodes
  visited = new Set<number>();
  // output entity
  pathFound = new Array<Vector>();
}

class Pair<A, B> {
  first: A;
  second: B;
  constructor(first: A, second: B) {
    this.first = first;
    this.second = second;
  }
}

export abstract class PathFinder {

  /**
   * Tries to find a path from start to goal
   * @param grid map grid
   * @param start first point
   * @param goal final point
   * @param outputCtx output structure, contains path found so-far if there is no direct path
   * @return true if the path has been found
   */
  abstract search(grid: GridMap, start: Vector, goal: Vector, outputCtx: PathFinderContext): boolean;

  protected calcPathFromSteps(start: Vector, goal: Vector, steps: Map<number, Vector>, mapWidth: number): Array<Vector> {
    let current = goal;
    let output = new Array<Vector>();
    output.push(current);
    while (!current.equals(start)) {
      current = steps.get(this.indexMapper(current, mapWidth));
      output.push(current);
    }
    // reverse path so the starting position will be at the first place
    output = output.reverse();
    return output;
  }

  /**
   * Transforms vector to a unique number, must know the width of the map
   */
  protected indexMapper = (vec: Vector, mapWidth: number) => {
    return vec.y * mapWidth + vec.x;
  }
}

export class BreadthFirstSearch extends PathFinder {
  search(grid: GridMap, start: Vector, goal: Vector, outputCtx: PathFinderContext): boolean {
    let frontier = new Queue<Vector>();
    frontier.add(start);

    outputCtx.cameFrom.set(this.indexMapper(start, grid.width), start);

    while (!frontier.isEmpty()) {
      let current = frontier.peek();
      outputCtx.visited.add(this.indexMapper(current, grid.width));

      frontier.dequeue();

      if (current.equals(goal)) {
        // the goal was achieved
        outputCtx.pathFound = this.calcPathFromSteps(start, goal, outputCtx.cameFrom, grid.width);
        return true;
      }

      // get neighbors of the current grid block
      let neighbors = grid.getNeighbors(current);

      for (let next of neighbors) {
        if (!outputCtx.cameFrom.has(this.indexMapper(next, grid.width))) {
          frontier.enqueue(next);
          outputCtx.cameFrom.set(this.indexMapper(next, grid.width), current);
        }
      }
    }
    return false;
  }
}


export class Dijkstra extends PathFinder {
  search(grid: GridMap, start: Vector, goal: Vector, outputCtx: PathFinderContext): boolean {
    // initialize priority queue, using GREATER comparator
    let frontier = new PriorityQueue<Pair<Vector, number>>((itemA, itemB) => {
      if (itemA.second === itemB.second) {
        return 0;
      }
      return itemA.second < itemB.second ? 1 : -1;
    });

    let costSoFar = new Map<number, number>();

    // start with the first position
    frontier.enqueue(new Pair<Vector, number>(start, 0));
    outputCtx.cameFrom.set(this.indexMapper(start, grid.width), start);
    costSoFar.set(this.indexMapper(start, grid.width), 0);

    while (!frontier.isEmpty()) {
      let current = frontier.dequeue();
      outputCtx.visited.add(this.indexMapper(current.first, grid.width));
      if (current.first.equals(goal)) {
        // the goal was achieved
        outputCtx.pathFound = this.calcPathFromSteps(start, goal, outputCtx.cameFrom, grid.width);
        return true;
      }

      // get neighbors of the current grid block
      let neighbors = grid.getNeighbors(current.first);

      for (let next of neighbors) {
        let newCost = costSoFar.get(this.indexMapper(current.first, grid.width)) + grid.getCost(current.first, next);
        if (!costSoFar.has(this.indexMapper(next, grid.width)) || newCost < costSoFar.get(this.indexMapper(next, grid.width))) {
          costSoFar.set(this.indexMapper(next, grid.width), newCost);
          outputCtx.cameFrom.set(this.indexMapper(next, grid.width), current.first);
          frontier.add(new Pair<Vector, number>(next, newCost));
        }
      }
    }

    return false;
  }
}

export class AStarSearch extends PathFinder {

  search(grid: GridMap, start: Vector, goal: Vector, outputCtx: PathFinderContext, distanceMeasurement: 'manhattan' | 'euclidean' = 'manhattan', heuristics?: (cost:number, distance:number) => number): boolean {
    // initialize priority queue, using GREATER comparator
    let frontier = new PriorityQueue<Pair<Vector, number>>((itemA, itemB) => {
      if (itemA.second === itemB.second) {
        return 0;
      }
      return itemA.second < itemB.second ? 1 : -1;
    });

    let costSoFar = new Map<number, number>();

    // start with the first position
    frontier.enqueue(new Pair<Vector, number>(start, 0));
    outputCtx.cameFrom.set(this.indexMapper(start, grid.width), start);
    costSoFar.set(this.indexMapper(start, grid.width), 0);

    while (!frontier.isEmpty()) {
      let current = frontier.dequeue();
      outputCtx.visited.add(this.indexMapper(current.first, grid.width));
      if (current.first.equals(goal)) {
        // the goal was achieved
        outputCtx.pathFound = this.calcPathFromSteps(start, goal, outputCtx.cameFrom, grid.width);
        return true;
      }

      // get neighbors of the current grid block
      let neighbors = grid.getNeighbors(current.first);

      // explore neighbors
      for (let next of neighbors) {
        // calculate the increment of the cost on the current path
        let newCost = costSoFar.get(this.indexMapper(current.first, grid.width)) + grid.getCost(current.first, next);
        // verify if there was a better way
        if (!costSoFar.has(this.indexMapper(next, grid.width)) || newCost < costSoFar.get(this.indexMapper(next, grid.width))) {
          costSoFar.set(this.indexMapper(next, grid.width), newCost);

          // priority is price + distance between next position and the target
          let distance = distanceMeasurement === 'manhattan' ? next.manhattanDistance(goal) : next.distance(goal);
          let priority = heuristics ? heuristics(newCost, distance) :  (newCost + distance);

          outputCtx.cameFrom.set(this.indexMapper(next, grid.width), current.first);
          frontier.add(new Pair<Vector, number>(next, priority));
        }
      }
    }

    return false;
  }
}