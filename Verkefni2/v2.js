var canvas;
var gl;

var numVertices = 36;
var gridSize = 10;
var grid = [];
var nextGrid = [];

var cubeSize = 0.1;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -6.0;

var proLoc;
var mvLoc;
var program;

var lastUpdateTime = 0;
var updateInterval = 1000; // Update every 500 milliseconds (0.5 seconds)

// Define cube vertices and their corresponding colors for each face
var vertices = [
    vec3(-0.5, -0.5, 0.5),
    vec3(-0.5, 0.5, 0.5),
    vec3(0.5, 0.5, 0.5),
    vec3(0.5, -0.5, 0.5),
    vec3(-0.5, -0.5, -0.5),
    vec3(-0.5, 0.5, -0.5),
    vec3(0.5, 0.5, -0.5),
    vec3(0.5, -0.5, -0.5)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0)   // white
];

var indices = [
    1, 0, 3, 3, 2, 1, // Front face
    2, 3, 7, 7, 6, 2, // Right face
    3, 0, 4, 4, 7, 3, // Bottom face
    6, 5, 1, 1, 2, 6, // Top face
    4, 5, 6, 6, 7, 4, // Back face
    5, 4, 0, 0, 1, 5  // Left face
];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    initializeGrid();
    setupBuffers();

    proLoc = gl.getUniformLocation(program, "projection");
    mvLoc = gl.getUniformLocation(program, "modelview");

    var proj = perspective(50.0, 1.0, 0.2, 100.0);
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    // Event listeners for mouse
    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault(); // Disable drag and drop
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            spinY = (spinY + (e.offsetX - origX)) % 360;
            spinX = (spinX + (origY - e.offsetY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });



    window.addEventListener("mousewheel", function (e) {
        if (e.wheelDelta > 0.0) {
            zDist += 0.2;
        } else {
            zDist -= 0.2;
        }
    });

    requestAnimFrame(render);
};

function initializeGrid() {
    for (let x = 0; x < gridSize; x++) {
        grid[x] = [];
        nextGrid[x] = [];
        for (let y = 0; y < gridSize; y++) {
            grid[x][y] = [];
            nextGrid[x][y] = [];
            for (let z = 0; z < gridSize; z++) {
                grid[x][y][z] = Math.random() < 0.2 ? 1 : 0;
                nextGrid[x][y][z] = 0;
            }
        }
    }
}

function setupBuffers() {
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
}

function updateGrid() {
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                let neighbors = countNeighbors(x, y, z);
                if (grid[x][y][z] === 1) {
                    nextGrid[x][y][z] = (neighbors >= 5 && neighbors <= 7) ? 1 : 0;
                } else {
                    nextGrid[x][y][z] = (neighbors === 6) ? 1 : 0;
                }
            }
        }
    }

    [grid, nextGrid] = [nextGrid, grid];
}

function countNeighbors(x, y, z) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            for (let k = -1; k <= 1; k++) {
                if (i === 0 && j === 0 && k === 0) continue;
                let nx = (x + i + gridSize) % gridSize;
                let ny = (y + j + gridSize) % gridSize;
                let nz = (z + k + gridSize) % gridSize;
                count += grid[nx][ny][nz];
            }
        }
    }
    return count;
}

function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = lookAt(vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    // Centering the grid by translating each cube
    var offset = (gridSize / 2 - 0.5) * cubeSize;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                if (grid[x][y][z] === 1) {
                    var cubeMv = mult(mv, translate((x * cubeSize) - offset, (y * cubeSize) - offset, (z * cubeSize) - offset));
                    cubeMv = mult(cubeMv, scalem(cubeSize, cubeSize, cubeSize));
                    gl.uniformMatrix4fv(mvLoc, false, flatten(cubeMv));
                    gl.drawElements(gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0);
                }
            }
        }
    }

    if (timestamp - lastUpdateTime >= updateInterval) {
        updateGrid();
        lastUpdateTime = timestamp;
    }

    requestAnimFrame(render);
}
