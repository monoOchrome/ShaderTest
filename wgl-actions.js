WGL.actions = {
    trigger: function(program){
        var that = this;
        return {
            name: 'trigger',
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
                    this.parent.textures[1].active = true;
                    this.parent.displacer.active = true;
                    this.parent.bindTexture(0, this.parent.textures[this.parent.activeTextureIndex].texture);
                    this.parent.bindTexture(1, this.parent.textures[1].texture);
                    this.parent.bindTexture(2, this.parent.displacer.texture);
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
                if(this.parent.lock) return this.parent.activeTextureIndex;
                this.parent.lock = true;
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
                
                return this.parent.activeTextureIndex;
            },
            prev: function(uniforms){
                if(this.parent.lock) return this.parent.activeTextureIndex;
                this.parent.lock = true;
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

                return this.parent.activeTextureIndex;
            },
            goto: function(index, uniforms){
                if(this.parent.lock) return this.parent.activeTextureIndex;
                this.parent.lock = true;
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

                return this.parent.activeTextureIndex;
            }
        }
    },
    move: function(program){
        var that = this;
        return {
            name: 'move',
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
                this.currentX = this.currentY = this.targetX = this.targetY = 0
                for(var i = 0; i < this.parent.textures.length; i++){
                    this.parent.textures[i].active = false;
                }
                this.parent.bindTexture(0, null);
                this.parent.bindTexture(1, null);
                this.parent.gl.useProgram(null);
            },
            listener: {
                added: false,
                type: 'mousemove',
                handler: function(event){
                    if(this.parent.lock) return;
                    this.targetX = (this.parent.gl.canvas.width / 2 - event.clientX) / (this.parent.gl.canvas.width / 2);
                    this.targetY = (this.parent.gl.canvas.height / 2 - event.clientY) / (this.parent.gl.canvas.height / 2);
                    this.enable();
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
            name: 'orientation',
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
                this.currentX = this.currentY = this.targetX = this.targetY = 0;
                for(var i = 0; i < this.parent.textures.length; i++){
                    this.parent.textures[i].active = false;
                }
                this.parent.bindTexture(0, null);
                this.parent.bindTexture(1, null);
                this.parent.gl.useProgram(null);
            },
            listener: {
                added: false,
                type: 'deviceorientation',
                handler: function(event){
                    if(this.parent.lock) return;
                    if(this.startAlpha === null) this.startAlpha = event.alpha;
                    if(this.startBeta === null) this.startBeta = event.beta;

                    // this.targetX = -WGL.utils.clamp(event.alpha - this.startAlpha, -this.maxTilt, this.maxTilt) / this.maxTilt;
                    // this.targetY = -WGL.utils.clamp(event.beta - this.startBeta, -this.maxTilt, this.maxTilt) / this.maxTilt;
                    this.enable();
                }
            }
        }
    }
};