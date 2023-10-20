var SCENE = {
    camera: new Vector3(0, 0, 2),
    imagePlane: {
	topLeft: new Vector3(-1.28, 0.86, -0.5),
	topRight: new Vector3(1.28, 0.86, -0.5),
	bottomLeft: new Vector3(-1.28, -0.86, -0.5),
	bottomRight: new Vector3(1.28, -0.86, -0.5)
    },
    ia: new Color(0.5, 0.5, 0.5),
    lights: [
	{
    	    position: new Vector3(-3, -0.5, 1),
    	    id: new Color(0.8, 0.3, 0.3),
    	    is: new Color(0.8, 0.8, 0.8)
	},
	{
    	    position: new Vector3(-3, 0, 1),  // added
    	    id: new Color(0.8, 0.3, 0.3),
    	    is: new Color(0.8, 0.8, 0.8)
	},
	{
    	    position: new Vector3(3, 2, 1),
    	    id: new Color(0.4, 0.4, 0.9),
    	    is: new Color(0.8, 0.8, 0.8)
	}
    ],
    objects: [
	new Sphere(
    	    new Vector3(-1.1, 0.6, -1),
    	    0.2,
    	    {
    		ka: new Color(0.1, 0.1, 0.1),
    		kd: new Color(0.5, 0.5, 0.9),
    		ks: new Color(0.7, 0.7, 0.7),
    		alpha: 20,
    		kr: new Color(0.1, 0.1, 0.2)
    	    }
	    ),
	new Sphere(
    	    new Vector3(0.2, -0.1, -1),
    	    0.5,
    	    {	
    		ka: new Color(0.1, 0.1, 0.1),
    		kd: new Color(0.9, 0.5, 0.5),
    		ks: new Color(0.7, 0.7, 0.7),
    		alpha: 20,
    		kr: new Color(0.2, 0.1, 0.1)

    	    }
	    ),
	new Sphere(
    	    new Vector3(1.2, -0.5, -1.75),
    	    0.4,
    	    {
    		ka: new Color(0.1, 0.1, 0.1),
    		kd: new Color(0.1, 0.5, 0.1),
    		ks: new Color(0.7, 0.7, 0.7),
    		alpha: 20,
    		kr: new Color(0.8, 0.9, 0.8)
    	    }
	    )
	]
};

//var nobj = 3;
for (var j=3; j<=3000; j++) {
//    for (var k=0; k<nobj; k++) {
//	SCENE.objects[j*nobj+k] = SCENE.objects[k];
	SCENE.objects[j] = SCENE.objects[1];
//	}
