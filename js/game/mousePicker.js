var MousePicker = function(ctx, precision) {
    this.ctx = ctx;
    this.framebuffer;
    this.texture;
    this.capture;
    this.mouse;
    this.objects = [];
    
    this.precision = precision;
    this.width = ctx.gl.viewportWidth * this.precision;
    this.height = ctx.gl.viewportHeight * this.precision;
    
    this._initFramebuffer();
};

MousePicker.prototype._initFramebuffer = function() {
    var gl = this.ctx.gl;

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, null);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

MousePicker.prototype.addObject = function(model, pickId) {
    var b = model.getBounds();
    var box = new Model(this.ctx, 'box');
    
    box.vertices = [
        b[0], b[2], b[5],
        b[1], b[2], b[5],
        b[1], b[3], b[5],
        b[0], b[3], b[5],
        b[0], b[2], b[4],
        b[0], b[3], b[4],
        b[1], b[3], b[4],
        b[1], b[2], b[4],
        b[0], b[3], b[4],
        b[0], b[3], b[5],
        b[1], b[3], b[5],
        b[1], b[3], b[4],
        b[0], b[2], b[4],
        b[1], b[2], b[4],
        b[1], b[2], b[5],
        b[0], b[2], b[5],
        b[1], b[2], b[4],
        b[1], b[3], b[4],
        b[1], b[3], b[5],
        b[1], b[2], b[5],
        b[0], b[2], b[4],
        b[0], b[2], b[5],
        b[0], b[3], b[5],
        b[0], b[3], b[4]
    ];
    
    box.indices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    
    box.bindBuffers();
    this.objects.push({
        model: box,
        pickId: pickId
    });
};

MousePicker.prototype.render = function(shader, model) {
    var gl = this.ctx.gl;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    
    gl.viewport(0, 0, this.width, this.height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    this.ctx.matrix.setIdentity();
    this.ctx.matrix.setUniforms(shader);
    
    shader.setColorId(-10);
    model.render(shader);
    
    for(var i = 0; i < this.objects.length; i++) {
        shader.setColorId(this.objects[i].pickId);
        this.objects[i].model.render(shader);
    }
    
    if (this.mouse && gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
        this.pixels = new Float32Array(4);
        gl.readPixels(this.mouse.x, this.mouse.y, 1, 1, gl.RGBA, gl.FLOAT, this.pixels);
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
};

MousePicker.prototype.updateMouse = function(mx, my) {
    this.mouse = {
        x: mx * this.precision,
        y: this.height - (my * this.precision)
    };
};

MousePicker.prototype.getCoordinates = function(mx, my) {
    if(!this.pixels || this.pixels[3] > 0.9 || this.pixels[0] === -1) {
        return undefined;
    }
    
    return [this.pixels[0], this.pixels[1], this.pixels[2]];
};


MousePicker.prototype.getObjectId = function(mx, my) {
    if(!this.pixels || this.pixels[0] !== -1) {
        return undefined;
    }
    
    return this.pixels[1];
};