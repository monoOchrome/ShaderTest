WGL.entity = function(){
    return{
        actions: {},
        activeTextureIndex: 0,
        buffers: {},
        currentProgram: null,
        displacer:  null,
        locations: {},
        programIndex: -1,
        textures: [],
        start: null,
        lock: false,
        animate: function(time){
            if(this.currentAction){
                if(this.currentAction.name == 'trigger'){
                    this.gl.useProgram(this.currentProgram);
                    this.lock = true;
                    if(!this.start) this.start = time;
                    this.gl.uniform1f(this.gl.getUniformLocation(this.currentProgram, "disp"), WGL.utils.outExpo((time - this.start) / 1000));
                    this.resize();
                    if(time - this.start >= 1000){
                        this.start = null;
                        this.textures[this.activeTextureIndex].active = true;
                        this.bindTexture(0, this.textures[this.activeTextureIndex].texture);
                        this.gl.uniform1f(this.gl.getUniformLocation(this.currentProgram, "disp"), 0);
                        this.resize();
                        this.currentAction = null;
                        this.lock = false;
                    }
                }else if((this.currentAction.name == 'move' || this.currentAction.name == 'orientation') && !this.lock){
                    if(this.textures[this.activeTextureIndex].blend.shaderData){
                        for(var key in this.textures[this.activeTextureIndex].blend.shaderData){
                            this.set1f(key, this.textures[this.activeTextureIndex].blend.shaderData[key]);
                        }
                    }
                    this.currentAction.currentX += .05 * (this.currentAction.targetX - this.currentAction.currentX);
                    this.currentAction.currentY += .05 * (this.currentAction.targetY - this.currentAction.currentY);
                    this.gl.uniform2f(this.gl.getUniformLocation(this.currentProgram, 'mouse'), parseFloat(this.currentAction.currentX.toFixed(2)), parseFloat(this.currentAction.currentY.toFixed(2)));
                    this.resize();
                    if(this.currentAction.currentX.toFixed(6) == this.currentAction.targetX.toFixed(6) && this.currentAction.currentY.toFixed(6) == this.currentAction.targetY.toFixed(6))
                        this.currentAction = null;
                }
            }

            requestAnimationFrame(this.animate.bind(this));
        },
        bindTexture: function(index, texture){
            this.gl.activeTexture(this.gl['TEXTURE' + index]);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        },
        blend: function(imageData){
            if(typeof imageData === 'object' && imageData.hasOwnProperty('length')) return this.resources(imageData, 'blend');
            return this.resource(imageData, 'blend');
        },
        destroy: function(){
            window.removeEventListener(this.listener.type, this.listener.handler);
            if(this.animationFrame) cancelAnimationFrame(this.animationFrame);
            this.gl.useProgram(null);
            for(var key in this.buffers){
                this.gl.deleteBuffer(this.buffers[key])
            }
            for(var i = 0; i <= this.programIndex; i++) this.gl.deleteProgram(this['program' + i]);
            WGL.sources.splice(WGL.sources.indexOf(this), 1);
        },
        displace: function(imageData){
            return this.resource(imageData, 'displace');
        },
        on: function(){
            for(var i = 0; i < arguments.length; i++){
                if(WGL.utils.isMobile() && arguments[i] == 'move') arguments[i] = 'orientation';
                if(this.actions[arguments[i]]) console.warn('WGL has already an action type of ' + arguments[i] + '. An override will occur.');
                this.actions[arguments[i]] = WGL.actions[arguments[i]].call(this, this['program' + this.programIndex]);
            }
            return this;
        },
        onComplete: function(callback){
            var done = true;
            if(this.displacer && !this.displacer.loaded) done = false;
            for(var j = 0; j < this.textures.length; j++){
                if(!this.textures[j].loaded) done = false;
                else if(this.textures[j].blend && !this.textures[j].blend.loaded) done = false;
            }

            if(done){
                for(var key in this.actions) if(this.actions[key]) this.actions[key].enable();
                this.animate();
                callback.call(this);
            }else setTimeout(function(){ this.onComplete(callback); }.bind(this), 50);
            return this;
        },
        resize: function(){
            var dw = this.gl.canvas.clientWidth;
            var dh = this.gl.canvas.clientHeight;
            if(this.gl.canvas.width != dw || this.gl.canvas.height != dh){
                this.gl.canvas.width = dw;
                this.gl.canvas.height = dh;
                this.gl.viewport(0, 0, dw, dh);
            }
            this.gl.uniform2f(this.gl.getUniformLocation(this.currentProgram, 'u_res'), dw, dh);
            if(this.textures){
                for(var j = 0; j < this.textures.length; j++){
                    if(this.textures[j].active) this.textures[j].draw.call(this, this.textures[j]);
                }
                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
            }
        },
        resource: function(imageData, type){
            var resource = {
                active: false,
                image: new Image(),
                loaded: false,
                type: type || 'resource',
                load: function(resource){
                    if(this.locations['a_position'] === undefined){
                        this.buffers['a_position'] = this.gl.createBuffer();
                        this.locations['a_position'] = this.gl.getAttribLocation(this['program' + this.programIndex], 'a_position');
                        this.gl.enableVertexAttribArray(this.locations['a_position']);
                    }
                    
                    if(this.locations['a_texCoord'] === undefined){
                        this.buffers['a_texCoord'] = this.gl.createBuffer();
                        this.locations['a_texCoord'] = this.gl.getAttribLocation(this['program' + this.programIndex], "a_texCoord");
                        this.gl.enableVertexAttribArray(this.locations['a_texCoord']);
                    }
                    
                    var texture = this.gl.createTexture();
                    this.bindTexture(3, texture);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, resource.image);

                    resource.texture = texture;
                    resource.loaded = true;
                },
                draw: function(resource){
                    var sx = this.gl.canvas.clientWidth / resource.image.width;
                    var sy = this.gl.canvas.clientHeight / resource.image.height;
                    var s = Math.max(sx, sy);
                    var x = (this.gl.canvas.clientWidth - (resource.image.width * s)) / 2;
                    var y = (this.gl.canvas.clientHeight - (resource.image.height * s)) / 2;

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers['a_position']);
                    this.gl.vertexAttribPointer(this.locations['a_position'], 2, this.gl.FLOAT, false, 0, 0);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(WGL.utils.defineRect(x, y, resource.image.width * s, resource.image.height * s)), this.gl.STATIC_DRAW);
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers['a_texCoord']);
                    this.gl.vertexAttribPointer(this.locations['a_texCoord'], 2, this.gl.FLOAT, false, 0, 0);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(WGL.utils.defineRect(0, 0, 1, 1)), this.gl.STATIC_DRAW);
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
                }
            };
            if(resource.type == 'resource') this.textures.push(resource);
            else if(this.textures.length > 0 && resource.type == 'blend'){
                for(var i = 0; i < this.textures.length; i++){
                    if(!this.textures[i].blend){
                        this.textures[i].blend = resource;
                        break;
                    }
                }
            }else if(type == 'displace') this.displacer = resource;
            resource.image.onload = resource.load.bind(this, resource);
            resource.image.src = imageData.url;
            resource.shaderData = imageData.shaderData;

            return this;
        },
        resources: function(imageData, type){
            for(var i = 0; i < imageData.length; i++) this.resource(imageData[i], type);
            return this;
        },
        set1f: function(name, value){
            this.gl.uniform1f(this.gl.getUniformLocation(this.currentProgram, name), value);
            return this;
        },
        using: function(vertexShader, fragmentShader){
            if(!vertexShader){
                console.error('No vertex shader supplied.');
                return null;
            }
            if(!fragmentShader){
                console.error('No fragment shader supplied.');
                return null;
            }

            var vs = this.gl.createShader(this.gl.VERTEX_SHADER);
            this.gl.shaderSource(vs, vertexShader);
            this.gl.compileShader(vs);
            if(!this.gl.getShaderParameter(vs, this.gl.COMPILE_STATUS)){
                console.error("Vertex Shader Error: ", this.gl.getShaderInfoLog(vs));
                return null;
            }

            var fs = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            this.gl.shaderSource(fs, fragmentShader);
            this.gl.compileShader(fs);
            if(!this.gl.getShaderParameter(fs, this.gl.COMPILE_STATUS)) {
                console.error("Fragment Shader Error: ", this.gl.getShaderInfoLog(fs));
                return null;
            }
            
            this.programIndex++;
            var p = this.gl.createProgram();
            this.gl.attachShader(p, vs);
            this.gl.attachShader(p, fs);
            this.gl.linkProgram(p);
            this.gl.detachShader(p, vs);
            this.gl.detachShader(p, fs);
            this.gl.deleteShader(vs);
            this.gl.deleteShader(fs);
            this['program' + this.programIndex] = p;

            this.locations['u_res' + this.programIndex] = this.gl.getUniformLocation(p, "u_res");
            if(!this.locations['u_res' + this.programIndex]){
                console.error('Missing resolution uniform (u_res) in Vertex Shader.');
                return null;
            }
            if(this.programIndex == 0) window.addEventListener('resize', this.resize.bind(this));

            return this;
        }
    }
};