var SUN_MASS = 200;
var EARTH_MASS = 10;
var GRAVITATION = 10000;   //6.67 * Math.pow(10. -11);
var AM = new AssetManager();

window.onload = function () {
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var game = new GameEngine();
    game.init(ctx);
    var Sun1 = new Star(new Vector(0, 0), new Vector(0, 0));
    // var Sun2 = new Star (new Vector(50, 0), new Vector(0, 0));
    var Earth = new Planet(new Vector(150, 0), new Vector(0, -120), EARTH_MASS);
    Earth.addStar(Sun1);
    game.addEntity(Sun1);
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

    lengthSquare : function() {
        return (this.x * this.x + this.y * this.y);
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
}

function Star (pos, velocity) {
    Entity.call(this, pos, velocity, SUN_MASS);
}

Star.prototype = {
    update : function (tick) {

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
        var delta = this.star.pos.plus(this.pos.times(-1));
        var distance = Math.sqrt(delta.lengthSquare());
        var f = (GRAVITATION * this.star.mass * this.mass) / (delta.lengthSquare());
        var force = delta.times(f / distance);
        var acceleration = force.times(1/this.mass);
        this.vel = this.vel.plus(acceleration.times(tick));
        this.pos = this.pos.plus(this.vel.times(tick));
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
