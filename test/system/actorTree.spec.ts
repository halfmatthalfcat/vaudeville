/**
 * Tests for the system tree
 */

import { Observable } from 'rxjs/Observable';

import { TreeUtils } from '../../src/system/actorTree';
import { INode, ITree } from '../../src/system/actorTree.d';

describe('ActorTree', () => {

  describe('TreeUtils', () => {

    let complexTree: ITree = {};

    beforeEach(() => complexTree = {
      system: {
        children: {
          singleton: {
            children: {},
            mailbox: new Observable<{}>(),
            thread: '2345',
          },
          stats: {
            children: {},
            mailbox: new Observable<{}>(),
            thread: '2345',
          },
        },
        mailbox: new Observable<{}>(),
        thread: '2345',
      },
      user: {
        children: {
          http: {
            children: {},
            mailbox: new Observable<{}>(),
            thread: '2345',
          },
        },
        mailbox: new Observable<{}>(),
        thread: '3457',
      },
    });

    describe('expandPath', () => {

      it('should split a path with forward slashes', () => {
        const path: string = 'hello/world/path';
        const expandedPath: Array<string> = TreeUtils.expandPath(path);

        expect(expandedPath.length).toEqual(3);
      });

      it('should return return the whole path if there are no forward slashes', () => {
        const path: string = 'path';
        const expandedPath: Array<string> = TreeUtils.expandPath(path);

        expect(expandedPath.length).toEqual(1);
        expect(expandedPath[0]).toEqual(path);
      });

    });

    describe('pathHead', () => {

      it('should return the first path element in a given path', () => {
        const path: string = 'hello/world/path';
        const pathHead: string = TreeUtils.pathHead(path);

        expect(pathHead).toEqual('hello');
      });

      it('should return the whole path if there are no forward slashes', () => {
        const path: string = 'path';
        const pathHead: string = TreeUtils.pathHead(path);

        expect(pathHead).toEqual('path');
      });

    });

    describe('popPath', () => {

      it('should pop the first path element and return the remaining path', () => {
        const path: string = 'hello/world/path';
        const newPath: string = TreeUtils.popPath(path);

        expect(newPath).toEqual('world/path');
      });

      it('should return the whole path if there are no forward slashes', () => {
        const path: string = 'path';
        const newPath: string = TreeUtils.popPath(path);

        expect(newPath).toEqual(path);
      });

    });

    describe('getNode', () => {

      it('should find a first level node', () => {
        const path: string = 'system';
        const node: INode | null = TreeUtils.getNode(path, complexTree);

        expect(node).not.toBeNull();
      });

      it('should find a second level node', () => {
        const path: string = 'system/singleton';
        const node: INode | null = TreeUtils.getNode(path, complexTree);

        expect(node).not.toBeNull();
      });

      it('should return null if no node is found, first level', () => {
        const path: string = 'null';
        const node: INode | null = TreeUtils.getNode(path, complexTree);

        expect(node).toBeNull();
      });

      it('should return null if no node is found, second level', () => {
        const path: string = 'system/null';
        const node: INode | null = TreeUtils.getNode(path, complexTree);

        expect(node).toBeNull();
      });

    });

    describe('addNode', () => {

      it('should add a node to an empty tree', () => {

        const newTree: ITree = TreeUtils.addNode(
          'system',
          {},
          { thread: '1234', children: {}, mailbox: new Observable<{}>() },
        );

        expect(newTree).toBeDefined();
        expect(newTree.hasOwnProperty('system')).toBeTruthy();

      });

      it('should add a node to an existing tree path', () => {

        const newTree: ITree = TreeUtils.addNode(
          'system',
          {},
          { thread: '1234', children: {}, mailbox: new Observable<{}>() },
        );

        const newerTree: ITree = TreeUtils.addNode(
          'system/child',
          newTree,
          { thread: '1234', children: {}, mailbox: new Observable<{}>() },
        );

        expect(newerTree).toBeDefined();
        expect(TreeUtils.getNode('system/child', newerTree)).not.toBeNull();

      });

      it('should add a node to a complex tree', () => {

        const newTree: ITree = TreeUtils.addNode(
          'user/http/worker',
          complexTree,
          { thread: '1234', children: {}, mailbox: new Observable<{}>() },
        );

        expect(newTree).toBeDefined();
        expect(TreeUtils.getNode('user/http/worker', newTree)).not.toBeNull();
        expect(TreeUtils.getNode('system/singleton', newTree)).not.toBeNull();

      });

    });

    describe('removeNode', () => {

      it('should remove a node from a complex tree', () => {

        const newTree: ITree = TreeUtils.removeNode(
          'system/singleton',
          complexTree,
        );

        expect(newTree).toBeDefined();
        expect(TreeUtils.getNode('system/singleton', newTree)).toBeNull();

      });

      it('should return the same tree if node not found', () => {

        const newTree: ITree = TreeUtils.removeNode(
          'null',
          complexTree,
        );

        expect(newTree).toBeDefined();
        expect(newTree).toEqual(complexTree);

      });

    });

  });

});
