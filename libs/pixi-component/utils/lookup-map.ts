
interface Lookable {
  id;
}

/**
 * Accelerating structure for sorting items by two attributes
 */
export class LookupMap<K, T extends Lookable> {
  private items: Map<K, Map<number, T>> = new Map();
  private itemKeys: Map<number, Set<K>> = new Map(); // helper for faster inverted search

  public insert(key: K, item: T): boolean {
    if(!this.items.has(key)) {
      this.items.set(key, new Map());
    }

    if(this.items.get(key).has(item.id)) {
      return false; // already is in the collection
    }

    this.items.get(key).set(item.id, item);

    // add into helper collection as well
    if(!this.itemKeys.has(item.id)) {
      this.itemKeys.set(item.id, new Set());
    }
    this.itemKeys.get(item.id).add(key);

    return true;
  }

  public remove(key: K, item: T): boolean {
    this.itemKeys.delete(item.id);

    if(this.items.has(key)) {
      this.items.get(key).delete(item.id);
      if(this.items.get(key).size === 0) {
        this.items.delete(key);
      }
      return true;
    }
    return false;
  }

  public removeItem(item: T) {
    if(this.itemKeys.has(item.id)) {
      for(let entry of this.itemKeys.get(item.id)) {
        this.remove(entry, item);
      }
      this.itemKeys.delete(item.id);
    }
  }

  public findFirst(key: K): T {
    if(this.items.has(key)) {
      return this.items.get(key).values().next().value;
    }
    return null;
  }

  public findAll(key: K): T[] {
    if(this.items.has(key)) {
      return [...this.items.get(key).values()];
    }
    return [];
  }

  public clear() {
    this.items.clear();
    this.itemKeys.clear();
  }
}