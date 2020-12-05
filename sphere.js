/**
 * @fileoverview Sphere - A simple 3D sphere using WebGL
 * @author Eric Shaffer
 */

/**
 * Global mesh for unit sphere, used to generate all other spheres
 */
var sphereSoup = [];
var sphereNormals = [];
var numT = sphereFromSubdivision(6,sphereSoup,sphereNormals);
//console.log("Generated ", numT, " triangles"); 

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;



/** Class implementing 3D sphere. */
class Sphere{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(radius, position, velocity, acceleration, color){
        this.radius = radius;
        this.position = position;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.color = color;
    }

    /**
     * Populates buffers with data for spheres
     */
    setupBuffers()
    {
        var sphereVertexPositions = new Float32Array(sphereSoup);
        for (i=0; i<sphereVertexPositions.length; i+=3){
            sphereVertexPositions[i] = sphereVertexPositions[i]*this.radius+this.position[0];
            sphereVertexPositions[i+1]= sphereVertexPositions[i+1]*this.radius+this.position[1];
            sphereVertexPositions[i+2]= sphereVertexPositions[i+2]*this.radius+this.position[2];
        }
        
        sphereVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, sphereVertexPositions, gl.STATIC_DRAW);
        sphereVertexPositionBuffer.itemSize = 3;
        sphereVertexPositionBuffer.numItems = numT*3;
        //console.log(sphereSoup.length/9);

        // Specify normals to be able to do lighting calculations
        sphereVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                      gl.STATIC_DRAW);
        sphereVertexNormalBuffer.itemSize = 3;
        sphereVertexNormalBuffer.numItems = numT*3;

        //console.log("Normals ", sphereNormals.length/3);     
    }

    /**
     * Draws a sphere from the sphere buffer
     */
    draw(){
     gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
     gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                             gl.FLOAT, false, 0, 0);

     // Bind normal buffer
     gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
     gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                               sphereVertexNormalBuffer.itemSize,
                               gl.FLOAT, false, 0, 0);
     gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
    }

}
