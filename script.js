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

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', finishedPosition);

colorPicker.addEventListener('change', (e) => currentColor = e.target.value);
brushSize.addEventListener('change', (e) => currentSize = e.target.value);
clearButton.addEventListener('click', clearCanvas);
replayButton.addEventListener('click', replayDrawing);
penUpload.addEventListener('change', uploadPen);

function startPosition(e) {
    if (isReplaying) return;
    drawing = true;
    currentPath = [];
    draw(e);
}

function finishedPosition() {
    if (!drawing) return;
    drawing = false;
    paths.push(currentPath);
    ctx.beginPath();
}

function draw(e) {
    if (!drawing || isReplaying) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
            isReplaying = false;
            ctx.beginPath();
            return;
        }

        let path = paths[index];
        let pointIndex = 0;

        function drawPath() {
            if (pointIndex >= path.length) {
                index++;
                setTimeout(replayStep, 50);
                return;
            }

            const point = path[pointIndex];
            ctx.lineWidth = point.size;
            ctx.strokeStyle = point.color;
            ctx.lineCap = 'round';

            redrawPathsUpTo(index, pointIndex);

            if (penImage) {
                const penWidth = 30;
                const penHeight = 30;
                ctx.drawImage(penImage, point.x - penWidth / 2, point.y - penHeight / 2, penWidth, penHeight);
            }

            pointIndex++;
            setTimeout(drawPath, speed * 10);
        }

        drawPath();
    }

    replayStep();
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
