frameRate(60);//60 frames per second
angleMode = "radians";

//connects bones together

var part = function(e1, e2){
   
    this.ends = [e1, e2];//joint connections
    this.vertexs = [];//corners of part
    this.pos = new PVector(0, 0);//center
    this.id = 0;
    this.color = [230, 0, 255];
    this.name = "";
    this.mass = 1;
    this.width = 10;
};

var joint = function(x, y){
   
    this.attached = [];//bone connections
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

var body= function(x,y){
    this.joints = [];
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


joint.prototype.setCenter = function(x,y){
    this.cenAng = atan2(this.pos.y-y,this.pos.x-x);
    this.cenLen = mag(this.pos.x-x,this.pos.y-y);
};



//whenever limbs lost or rotated
body.prototype.updateCenter = function(){
    var xSum = 0;
    var ySum = 0;
    var massSum = 0;
    for(var i = 0; i < this.joints.length;i++){
        xSum+=this.joints[i].pos.x*this.joints[i].mass;
        ySum+=this.joints[i].pos.y*this.joints[i].mass;
        massSum+=this.joints[i].mass;
    }
    this.pos.x = xSum/massSum;
    this.pos.y = ySum/massSum;
    for(var i = 0; i < this.joints.length;i++){
        this.joints[i].setCenter(this.pos.x,this.pos.y);
    }
};




body.prototype.getAttached = function(idSource, idAttached){
    return this.joints[this.joints[idSource].attached[idAttached]];
};

//optimizable

body.prototype.drawLimbs = function(){
    noStroke();
    for(var i = 0; i < this.parts.length; i++){
        fill(this.parts[i].color[0], this.parts[i].color[1], this.parts[i].color[2]);
        quad(this.parts[i].vertexs[0].x, this.parts[i].vertexs[0].y, this.parts[i].vertexs[1].x, this.parts[i].vertexs[1].y, this.parts[i].vertexs[2].x, this.parts[i].vertexs[2].y, this.parts[i].vertexs[3].x, this.parts[i].vertexs[3].y);
    }
};

body.prototype.drawBones = function() {
    strokeWeight(3);
    for(var i = 0; i < this.joints.length; i++){
        stroke(this.joints[i].color[0], this.joints[i].color[1], this.joints[i].color[2]);
        for(var j = 0; j < this.joints[i].attached.length; j++){
            line(this.joints[i].pos.x, this.joints[i].pos.y, this.getAttached(i,j).pos.x, this.getAttached(i,j).pos.y);
        }
    }
};

body.prototype.drawJoints = function() {
    strokeWeight(2);
    for(var i = 0; i < this.joints.length; i++){
        stroke(255,255,255);
        point(this.joints[i].pos.x,this.joints[i].pos.y);
        
    }
};

body.prototype.draw = function() {
    this.drawLimbs();
    this.drawBones();
    this.drawJoints();
};


body.prototype.updateVelo = function(){
    this.velo.x+=this.accel.x;
    this.velo.y+=this.accel.y;
};

body.prototype.updatePos = function(){
    this.pos.x+=this.velo.x;
    this.pos.y+=this.velo.y;
};

joint.prototype.setPos = function(x,y){
    this.pos.x=x;
    this.pos.y=y;
};

body.prototype.updateAng = function(){
    this.ang+=this.angVelo;
};

body.prototype.rotate = function(){
    for(var i = 0; i < this.joints.length; i++){
        this.joints[i].setPos(cos(this.ang+this.joints[i].cenAng)*this.joints[i].cenLen+this.pos.x,sin(this.ang+this.joints[i].cenAng)*this.joints[i].cenLen+this.pos.y);
    }
};








part.prototype.initSquare = function(){
    for(var i = 0; i < 4; i++){
        this.vertexs[i] = new PVector(0,0);   
    }
};


body.prototype.getEnds = function(id){
    return [this.joints[this.parts[id].ends[0]].pos, this.joints[this.parts[id].ends[1]].pos];
};


var getUV = function(p1, p2) {
    var magni = mag(p2.x-p1.x,p2.y-p1.y);
    return new PVector((p2.x-p1.x)/magni,(p2.y-p1.y)/magni);
};

var getNrmUV = function(p1, p2) {
    var magni = mag(p2.x-p1.x,p2.y-p1.y);
    return new PVector(-(p2.y-p1.y)/magni,(p2.x-p1.x)/magni);
};

body.prototype.updateVertexs = function(){
    var ends;
    var nrm;
    
    for(var i = 0; i < this.parts.length; i++){
        ends = this.getEnds(i);
        nrm = getNrmUV(ends[0],ends[1]);
        this.parts[i].vertexs[0].x=ends[0].x+nrm.x*this.parts[i].width/2;
        this.parts[i].vertexs[0].y=ends[0].y+nrm.y*this.parts[i].width/2;
        this.parts[i].vertexs[1].x=ends[1].x+nrm.x*this.parts[i].width/2;
        this.parts[i].vertexs[1].y=ends[1].y+nrm.y*this.parts[i].width/2;
        this.parts[i].vertexs[2].x=ends[1].x-nrm.x*this.parts[i].width/2;
        this.parts[i].vertexs[2].y=ends[1].y-nrm.y*this.parts[i].width/2;
        this.parts[i].vertexs[3].x=ends[0].x-nrm.x*this.parts[i].width/2;
        this.parts[i].vertexs[3].y=ends[0].y-nrm.y*this.parts[i].width/2;
    }
    
};

body.prototype.act = function(){
  this.updateVelo();
  //this.updatePos();
  this.updateAng();
  this.rotate();
  this.updateVertexs();
  
};

body.prototype.createAnt = function(x,y){
    var head = new joint(x+50,y);
    var neck = new joint(x,y);
    var tail = new joint(x-50,y);
    var tail2 = new joint(x,y+25);
    
    this.joints = [head,neck,tail,tail2];
    
    for(var i = 0;i<this.joints.length;i++){
        this.joints[i].id = i;
    }
    
    head.attached = [neck.id];
    head.len = [10];
    
    neck.attached = [head.id,tail.id];
    neck.len = [10,20];
    
    tail.attached = [neck.id, tail2.id];
    tail.len = [20];
    
    var p_head = new part(head.id,neck.id);
    var p_body = new part(neck.id,tail.id);
    var p_tail = new part(tail.id,tail2.id);
    
    this.parts = [p_head, p_body, p_tail];
    
    for(var i = 0;i<this.parts.length;i++){
        this.parts[i].id = i;
        this.parts[i].initSquare();
    }

    this.updateCenter();
    this.updateVertexs();

};




var ant = new body(100,100);
ant.createAnt(100,100);


var draw = function() {
    background(0, 0, 0);
    ant.act();
    ant.draw();
    point(ant.pos.x,ant.pos.y);
    //println(ant.parts[0].vertexs);
};


