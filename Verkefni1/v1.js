var canvas;
var gl;

var skot = [];
var bulletSpeed = 0.02;
var bulletActive = false;

var ducks = []; // Fylki sem heldur utan um endurnar
var duckSize = 0.05;


// Aðal fallið sem skilgreinir hvað gerist á Canvas elementinu.
window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 1, 1, 0.0); // canvas gefið alpga gildi: 0 svo að hægt er að sjá bakgrunninn.

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // punktarnir fyrir þríhyrninginn.
    vertices = [
        vec2(-0.1, -0.9),
        vec2(0.1, -0.9),
        vec2(0.0, -0.7)
    ];

    triangleBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);

    spawnDucks();

    window.addEventListener("keydown", function (e) {
        switch (e.keyCode) {
            case 37:    // vinstri örvatakki.
                xmove = -0.02;
                moveTriangle();
                break;
            case 39:    // hægri örvatakki.
                xmove = 0.02;
                moveTriangle();
                break;
            case 32:    // space.
                if (!bulletActive) {
                    shootBullet(vertices[2]);  // skýtur byssukúlu frá toppnum á þríhyrningnum.
                }
                break;
            default:
                xmove = 0.0;
        }
    });

    // kemur í veg fyrir að space hnappurinn scrolli niður á síðuna þegar spilað er leikinn
    window.onkeydown = function (e) {
        return !(e.keyCode == 32);
    };

    render();
}

// Fall sem hleður inn 3 endur á mismunandi hraða og hæð.
// position: skilgreininir staðsetningu.
// velocity: skilgreinir flughraða.

function spawnDucks() {
    ducks.push({
        position: vec2(Math.random() * 2 - 1, 0.8),
        velocity: 0.012,
    });
    ducks.push({
        position: vec2(Math.random() * 2 - 1, 0.6),
        velocity: 0.010,
    });
    ducks.push({
        position: vec2(Math.random() * 2 - 1, 0.4),
        velocity: 0.014,
    });
}

// fallið sem færir þríhyrninginn.
function moveTriangle() {
    for (i = 0; i < 3; i++) {
        vertices[i][0] += xmove;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
}

// fall sem skýtur byssukúlu
function shootBullet(startPosition) {
    bulletActive = true;
    skot.push({
        position: vec2(startPosition[0], startPosition[1]),
        velocity: bulletSpeed
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);  // Bind the triangle buffer
    gl.vertexAttribPointer(gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition"));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // sér um að færa endurnar frá hægri til vinstri og öfugt
    ducks.forEach(function (duck) {
        duck.position[0] += duck.velocity;
        if (duck.position[0] > 1.0 || duck.position[0] < -1.0) {
            duck.velocity *= -1;
        }
        drawDuck(duck.position);
    });

    // Byssukúla
    skot = skot.filter(function (skot) {
        skot.position[1] += skot.velocity;
        if (skot.position[1] > 1.0) {
            return false;
        }
        drawBullet(skot.position);

        // sér til þess að stroka út / fjarlægja önd ef hún kemur í snertingu við skotið 
        ducks = ducks.filter(function (duck) {
            if (checkCollision(skot.position, duck.position)) {
                return false;
            }
            return true;
        });

        return true;
    });

    if (skot.length === 0) {
        bulletActive = false;
    }

    window.requestAnimFrame(render);
}

// hönnun byssukúlu, punktarnir
function drawBullet(position) {
    var bulletVertices = [
        vec2(position[0] - 0.01, position[1] - 0.01),
        vec2(position[0] + 0.01, position[1] - 0.01),
        vec2(position[0] + 0.01, position[1] + 0.01),
        vec2(position[0] - 0.01, position[1] + 0.01)
    ];
    bulletBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bulletBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bulletVertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

// hönnun á öndunum
function drawDuck(position) {
    var duckVertices = [
        vec2(position[0] - duckSize, position[1] - duckSize),
        vec2(position[0] + duckSize, position[1] - duckSize),
        vec2(position[0] + duckSize, position[1] + duckSize),
        vec2(position[0] - duckSize, position[1] + duckSize)
    ];
    duckBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, duckBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(duckVertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function checkCollision(bulletPos, duckPos) {
    return bulletPos[0] > duckPos[0] - duckSize &&
        bulletPos[0] < duckPos[0] + duckSize &&
        bulletPos[1] > duckPos[1] - duckSize &&
        bulletPos[1] < duckPos[1] + duckSize;
}
