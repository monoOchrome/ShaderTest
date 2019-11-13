WGL.actions = {
    trigger: function(program){
        var that = this;
        return {
            parent: that,
            program: program,
            enable: function(){
                if(this.parent.currentAction != this){
                    if(this.parent.currentAction) this.parent.currentAction.disable();
                    this.parent.currentAction = this;
                    this.parent.currentProgram = this.program;
                    this.parent.gl.useProgram(this.program);
                    this.parent.gl.uniform1i(this.parent.gl.getUniformLocation(this.program, "u_image"), 0);
                    this.parent.gl.uniform1i(this.parent.gl.getUniformLocation(this.program, "u_image1"), 1);
                    this.parent.gl.uniform1i(this.parent.gl.getUniformLocation(this.program, "u_image2"), 2);
                    this.parent.textures[this.parent.activeTextureIndex].active = true;
                    this.parent.bindTexture(0, this.parent.textures[this.parent.activeTextureIndex].texture);
                    this.parent.resize();
                }
            },
            disable: function(){
                for(var i = 0; i < this.parent.textures.length; i++){
                    this.parent.textures[i].active = false;
                }
                this.parent.bindTexture(0, null);
                this.parent.bindTexture(1, null);
                this.parent.bindTexture(2, null);
                this.parent.gl.useProgram(null);
            },
            next: function(uniforms){
                if(this.animationFrame) return this.parent.activeTextureIndex;
                this.enable();
                if(uniforms){
                    for(var key in uniforms) this.parent.set1f(key, uniforms[key]);
                }

                var nextIndex = (this.parent.activeTextureIndex + 1 > this.parent.textures.length - 1) ? 0 : this.parent.activeTextureIndex + 1;
                this.parent.textures[this.parent.activeTextureIndex].active = false;
                this.parent.textures[nextIndex].active = true;
                this.parent.bindTexture(0, this.parent.textures[this.parent.activeTextureIndex].texture);
                this.parent.bindTexture(1, this.parent.textures[nextIndex].texture);
                this.parent.bindTexture(2, this.parent.displacer.texture);
                this.parent.activeTextureIndex = nextIndex;
                
                this.animationFrame = requestAnimationFrame(this.animate.bind(this));
                return this.parent.activeTextureIndex;
            },
            prev: function(uniforms){
                if(this.animationFrame) return this.parent.activeTextureIndex;
                this.enable();
                if(uniforms){
                    for(var key in uniforms) this.parent.set1f(key, uniforms[key]);
                }

                var prevIndex = (this.parent.activeTextureIndex - 1 < 0) ? this.parent.textures.length - 1 : this.parent.activeTextureIndex - 1;
                this.parent.textures[this.parent.activeTextureIndex].active = false;
                this.parent.textures[prevIndex].active = true;
                this.parent.bindTexture(0, this.parent.textures[this.parent.activeTextureIndex].texture);
                this.parent.bindTexture(1, this.parent.textures[prevIndex].texture);
                this.parent.bindTexture(2, this.parent.displacer.texture);
                this.parent.activeTextureIndex = prevIndex;

                this.animationFrame = requestAnimationFrame(this.animate.bind(this));
                return this.parent.activeTextureIndex;
            },
            goto: function(index, uniforms){
                if(this.animationFrame) return this.parent.activeTextureIndex;
                this.enable();
                if(uniforms){
                    for(var key in uniforms) this.parent.set1f(key, uniforms[key]);
                }

                this.parent.textures[this.parent.activeTextureIndex].active = false;
                this.parent.textures[index].active = true;
                this.parent.bindTexture(0, this.parent.textures[this.parent.activeTextureIndex].texture);
                this.parent.bindTexture(1, this.parent.textures[index].texture);
                this.parent.bindTexture(2, this.parent.displacer.texture);
                this.parent.activeTextureIndex = index;

                this.animationFrame = requestAnimationFrame(this.animate.bind(this));
                return this.parent.activeTextureIndex;
            },
            animate: function(time){
                this.parent.lock = true;
                if(!this.start) this.start = time;
                this.parent.gl.uniform1f(this.parent.gl.getUniformLocation(this.program, "disp"), WGL.utils.outExpo((time - this.start) / 1000));
                this.parent.resize();
                if(time - this.start <= 1000) this.animationFrame = requestAnimationFrame(this.animate.bind(this));
                else{
                    cancelAnimationFrame(this.animationFrame);
                    this.animationFrame = this.start = null;
                    this.parent.textures[this.parent.activeTextureIndex].active = true;
                    this.parent.bindTexture(0, this.parent.textures[this.parent.activeTextureIndex].texture);
                    this.parent.gl.uniform1f(this.parent.gl.getUniformLocation(this.program, "disp"), 0);
                    this.parent.resize();
                    this.parent.lock = false;
                }
            },
        }
    },
    move: function(program){
        var that = this;
        return {
            parent: that,
            program: program,
            enable: function(){
                if(this.parent.currentAction != this){
                    if(this.parent.currentAction) this.parent.currentAction.disable();
                    this.parent.currentAction = this;
                    if(this.currentX === undefined) this.currentX = this.currentY = this.targetX = this.targetY = 0;
                    this.parent.currentProgram = this.program;
                    this.parent.gl.useProgram(this.program);
                    this.parent.gl.uniform1i(this.parent.gl.getUniformLocation(this.program, "u_image"), 0);
                    this.parent.gl.uniform1i(this.parent.gl.getUniformLocation(this.program, "u_image1"), 1);
                    this.parent.textures[this.parent.activeTextureIndex].active = true;
                    this.parent.bindTexture(0, this.parent.textures[this.parent.activeTextureIndex].texture);
                    this.parent.bindTexture(1, this.parent.textures[this.parent.activeTextureIndex].blend.texture);
                    if(!this.listener.added){
                        this.listener.added = true;
                        this.parent.gl.canvas.addEventListener(this.listener.type, this.listener.handler.bind(this));
                    }
                }
            },
            disable: function(){
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
                this.currentX = this.currentY = this.targetX = this.targetY = 0
                for(var i = 0; i < this.parent.textures.length; i++){
                    this.parent.textures[i].active = false;
                }
                this.parent.bindTexture(0, null);
                this.parent.bindTexture(1, null);
                this.parent.gl.useProgram(null);
            },
            animate: function(){
                if(this.parent.currentProgram != this.program || this.parent.lock){
                    cancelAnimationFrame(this.animationFrame);
                    this.animationFrame = null;
                    return;
                }
                if(this.parent.textures[this.parent.activeTextureIndex].blend.shaderData){
                    for(var key in this.parent.textures[this.parent.activeTextureIndex].blend.shaderData){
                        this.parent.set1f(key, this.parent.textures[this.parent.activeTextureIndex].blend.shaderData[key]);
                    }
                }
                this.currentX += .05 * (this.targetX - this.currentX);
                this.currentY += .05 * (this.targetY - this.currentY);
                this.parent.gl.uniform2f(this.parent.gl.getUniformLocation(this.program, 'mouse'), parseFloat(this.currentX.toFixed(2)), parseFloat(this.currentY.toFixed(2)));
                this.parent.resize();
                if(this.currentX.toFixed(6) == this.targetX.toFixed(6) && this.currentY.toFixed(6) == this.targetY.toFixed(6)){
                    cancelAnimationFrame(this.animationFrame);
                    this.animationFrame = null;
                }else this.animationFrame = requestAnimationFrame(this.animate.bind(this));
            },
            listener: {
                added: false,
                type: 'mousemove',
                handler: function(event){
                    if(this.parent.lock) return;
                    this.targetX = (this.parent.gl.canvas.width / 2 - event.clientX) / (this.parent.gl.canvas.width / 2);
                    this.targetY = (this.parent.gl.canvas.height / 2 - event.clientY) / (this.parent.gl.canvas.height / 2);
                    this.enable();
                    if(!this.animationFrame) this.animationFrame = requestAnimationFrame(this.animate.bind(this));
                }
            }
        }
    },
    orientation: function(program){
        if(!window.DeviceOrientationEvent){
            console.warn('Device orientation is not supported.');
            return null;
        }
        var that = this;
        return {
            parent: that,
            program: program,
            maxTilt: 15,
            startAlpha: null,
            startBeta: null,
            enable: function(){
                if(this.parent.currentAction != this){
                    if(this.parent.currentAction) this.parent.currentAction.disable();
                    this.parent.currentAction = this;
                    if(this.currentX === undefined) this.currentX = this.currentY = this.targetX = this.targetY = 0;
                    this.maxTilt = 15;
                    this.parent.currentProgram = this.program;
                    this.parent.gl.useProgram(this.program);
                    this.parent.gl.uniform1i(this.parent.gl.getUniformLocation(this.program, "u_image"), 0);
                    this.parent.gl.uniform1i(this.parent.gl.getUniformLocation(this.program, "u_image1"), 1);
                    this.parent.textures[this.parent.activeTextureIndex].active = true;
                    this.parent.bindTexture(0, this.parent.textures[this.parent.activeTextureIndex].texture);
                    this.parent.bindTexture(1, this.parent.textures[this.parent.activeTextureIndex].blend.texture);
                    if(!this.listener.added){
                        this.listener.added = true;
                        window.addEventListener(this.listener.type, this.listener.handler.bind(this));
                    }
                }
            },
            disable: function(){
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
                this.currentX = this.currentY = this.targetX = this.targetY = 0;
                for(var i = 0; i < this.parent.textures.length; i++){
                    this.parent.textures[i].active = false;
                }
                this.parent.bindTexture(0, null);
                this.parent.bindTexture(1, null);
                this.parent.gl.useProgram(null);
            },
            animate: function(){
                if(this.parent.currentProgram != this.program || this.parent.lock){
                    cancelAnimationFrame(this.animationFrame);
                    this.animationFrame = null;
                    return;
                }
                if(this.parent.textures[this.parent.activeTextureIndex].blend.shaderData){
                    for(var key in this.parent.textures[this.parent.activeTextureIndex].blend.shaderData){
                        this.parent.set1f(key, this.parent.textures[this.parent.activeTextureIndex].blend.shaderData[key]);
                    }
                }
                this.currentX += .05 * (this.targetX - this.currentX);
                this.currentY += .05 * (this.targetY - this.currentY);
                this.parent.gl.uniform2f(this.parent.gl.getUniformLocation(this.program, 'mouse'), parseFloat(this.currentX.toFixed(2)), parseFloat(this.currentY.toFixed(2)));
                this.parent.resize();
                if(this.currentX.toFixed(6) == this.targetX.toFixed(6) && this.currentY.toFixed(6) == this.targetY.toFixed(6)){
                    cancelAnimationFrame(this.animationFrame);
                    this.animationFrame = null;
                }else this.animationFrame = requestAnimationFrame(this.animate.bind(this));
            },
            listener: {
                added: false,
                type: 'deviceorientation',
                handler: function(event){
                    if(this.parent.lock) return;
                    if(this.startAlpha === null) this.startAlpha = event.alpha;
                    if(this.startBeta === null) this.startBeta = event.beta;

                    this.targetX = -WGL.utils.clamp(event.alpha - this.startAlpha, -this.maxTilt, this.maxTilt) / this.maxTilt;
                    this.targetY = -WGL.utils.clamp(event.beta - this.startBeta, -this.maxTilt, this.maxTilt) / this.maxTilt;
                    this.enable();
                    if(!this.animationFrame) this.animationFrame = requestAnimationFrame(this.animate.bind(this));
                }
            }
        }
    }
};