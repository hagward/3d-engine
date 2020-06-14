class Vec3 {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Triangle {
  p: [Vec3, Vec3, Vec3];
  style?: string;

  constructor(p1: Vec3, p2: Vec3, p3: Vec3) {
    this.p = [p1, p2, p3];
  }
}

class Mesh {
  tris: Triangle[];

  constructor(tris: Triangle[]) {
    this.tris = tris;
  }
}

class Matrix {
  m: number[][];

  constructor(m: number[][]) {
    this.m = m;
  }
}

function createMatRotX(angle: number): Matrix {
  return new Matrix([
    [1, 0, 0, 0],
    [0, Math.cos(angle * 0.5), Math.sin(angle * 0.5), 0],
    [0, -Math.sin(angle * 0.5), Math.cos(angle * 0.5), 0],
    [0, 0, 0, 1],
  ]);
}

function createMatRotZ(angle: number): Matrix {
  return new Matrix([
    [Math.cos(angle), Math.sin(angle), 0, 0],
    [-Math.sin(angle), Math.cos(angle), 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]);
}

function createMatProj(
  fNear: number,
  fFar: number,
  fFov: number,
  fAspectRatio: number
): Matrix {
  return new Matrix([
    [fAspectRatio * fFov, 0, 0, 0],
    [0, fFov, 0, 0],
    [0, 0, fFar / (fFar - fNear), 1],
    [0, 0, (-fFar * fNear) / (fFar - fNear), 0],
  ]);
}

function multiplyMatrixVector(v: Vec3, m: Matrix): Vec3 {
  let x = v.x * m.m[0][0] + v.y * m.m[1][0] + v.z * m.m[2][0] + m.m[3][0];
  let y = v.x * m.m[0][1] + v.y * m.m[1][1] + v.z * m.m[2][1] + m.m[3][1];
  let z = v.x * m.m[0][2] + v.y * m.m[1][2] + v.z * m.m[2][2] + m.m[3][2];
  const w = v.x * m.m[0][3] + v.y * m.m[1][3] + v.z * m.m[2][3] + m.m[3][3];

  if (w !== 0) {
    x /= w;
    y /= w;
    z /= w;
  }

  return { x, y, z };
}

function normal(t: Triangle): Vec3 {
  const line1 = new Vec3(
    t.p[1].x - t.p[0].x,
    t.p[1].y - t.p[0].y,
    t.p[1].z - t.p[0].z
  );

  const line2 = new Vec3(
    t.p[2].x - t.p[0].x,
    t.p[2].y - t.p[0].y,
    t.p[2].z - t.p[0].z
  );

  const normal = crossProduct(line1, line2);
  const length = len(normal);
  normal.x /= length;
  normal.y /= length;
  normal.z /= length;

  return normal;
}

function crossProduct(v1: Vec3, v2: Vec3): Vec3 {
  return new Vec3(
    v1.y * v2.z - v1.z * v2.y,
    v1.z * v2.x - v1.x * v2.z,
    v1.x * v2.y - v1.y * v2.x
  );
}

function dotProduct(v1: Vec3, v2: Vec3): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function subtract(v1: Vec3, v2: Vec3): Vec3 {
  return new Vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
}

function len(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function drawTriangle(
  t: Triangle,
  ctx: CanvasRenderingContext2D,
  style = "black"
): void {
  ctx.strokeStyle = style;
  ctx.beginPath();
  ctx.moveTo(t.p[0].x, t.p[0].y);
  ctx.lineTo(t.p[1].x, t.p[1].y);
  ctx.lineTo(t.p[2].x, t.p[2].y);
  ctx.lineTo(t.p[0].x, t.p[0].y);
  ctx.stroke();
}

function fillTriangle(
  t: Triangle,
  ctx: CanvasRenderingContext2D,
  style = "white"
): void {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.moveTo(t.p[0].x, t.p[0].y);
  ctx.lineTo(t.p[1].x, t.p[1].y);
  ctx.lineTo(t.p[2].x, t.p[2].y);
  ctx.lineTo(t.p[0].x, t.p[0].y);
  ctx.fill();
}
