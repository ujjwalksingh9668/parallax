const layers = [...document.querySelectorAll("[data-parallax]")];
const scenes = [...document.querySelectorAll(".scene")];
const sceneLinks = [...document.querySelectorAll(".progress-rail a")];
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let ticking = false;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resetLayers() {
  for (const layer of layers) {
    layer.style.removeProperty("--tx");
    layer.style.removeProperty("--ty");
    layer.style.removeProperty("--spin");
    layer.style.removeProperty("--zoom");
  }
}

function updatePageProgress() {
  const limit = document.documentElement.scrollHeight - window.innerHeight;
  const progress = limit > 0 ? window.scrollY / limit : 0;
  document.documentElement.style.setProperty("--page-progress", progress.toFixed(4));
}

function updateActiveScene() {
  const marker = window.innerHeight * 0.45;
  let activeId = scenes[0]?.id ?? "";

  for (const scene of scenes) {
    const rect = scene.getBoundingClientRect();
    if (rect.top <= marker && rect.bottom >= marker) {
      activeId = scene.id;
      break;
    }
  }

  for (const link of sceneLinks) {
    const target = link.getAttribute("href")?.slice(1);
    link.classList.toggle("is-active", target === activeId);
  }
}

function updateParallax() {
  if (reduceMotionQuery.matches) {
    resetLayers();
    return;
  }

  const viewportHeight = window.innerHeight;

  for (const layer of layers) {
    const scene = layer.closest(".scene");
    if (!scene) {
      continue;
    }

    const rect = scene.getBoundingClientRect();
    const progress = clamp(
      (viewportHeight - rect.top) / (rect.height + viewportHeight),
      0,
      1
    );
    const centered = (progress - 0.5) * 2;
    const speed = Number(layer.dataset.speed || 0);
    const depth = Number(layer.dataset.depth || 180);
    const rotate = Number(layer.dataset.rotate || 0);
    const axis = layer.dataset.axis || "y";

    let x = 0;
    let y = centered * depth * speed;

    if (axis === "x") {
      x = centered * depth * speed;
      y = 0;
    } else if (axis === "both") {
      x = centered * depth * speed;
      y = centered * depth * speed * 0.65;
    }

    const scale = 1 + Math.abs(centered) * Math.abs(speed) * 0.05;

    layer.style.setProperty("--tx", `${x.toFixed(2)}px`);
    layer.style.setProperty("--ty", `${y.toFixed(2)}px`);
    layer.style.setProperty("--spin", `${(centered * rotate).toFixed(2)}deg`);
    layer.style.setProperty("--zoom", scale.toFixed(3));
  }
}

function updateScene() {
  ticking = false;
  updatePageProgress();
  updateActiveScene();
  updateParallax();
}

function requestUpdate() {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(updateScene);
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);

if (typeof reduceMotionQuery.addEventListener === "function") {
  reduceMotionQuery.addEventListener("change", requestUpdate);
} else if (typeof reduceMotionQuery.addListener === "function") {
  reduceMotionQuery.addListener(requestUpdate);
}

requestUpdate();
