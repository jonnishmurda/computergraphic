/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Teiknar punkt á strigann þar sem notandinn smellir
//     með músinni
//
//    Hjálmtýr Hafsteinsson, ágúst 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// Þarf hámarksfjölda punkta til að taka frá pláss í grafíkminni
var maxNumPoints = 200;
var index = 0;

// stærð hrings
var numCirclePoints = 100;



window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 1.0, 1.0, 1.0);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumPoints * numCirclePoints, gl.DYNAMIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("mousedown", function (e) {

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

        //miðja
        var center = vec2(2 * e.offsetX / canvas.width - 1, 2 * (canvas.height - e.offsetY) / canvas.height - 1);

        var radius = Math.random() * 0.1 + 0.05;

        var circlePoints = createCirclePoints(center, radius, numCirclePoints);
        // Calculate coordinates of new point

        // Add new point behind the others
        for (var i = 0; i < circlePoints.length; i++) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(circlePoints[i]));
            index++;
        }

        render();
    });

    render();
}

function createCirclePoints(cent, rad, k) {
    points = [];
    var dAngle = 2 * Math.PI / k;
    for (var i = 0; i <= k; i++) {
        var a = i * dAngle;
        var p = vec2(rad * Math.cos(a) + cent[0], rad * Math.sin(a) + cent[1]);
        points.push(p);
    }
    return points;
}


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE, 0, index);

    window.requestAnimFrame(render);
}