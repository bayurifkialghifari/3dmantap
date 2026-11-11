import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { printTargetGeometry } from './projection';

test('front artwork excludes horizontal brim and back faces', () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [-1, -1, 0, 1, -1, 0, 0, 1, 0, -1, 0, 0, 0, 0, 1, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, -1, 0],
      3,
    ),
  );
  const prepared = printTargetGeometry(geometry, new THREE.Matrix4(), [0, 0, 0]);
  expect(Array.from(prepared.getIndex()!.array)).toEqual([0, 1, 2]);
  expect(geometry.getIndex()).toBeNull();
  const back = printTargetGeometry(geometry, new THREE.Matrix4(), [0, Math.PI, 0]);
  expect(Array.from(back.getIndex()!.array)).toEqual([6, 7, 8]);
  prepared.dispose();
  back.dispose();
  geometry.dispose();
});

test('quantized vertices are decoded before scaling and source data remains intact', () => {
  const geometry = new THREE.BufferGeometry();
  const raw = new Int16Array([-16384, -16384, 0, 16384, -16384, 0, 0, 16384, 0]);
  geometry.setAttribute('position', new THREE.BufferAttribute(raw, 3, true));
  const prepared = printTargetGeometry(
    geometry,
    new THREE.Matrix4().makeScale(0.2, 0.4, 0.1),
    [0, 0, 0],
  );
  expect(prepared.getAttribute('position').array).toBeInstanceOf(Float32Array);
  expect(prepared.getAttribute('position').getX(0)).toBeCloseTo(-0.1, 4);
  expect(prepared.getAttribute('position').getY(0)).toBeCloseTo(-0.2, 4);
  expect(Array.from(prepared.getIndex()!.array)).toEqual([0, 1, 2]);
  expect(geometry.getAttribute('position').array).toBe(raw);
  expect(raw[0]).toBe(-16384);
  prepared.dispose();
  geometry.dispose();
});
