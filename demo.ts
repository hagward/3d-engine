import {
  Triangle,
  createMatProj,
  Vec3,
  Mesh,
  createMatRotZ,
  createMatRotX,
  multiplyMatrixVector,
  normal,
  dotProduct,
  subtract,
  len,
  fillTriangle,
} from "./3d-engine.js";

const canvas = document.getElementById("c") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const fNear = 0.1;
const fFar = 1000;
const fFov = Math.PI / 2;
const fAspectRatio = canvas.height / canvas.width;

const matProj = createMatProj(fNear, fFar, fFov, fAspectRatio);
const vCamera = new Vec3(0, 0, 0);

let angle = 0;
let mesh: Mesh | null = null;

function draw() {
  if (!mesh) {
    return;
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const matRotZ = createMatRotZ(angle);
  const matRotX = createMatRotX(angle * 0.5);

  const trianglesToRaster: Triangle[] = [];

  for (const tri of mesh.tris) {
    // Rotate.
    const triRotatedZ = new Triangle(
      multiplyMatrixVector(tri.p[0], matRotZ),
      multiplyMatrixVector(tri.p[1], matRotZ),
      multiplyMatrixVector(tri.p[2], matRotZ)
    );
    const triRotatedX = new Triangle(
      multiplyMatrixVector(triRotatedZ.p[0], matRotX),
      multiplyMatrixVector(triRotatedZ.p[1], matRotX),
      multiplyMatrixVector(triRotatedZ.p[2], matRotX)
    );

    // Offset into the screen.
    const triTranslated = triRotatedX;
    triTranslated.p[0].z += 10;
    triTranslated.p[1].z += 10;
    triTranslated.p[2].z += 10;

    const vNormal = normal(triTranslated);
    let dotProd = dotProduct(vNormal, subtract(triTranslated.p[0], vCamera));

    if (dotProd < 0) {
      // Illumination.
      const vLightDirection = new Vec3(0, 0, -1);
      const length = len(vLightDirection);
      vLightDirection.x /= length;
      vLightDirection.y /= length;
      vLightDirection.z /= length;
      dotProd = dotProduct(vNormal, vLightDirection);
      const c = ((dotProd + 1) / 2) * 255;

      // Project triangles from 3D into 2D.
      const triProjected = new Triangle(
        multiplyMatrixVector(triTranslated.p[0], matProj),
        multiplyMatrixVector(triTranslated.p[1], matProj),
        multiplyMatrixVector(triTranslated.p[2], matProj)
      );
      triProjected.style = `rgb(${c}, ${c}, ${c})`;

      // Scale into view.
      for (const p of triProjected.p) {
        p.x += 1;
        p.y += 1;

        p.x *= 0.5 * canvas.width;
        p.y *= 0.5 * canvas.height;
      }

      trianglesToRaster.push(triProjected);
    }

    // Sort by depth (painter's algorithm).
    trianglesToRaster.sort((a, b) => {
      const z1 = (a.p[0].z + a.p[1].z + a.p[2].z) / 3;
      const z2 = (b.p[0].z + b.p[1].z + b.p[2].z) / 3;
      return z2 - z1;
    });

    for (const tri of trianglesToRaster) {
      fillTriangle(tri, ctx, tri.style);
      // drawTriangle(tri, ctx);
    }
  }

  angle += 0.01;

  requestAnimationFrame(draw);
}

function parseObj(s: string): Mesh {
  const verts: Vec3[] = [];
  const tris: Triangle[] = [];

  for (const line of s.split("\n")) {
    const p = line.split(" ");

    if (p[0] !== "v" && p[0] !== "f") {
      continue;
    }

    const a = Number(p[1]);
    const b = Number(p[2]);
    const c = Number(p[3]);

    if (p[0] === "v") {
      verts.push(new Vec3(a, b, c));
    } else if (p[0] === "f") {
      tris.push(new Triangle(verts[a - 1], verts[b - 1], verts[c - 1]));
    }
  }

  return { tris };
}

fetch("models/VideoShip.obj")
  .then((response) => response.text())
  .then((text) => {
    mesh = parseObj(text);
    requestAnimationFrame(draw);
  });
