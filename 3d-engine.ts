type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type Triangle = {
  p: [Vec3, Vec3, Vec3];
  style?: string;
};

type Mesh = {
  tris: Triangle[];
};

type Matrix = {
  m: number[][];
};

function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

function triangle(v1: Vec3, v2: Vec3, v3: Vec3): Triangle {
  return { p: [v1, v2, v3] };
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
