"use strict";

var gl;
var points;

var NumPoints = 50000;

var mouseX, mouseY;
var movement = false;

var zoom = 1.0;
var translation = vec2(0.0, 0.0);
var color = vec4(1.0, 0.0, 0.0, 1.0);

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // Initialize the corners of the Sierpinski Gasket
    var vertices = [
        vec2(-1, -1),
        vec2(0, 1),
        vec2(1, -1)
    ];

    // Initial point inside the triangle
    var u = add(vertices[0], vertices[1]);
    var v = add(vertices[0], vertices[2]);
    var p = scale(0.25, add(u, v));

    points = [p];

    for (var i = 0; points.length < NumPoints; ++i) {
        var j = Math.floor(Math.random() * 3);
        p = add(points[i], vertices[j]);
        p = scale(0.5, p);
        points.push(p);
    }


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var uTranslation = gl.getUniformLocation(program, "uTranslation");
    var uZoom = gl.getUniformLocation(program, "uZoom");
    var uColor = gl.getUniformLocation(program, "litur");

    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            var dx = 2 * (e.offsetX - mouseX) / canvas.width;
            var dy = -2 * (e.offsetY - mouseY) / canvas.height;
            translation = add(translation, vec2(dx, dy));
            mouseX = e.offsetX;
            mouseY = e.offsetY;
            render();
        }
    });

    canvas.addEventListener("wheel", function (e) {
        if (e.deltaY > 0) {
            zoom *= 1.1;
        } else {
            zoom /= 1.1;
        }
        render();
    });

    window.addEventListener("keydown", function (e) {
        if (e.keyCode === 32) {
            color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
            render();
        }
    });

    window.onclick, function (e) {
        var background = vec4(Math.random(), Math.random(), Math.random(), 1.0);
    }

    // Render function
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2fv(uTranslation, flatten(translation));
        gl.uniform1f(uZoom, zoom);
        gl.uniform4fv(uColor, flatten(color));

        gl.drawArrays(gl.POINTS, 0, points.length);
    }

    render();
};
