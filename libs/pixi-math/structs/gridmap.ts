import Vector from '../../pixi-component/utils/vector';

export const MAP_TYPE_TILE = 1;
export const MAP_TYPE_OCTILE = 2;

/**
 * Grid-based map for searching algorithms
 */
export class GridMap {
  // grid size
  width = 0;
  height = 0;
  // places that can't be crossed
  obstructions = new Set<number>();
  // elevations of map blocks
  elevations = new Map<number, number>();
  mapType = MAP_TYPE_TILE;
  maxElevation = 1;
  defaultElevation = 1;

  constructor(mapType: number, maxElevation: number, width: number, height: number) {
    this.mapType = mapType;
    this.maxElevation = maxElevation;
    this.width = width;
    this.height = height;
  }

  /**
   * We can't use Vector structure for hashmaps - this mapper only maps Vector into indices based on
   * the size of the map
   */
  indexMapper = (pos: Vector) => { return pos.y * this.width + pos.x; };


  /**
   * Returns true, if there is an obstruction in given location
   */
  hasObstruction(pos: Vector): boolean {
    return this.obstructions.has(this.indexMapper(pos));
  }

  notInside(pos: Vector): boolean {
    return pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y >= this.height;
  }

  /**
   * Gets elevation by given location
   */
  getElevation(pos: Vector): number {
    let index = this.indexMapper(pos);
    if (!this.elevations.has(index)) {
      return this.defaultElevation;
    }
    return this.elevations.get(this.indexMapper(pos));
  }

  /**
   * Sets elevation
   * @param pos location of the elevation (target block)
   * @param cost cost of "approaching that block"
   */
  setElevation(pos: Vector, cost: number) {
    this.elevations.set(this.indexMapper(pos), cost);
  }

  addObstruction(pos: Vector) {
    this.obstructions.add(this.indexMapper(pos));
  }

  removeObstruction(pos: Vector) {
    this.obstructions.delete(this.indexMapper(pos));
  }

  getCost(from: Vector, to: Vector): number {
    // gets cost from point A to point B
    // let's assume the cost is the same for all blocks that surround given block (described by 'from')
    return this.elevations.has(this.indexMapper(from)) ? this.elevations.get(this.indexMapper(from)) : this.defaultElevation;
    // uncomment those lines to get elevation relative to the direction
    //let elevationFrom = this.elevations.has(this.indexMapper(from)) ? this.elevations.get(this.indexMapper(from)) : this.defaultElevation;
    //let elevationTo = this.elevations.has(this.indexMapper(to)) ? this.elevations.get(this.indexMapper(to)) : this.defaultElevation;
    //return elevationTo - elevationFrom;
  }

  /**
   * Gets all surrounding blocks
   */
  getNeighbors(pos: Vector): Array<Vector> {
    let output = new Array<Vector>();

    if (this.mapType === MAP_TYPE_TILE) {
      let n1 = new Vector(pos.x - 1, pos.y);
      let n2 = new Vector(pos.x + 1, pos.y);
      let n3 = new Vector(pos.x, pos.y - 1);
      let n4 = new Vector(pos.x, pos.y + 1);

      if (this.isInside(n1) && !this.obstructions.has(this.indexMapper(n1))) { output.push(n1); }
      if (this.isInside(n2) && !this.obstructions.has(this.indexMapper(n2))) { output.push(n2); }
      if (this.isInside(n3) && !this.obstructions.has(this.indexMapper(n3))) { output.push(n3); }
      if (this.isInside(n4) && !this.obstructions.has(this.indexMapper(n4))) { output.push(n4); }
    } else if (this.mapType === MAP_TYPE_OCTILE) {
      let west = new Vector(pos.x - 1, pos.y);
      let east = new Vector(pos.x + 1, pos.y);
      let north = new Vector(pos.x, pos.y - 1);
      let south = new Vector(pos.x, pos.y + 1);
      let northWest = new Vector(pos.x - 1, pos.y - 1);
      let southEast = new Vector(pos.x + 1, pos.y + 1);
      let northEast = new Vector(pos.x + 1, pos.y - 1);
      let southWest = new Vector(pos.x - 1, pos.y + 1);

      if (this.isInside(west) && !this.obstructions.has(this.indexMapper(west))) { output.push(west); }
      if (this.isInside(east) && !this.obstructions.has(this.indexMapper(east))) { output.push(east); }
      if (this.isInside(north) && !this.obstructions.has(this.indexMapper(north))) { output.push(north); }
      if (this.isInside(south) && !this.obstructions.has(this.indexMapper(south))) { output.push(south); }
      if (this.isInside(northWest) && !this.obstructions.has(this.indexMapper(northWest))) { output.push(northWest); }
      if (this.isInside(southEast) && !this.obstructions.has(this.indexMapper(southEast))) { output.push(southEast); }
      if (this.isInside(northEast) && !this.obstructions.has(this.indexMapper(northEast))) { output.push(northEast); }
      if (this.isInside(southWest) && !this.obstructions.has(this.indexMapper(southWest))) { output.push(southWest); }
    }

    return output;
  }

  private isInside(pos: Vector): boolean {
    return 0 <= pos.x && pos.x < this.width && 0 <= pos.y && pos.y < this.height;
  }
}