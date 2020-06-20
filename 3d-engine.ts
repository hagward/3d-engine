export class Vec3 {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = 1;
  }

  get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  mul(k: number): Vec3 {
    return new Vec3(this.x * k, this.y * k, this.z * k);
  }

  div(k: number): Vec3 {
    return new Vec3(this.x / k, this.y / k, this.z / k);
  }

  crossProduct(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  dotProduct(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  normalize(): Vec3 {
    const l = this.length;
    return new Vec3(this.x / l, this.y / l, this.z / l);
  }
}

export class Triangle {
  p: [Vec3, Vec3, Vec3];
  style?: string;

  constructor(p1: Vec3, p2: Vec3, p3: Vec3) {
    this.p = [p1, p2, p3];
  }

  get normal(): Vec3 {
    const line1 = this.p[1].sub(this.p[0]);
    const line2 = this.p[2].sub(this.p[0]);
    return line1.crossProduct(line2).normalize();
  }
}

export class Mesh {
  tris: Triangle[];

  constructor(tris: Triangle[]) {
    this.tris = tris;
  }
}

export class Matrix {
  m: number[][];

  constructor(m: number[][]) {
    this.m = m;
  }

  static identity(): Matrix {
    return new Matrix([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]);
  }

  static rotationX(angle: number): Matrix {
    return new Matrix([
      [1, 0, 0, 0],
      [0, Math.cos(angle), Math.sin(angle), 0],
      [0, -Math.sin(angle), Math.cos(angle), 0],
      [0, 0, 0, 1],
    ]);
  }

  static rotationY(angle: number): Matrix {
    return new Matrix([
      [Math.cos(angle), 0, Math.sin(angle), 0],
      [0, 1, 0, 0],
      [-Math.sin(angle), 0, Math.cos(angle), 0],
      [0, 0, 0, 1],
    ]);
  }

  static rotationZ(angle: number): Matrix {
    return new Matrix([
      [Math.cos(angle), Math.sin(angle), 0, 0],
      [-Math.sin(angle), Math.cos(angle), 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]);
  }

  static projection(
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

  static translation(x: number, y: number, z: number): Matrix {
    return new Matrix([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [x, y, z, 1],
    ]);
  }

  mulVec(v: Vec3): Vec3 {
    const m = this.m;
    const x = v.x * m[0][0] + v.y * m[1][0] + v.z * m[2][0] + v.w * m[3][0];
    const y = v.x * m[0][1] + v.y * m[1][1] + v.z * m[2][1] + v.w * m[3][1];
    const z = v.x * m[0][2] + v.y * m[1][2] + v.z * m[2][2] + v.w * m[3][2];
    const w = v.x * m[0][3] + v.y * m[1][3] + v.z * m[2][3] + v.w * m[3][3];

    const result = new Vec3(x, y, z);
    result.w = w;
    return result;
  }

  mulMat(mat: Matrix): Matrix {
    const m1 = this.m;
    const m2 = mat.m;
    const result: number[][] = [];

    if (m1[0].length !== m2.length) {
      throw new Error("Columns and rows do not match");
    }

    for (let i = 0; i < m1.length; i++) {
      result.push([]);
      for (let j = 0; j < m2[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < m1[0].length; k++) {
          sum += m1[i][k] * m2[k][j];
        }
        result[i].push(sum);
      }
    }

    return new Matrix(result);
  }
}

export function drawTriangle(
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

export function fillTriangle(
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
