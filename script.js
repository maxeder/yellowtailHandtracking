const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

let sketchRNN;
let modelLoaded = true;

// Load the SketchRNN model for a specific class, e.g., 'cat'
function preload() {
    sketchRNN = new ms.SketchRNN("https://storage.googleapis.com/quickdraw-models/sketchRNN/models/cat.gen.json");
  //sketchRNN = ml5.sketchRNN('garden', modelReady);
}

function modelReady() {
  console.log('SketchRNN Model Loaded');
  modelLoaded = true;
}


let drawingActive = false;
// let middlePoint = {
//     x: 0,
//     y: 0,
//     z: 0
// }
// let canvas = document.getElementById("mycanvas");
// let canvas = document.getElementById("mycanvas");
const ctx = canvasCtx;

// TODO: fix
let resize = function () {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    videoElement.width = window.innerWidth;
    videoElement.height = window.innerHeight;
};
window.addEventListener("resize", resize);
resize();

// state:
let state = {
  pointer: {
    x: 0,
    y: 0,
    button: 0
  },
  // time since the script started, in milliseconds
  t: 0,
  // the current path being edited (null initially)
  currentpath: null,
  // 	list of finished paths
  paths: [],
  // input mode
  movingMode: true,
  animate: false
};

let thumbPoint;
let indexPoint;
let middlePoint;

function onResults(results) {
    //canvasCtx.save();
    //canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    //canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks) {
    
        for (const landmarks of results.multiHandLandmarks) {

            thumbPoint = landmarks[4];
            indexPoint = landmarks[8];
            const thumbIndexDistance = Math.sqrt(
                Math.pow(thumbPoint.x - indexPoint.x, 2) +
                Math.pow(thumbPoint.y - indexPoint.y, 2)
            );
            middlePoint = {
                x: (thumbPoint.x + indexPoint.x) / 2,
                y: (thumbPoint.y + indexPoint.y) / 2,
                z: (thumbPoint.z + indexPoint.z) / 2
            };

            if(thumbIndexDistance <= 0.09) {
                if (drawingActive == false) {
                    pointerDown(middlePoint.x * canvasElement.width, middlePoint.y * canvasElement.height);
                }
                drawingActive = true;
                pointerMove(middlePoint.x * canvasElement.width, middlePoint.y * canvasElement.height);
            } else {
                if (drawingActive == true) {
                    pointerUp(middlePoint.x * canvasElement.width, middlePoint.y * canvasElement.height);
                }
                drawingActive = false;

            }

           
            // drawLandmarks(canvasCtx, [thumbPoint, indexPoint, middlePoint], {color: '#FF0000', radius: 0.2});
        }
    }
    //canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
    await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start();





// store the current x, y and also time t into the state
// used in all mouse handler functions
function updateInputState(x, y, t) {
  state.pointer.x = x;
  state.pointer.y = y;
  state.t = t;
}

// // pointerdown:
// canvasElement.addEventListener("pointerdown", function (event) {
//   let x = event.clientX;
//   let y = event.clientY;
//   let btn = event.buttons;
//   let t = performance.now();
//   // 	create a new currentpath object, with start position at mouse x,y & t
//   state.currentpath = {
//     start: { x, y },
//     time: t,
//     segments: [],
//     hue: Math.random() * 360,
//     movingMode: state.movingMode
//   };
//   updateInputState(x, y, t);
// });

function pointerDown(x,y) {

  let t = performance.now();
  // 	create a new currentpath object, with start position at mouse x,y & t
  state.currentpath = {
    start: { x, y },
    time: t,
    segments: [],
    hue: Math.random() * 360,
    movingMode: state.movingMode
  };
  updateInputState(x, y, t);
}

// // pointerup:
// canvasElement.addEventListener("pointerup", function (event) {
//   let x = event.clientX;
//   let y = event.clientY;
//   let btn = event.buttons;
//   let t = performance.now();
//   // if currentpath exists
//   if (state.currentpath) {
//     // add my currentpath to the list of finished paths
//     if (state.currentpath.segments.length > 0) {
//       state.paths.push(state.currentpath);
//     }
//     // clear currentpath, because we are done with it
//     state.currentpath = null;
//   }
//   updateInputState(x, y, t);
// });

function pointerUp(x,y) {

  let t = performance.now();
  // if currentpath exists
  if (state.currentpath) {
    // add my currentpath to the list of finished paths
    if (state.currentpath.segments.length > 0) {
      state.paths.push(state.currentpath);
    }
    // clear currentpath, because we are done with it
    state.currentpath = null;
  }
  updateInputState(x, y, t);
}

// // pointermove:
// canvasElement.addEventListener("pointermove", function (event) {
//   let x = event.clientX;
//   let y = event.clientY;
//   let btn = event.buttons;
//   let t = performance.now();

//   // if currentpath exists
//   if (state.currentpath) {
//     let dx = x - state.pointer.x;
//     let dy = y - state.pointer.y;
//     let dt = t - state.t;
//     // add mouse dx,dy & dt to currentpath's list of segments
//     state.currentpath.segments.push({ dx, dy, dt });
//   }
//   updateInputState(x, y, t);
// });

function pointerMove(x,y) {
    let t = performance.now();
  
    // if currentpath exists
    if (state.currentpath) {
      let dx = x - state.pointer.x;
      let dy = y - state.pointer.y;
      let dt = t - state.t;
      // add mouse dx,dy & dt to currentpath's list of segments
      state.currentpath.segments.push({ dx, dy, dt });
    }
    updateInputState(x, y, t);
}

// key 'c' to clear all paths
// key 'm' to toggle moving mode
window.addEventListener("keydown", (event) => {
  if (event.key == "c") {
    // destroy all paths NOW!
    state.paths = [];
  } else if (event.key == "m") {
    state.movingMode = !state.movingMode;
  } else if (event.key == "a") {
    state.animate = !state.animate;
  }
});

// wrap an { x, y } position around canvas width/height
function donut(pos) {
  if (pos.x > canvasElement.width) {
    pos.x -= canvasElement.width;
  } else if (pos.x < 0) {
    pos.x += canvasElement.width;
  }
  if (pos.y > canvasElement.height) {
    pos.y -= canvasElement.height;
  } else if (pos.y < 0) {
    pos.y += canvasElement.height;
  }
}

// animate:
function animate() {
  // 	for each path of finished paths
  for (let path of state.paths) {
    // remove 1st segment (shift)
    let first = path.segments.shift();
    // move the start position by this segment's change:
    if (path.movingMode) {
      path.start.x += first.dx;
      path.start.y += first.dy;
    }
    // stick it onto the end (push)
    path.segments.push(first);
    // wrap around canvas width/height
    donut(path.start);
  }
}

// drawpath:
function drawpath(path) {
  // 	begin position at path's start position
  let pos = { x: path.start.x, y: path.start.y };
  // 	for each segment of the path
  //for (let segment of path.segments) {
  for (const [i, segment] of Object.entries(path.segments)) {
    // draw a line from last position to new position by adding segment change
    // get the segment change:
    let { dx, dy, dt } = segment;
    // here's the new position, by adding the segment change
    let x1 = pos.x + dx;
    let y1 = pos.y + dy;

    // get some properties we can use to stylize the segment:
    let length = Math.sqrt(dx * dx + dy * dy);
    let speed = Math.min(length / dt, 1.5);

    // the "phase" goes from 0 to 1 as we work through the path:
    let phase = i / path.segments.length;
    // stylize:
    let width = Math.sin(Math.PI * phase) * 0.01 * canvasElement.width;
    let lightness = 1 - 1 / (1 + speed);
    let saturation = Math.exp(-speed);
    let opacity = 0.5;
    ctx.strokeStyle = `hsla(${path.hue}, ${100 * saturation}%, ${
      100 * lightness
    }%, ${opacity})`;
    //ctx.strokeStyle = `hsla(${path.hue}, 80%, 80%, ${opacity})`;
    ctx.lineWidth = width;
    ctx.lineCap = "round";

    // 		(path, moveto, lineto, stroke)
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // update our x, y absolute point for the next segment
    pos.x = x1;
    pos.y = y1;
    // wrap the position in the available canvas area
    // (this is the "donut" toroidal space)
    donut(pos);
  }
}

// // draw:
// function draw() {
//   // update the scene:
//   if( state.animate) {
//     animate();
//   }
//   // 	clear screen
//   ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

//   // 	for each path of finished paths, draw them
//   for (let path of state.paths) {
//     drawpath(path);
//   }
//   // 	if currentpath exists, draw it
//   if (state.currentpath) {
//     drawpath(state.currentpath);
//   }
//   drawLandmarks(canvasCtx, [thumbPoint, indexPoint, middlePoint], {color: '#FF0000', radius: 0.2});

//   window.requestAnimationFrame(draw);
// }
// draw();








// State variables for AI agent
let aiDrawing = false;
let aiStrokePath = null;
let aiPen = 'down'; // 'down', 'up', or 'end'
let aiX, aiY; // Starting point for AI drawing

// Modify the 'draw' function to include the AI agent's drawing
function draw() {
    // Update the scene:
    if (state.animate) {
        animate();
    }

    // Clear screen
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw user's paths
    for (let path of state.paths) {
        drawpath(path);
    }

    // If currentpath exists, draw it
    if (state.currentpath) {
        drawpath(state.currentpath);

        // Start AI agent if model is loaded and not already drawing
        console.log("modelLoaded: " + modelLoaded)
        if (modelLoaded && !aiDrawing) {
        startAIDrawing(state.currentpath);
        }
    }

    // Draw AI agent's stroke if available
    if (aiDrawing && aiStrokePath) {
        drawAIStroke();
    }

    // Draw landmarks
    drawLandmarks(canvasCtx, [thumbPoint, indexPoint, middlePoint], { color: '#FF0000', radius: 0.2 });

    window.requestAnimationFrame(draw);
}
draw();



// Function to start AI drawing based on user's input
function startAIDrawing(userPath) {
    console.log("startAIDrawing")
    // Convert userPath to SketchRNN format
    let strokes = userPathToStrokes(userPath);
    // Start the AI drawing
    sketchRNN.zeroState();
    sketchRNN.generate(strokes, gotAIStroke);
    aiDrawing = true;
    // Starting point for AI drawing
    aiX = userPath.start.x;
    aiY = userPath.start.y;
}

// Callback when AI generates a stroke
function gotAIStroke(err, strokePath) {
    if (err) {
        console.error(err);
        aiDrawing = false;
        return;
    }
    aiStrokePath = strokePath;
    aiPen = aiStrokePath.pen;
    // If the drawing is not finished, generate the next stroke
    if (aiPen !== 'end') {
        sketchRNN.generate(gotAIStroke);
    } else {
        aiDrawing = false;
    }
}

// Function to draw the AI's stroke
function drawAIStroke() {
    console.log("drawAIStroke")
    if (!aiStrokePath) return;

    // Update position
    let dx = aiStrokePath.dx * 0.5; // Scale down if necessary
    let dy = aiStrokePath.dy * 0.5;

    if (aiPen === 'down') {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red color for AI drawing
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(aiX, aiY);
        ctx.lineTo(aiX + dx, aiY + dy);
        ctx.stroke();
    }

    // Move to the next point
    aiX += dx;
    aiY += dy;
    aiPen = aiStrokePath.pen;
    aiStrokePath = null; // Reset stroke path for next stroke
}

// Convert user's path to strokes for SketchRNN
function userPathToStrokes(userPath) {
    let strokes = [];
    let x = 0;
    let y = 0;

    for (let segment of userPath.segments) {
        let dx = segment.dx;
        let dy = segment.dy;
        strokes.push({
        dx: dx,
        dy: dy,
        pen: 'down', // Assume the pen is always down for user input
        });
        x += dx;
        y += dy;
    }

    // End the strokes
    strokes.push({
        dx: 0,
        dy: 0,
        pen: 'end',
    });

    return strokes;
}

// ... [Rest of the existing code]

// Call preload function to load the SketchRNN model
preload();
