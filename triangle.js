
const canvas = document.querySelector("canvas");

let width = 0;
let height = 0;


let previousPoint = null;
let cancel = false;

const ctx = canvas.getContext("2d");
const pointCountInput = document.getElementById("pointCountInput");
const speedModifier = document.getElementById("speedModifier");
const speedModifierInput = document.getElementById("speedModifierInput");
const countNote = document.getElementById("countNote");
const colorInput = document.getElementById("colorInput");
const bgColorInput = document.getElementById("bgColorInput");
const dotSizeInput = document.getElementById("dotSizeInput");
const progress = document.getElementById("progress");
const progressMsg = document.getElementById("progressMsg");
const cancelButton = document.getElementById("cancelButton");
const runButton = document.getElementById("runButton");
const clearButton = document.getElementById("clearButton");
const saveButton = document.getElementById("saveButton");

// Initial triangle points
let initialPoints = [
  { x: width / 2, y: height * 0.05 }, // Top
  { x: (height * 0.05), y: height - (height * 0.05) },  // Bottom left
  { x: width - (height * 0.05), y: height - (height * 0.05) } // Bottom right
];

resizeCanvas();
reset();

/* Events */
cancelButton.addEventListener("click", function() {
  cancelAnimation();
});

clearButton.addEventListener("click", function() {
  reset();
  clearButton.style.display = "none";
});

saveButton.addEventListener("click", function() {
  const pngData = base64ToArrayBuffer(canvas.toDataURL().substring(22));
  const imgData = new Blob([pngData], { type: 'image/png' });
  let a = document.createElement('a');
  a.href = URL.createObjectURL(imgData);
  a.download = 'triangles.png';
  a.click();
});

runButton.addEventListener("click", function() {
  previousPoint = null;
  fillTriangle(+pointCountInput.value);
});

canvas.addEventListener("click", function(e) {
  reset();
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const point = { x, y: y };

  previousPoint = point;
  fillTriangle(+pointCountInput.value);
});


pointCountInput.addEventListener("keyup", checkCount);
pointCountInput.addEventListener("change", checkCount);

document.getElementById("instant").addEventListener("change", modeChanged);
document.getElementById("animated").addEventListener("change", modeChanged);


window.addEventListener('resize', resizeCanvas, false);



// Persist settings to localStorage
document.querySelectorAll("input").forEach(input => {
  let key = input.id;
  if (input.type === 'radio') {
    key = input.name;
  }

  input.addEventListener("change", function(e) {
    localStorage.setItem(key, e.target.value);
  });
  const lsValue = localStorage.getItem(key);
  if (lsValue) {
    if (input.type === 'radio') {
      input.checked = (lsValue === input.value);
    } else {
      input.value = localStorage.getItem(key);
    }
  }
});

// Emit events to inputs in case they changed so that the UI updates accordingly
document.querySelectorAll("input").forEach(input => {
  if (input.type === 'radio' && !input.checked) return;

  ['change', 'click'].forEach(eventType => {
    let e = new Event(eventType);
    e.target = input;
    input.dispatchEvent(e);
  });
});


/* Functions */
function resizeCanvas() {
  cancelAnimation();
  width = window.innerWidth - 20;
  height = width * .5;

  // create a temporary canvas obj to cache the pixel data //
  let temp_cnvs = document.createElement('canvas');
  let temp_ctx = temp_cnvs.getContext('2d');
  // set it to the new width & height and draw the current canvas data into it // 
  temp_cnvs.width = width; 
  temp_cnvs.height = height;

  if (bgColorInput.value.length > 0) {
    temp_ctx.fillStyle = bgColorInput.value;
    temp_ctx.fillRect(0, 0, width, height);
  }

  temp_ctx.drawImage(canvas, 0, 0);
  // resize & clear the original canvas and copy back in the cached pixel data //
  canvas.width = width; 
  canvas.height = height;
  ctx.drawImage(temp_cnvs, 0, 0);
  temp_ctx.clearRect(0, 0, width, height);

  //canvas.width = width;
  //canvas.height = height;
}

function cancelAnimation() {
  cancel = true;
  progressMsg.innerHTML = " (canceled)";
  cancelButton.style.display = "none";
  runButton.style.display = "inline";
  clearButton.style.display = "inline";
  saveButton.style.display = "inline";
}

function modeChanged(e) {
  speedModifier.style.display = e.target.value === 'animated' ? 'block' : 'none';
}

function checkCount(e) {
  countNote.innerHTML = "";
  if (+e.target.value >= 2000000) {
    countNote.innerHTML = "Might be rough lol";
  }
}

function drawPoint(point, color) {
  const dotSizeModifier = +dotSizeInput.value * 0.00005;
  const dotSize = width * dotSizeModifier;
  color = color || colorInput.value;
  ctx.beginPath();
  ctx.arc(point.x, point.y, dotSize, 0, 2 * Math.PI, true);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.stroke();
  ctx.fill();
}

function drawLine(fromPoint, toPoint, color) {
  color = color || colorInput.value;
  ctx.beginPath();
  ctx.moveTo(fromPoint.x, fromPoint.y);
  ctx.lineTo(toPoint.x, toPoint.y);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function chooseRandom(items) {
  const idx = Math.floor(Math.random() * items.length, 0);
  return items[idx];
}

function getRandomPoint() {
  // Pick a number between 0 and 2 (indexes for the 3 items in the array)
  const idx = Math.round(Math.random() * 2, 0) + 1;
  return initialPoints[idx];
}

function getMidPoint(pointA, pointB) {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2
  }
}

function reset() {
  progress.innerHTML = "";
  progressMsg.innerHTML = "";
  // In case width/height changed
  initialPoints = [
    { x: width / 2, y: (height * 0.05) }, // Top
    { x: (height * 0.05), y: height - (height * 0.05) },  // Bottom left
    { x: width - (height * 0.05), y: height - (height * 0.05) } // Bottom right
  ]

  ctx.clearRect(0, 0, width, height);
  if (bgColorInput.value.length > 0) {
    ctx.fillStyle = bgColorInput.value;
    ctx.fillRect(0, 0, width, height);
  }
  initialPoints.forEach(point => drawPoint(point, 'red'));
}

function getAllPoints() {
  let allPoints = [];
  const count = +pointCountInput.value;
  reset();

  // Set our initial dot
  if (previousPoint === null) {
    previousPoint = getMidPoint(initialPoints[0], initialPoints[1]);
  }

  allPoints.push(previousPoint);

  for (let i = 0; i < count; i++) {
    // Our new point will be the midpoint beween our previousPoint and a random initialPoint
    let randomInitialPoint = chooseRandom(initialPoints);
    let newPoint = getMidPoint(previousPoint, randomInitialPoint);
    allPoints.push(newPoint);
    // This new point becomes our previousPoint for the next iteration
    previousPoint = newPoint;
  }
  return allPoints;
}

function fillTriangle() {
  cancel = false;
  const points = getAllPoints();
  const mode = document.querySelector('input[name="mode"]:checked').value;

  if (mode === 'animated') {
    cancelButton.style.display = "inline";
    runButton.style.display = "none";
    clearButton.style.display = "none";
    saveButton.style.display = "none";
    requestAnimationFrame(() => fillNextPoint(points, 0));
  } else {
    points.forEach((point, i) => {
      drawPoint(point, i === 0 ? 'blue' : null)
    });
    clearButton.style.display = "inline";
    saveButton.style.display = "inline";
  }
}

function fillNextPoint(points, index) {
  if (points.length <= index) {
    progress.innerHTML = "100%";
    progressMsg.innerHTML = "";
    cancelButton.style.display = "none";
    runButton.style.display = "inline";
    clearButton.style.display = "inline";
    saveButton.style.display = "inline";
    return;
  }
  progress.innerHTML = Math.round(index / points.length * 100) + "%";

  drawPoint(points[index], index === 0 ? 'blue' : null);
  for (let i = 1; i < +speedModifierInput.value; i++) {
    if (index + i < points.length) {
      drawPoint(points[index + i]);
    }
    // drawLine(points[index + (i - 1)], points[index + i]);
  }

  if (!cancel) {
    return requestAnimationFrame(() => {
      fillNextPoint(points, index + (+speedModifierInput.value));
    });
  } else {
    cancelAnimation()
  }
}


function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
