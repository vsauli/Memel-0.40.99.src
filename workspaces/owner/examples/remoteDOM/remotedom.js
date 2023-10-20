// Remote DOM test
////#pragma noremotedom
//#pragma dombuffersize 200
//#pragma sequential
__remoteDOM("__tvar.canvas = __tvar.document.createElement('canvas');");
__remoteDOM("__tvar.canvas.setAttribute('width', 200);");
__remoteDOM("__tvar.canvas.setAttribute('height', 100);");
__remoteDOM("__tvar.context = __tvar.canvas.getContext('2d');");
__remoteDOM("__tvar.imageData = __tvar.context.getImageData(0,0,200,100);");
__remoteDOM("__tvar.pixels = __tvar.imageData.data;");

for (var i=0; i<200; i++) {
    putPixel(i, 5, 64, 128, 196, 200);
    }

__remoteDOM("__tvar.context.putImageData(__tvar.imageData, 0, 0);");
__remoteDOM("__tvar.elem = __tvar.document.getElementById(__tid);");
__remoteDOM("__tvar.elem.appendChild(__tvar.canvas);");

function putPixel(x, y, r, g, b, w) {
    const offset = (y * w + x) * 4;
    __remoteDOM("__tvar.pixels["+offset+"] = "+r+";");
    __remoteDOM("__tvar.pixels["+offset+"+1"+"]="+g+";");
    __remoteDOM("__tvar.pixels["+offset+"+2"+"]="+b+";");
    __remoteDOM("__tvar.pixels["+offset+"+3"+"]=255;");
}
