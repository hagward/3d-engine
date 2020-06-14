const canvas = document.getElementById("c") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

// const mesh: Mesh = {
//   tris: [
//     // SOUTH
//     triangle(vec3(0, 0, 0), vec3(0, 1, 0), vec3(1, 1, 0)),
//     triangle(vec3(0, 0, 0), vec3(1, 1, 0), vec3(1, 0, 0)),

//     // EAST
//     triangle(vec3(1, 0, 0), vec3(1, 1, 0), vec3(1, 1, 1)),
//     triangle(vec3(1, 0, 0), vec3(1, 1, 1), vec3(1, 0, 1)),

//     // NORTH
//     triangle(vec3(1, 0, 1), vec3(1, 1, 1), vec3(0, 1, 1)),
//     triangle(vec3(1, 0, 1), vec3(0, 1, 1), vec3(0, 0, 1)),

//     // WEST
//     triangle(vec3(0, 0, 1), vec3(0, 1, 1), vec3(0, 1, 0)),
//     triangle(vec3(0, 0, 1), vec3(0, 1, 0), vec3(0, 0, 0)),

//     // TOP
//     triangle(vec3(0, 1, 0), vec3(0, 1, 1), vec3(1, 1, 1)),
//     triangle(vec3(0, 1, 0), vec3(1, 1, 1), vec3(1, 1, 0)),

//     // TOP
//     triangle(vec3(1, 0, 1), vec3(0, 0, 1), vec3(0, 0, 0)),
//     triangle(vec3(1, 0, 1), vec3(0, 0, 0), vec3(1, 0, 0)),
//   ],
// };

let mesh: Mesh = null;

const fNear = 0.1;
const fFar = 1000;
const fFov = Math.PI / 2;
const fAspectRatio = canvas.height / canvas.width;

const vCamera: Vec3 = {
  x: 0,
  y: 0,
  z: 0,
};

const matProj: Matrix = {
  m: [
    [fAspectRatio * fFov, 0, 0, 0],
    [0, fFov, 0, 0],
    [0, 0, fFar / (fFar - fNear), 1],
    [0, 0, (-fFar * fNear) / (fFar - fNear), 0],
  ],
};

let angle = 0;

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const matRotZ: Matrix = {
    m: [
      [Math.cos(angle), Math.sin(angle), 0, 0],
      [-Math.sin(angle), Math.cos(angle), 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  };

  const matRotX: Matrix = {
    m: [
      [1, 0, 0, 0],
      [0, Math.cos(angle * 0.5), Math.sin(angle * 0.5), 0],
      [0, -Math.sin(angle * 0.5), Math.cos(angle * 0.5), 0],
      [0, 0, 0, 1],
    ],
  };

  const trianglesToRaster: Triangle[] = [];

  for (const tri of mesh.tris) {
    const triRotatedZ: Triangle = {
      p: [
        multiplyMatrixVector(tri.p[0], matRotZ),
        multiplyMatrixVector(tri.p[1], matRotZ),
        multiplyMatrixVector(tri.p[2], matRotZ),
      ],
    };
    const triRotatedX: Triangle = {
      p: [
        multiplyMatrixVector(triRotatedZ.p[0], matRotX),
        multiplyMatrixVector(triRotatedZ.p[1], matRotX),
        multiplyMatrixVector(triRotatedZ.p[2], matRotX),
      ],
    };

    // Offset into the screen.
    const triTranslated = triRotatedX;
    triTranslated.p[0].z += 10;
    triTranslated.p[1].z += 10;
    triTranslated.p[2].z += 10;

    const line1: Vec3 = {
      x: triTranslated.p[1].x - triTranslated.p[0].x,
      y: triTranslated.p[1].y - triTranslated.p[0].y,
      z: triTranslated.p[1].z - triTranslated.p[0].z,
    };

    const line2: Vec3 = {
      x: triTranslated.p[2].x - triTranslated.p[0].x,
      y: triTranslated.p[2].y - triTranslated.p[0].y,
      z: triTranslated.p[2].z - triTranslated.p[0].z,
    };

    const normal: Vec3 = {
      x: line1.y * line2.z - line1.z * line2.y,
      y: line1.z * line2.x - line1.x * line2.z,
      z: line1.x * line2.y - line1.y * line2.x,
    };

    let len = Math.sqrt(
      normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
    );
    normal.x /= len;
    normal.y /= len;
    normal.z /= len;

    let dotProd =
      normal.x * (triTranslated.p[0].x - vCamera.x) +
      normal.y * (triTranslated.p[0].y - vCamera.y) +
      normal.z * (triTranslated.p[0].z - vCamera.z);

    if (dotProd < 0) {
      // Illumination.
      const lightDirection: Vec3 = {
        x: 0,
        y: 0,
        z: -1,
      };
      len = Math.sqrt(
        lightDirection.x * lightDirection.x +
          lightDirection.y * lightDirection.y +
          lightDirection.z * lightDirection.z
      );
      lightDirection.x /= len;
      lightDirection.y /= len;
      lightDirection.z /= len;
      dotProd =
        normal.x * lightDirection.x +
        normal.y * lightDirection.y +
        normal.z * lightDirection.z;

      const c = ((dotProd + 1) / 2) * 255;

      // Project triangles from 3D into 2D.
      const triProjected: Triangle = {
        p: [
          multiplyMatrixVector(triTranslated.p[0], matProj),
          multiplyMatrixVector(triTranslated.p[1], matProj),
          multiplyMatrixVector(triTranslated.p[2], matProj),
        ],
        style: `rgb(${c}, ${c}, ${c})`,
      };

      // Scale into view.
      for (const p of triProjected.p) {
        p.x += 1;
        p.y += 1;

        p.x *= 0.5 * canvas.width;
        p.y *= 0.5 * canvas.height;
      }

      trianglesToRaster.push(triProjected);
      // fillTriangle(triProjected, ctx, triProjected.style);
      // drawTriangle(triProjected, ctx);
    }

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
      verts.push({
        x: a,
        y: b,
        z: c,
      });
    } else if (p[0] === "f") {
      tris.push(triangle(verts[a - 1], verts[b - 1], verts[c - 1]));
    }
  }

  return { tris };
}

// requestAnimationFrame(draw);

fetch("VideoShip.obj")
  .then((response) => response.text())
  .then((text) => {
    mesh = parseObj(text);
    requestAnimationFrame(draw);
  });
