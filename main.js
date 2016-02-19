var SUN_MASS = 2 * Math.pow(10,30);      // 2 * Math.pow(10, 30);
var EARTH_MASS = 6 * Math.pow(10, 24);    // 6 * Math.pow(10, 24);
var MOON_MASS = 7.35 * Math.pow(10, 22);
var GRAVITATION = 6.67 * Math.pow(10, -11);
var EXAMPLE_MASS = 3 * Math.pow(10, 28);

window.onload = function () {

    var preset1 = [
        new Planet(new Vector(152 * Math.pow(10, 9), 0), new Vector(0, -30000), EARTH_MASS, 10),
        new Star(new Vector(0, 0), new Vector(0, 0), SUN_MASS)
    ];

    var preset2 = [
        new Planet(new Vector(151 * Math.pow(10, 9), 0), new Vector(0, -25230), MOON_MASS, 4),
        new Planet(new Vector(152 * Math.pow(10, 9), 0), new Vector(0, -30000), EARTH_MASS, 10),
        new Star(new Vector(0, 0), new Vector(0, 0), SUN_MASS)
    ];

    var preset3 = [
        new Planet(new Vector(-3.5 * Math.pow(10, 10), 0), new Vector(0, 1400), EXAMPLE_MASS, 10),
        new Planet(new Vector(-1 * Math.pow(10, 10), 0), new Vector(0, 14000), EXAMPLE_MASS, 10),
        new Planet(new Vector(Math.pow(10, 10), 0), new Vector(0, -14000), EXAMPLE_MASS, 10),
        new Planet(new Vector(3.5 * Math.pow(10, 10), 0), new Vector(0, -1400), EXAMPLE_MASS, 10)
    ]

    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var game = new GameEngine();
    game.init(ctx);
    // var Sun1 = new Star(new Vector(0, 0), new Vector(0, 0));
    // var Sun2 = new Star (new Vector(200, 0), new Vector(0, 0));
    // var Earth = new Planet(new Vector(150, 0), new Vector(-72, -93), EARTH_MASS);
    // Earth.addStar(Sun1);
    // Sun1.addPlanet(Earth);
    // Earth.addStar(Sun2);
    // game.addEntity(Sun2);
    // game.addEntity(Earth);
    // game.addEntity(Sun1);
    // var body = [];
    // body.push(new Planet(new Vector(-3.5 * Math.pow(10, 10), 0), new Vector(0, 1400), EXAMPLE_MASS));
    // body.push(new Planet(new Vector(-1 * Math.pow(10, 10), 0), new Vector(0, 14000), EXAMPLE_MASS));
    // body.push(new Planet(new Vector(Math.pow(10, 10), 0), new Vector(0, -14000), EXAMPLE_MASS));
    // body.push(new Planet(new Vector(3.5 * Math.pow(10, 10), 0), new Vector(0, -1400), EXAMPLE_MASS));
    // for (var i = 0; i < body.length; i += 1) {
    //     for (var j = 0; j < body.length; j += 1) {
    //         if (i !== j) {
    //             body[i].addOther(body[j]);
    //         }
    //     }
    //     game.addEntity(body[i]);
    // }
    var preset = preset3;
    for (var i = 0; i < preset.length; i += 1) {
        for (var j = 0; j < preset.length; j += 1) {
            if (i !== j) {
                preset[i].addOther(preset[j]);
            }
        }
        game.addEntity(preset[i]);
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
    this.mass = mass || 0;
    this.radius = Math.floor(this.mass / 10);
    this.trail = [];
    this.others = [];
    this.removeFromWorld = false;
}

Entity.prototype = {
    addOther : function (other) {
        this.others.push(other);
    },

    update : function (tick) {
        this.trail.push(this.pos);
        var totalForce = new Vector(0, 0);
        for (var i = 0; i < this.others.length; i += 1) {
            var delta = this.others[i].pos.plus(this.pos.times(-1));
            var distance = delta.magnitude();
            var f = (GRAVITATION * this.others[i].mass * this.mass) / (distance * distance);
            var force = delta.times(f / distance);
            totalForce = totalForce.plus(force);
        }
        var acceleration = totalForce.times(1/this.mass);
        this.vel = this.vel.plus(acceleration.times(tick));
        this.pos = this.pos.plus(this.vel.times(tick));
    },

    draw : function (ctx) {
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x / Math.pow(10, 8), this.trail[0].y / Math.pow(10, 8));
            for (var i = 1; i < this.trail.length; i += 1) {
                ctx.lineTo(this.trail[i].x / Math.pow(10, 8), this.trail[i].y / Math.pow(10, 8));
            }
            ctx.stroke();
        }
    }
};

function Star (pos, velocity) {
    Entity.call(this, pos, velocity, SUN_MASS);
}

Star.prototype = new Entity();
Star.prototype.constructor = Star;

Star.prototype.draw = function (ctx) {
    ctx.fillStyle = "Yellow";
    ctx.beginPath();
    ctx.arc(this.pos.x / Math.pow(10, 8), this.pos.y / Math.pow(10, 8), 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "Yellow";
    Entity.prototype.draw.call(this, ctx);
};

function Planet (pos, velocity, mass, radius) {
    Entity.call(this, pos, velocity, mass);
    this.radius = radius
}

Planet.prototype = Object.create(Entity.prototype);
Planet.prototype.constructor = Planet;

Planet.prototype.draw = function (ctx) {
    ctx.fillStyle = "Purple";
    ctx.beginPath();
    ctx.arc(this.pos.x / Math.pow(10, 8), this.pos.y / Math.pow(10, 8), this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "Purple";
    Entity.prototype.draw.call(this, ctx);
};
