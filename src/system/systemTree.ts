/**
 * Maintains a view of the local actor tree
 */

import {
  INode,
  ISystemTree,
  ITree,
} from './systemTree.d';

export class SystemTree implements ISystemTree {

  private tree: ITree = {};

  public nodeExists(path: string): INode | null {
    return TreeUtils.getNode(path, this.tree);
  }

}

/**
 * Utility methods for dealing with the SystemTree
 */
export class TreeUtils {

  /**
   * Expand a given path into an array
   * @param {string} path - The fully formed path
   * @return {Array<string>} - The broken out path
   */
  public static expandPath(path: string): Array<string> {
    return path.split('/');
  }

  /**
   * Return the head of a given path
   * @param {string} path - The fully formed path
   * @return {string} - The head of the current path
   */
  public static pathHead(path: string): string {
    return TreeUtils.expandPath(path)[0];
  }

  /**
   * Pop the head of a path off and return the new path
   * @param {string} path - The fully formed path
   * @return {string} - The new path
   */
  public static popPath(path: string): string {
    const expandedPath: Array<string> = TreeUtils.expandPath(path);
    return expandedPath.length > 1 ? expandedPath.slice(1).join('/') : expandedPath[0];
  }

  /**
   * Find a node in the tree for the given path, if any exists recursively
   * @param {string} path - The fully formed path
   * @param {ITree} tree - The tree to search
   * @param {?string} pathHead - Current path head based on the given path
   * @return {INode | null} - The found Node or null if none exists
   */
  public static getNode(
    path: string, // system/singleton
    tree: ITree,
    pathHead: string = TreeUtils.pathHead(path), // system
  ): INode | null {
    if (
      tree[pathHead] &&
      path === pathHead
    ) {
      return tree[pathHead];
    } else if (
      tree[pathHead] &&
      tree[pathHead].children
    ) {
      return TreeUtils.getNode(
        TreeUtils.popPath(path),
        tree[pathHead].children,
      );
    } else { return null; }
  }

  /**
   * Add a node to the tree for a given path
   * @param {string} path - The fully formed path for the new node
   * @param {ITree} tree - The tree to add to
   * @param {INode} node - The node to add to the tree
   * @param {?string} pathHead - Current path head based on given path
   * @return {ITree} - A new tree with the node added at the specified path
   */
  public static addNode(
    path: string,
    tree: ITree,
    node: INode,
    pathHead: string = TreeUtils.pathHead(path), // system
  ): ITree {
    if (path === pathHead) {
      return {
        ...tree,
        [pathHead]: Object.freeze(node),
      };
    } else if (
      tree[pathHead] &&
      tree[pathHead].children
    ) {
      return {
        ...tree,
        [pathHead]: {
          ...tree[pathHead],
          children: TreeUtils.addNode(
            TreeUtils.popPath(path),
            tree[pathHead].children,
            node,
          ),
        },
      };
    } else { return tree; }
  }

  /**
   * Remove a node from a given tree for a given path and return the new tree
   * @param {string} path - The path of the node to remove
   * @param {ITree} tree - The tree to remove from
   * @param {?string} pathHead - Current path head based on given path
   * @return {ITree} - A new tree with the node added at the specified path
   */
  public static removeNode(
    path: string,
    tree: ITree,
    pathHead: string = TreeUtils.pathHead(path),
  ): ITree {
    if (path === pathHead) {
      const { [pathHead]: removalNode, ...rest } = tree;
      return rest;
    } else if (
      tree[pathHead] &&
      tree[pathHead].children
    ) {
      return {
        ...tree,
        [pathHead]: {
          ...tree[pathHead],
          children: TreeUtils.removeNode(
            TreeUtils.popPath(path),
            tree[pathHead].children,
          ),
        },
      };
    } else { return tree; }
  }
}
