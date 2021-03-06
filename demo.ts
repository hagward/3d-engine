import * as gl from "./3d-engine.js";

const canvas = document.getElementById("c") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const keyPressed = {
  up: false,
  down: false,
  left: false,
  right: false,
};

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowUp":
      keyPressed.up = true;
      break;
    case "ArrowDown":
      keyPressed.down = true;
      break;
    case "ArrowLeft":
      keyPressed.left = true;
      break;
    case "ArrowRight":
      keyPressed.right = true;
      break;
  }
});

document.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "ArrowUp":
      keyPressed.up = false;
      break;
    case "ArrowDown":
      keyPressed.down = false;
      break;
    case "ArrowLeft":
      keyPressed.left = false;
      break;
    case "ArrowRight":
      keyPressed.right = false;
      break;
  }
});

function drawTriangle(t: gl.Triangle): void {
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(canvas.width - t.p[0].x, canvas.height - t.p[0].y);
  ctx.lineTo(canvas.width - t.p[1].x, canvas.height - t.p[1].y);
  ctx.lineTo(canvas.width - t.p[2].x, canvas.height - t.p[2].y);
  ctx.lineTo(canvas.width - t.p[0].x, canvas.height - t.p[0].y);
  ctx.stroke();
}

function fillTriangle(t: gl.Triangle): void {
  ctx.fillStyle = t.style || "white";
  ctx.beginPath();
  ctx.moveTo(canvas.width - t.p[0].x, canvas.height - t.p[0].y);
  ctx.lineTo(canvas.width - t.p[1].x, canvas.height - t.p[1].y);
  ctx.lineTo(canvas.width - t.p[2].x, canvas.height - t.p[2].y);
  ctx.lineTo(canvas.width - t.p[0].x, canvas.height - t.p[0].y);
  ctx.fill();
}

const fNear = 0.1;
const fFar = 1000;
const fFov = Math.PI / 2;
const fAspectRatio = canvas.height / canvas.width;

const matProj = gl.perspectiveMatrix(fFov, fAspectRatio, fNear, fFar);

const vCamera = new gl.Vec3D(0, 0, 0);
const vLookDir = new gl.Vec3D(0, 0, 1);

let angle = 0;
let now = -1;
let fps = 0;
let mesh: gl.Mesh | null = null;

function draw() {
  if (!mesh) {
    return;
  }

  if (keyPressed.up) {
    vCamera.y += 0.1;
  }
  if (keyPressed.down) {
    vCamera.y -= 0.1;
  }
  if (keyPressed.left) {
    vCamera.x += 0.1;
  }
  if (keyPressed.right) {
    vCamera.x -= 0.1;
  }

  // Clear screen.
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw fps counter.
  const newNow = Date.now();
  if (now > -1) {
    fps = 1000 / (newNow - now);
    ctx.fillStyle = "white";
    ctx.fillText(`FPS: ${Math.floor(fps)}`, 10, 20);
  }
  now = newNow;

  const matRotZ = gl.rotateZMatrix(angle * 0.5);
  const matRotX = gl.rotateXMatrix(angle);
  const matTrans = gl.translateMatrix(0, 0, 5);
  const matWorld = matRotZ.multiplyMatrix(matRotX).multiplyMatrix(matTrans);

  const vUp = new gl.Vec3D(0, 1, 0);
  const vTarget = vCamera.add(vLookDir);
  const matCamera = gl.pointAtMatrix(vCamera, vTarget, vUp);

  // Make view matrix from camera.
  const matView = matCamera.quickInverse();

  const trianglesToRaster: gl.Triangle[] = [];

  for (const tri of mesh.tris) {
    const triTransformed = new gl.Triangle(
      matWorld.multiplyVector(tri.p[0]),
      matWorld.multiplyVector(tri.p[1]),
      matWorld.multiplyVector(tri.p[2])
    );

    const vNormal = triTransformed.normal;
    const vCameraRay = triTransformed.p[0].subtract(vCamera);

    // If ray is aligned with normal, then the triangle is visible.
    if (vNormal.dotProduct(vCameraRay) < 0) {
      // Illumination.
      const vLightDirection = new gl.Vec3D(0, 0, -1).normalize();

      // How "aligned" are light direction and triangle surface normal?
      const dp = vLightDirection.dotProduct(vNormal);
      const c = ((dp + 1) / 2) * 255;
      const style = `rgb(${c}, ${c}, ${c})`;

      // Convert world space to view space.
      const triViewed = new gl.Triangle(
        matView.multiplyVector(triTransformed.p[0]),
        matView.multiplyVector(triTransformed.p[1]),
        matView.multiplyVector(triTransformed.p[2])
      );

      // Project triangles from 3D to 2D.
      const triProjected = new gl.Triangle(
        matProj.multiplyVector(triViewed.p[0]),
        matProj.multiplyVector(triViewed.p[1]),
        matProj.multiplyVector(triViewed.p[2])
      );
      triProjected.style = style;

      // Normalize into cartesian space.
      triProjected.p[0] = triProjected.p[0].divide(triProjected.p[0].w);
      triProjected.p[1] = triProjected.p[1].divide(triProjected.p[1].w);
      triProjected.p[2] = triProjected.p[2].divide(triProjected.p[2].w);

      // Offset vertices into visible normalized space.
      const vOffsetView = new gl.Vec3D(1, 1, 0);
      for (let i = 0; i < triProjected.p.length; i++) {
        triProjected.p[i] = triProjected.p[i].add(vOffsetView);
        triProjected.p[i].x *= 0.5 * canvas.width;
        triProjected.p[i].y *= 0.5 * canvas.height;
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
      fillTriangle(tri);
      // drawTriangle(tri);
    }
  }

  // angle += 0.01;

  requestAnimationFrame(draw);
}

function parseObj(s: string): gl.Mesh {
  const verts: gl.Vec3D[] = [];
  const tris: gl.Triangle[] = [];

  for (const line of s.split("\n")) {
    const p = line.split(" ");

    if (p[0] !== "v" && p[0] !== "f") {
      continue;
    }

    const a = Number(p[1]);
    const b = Number(p[2]);
    const c = Number(p[3]);

    if (p[0] === "v") {
      verts.push(new gl.Vec3D(a, b, c));
    } else if (p[0] === "f") {
      tris.push(new gl.Triangle(verts[a - 1], verts[b - 1], verts[c - 1]));
    }
  }

  return { tris };
}

fetch("models/axis.obj")
  .then((response) => response.text())
  .then((text) => {
    mesh = parseObj(text);
    requestAnimationFrame(draw);
  });
