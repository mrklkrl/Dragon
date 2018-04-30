
var canvas;
var gl;

var positionBuffer;
var triangleBuffer;
var normalBuffer;

var lightingShader;
var rainbowShader;
var goochShader;
var demon
 
var modelRotationX = 0;
var modelRotationY = 0;
var dragging = false;
var lastClientX;
var lastClientY;

//When the mouse is pressed
function onmousedown(event){
    dragging = true;
    lastClientX = event.clientX;
    lastClientY = event.clientY;
}

//When the mouse is released
function onmouseup(event){
    dragging = false;
}

//When the mouse is moving
function onmousemove(event){
    if(dragging)
    {
    dX = event.clientX - lastClientX;
    dY = event.clientY - lastClientY;
    
    modelRotationY = modelRotationY + dX;
    modelRotationX = modelRotationX + dY;
    
    if (modelRotationX > 90.0)
        modelRotationX = 90.0;
    if (modelRotationX < -90.0)
        modelRotationX = -90.0;
    
    requestAnimationFrame(draw);
    
    lastClientX = event.clientX;
    lastClientY = event.clientY;
    }
}
//creates a new shader object
function Shader(vertexId, fragmentId) {
    this.program = createProgram(gl, document.getElementById(vertexId).text, document.getElementById(fragmentId).text);
                                
    this.vertexPositionLocation = gl.getAttribLocation(this.program, "vertexPosition");
    this.vertexNormalLocation = gl.getAttribLocation(this.program, "vertexNormal");
                                
    this.modelMatrixLocation = gl.getUniformLocation(this.program, 'modelMatrix');
    this.viewMatrixLocation = gl.getUniformLocation(this.program, 'viewMatrix');
    this.projectionMatrixLocation = gl.getUniformLocation(this.program, 'projectionMatrix');
    this.modelColorLocation = gl.getUniformLocation(this.program, 'modelColor');
    this.lightColorLocation = gl.getUniformLocation(this.program, 'lightColor');
    this.lightPositionLocation = gl.getUniformLocation(this.program, 'lightPosition');
    
    gl.enableVertexAttribArray(this.vertexPositionLocation);
    gl.enableVertexAttribArray(this.vertexNormalLocation);
}
//allows us to use a specified shader program
Shader.prototype.use = function(projectionMatrix, viewMatrix, modelMatrix) {
    gl.useProgram(this.program);
    
    gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
    gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
    gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
    
    gl.uniform3f(this.modelColorLocation, 0.734375,0.7734375,0.82);
    gl.uniform3f(this.lightColorLocation, 0.8,0.8,1.0);
    gl.uniform4f(this.lightPositionLocation, 1.0,1.0,1.0,1.0);
}
    //creates an object model
function Model(model) {
    //Declares the buffers for what we are rendering
    this.positionBuffer = gl.createBuffer();
    this.triangleBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();

    var positions =[];
    
    for(var i = 0 ; i < model.positions.length ; i++){
        for(var j = 0 ; j < 3; j++)
        positions.push(model.positions[i][j]/500);
    }
    //Takes the positions from cube.js and flattens the array
    this.positionArray = new Float32Array(positions);
    
    //Binds position buffer and attaches it to the position array
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);
    
    //Takes normals and flattens them
    this.normalArray = new Float32Array(flatten(calcNorm()));
    
    //Binds normal buffer and attaches it to the normal array       
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normalArray, gl.STATIC_DRAW);
    
    //Takes the positions from cube.js and flattens the array
    this.triangleArray = new Uint16Array(flatten(model.triangles));

    //Binds triangle buffer and attaches it to the triangle array       
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);
    
    
}
//renders the model. A shader object, along with transformation coordinates are accepted as arguments
Model.prototype.draw = function(currentShader, X, Y, Z) {
    var viewMatrix = new Matrix4();
    var projectionMatrix = new Matrix4();    
    
    //Moves the cube away on the z axis
    viewMatrix.translate(0,0,-3);
    
    //Shows how you percieve the cube (FOV, ratio, closest render point, fartherst r.p.)
    projectionMatrix.perspective(45, 1, 1, 10);

    var modelMatrix = new Matrix4();

    modelMatrix.rotate(modelRotationX, 1, 0, 0);
    modelMatrix.rotate(modelRotationY, 0, 1, 0);
    modelMatrix.translate(X,Y,Z);
    currentShader.use(projectionMatrix, viewMatrix, modelMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);     
    gl.vertexAttribPointer(currentShader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(currentShader.vertexNormalLocation,3,gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.drawElements(gl.TRIANGLES, this.triangleArray.length, gl.UNSIGNED_SHORT, 0)
}
//initializes canvas, creates shader objects and model objects
function init(){
    
    //Grabs the canvas from the html document
    canvas = document.getElementById("webgl");
    gl = getWebGLContext(canvas, false);
    
    lightingShader = new Shader("vertexShader", "lightingFragmentShader");
    rainbowShader = new Shader("vertexShader", "rainbowFragmentShader");
    goochShader = new Shader("vertexShader", "goochFragmentShader");
    Demon = new Model(demon);
    //connects the canvas to our mouse function events
    canvas.onmousedown = onmousedown;
    canvas.onmouseup = onmouseup;
    canvas.onmousemove = onmousemove;
    
    //Enables checking for Depth
    gl.enable(gl.DEPTH_TEST);
    
    //Request to draw
    requestAnimationFrame(draw);
}
//used to change a 2d array into 1d
function flatten(a){
    return a.reduce(function (b, v) { b.push.apply(b, v); return b }, [])
};
//draws the model obects
function draw(){
    //Clears the screen
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
    //Demon.draw(goochShader,-0.8,0.0,-1.0);
    Demon.draw(lightingShader,0.0,-0.3,0.0);
    //Demon.draw(rainbowShader,0.8,0.0,-1.0);
}


function add(a,b)
{
    return [  a[0] + b[0], a[1] + b[1], a[2] + b[2] ]; 
}

function sub(a,b)
{
    return [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ]; 
}

    function dot(a,b)
{
    var n = 0, lim = Math.min(a.length,b.length);
    for (var i = 0; i < lim; i++) n += a[i] * b[i];
    return n;
    }

function cross(a,b)
{
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ]; 
}

function normalize(a)
{
    var len = Math.sqrt(dot(a,a));

    return [
        a[0] / len,
        a[1] / len,
        a[2] / len 
    ];
}

function calcNorm()
{
    var Normals = [];

    var n = [0,0,0];

    for (var i = 0; i < demon.positions.length; i++)
    {
        Normals.push(n);
    }

    for (var j = 0; j < demon.triangles.length; j++)
    {
        var a = sub(demon.positions[demon.triangles[j][1]], demon.positions[demon.triangles[j][0]]);
        var b = sub(demon.positions[demon.triangles[j][2]],demon.positions[demon.triangles[j][0]]);

        a = normalize(a);
        b = normalize(b);

        n = normalize(cross(a,b));

        Normals[demon.triangles[j][0]]   = add(Normals[demon.triangles[j][0]], n);
        Normals[demon.triangles[j][1]] = add(Normals[demon.triangles[j][1]], n);
        Normals[demon.triangles[j][2]] = add(Normals[demon.triangles[j][2]], n);
    }

    for (var k = 0; k < Normals.length; k++)
    {
        n = normalize(n);
    }

    return Normals;
}
        