WGL = {
    sources: [],
    supports: function(){
        try{
            var canvas = document.getElementsByTagName('canvas')[0] || document.createElement('canvas'); 
            return !!window.WebGLRenderingContext && !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        }catch(error){ return false; }
    },
    with: function(selector){
        var c = document.querySelector(selector);
        var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        var entity = WGL.entity();
        entity.gl = gl;
        this.sources.push(entity);
        return entity;
    }
};