/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir notkun á lyklaborðsatburðum til að hreyfa spaða
//
//    Hjálmtýr Hafsteinsson, september 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;
var bullets = [];
var bulletSpeed = 0.02;
var bulletActive = false;

var triangleBufferId; // Separate buffer for the triangle
var bulletBufferId;   // Separate buffer for the bullet
var duckBufferId;     // Separate buffer for ducks

var vertices;  // Triangle vertices array
var ducks = []; // Ducks array
var duckSize = 0.05; // Size of each duck

var xmove = 0.0; // Movement variable for horizontal movement

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0.0);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Define the vertices of a triangle
    vertices = [
        vec2(-0.1, -0.9),   // Bottom left corner
        vec2(0.1, -0.9),    // Bottom right corner
        vec2(0.0, -0.7)     // Top center corner
    ];

    // Create a separate buffer for the triangle
    triangleBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);

    // Create 3 ducks at different heights and speeds
    spawnDucks();

    // Event listener for keyboard
    window.addEventListener("keydown", function (e) {
        switch (e.keyCode) {
            case 37:    // left arrow key
                xmove = -0.02;
                moveTriangle();
                break;
            case 39:    // right arrow key
                xmove = 0.02;
                moveTriangle();
                break;
            case 32:    // spacebar
                if (!bulletActive) {
                    shootBullet(vertices[2]);  // The top-center of the triangle
                }
                break;
            default:
                xmove = 0.0;
        }
    });

    render();
}

// Function to spawn 3 ducks with different heights and speeds
function spawnDucks() {
    ducks.push({
        position: vec2(Math.random() * 2 - 1, 0.8),  // High near the top
        velocity: 0.012, // Slow speed
    });
    ducks.push({
        position: vec2(Math.random() * 2 - 1, 0.6),  // Mid height
        velocity: 0.010,  // Medium speed
    });
    ducks.push({
        position: vec2(Math.random() * 2 - 1, 0.4),  // Lower but above triangle
        velocity: 0.014, // Fast speed
    });
}

function moveTriangle() {
    // Move each vertex of the triangle horizontally based on xmove
    for (i = 0; i < 3; i++) {
        vertices[i][0] += xmove;
    }

    // Update the buffer with the new position of the triangle
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
}

function shootBullet(startPosition) {
    bulletActive = true;
    bullets.push({
        position: vec2(startPosition[0], startPosition[1]),  // Start at the triangle's top
        velocity: bulletSpeed
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the triangle
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);  // Bind the triangle buffer
    gl.vertexAttribPointer(gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition"));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Draw ducks and move them
    ducks.forEach(function (duck) {
        duck.position[0] += duck.velocity; // Move duck horizontally
        if (duck.position[0] > 1.0 || duck.position[0] < -1.0) {
            duck.velocity *= -1; // Bounce ducks back from the edges
        }
        drawDuck(duck.position);
    });

    // Draw bullets
    bullets = bullets.filter(function (bullet) {
        bullet.position[1] += bullet.velocity; // Move the bullet upwards
        if (bullet.position[1] > 1.0) {
            return false; // Remove the bullet if it goes off-screen
        }
        drawBullet(bullet.position);

        // Check collision with ducks
        ducks = ducks.filter(function (duck) {
            if (checkCollision(bullet.position, duck.position)) {
                return false; // Remove the duck if hit
            }
            return true;
        });

        return true;
    });

    if (bullets.length === 0) {
        bulletActive = false;  // Allow firing another bullet if none are on screen
    }

    window.requestAnimFrame(render);
}

function drawBullet(position) {
    // Define the small bullet (a point or a square)
    var bulletVertices = [
        vec2(position[0] - 0.01, position[1] - 0.01), // Bottom left
        vec2(position[0] + 0.01, position[1] - 0.01), // Bottom right
        vec2(position[0] + 0.01, position[1] + 0.01), // Top right
        vec2(position[0] - 0.01, position[1] + 0.01)  // Top left
    ];

    // Create a separate buffer for the bullet
    bulletBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bulletBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bulletVertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // Draw the bullet as a small square
}

function drawDuck(position) {
    // Define the small duck (a square)
    var duckVertices = [
        vec2(position[0] - duckSize, position[1] - duckSize), // Bottom left
        vec2(position[0] + duckSize, position[1] - duckSize), // Bottom right
        vec2(position[0] + duckSize, position[1] + duckSize), // Top right
        vec2(position[0] - duckSize, position[1] + duckSize)  // Top left
    ];

    // Create a separate buffer for the duck
    duckBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, duckBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(duckVertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // Draw the duck as a small square
}

function checkCollision(bulletPos, duckPos) {
    // Simple collision detection (check if the bullet is within the bounds of the duck)
    return bulletPos[0] > duckPos[0] - duckSize &&
        bulletPos[0] < duckPos[0] + duckSize &&
        bulletPos[1] > duckPos[1] - duckSize &&
        bulletPos[1] < duckPos[1] + duckSize;
}
