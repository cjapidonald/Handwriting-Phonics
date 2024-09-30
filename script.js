const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearButton = document.getElementById('clearButton');
const replayButton = document.getElementById('replayButton');
const replaySpeedSlider = document.getElementById('replaySpeed');
const penUpload = document.getElementById('penUpload');

let drawing = false;
let currentColor = '#000000';
let currentSize = 2;
let paths = [];
let currentPath = [];
let isReplaying = false;
let stopReplay = false; // Variable to stop the replay loop
let backgroundImage = new Image(); // Define the background image
let penImage = null;

// Load the default background image when the page loads
backgroundImage.src = 'Notebook.png'; // Default background file
backgroundImage.onload = function() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
};

// Initial canvas fill with background
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Event listeners for mouse input
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', finishedPosition);

// Event listeners for touch input
canvas.addEventListener('touchstart', startTouchPosition);
canvas.addEventListener('touchend', finishedPosition);
canvas.addEventListener('touchmove', drawTouch);

// Other event listeners
colorPicker.addEventListener('change', (e) => currentColor = e.target.value);
brushSize.addEventListener('change', (e) => currentSize = e.target.value);
clearButton.addEventListener('click', clearCanvas);
replayButton.addEventListener('click', replayDrawingLoop); // Start the replay loop
penUpload.addEventListener('change', uploadPen);

// Mouse event handling
function startPosition(e) {
    if (isReplaying) return;
    stopReplay = true; // Stop replay when the user starts drawing
    drawing = true;
    currentPath = [];
    draw(e);
}

// Touch event handling
function startTouchPosition(e) {
    if (isReplaying) return;
    stopReplay = true; // Stop replay when the user starts drawing
    drawing = true;
    currentPath = [];
    drawTouch(e);
    e.preventDefault(); // Prevent scrolling when drawing
}

function finishedPosition() {
    if (!drawing) return;
    drawing = false;
    paths.push(currentPath);
    ctx.beginPath();
}

// Mouse drawing
function draw(e) {
    if (!drawing || isReplaying) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawLine(x, y);
}

// Touch drawing
function drawTouch(e) {
    if (!drawing || isReplaying) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0]; // Single touch point
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    drawLine(x, y);
    e.preventDefault(); // Prevent scrolling when drawing
}

// Helper function for drawing a line
function drawLine(x, y) {
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Record the drawing action
    currentPath.push({
        x: x,
        y: y,
        color: currentColor,
        size: currentSize,
    });
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw background image
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    paths = [];
    stopReplay = true; // Stop the replay loop when clearing the board
}

function replayDrawing() {
    if (isReplaying || paths.length === 0) return;
    isReplaying = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw background
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    let index = 0;
    const speed = 11 - replaySpeedSlider.value;

    function replayStep() {
        if (index >= paths.length) {
            index = 0; // Reset to the beginning to loop
        }

        let path = paths[index];
        let pointIndex = 0;

        function drawPath() {
            if (pointIndex >= path.length) {
                index++;
                if (index >= paths.length) {
                    index = 0; // Reset index to loop from the start
                }
                setTimeout(replayStep, 50);
                return;
            }

            const point = path[pointIndex];
            ctx.lineWidth = point.size;
            ctx.strokeStyle = point.color;
            ctx.lineCap = 'round';

            redrawPathsUpTo(index, pointIndex);

            if (penImage) {
                const penWidth = 50;
                const penHeight = 50;
                ctx.drawImage(penImage, point.x - penWidth / 2, point.y - penHeight / 2, penWidth, penHeight);
            }

            pointIndex++;
            setTimeout(drawPath, speed * 10);
        }

        drawPath();
    }

    replayStep();
}

// Function to replay in a loop until a new drawing is started or the board is cleared
function replayDrawingLoop() {
    stopReplay = false; // Allow replay loop
    function loop() {
        if (stopReplay || paths.length === 0) {
            isReplaying = false;
            return; // Stop the loop if drawing starts or board is cleared
        }
        replayDrawing();
        setTimeout(loop, 200); // Restart the loop after the replay finishes
    }
    loop(); // Start the loop
}

function redrawPathsUpTo(pathIndex, pointIndex) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw background
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    for (let i = 0; i <= pathIndex; i++) {
        const path = paths[i];
        ctx.beginPath();
        for (let j = 0; j < (i === pathIndex ? pointIndex : path.length); j++) {
            const point = path[j];
            ctx.lineWidth = point.size;
            ctx.strokeStyle = point.color;
            if (j === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        }
    }
}

function uploadPen(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            penImage = img;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}
