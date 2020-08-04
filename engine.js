frameRate(60);//60 frames per second
angleMode = "radians";

var keys = [];

keyPressed = function() {
    if(keyCode === 32)//spacebar
    {
        keys[0] = true;
    }
    
};

keyReleased = function() {

    if(keyCode === 32)//spacebar
    {
        keys[0] = false;
        
    }
};


//connects bones together
var game = function(){
    this.actors = [];
    this.floor = 375;
};

var part = function(e1, e2){
   
    this.ends = [e1, e2];//joint connections
    this.vertexs = [];//corners of part
    this.pos = new PVector(0, 0);//center
    this.id = 0;
    this.color = [230, 0, 255];
    this.name = "";
    this.mass = 1;
    this.sF = 0.9;//static friction
    this.kF = 0.1;//kinetic friction
    this.bounce = 0.1;
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
    
    this.maxlen = 0;
    
    this.pos = new PVector(x, y);//center of mass, make actual center of body eventually
        
    this.velo = new PVector(0, 0);
    
    this.accel = new PVector(0, 10/60);
    
    this.ang = 0;
        
    this.angVelo = 2*PI/180 * 0;
    
    this.torque = 0;
    
    this.inertia = 0;
    
    this.mass = 0;

};


joint.prototype.setCenter = function(x,y){
    this.cenAng = atan2(this.pos.y-y,this.pos.x-x);
    this.cenLen = mag(this.pos.x-x,this.pos.y-y);
};


body.prototype.updateInertia = function(){
    this.inertia = 0;
    for(var i = 0; i < this.parts.length;i++){
        this.parts[i].cenLen = mag(this.parts[i].pos.x-this.pos.x, this.parts[i].pos.y-this.pos.y);
        this.inertia +=  this.parts[i].mass* this.parts[i].cenLen* this.parts[i].cenLen;
    }
};

//whenever limbs lost or rotated
body.prototype.updateCenter = function(){
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
    this.mass = massSum;
    this.updateInertia();
    
    this.maxLen = 0;
    for(var i = 0; i < this.joints.length;i++){
        this.joints[i].setCenter(this.pos.x,this.pos.y);
        if(this.joints[i].cenLen>this.maxLen){
            this.maxLen = this.joints[i].cenLen;
        }
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

//using angle and radius
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

var getDot = function(p1, p2) {
    return p1.x*p2.x+p1.y*p2.y;
};


var getCross = function(p1, p2) {
    return p1.x*p2.y-p1.y*p2.x;
};


body.prototype.updateParts = function(){
    var ends;
    var nrm;
    
    for(var i = 0; i < this.parts.length; i++){
        ends = this.getEnds(i);
        nrm = getNrmUV(ends[0],ends[1]);
        this.parts[i].pos.x=(ends[0].x+ends[1].x)/2;
        this.parts[i].pos.y=(ends[0].y+ends[1].y)/2;
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


var rotateVector = function(p, rad) {
    var cs = cos(rad);
    var sn = sin(rad);
    return new PVector(cs*p.x-sn*p.y,sn*p.x+cs*p.y);
};

//ang velocity of last and present
body.prototype.getVertexVelo = function(contact){
    var endPoint = new PVector(contact.x-this.pos.x,contact.y-this.pos.y);
    
    var startPoint = rotateVector(endPoint, -this.angVelo);
    startPoint.x-=this.velo.x;
    startPoint.y-=this.velo.y;
    
    
    return new PVector(endPoint.x-startPoint.x,endPoint.y-startPoint.y);
};

game.prototype.collideActvAct = function(id, id){
    
};


//sat collisions check
game.prototype.checkActvAct = function(id, id){
    
};



game.prototype.collideActvFloor = function(id, part, contact){
    println(id);
    var velocity = this.actors[id].getVertexVelo(contact);
    //println(velocity);
    //println(mag(velocity.x,velocity.y));
    if(velocity.y<0){// || this.actors[id].velo.y<0){
        return;   
    }
    
    var impulse = new PVector(0,0);
    
    impulse.x = -(1+part.bounce)*(velocity.x)/(1/this.actors[id].mass+(velocity.x*velocity.x)/this.actors[id].inertia);
    //impulse.x=0;
    impulse.y = -(1+part.bounce)*(velocity.y)/(1/this.actors[id].mass+(velocity.x*velocity.x)/this.actors[id].inertia);
    
    this.actors[id].velo.x+=impulse.x/this.actors[id].mass;
    this.actors[id].velo.y+=impulse.y/this.actors[id].mass;
    
    
    var relContact = new PVector(contact.x-this.actors[id].pos.x,contact.y-this.actors[id].pos.y);
    println(mag(relContact.x,relContact.y));
    this.actors[id].angVelo+=getCross(relContact,impulse)/this.actors[id].inertia;
    
    
    
};

game.prototype.checkActvFloor = function(id){
    for(var i = 0; i < this.actors[id].parts.length; i++){
        for(var j = 0; j < this.actors[id].parts[i].vertexs.length; j++){
            if(this.actors[id].parts[i].vertexs[j].y>this.floor){
                this.collideActvFloor(id,  this.actors[id].parts[i], this.actors[id].parts[i].vertexs[j]);
                return;
            }
        }
    }
};




game.prototype.checkCollisions = function(){
    
    
    //quick check for floor
    for(var i = 0; i<this.actors.length ;i++){
        if(this.floor-this.actors[i].pos.y<this.actors[i].maxLen){
                this.checkActvFloor(i);
            }
    }
    
    
    //quick check between actors
    for(var i = 0; i<this.actors.length-1;i++){
        for(var j = i+1; j<this.actors.length;j++){
            if(mag(this.actors[j].pos.x-this.actors[i].pos.x,this.actors[j].pos.y-this.actors[i].pos.y)<this.actors[j].maxLen+this.actors[i].maxLen){
                //this.checkActvAct(i,j);
            }
        }
    }
};




body.prototype.act = function(){
  this.updateVelo();
  this.updatePos();
  this.updateAng();
  this.rotate();
  this.updateParts();
  
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
    this.updateParts();
    this.updateCenter();
    

};

game.prototype.initGame = function(){

    var ant = new body(300,300);
    ant.createAnt(300,300);
    
    
    var ant2 = new body(300,300);
    ant2.createAnt(300,300);
    
    this.actors[0] = ant;
    this.actors[1] = ant2;

};


game.prototype.act = function(){
    for (var i = 0; i<this.actors.length;i++){
        this.actors[i].act();
    }
    this.checkCollisions();
};

game.prototype.draw = function(){
    for (var i = 0; i<this.actors.length;i++){
        this.actors[i].draw();
    }
    stroke(255, 0, 0);
    line(-10000,this.floor,10000,this.floor);
};

var game = new game();
game.initGame();

var draw = function() {
    pushMatrix();
    if(keys[0]){
    background(0, 0, 0);
    game.act();
    
    translate(250-game.actors[0].pos.x,250-game.actors[0].pos.y);
    
    game.draw();
    point(game.actors[0].pos.x,game.actors[0].pos.y);
    var PE = 1/2*game.actors[0].mass*10/60*(game.floor-game.actors[0].pos.y);
    var KE = 1/2*game.actors[0].mass*pow(mag(game.actors[0].velo.x,game.actors[0].velo.y),2)+1/2*game.actors[0].inertia*pow(game.actors[0].angVelo,2);
    //println(PE);
    //println(KE);
    //println(PE+KE);
    //println(game.actors[0].pos.y);
     //println('');
    }
    
};


