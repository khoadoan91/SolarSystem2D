var SUN_MASS = 2 * Math.pow(10, 30);
var EARTH_MASS = 6 * Math.pow(10, 24);
var MOON_MASS = 7.3 * Math.pow(10, 22);
var GRAVITATION = 6.67 * Math.pow(10, -11);    // m^3/(kg * s^2);
var TIME_UPDATE = 1000000;

window.onload = function () {
    var allPresets = [];
    var preset1 = [
        // distance from sun to earth is 152 * 10 ^ 9 meters
        new Planet(new Vector(752 * Math.pow(10, 9), 400 * Math.pow(10, 9)), new Vector(0, -26000), EARTH_MASS, 10),
        new Star(new Vector(600 * Math.pow(10, 9), 400 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30)
    ];

    var preset2 = [
        new Planet(new Vector(380 * Math.pow(10, 9), 270 * Math.pow(10, 9)), new Vector(-15000, 7000), MOON_MASS, 4),
        new Planet(new Vector(752 * Math.pow(10, 9), 400 * Math.pow(10, 9)), new Vector(0, -26000), EARTH_MASS, 10),
        new Star(new Vector(600 * Math.pow(10, 9), 400 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30)
    ];

    var preset3 = [
        new Star(new Vector(250 * Math.pow(10, 9), 400 * Math.pow(10, 9)), new Vector(0, -8000), SUN_MASS, 30),
        new Star(new Vector(850 * Math.pow(10, 9), 400 * Math.pow(10, 9)), new Vector(0, 7000), SUN_MASS, 30),
        new Planet(new Vector(102 * Math.pow(10, 9), 400 * Math.pow(10, 9)), new Vector(0, 12000), EARTH_MASS, 10)
    ];

    var preset5 = [
        new Star(new Vector(800 * Math.pow(10, 9), 400 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30),
        new Star(new Vector(400 * Math.pow(10,9), 400 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30),
        new Planet(new Vector(580 * Math.pow(10, 9), 270 * Math.pow(10, 9)), new Vector(-35000, 0), MOON_MASS, 4),
        new Planet(new Vector(800 * Math.pow(10, 9), 200 * Math.pow(10, 9)), new Vector(-30000, 12000), EARTH_MASS, 10)
    ];

    // var preset4 = [
    //     new Star(new Vector(429 * Math.pow(10, 9), 133 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30),
    //     new Star(new Vector(874 * Math.pow(10, 9), 250 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30),
    //     // new Star(new Vector(930 * Math.pow(10, 9), 550 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30),
    //     new Star(new Vector(520 * Math.pow(10, 9), 709 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30),
    //     // new Star(new Vector(140 * Math.pow(10, 9), 480 * Math.pow(10, 9)), new Vector(0, 0), SUN_MASS, 30),
    //     new Planet(new Vector(1082 * Math.pow(10, 9), 250 * Math.pow(10, 9)), new Vector(0, -20000), EARTH_MASS, 10)
    // ]
    allPresets.push(preset1);
    allPresets.push(preset2);
    allPresets.push(preset3);
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var game = new GameEngine();
    game.init(ctx);

    // var preset = allPresets[1];
    // for (var i = 0; i < preset.length; i += 1) {
    //     for (var j = 0; j < preset.length; j += 1) {
    //         if (i !== j) {
    //             preset[i].addOther(preset[j]);
    //         }
    //     }
    //     game.addEntity(preset[i]);
    // }

    var preset = preset5;
    for (var i = 0; i < preset.length; i += 1) {
        game.addEntity(preset[i]);
    }
    var earth = game.entities[game.entities.length - 1];
    var commet = game.entities[game.entities.length - 2];
    for (var i = 0; i < preset.length - 2; i += 1) {
        earth.addOther(game.entities[i]);
        commet.addOther(game.entities[i]);
    }
    console.log(preset);
    game.start();
};

function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype = {
    plus : function (other) {
        return new Vector(this.x + other.x, this.y + other.y);
    },

    times : function (factor) {
        return new Vector (this.x * factor, this.y * factor);
    },

    magnitude : function () {
        return Math.sqrt(this.dotProduct(this));
    },

    dotProduct : function(other) {
        return this.x * other.x + this.y * other.y;
    },

    projectionOnto : function(other) {
        var scale = this.dotProduct(other) / (other.x * other.x + other.y * other.y);
        return other.times(scale);
    }
}

function Entity(pos, velocity, mass) {
    this.pos = pos || new Vector(0, 0);
    this.vel = velocity || new Vector(0, 0);
    this.totalForce = new Vector(0, 0);
    this.mass = mass || 0;
    this.radius = Math.floor(this.mass / 10);
    this.trail = [];
    this.others = [];
    this.removeFromWorld = false;
    this.timeToUpdate = TIME_UPDATE;
}

Entity.prototype = {
    addOther : function (other) {
        this.others.push(other);
    },

    setInitialPosition : function (pos) {
        this.pos = pos;
    },

    setInitialVelocity : function (vel) {
        this.vel = vel;
    },

    setMass : function (mass) {
        this.mass = mass;
    },

    drawForceVector : function(ctx, startingPoint, force) {
        ctx.strokeStyle = "Black";
        var endPoint = {
            x : startingPoint.x + force.x,
            y : startingPoint.y + force.y
        }
        var scale = Math.pow(10, 27);
        ctx.beginPath();
        ctx.moveTo(startingPoint.x / Math.pow(10, 9), startingPoint.y / Math.pow(10, 9));
        ctx.lineTo(endPoint.x / scale, endPoint.y / scale);
        // console.log(endPoint.x / scale + " " + endPoint.y / scale);
        ctx.stroke();
    },

    update : function (tick, info) {
        this.timeToUpdate -= tick;
        this.trail.push(this.pos);
        // if (this.timeToUpdate === TIME_UPDATE) {
        //     this.pos = new Vector(info.children[2].value, info.children[3].value);
        //     this.mass = info.children[1].value;
        //     this.vel = new Vector(info.children[4].value, info.children[5].value);
        // }
        this.totalForce = new Vector(0, 0);
        for (var i = 0; i < this.others.length; i += 1) {
            var delta = this.others[i].pos.plus(this.pos.times(-1));
            var distance = delta.magnitude();
            var f = (GRAVITATION * this.others[i].mass * this.mass) / (distance * distance);
            var force = delta.times(f / distance);
            this.totalForce = this.totalForce.plus(force);
        }
        var acceleration = this.totalForce.times(1/this.mass);
        this.vel = this.vel.plus(acceleration.times(tick));
        this.pos = this.pos.plus(this.vel.times(tick));
        if (this.timeToUpdate <= 0) {
            info.children[2].value = this.pos.x;
            info.children[3].value = this.pos.y;
            info.children[4].value = this.vel.x;
            info.children[5].value = this.vel.y;
            this.timeToUpdate = TIME_UPDATE;
        }
    },

    draw : function (ctx) {
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x / Math.pow(10, 9), this.trail[0].y / Math.pow(10, 9));
            for (var i = 1; i < this.trail.length; i += 1) {
                ctx.lineTo(this.trail[i].x / Math.pow(10, 9), this.trail[i].y / Math.pow(10, 9));
            }
            ctx.stroke();
        }
    }
};

function Star (pos, velocity, mass, radius) {
    Entity.call(this, pos, velocity, mass);
    this.radius = radius;
}

Star.prototype = new Entity();
Star.prototype.constructor = Star;

Star.prototype.draw = function (ctx) {
    ctx.save();
    ctx.fillStyle = "#FD7D00";
    ctx.beginPath();
    ctx.arc(this.pos.x / Math.pow(10, 9), this.pos.y / Math.pow(10, 9), this.radius, 0, 2 * Math.PI);
    ctx.fill();
    // this.drawForceVector(ctx, this.pos, this.totalForce);
    ctx.strokeStyle = "#FD7D00";
    Entity.prototype.draw.call(this, ctx);
    ctx.restore();
};

function Planet (pos, velocity, mass, radius) {
    Entity.call(this, pos, velocity, mass);
    this.radius = radius;
}

Planet.prototype = Object.create(Entity.prototype);
Planet.prototype.constructor = Planet;

Planet.prototype.draw = function (ctx) {
    ctx.save();
    ctx.fillStyle = "#1E90FF";
    ctx.beginPath();
    ctx.arc(this.pos.x / Math.pow(10, 9), this.pos.y / Math.pow(10, 9), this.radius, 0, 2 * Math.PI);
    ctx.fill();
    // this.drawForceVector(ctx, this.pos, this.totalForce);
    ctx.strokeStyle = "#1E90FF";
    Entity.prototype.draw.call(this, ctx);
    ctx.restore();
};
