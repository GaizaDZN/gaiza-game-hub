import * as THREE from "three";

export function RandRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function RandFromStringArr(arr: string[]): string {
  const max = arr.length;
  const min = 0;
  return arr[Math.random() * (max - min) + min];
}

// Places the mesh at a random position within the viewport bounds.
export function RandMeshPosition(
  ref: React.RefObject<
    THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  >,
  viewportWidth: number,
  viewportHeight: number
) {
  if (ref.current) {
    ref.current.position.set(
      RandRange((-viewportWidth / 2) * 0.9, viewportWidth),
      RandRange(-viewportHeight / 2, viewportHeight / 2),
      0
    );
  }
}

// Animates a mesh toward the left side of the viewport.
export function DriftLeft(
  ref: React.RefObject<
    THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  >,
  velocity: number,
  viewportWidth: number,
  viewportHeight: number,
  meshSize: number
) {
  if (ref.current) {
    ref.current.position.x -= velocity;

    // Reset when out of view
    if (ref.current.position.x < -viewportWidth / 2) {
      ref.current.position.set(
        viewportWidth / 2 + meshSize,
        RandRange(-viewportHeight / 2, viewportHeight / 2),
        0
      );
    }
  }
}

export function generateRandomId() {
  return `${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
}

export function stringToLines(str: string, charsPerLine: number): string[] {
  const lines: string[] = [];
  let start = 0;
  let end = charsPerLine;

  while (start < str.length) {
    let slice = str.slice(start, end);

    // If we hit a newline character, push the slice up to the newline
    if (slice.includes("\n")) {
      end = start + slice.indexOf("\n") + 1;
      slice = str.slice(start, end);
    } else if (
      end < str.length &&
      /\S/.test(str[end]) &&
      /\S/.test(str[end - 1])
    ) {
      // Otherwise, check if the slice ends with a partial word
      const lastSpace = str.lastIndexOf(" ", end);
      if (lastSpace > start) {
        end = lastSpace;
        slice = str.slice(start, end);
      }
    }

    lines.push(slice);

    // Move to the next slice
    start = end;
    end = start + charsPerLine;
  }

  return lines;
}

export function intervalElapsed(
  currentTime: number,
  lastTime: number,
  intervalTime: number
): boolean {
  return currentTime - lastTime > intervalTime;
}

export function scaleByPosition(
  ref: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.Material | THREE.Material[],
    THREE.Object3DEventMap
  >,
  scaleAdjustment: number
): void {
  ref.scale.set(scaleAdjustment, scaleAdjustment, scaleAdjustment);
}

export function fireRateElapsed(
  currentTime: number,
  lastBulletTime: number,
  bulletInterval: number
): boolean {
  return currentTime - lastBulletTime > bulletInterval;
}
