frameRate(60);//60 frames per second
angleMode = "radians";


var part = function(x, y){
   
	this.attached = [];
	this.len = [];
	this.id = 0;
	this.color = [16, 145, 40];
	this.name = "";
	this.pos = new PVector(x, y);
	this.pastPos = new PVector(x, y);
	this.setAng=0;
	this.cenAng=0;
	this.cenLen=0;
	this.mass = 1;
};

var linkedparts= function(x,y){
    this.parts = [];
    this.active = 0;
    this.dragging = false;
    this.lens = [];
    this.hp = 500;
    
    this.pos = new PVector(x, y);//center of mass
        
    this.velo = new PVector(0, 0);
    
    this.accel = new PVector(0, 10/60);
    
    this.ang = 0;
        
    this.angVelo = 2*PI/180;
    
    this.torque = 0;

};


part.prototype.setCenter = function(x,y){
    this.cenAng = atan2(this.pos.y-y,this.pos.x-x);
    this.cenLen = mag(this.pos.x-x,this.pos.y-y);
};



//whenever limbs lost or rotated
linkedparts.prototype.updateCenter = function(){
    var xSum = 0;
    var ySum = 0;
    var massSum = 0;
    for(var i = 0; i < this.parts.length;i++){
        xSum+=this.parts[i].pos.x*this.parts[i].mass;
        ySum+=this.parts[i].pos.y*this.parts[i].mass;
        massSum+=this.parts[i].mass;
    }
    this.pos.x = xSum/massSum;
    this.pos.y = ySum/massSum;
    for(var i = 0; i < this.parts.length;i++){
        this.parts[i].setCenter(this.pos.x,this.pos.y);
    }
};




linkedparts.prototype.getAttached = function(idSource, idAttached){
    return this.parts[this.parts[idSource].attached[idAttached]];
};

//optimizable
linkedparts.prototype.drawLimbs = function() {
    strokeWeight(3);
    for(var i = 0; i < this.parts.length; i++){
        stroke(this.parts[i].color[0], this.parts[i].color[1], this.parts[i].color[2]);
        for(var j = 0; j < this.parts[i].attached.length; j++){
            line(this.parts[i].pos.x, this.parts[i].pos.y, this.getAttached(i,j).pos.x, this.getAttached(i,j).pos.y);
        }
    }
};

linkedparts.prototype.drawJoints = function() {
    strokeWeight(2);
    for(var i = 0; i < this.parts.length; i++){
        stroke(255,255,255);
        point(this.parts[i].pos.x,this.parts[i].pos.y);
        
    }
};

linkedparts.prototype.draw = function() {
    this.drawLimbs();
    this.drawJoints();
};


linkedparts.prototype.updateVelo = function(){
    this.velo.x+=this.accel.x;
    this.velo.y+=this.accel.y;
};

linkedparts.prototype.updatePos = function(){
    this.pos.x+=this.velo.x;
    this.pos.y+=this.velo.y;
};

part.prototype.setPos = function(x,y){
    this.pos.x=x;
    this.pos.y=y;
};

linkedparts.prototype.updateAng = function(){
    this.ang+=this.angVelo;
};

linkedparts.prototype.rotate = function(){
    for(var i = 0; i < this.parts.length; i++){
        this.parts[i].setPos(cos(this.ang+this.parts[i].cenAng)*this.parts[i].cenLen+this.pos.x,sin(this.ang+this.parts[i].cenAng)*this.parts[i].cenLen+this.pos.y);
    }
};




linkedparts.prototype.act = function(){
  //this.updateVelo();
  //this.updatePos();
  this.updateAng();
  this.rotate();
  
  
  
  
    
};




linkedparts.prototype.createAnt = function(x,y){
    var head = new part(x+50,y);
    var neck = new part(x,y);
    var tail = new part(x-50,y);
    var tail2 = new part(x,y+25);
    
    this.parts = [head,neck,tail,tail2];
    
    for(var i = 0;i<this.parts.length;i++){
        this.parts[i].id = i;
    }
    
    head.attached = [neck.id];
    head.len = [10];
    
    neck.attached = [head.id,tail.id];
    neck.len = [10,20];
    
    tail.attached = [neck.id, tail2.id];
    tail.len = [20];
    
    
    

    this.updateCenter();

};

var ant = new linkedparts(100,100);
ant.createAnt(100,100);


var draw = function() {
    background(0, 0, 0);
    ant.act();
    ant.draw();
    point(ant.pos.x,ant.pos.y);
    println(ant.ang);
};


