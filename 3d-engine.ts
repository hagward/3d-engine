export class Vec3D {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number, y: number, z: number, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  add(v: Vec3D): Vec3D {
    return new Vec3D(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v: Vec3D): Vec3D {
    return new Vec3D(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(k: number): Vec3D {
    return new Vec3D(this.x * k, this.y * k, this.z * k);
  }

  divide(k: number): Vec3D {
    return new Vec3D(this.x / k, this.y / k, this.z / k);
  }

  crossProduct(v: Vec3D): Vec3D {
    return new Vec3D(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  dotProduct(v: Vec3D): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  normalize(): Vec3D {
    const l = this.length;
    return new Vec3D(this.x / l, this.y / l, this.z / l);
  }
}

export class Triangle {
  p: [Vec3D, Vec3D, Vec3D];
  style?: string;

  constructor(p1: Vec3D, p2: Vec3D, p3: Vec3D) {
    this.p = [p1, p2, p3];
  }

  get normal(): Vec3D {
    const line1 = this.p[1].subtract(this.p[0]);
    const line2 = this.p[2].subtract(this.p[0]);
    return line1.crossProduct(line2).normalize();
  }
}

export class Mesh {
  tris: Triangle[];

  constructor(tris: Triangle[]) {
    this.tris = tris;
  }
}

export class Mat4 {
  m: number[][];

  constructor(m: number[][]) {
    if (m.length !== 4 || m[0].length !== 4) {
      throw new Error("Not a 4x4 matrix");
    }

    this.m = m;
  }

  multiplyVector(v: Vec3D): Vec3D {
    const m = this.m;
    const x = v.x * m[0][0] + v.y * m[1][0] + v.z * m[2][0] + v.w * m[3][0];
    const y = v.x * m[0][1] + v.y * m[1][1] + v.z * m[2][1] + v.w * m[3][1];
    const z = v.x * m[0][2] + v.y * m[1][2] + v.z * m[2][2] + v.w * m[3][2];
    const w = v.x * m[0][3] + v.y * m[1][3] + v.z * m[2][3] + v.w * m[3][3];

    const result = new Vec3D(x, y, z);
    result.w = w;
    return result;
  }

  multiplyMatrix(mat: Mat4): Mat4 {
    const m1 = this.m;
    const m2 = mat.m;
    const result: number[][] = [];

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

    return new Mat4(result);
  }

  quickInverse(): Mat4 {
    const m = this.m;
    const matrix = new Mat4([
      [m[0][0], m[1][0], m[2][0], 0],
      [m[0][1], m[1][1], m[2][1], 0],
      [m[0][2], m[1][2], m[2][2], 0],
      [0, 0, 0, 1],
    ]);
    matrix.m[3][0] = -(
      m[3][0] * matrix.m[0][0] +
      m[3][1] * matrix.m[1][0] +
      m[3][2] * matrix.m[2][0]
    );
    matrix.m[3][1] = -(
      m[3][0] * matrix.m[0][1] +
      m[3][1] * matrix.m[1][1] +
      m[3][2] * matrix.m[2][1]
    );
    matrix.m[3][2] = -(
      m[3][0] * matrix.m[0][2] +
      m[3][1] * matrix.m[1][2] +
      m[3][2] * matrix.m[2][2]
    );
    return matrix;
  }
}

export function rotateXMatrix(angle: number): Mat4 {
  return new Mat4([
    [1, 0, 0, 0],
    [0, Math.cos(angle), Math.sin(angle), 0],
    [0, -Math.sin(angle), Math.cos(angle), 0],
    [0, 0, 0, 1],
  ]);
}

export function rotateYMatrix(angle: number): Mat4 {
  return new Mat4([
    [Math.cos(angle), 0, Math.sin(angle), 0],
    [0, 1, 0, 0],
    [-Math.sin(angle), 0, Math.cos(angle), 0],
    [0, 0, 0, 1],
  ]);
}

export function rotateZMatrix(angle: number): Mat4 {
  return new Mat4([
    [Math.cos(angle), Math.sin(angle), 0, 0],
    [-Math.sin(angle), Math.cos(angle), 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]);
}

export function perspectiveMatrix(
  fFov: number,
  fAspectRatio: number,
  fNear: number,
  fFar: number
): Mat4 {
  return new Mat4([
    [fAspectRatio * fFov, 0, 0, 0],
    [0, fFov, 0, 0],
    [0, 0, fFar / (fFar - fNear), 1],
    [0, 0, (-fFar * fNear) / (fFar - fNear), 0],
  ]);
}

export function translateMatrix(x: number, y: number, z: number): Mat4 {
  return new Mat4([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [x, y, z, 1],
  ]);
}

export function pointAtMatrix(pos: Vec3D, target: Vec3D, up: Vec3D): Mat4 {
  // Calculate new forward direction.
  const newForward = target.subtract(pos).normalize();

  // Calculate the new up direction.
  const a = newForward.multiply(up.dotProduct(newForward));
  const newUp = up.subtract(a).normalize();

  // Calculate new right direction.
  const newRight = newUp.crossProduct(newForward);

  // Construct dimensioning and translation matrix.
  return new Mat4([
    [newRight.x, newRight.y, newRight.z, 0],
    [newUp.x, newUp.y, newUp.z, 0],
    [newForward.x, newForward.y, newForward.z, 0],
    [pos.x, pos.y, pos.z, 1],
  ]);
}
