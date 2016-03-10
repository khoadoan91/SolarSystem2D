// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();


function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

function GameEngine() {
    this.entities = [];
    this.presets = [];
    this.showOutlines = false;
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;

    this.allPresets = null;
    this.speed = 100000;
    this.isStart = false;
    this.bg = null;
    this.grid = null;
    this.isStar = null;
    this.isPlanet = null;
}

GameEngine.prototype.clearElements = function () {
    this.isStart = false;
    this.entities = [];
    var parent = document.getElementById("info");
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
};

GameEngine.prototype.init = function (ctx, preset) {
    this.ctx = ctx;
    this.allPresets = preset;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    var that = this;

    document.getElementById('start').onclick = function () {
        that.isStart = true;
        console.log("start");
    };
    document.getElementById('stop').onclick = function () {
        that.isStart = false;
        console.log("pause");
    };
    document.getElementById('clear').onclick = function () {
        that.clearElements();
    };
    document.getElementById('apply-preset').onclick = function () {
        var presetOption = document.getElementById("preset");
        var presetIndex = presetOption.options[presetOption.selectedIndex].value;
        that.clearElements();
        var preset = that.presets[presetIndex];
        for (var i = 0; i < preset.length; i += 1) {
            that.addEntity(preset[i]);
        }
        for (var i = 0; i < preset.length; i += 1) {
            for (var j = 0; j < preset.length; j += 1) {
                if (i !== j && that.entities[i].type !== "Star") {
                    that.entities[i].addOther(that.entities[j]);
                }
            }
        }
    };
    document.getElementById('save-state').onclick = function () {
        that.saveState();
    }
    this.grid = document.getElementById('grid');
    this.bg = document.getElementById('bg');
    this.isStar = document.getElementById('star');
    this.isPlanet = document.getElementById('planet');
    // console.log(this.isStar.checked);
    this.startInput();
    this.timer = new Timer();
    console.log('game initialized');
}

GameEngine.prototype.addPreset = function (preset) {
    this.presets.push(preset);
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    this.draw(this.ctx);
    var that = this;
    (function gameLoop() {
        if (that.isStart) {
            that.loop();
        } else if (that.grid.checked !== this.showOutlines) {
            that.draw();
        }
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');
    var that = this;

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;
        return { x: x, y: y };
    }

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
        if (that.isStar.checked) {
            var createdStar = new Star(new Vector(that.click.x * Math.pow(10, 9), that.click.y * Math.pow(10, 9)),
                                new Vector(0, 0), SUN_MASS, 30);
            for (var i = 0; i < that.entities.length; i += 1) {
                that.entities[i].addOther(createdStar);
                createdStar.addOther(that.entities[i]);
            }
            that.addEntity(createdStar);
            that.isStar.checked = false;
        } else if (that.isPlanet.checked) {
            var createdPlanet = new Planet(new Vector(that.click.x * Math.pow(10, 9), that.click.y * Math.pow(10, 9)),
                                    new Vector(0, 0), EARTH_MASS, 10);
            for (var i = 0; i < that.entities.length; i += 1) {
                that.entities[i].addOther(createdPlanet);
                createdPlanet.addOther(that.entities[i]);
            }
            that.addEntity(createdPlanet);
            that.isPlanet.checked = false;
        }
    }, false);
}

GameEngine.prototype.saveState = function () {
    var content = [];
    for (var i = 0; i < this.entities.length; i += 1) {
        content.push(this.entities[i].toString());
    }
    socket.emit("save", { studentname: "Kyle Doan", statename: "entities", data : content });
    console.log("Saved");
}

GameEngine.prototype.loadState = function (data) {
    this.clearElements();
    var entity;
    var planets = [];
    for (var i = 0; i < data.length; i += 1) {
        switch (data[i].type) {
            case "Star":
                entity = new Star(new Vector(data[i].pos.x, data[i].pos.y),
                                new Vector(data[i].vel.x, data[i].vel.y),
                                data[i].mass, data[i].radius, data[i].trail);
                break;
            case "Planet" :
                entity = new Planet(new Vector(data[i].pos.x, data[i].pos.y),
                                new Vector(data[i].vel.x, data[i].vel.y),
                                data[i].mass, data[i].radius, data[i].trail);
                planets.push(entity);
                break;
            default: break;
        }
        if (entity !== undefined) this.addEntity(entity);
    }
    for (var i = 0; i < this.entities.length; i += 1) {
        for (var j = 0; j < planets.length; j += 1) {
            // var planet = planets[i], ent = this.entities[i];
            if (this.entities[i] !== planets[j]) {
                planets[j].addOther(this.entities[i]);
            }
        }
    }
    console.log(this.entities);
}

GameEngine.prototype.addEntity = function (entity) {
    this.entities.push(entity);
    // show the info of the entities.
    var label = document.createElement('Label');
    if (entity instanceof Star) {
        label.innerHTML = "Sun &nbsp;&nbsp;&nbsp;&nbsp;";
    } else if (entity instanceof Planet) {
        label.innerHTML = "Planet ";
    }
    var mass = document.createElement('input');
    mass.setAttribute('type', 'text');
    mass.setAttribute('value', entity.mass);
    var positionX = document.createElement('input');
    positionX.setAttribute('type', 'text');
    positionX.setAttribute('value', entity.pos.x);
    var positionY = document.createElement('input');
    positionY.setAttribute('type', 'text');
    positionY.setAttribute('value', entity.pos.y);
    var velX = document.createElement('input');
    velX.setAttribute('type', 'text');
    velX.setAttribute('value', entity.vel.x);
    var velY = document.createElement('input');
    velY.setAttribute('type', 'text');
    velY.setAttribute('value', entity.vel.y);
    var entityInfo = document.createElement('div');
    entityInfo.setAttribute('id', this.entities.length - 1);
    entityInfo.appendChild(label);
    entityInfo.appendChild(mass);
    entityInfo.appendChild(positionX);
    entityInfo.appendChild(positionY);
    entityInfo.appendChild(velX);
    entityInfo.appendChild(velY);
    var button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', 'Apply');
    button.onclick = function () {
        entity.setMass(Number(entityInfo.children[1].value));
        entity.setInitialPosition(new Vector(Number(entityInfo.children[2].value), Number(entityInfo.children[3].value)));
        entity.setInitialVelocity(new Vector(Number(entityInfo.children[4].value), Number(entityInfo.children[5].value)));
    }
    entityInfo.appendChild(button);

    var info = document.getElementById('info');
    info.appendChild(entityInfo);
    info.appendChild(document.createElement('br'));
    // console.log(entity.children[1].value);
}

GameEngine.prototype.draw = function () {
    if (this.bg.checked) {
        this.ctx.canvas.style.backgroundColor = "Black";
    } else {
        this.ctx.canvas.style.backgroundColor = "White";
    }
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (this.isStar.checked && this.mouse) {
        this.ctx.fillStyle = "#FD7D00";
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(this.mouse.x, this.mouse.y, 30, 0, 2 * Math.PI);
        this.ctx.fill();
    } else if (this.isPlanet.checked && this.mouse) {
        this.ctx.fillStyle = "#1E90FF";
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(this.mouse.x, this.mouse.y, 10, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    if (this.grid.checked) {
        this.showOutlines = this.grid.checked;
        this.ctx.strokeStyle = "Green";
        for (var y = 50; y < this.surfaceHeight; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.surfaceWidth, y);
            this.ctx.stroke();
        }
        for (var x = 50; x < this.surfaceWidth; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.surfaceHeight);
            this.ctx.stroke();
        }
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;
    var period = document.getElementById('range').value * this.clockTick * this.speed;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update(period, document.getElementById(i));
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.space = null;
}

// function Entity(game, x, y) {
//     this.game = game;
//     this.x = x;
//     this.y = y;
//     this.removeFromWorld = false;
// }
//
// Entity.prototype.update = function () {
// }
//
// Entity.prototype.draw = function (ctx) {
//     if (this.game.showOutlines && this.radius) {
//         this.game.ctx.beginPath();
//         this.game.ctx.strokeStyle = "green";
//         this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
//         this.game.ctx.stroke();
//         this.game.ctx.closePath();
//     }
// }
//
// Entity.prototype.rotateAndCache = function (image, angle) {
//     var offscreenCanvas = document.createElement('canvas');
//     var size = Math.max(image.width, image.height);
//     offscreenCanvas.width = size;
//     offscreenCanvas.height = size;
//     var offscreenCtx = offscreenCanvas.getContext('2d');
//     offscreenCtx.save();
//     offscreenCtx.translate(size / 2, size / 2);
//     offscreenCtx.rotate(angle);
//     offscreenCtx.translate(0, 0);
//     offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
//     offscreenCtx.restore();
//     //offscreenCtx.strokeStyle = "red";
//     //offscreenCtx.strokeRect(0,0,size,size);
//     return offscreenCanvas;
// }
