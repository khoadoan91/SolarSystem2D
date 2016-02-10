var SUN_MASS = 200;
var EARTH_MASS = 10;
var GRAVITATION = 100;
var AM = new AssetManager();

window.onload = function () {
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var game = new GameEngine();
    game.init(ctx);
    var Sun = new Star(new Vector(0, 0), new Vector(0, 0));
    var Earth = new Planet(new Vector(150, 0), new Vector(0, -120), EARTH_MASS);
    Earth.addStar(Sun);
    game.addEntity(Sun);
    game.addEntity(Earth);
    game.start();
};

function Vector(x, y) {
    this.x = x; this.y = y;
}

Vector.prototype = {
    plus : function (other) {
        return new Vector(this.x + other.x, this.y + other.y);
    },

    times : function (factor) {
        return new Vector (this.x * factor, this.y * factor);
    },

    length : function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
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
    this.acceleration = new Vector(0, 0);
    this.mass = mass || 0;
    this.planet = null;
    this.removeFromWorld = false;
    this.trail = [];
}

function Star (pos, velocity) {
    Entity.call(this, pos, velocity, SUN_MASS);
}

Star.prototype = {
    addPlanet : function (planet) {
        this.planet = planet;
    },

    update : function (tick) {
        // this.trail.push(this.pos);
        // var radiusVector = this.planet.pos.plus(this.pos.times(-1));
        // var velC = Math.sqrt(G)
    },

    draw : function (ctx) {
        ctx.fillStyle = "Yellow";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 20, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function Planet (pos, velocity, mass) {
    Entity.call(this, pos, velocity, mass);
    this.star = null;
    this.trail = [];
}

Planet.prototype = {
    addStar : function(star) {
        this.star = star;
    },

    update : function (tick) {
        this.trail.push(this.pos);
        var radiusVector = this.star.pos.plus(this.pos.times(-1));
        var centripetalVelInit = this.vel.projectionOnto(radiusVector);
        var tangentVelInit = this.vel.plus(centripetalVelInit.times(-1));
        var velC = Math.sqrt(GRAVITATION * this.star.mass / radiusVector.length());
        var scale = velC / radiusVector.length();
        var centripetalVel = centripetalVelInit.plus(radiusVector.times(scale));
        var realVel = tangentVelInit.plus(centripetalVel);
        this.pos = this.pos.plus(realVel.times(tick));
        this.vel = realVel;
    },

    draw : function (ctx) {
        ctx.fillStyle = "Purple";
        if (this.trail.length > 1) {
            ctx.strokeStyle = "Purple";
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (var i = 1; i < this.trail.length; i += 1) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 10, 0, 2 * Math.PI);
        ctx.fill();
    }
}
