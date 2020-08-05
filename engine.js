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

//stores past and present values, present values meant to be updated all at once
var pointStorage = function(){
    this.present = 0;
    
    this.storage = [];
    
    this.length = 0;
    this.autoSave = true;
       
};

//Object.defineProperty(pointStorage.prototype, 'length', {get: function() {
//   return this.length;
//}});

pointStorage.prototype.initStorage = function(pointslen,memory){
    this.length = pointslen;
    for(var i = 0; i<memory; i++){
        var holder = [];
        for(var j = 0; j<pointslen; j++){
            holder.push(new PVector(0,0));
        }
        this.storage.push(holder);
    }
};

pointStorage.prototype.setPoint = function(index,point){
    
    //change storage array when first index set
    if(this.autoSave && index === 0){
        this.present=(this.present+1)%this.storage.length;
    }
    
    this.storage[this.present][index].x = point.x;
    this.storage[this.present][index].y = point.y;
    
    
};

pointStorage.prototype.setPointX = function(index,value){
    //change storage array when first index set (assumes x is changed before y)
    if(this.autoSave && index === 0){
        this.present=(this.present+1)%this.storage.length;
    }
    this.storage[this.present][index].x = value;

};

pointStorage.prototype.setPointY = function(index,value){
    
    this.storage[this.present][index].y = value;
    
};

pointStorage.prototype.getPoint = function(index){
    
    return this.storage[this.present][index];
    
};

pointStorage.prototype.getPast = function(){
    var index = arguments[0];
    var select = 1;
    if(arguments.length===2){
        select = arguments[1];
    }
    
    var past = this.present-select;
    if(past<0){
        past+=this.storage.length;
    }

    return this.storage[past][index];
};

//connects bones together
var game = function(){
    this.actors = [];
    this.floor = 375;
};

var part = function(e1, e2){
   
    this.ends = [e1, e2];//joint connections
    this.vertexs = new pointStorage();//corners of part
    this.pos = new PVector(0, 0);//center
    this.id = 0;
    this.color = [230, 0, 255];
    this.name = "";
    this.mass = 1;
    this.sF = 0.9;//static friction
    this.kF = 0.1;//kinetic friction
    this.bounce = 0.10;
    this.width = 10;
    this.parallelS = true;//parallel sides
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
        quad(this.parts[i].vertexs.getPoint(0).x, this.parts[i].vertexs.getPoint(0).y, this.parts[i].vertexs.getPoint(1).x, this.parts[i].vertexs.getPoint(1).y, this.parts[i].vertexs.getPoint(2).x, this.parts[i].vertexs.getPoint(2).y, this.parts[i].vertexs.getPoint(3).x, this.parts[i].vertexs.getPoint(3).y);
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
    this.vertexs.initStorage(4,2);   
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

        this.parts[i].vertexs.setPointX(0,ends[0].x-nrm.x*this.parts[i].width/2);
        this.parts[i].vertexs.setPointY(0,ends[0].y-nrm.y*this.parts[i].width/2);
        this.parts[i].vertexs.setPointX(1,ends[0].x+nrm.x*this.parts[i].width/2);
        this.parts[i].vertexs.setPointY(1,ends[0].y+nrm.y*this.parts[i].width/2);
        this.parts[i].vertexs.setPointX(2,ends[1].x+nrm.x*this.parts[i].width/2);
        this.parts[i].vertexs.setPointY(2,ends[1].y+nrm.y*this.parts[i].width/2);
        this.parts[i].vertexs.setPointX(3,ends[1].x-nrm.x*this.parts[i].width/2);
        this.parts[i].vertexs.setPointY(3,ends[1].y-nrm.y*this.parts[i].width/2);
        
    }
    
};


var rotateVector = function(p, rad) {
    var cs = cos(rad);
    var sn = sin(rad);
    return new PVector(cs*p.x-sn*p.y,sn*p.x+cs*p.y);
};

//ang velocity of last and present
//can be shortened by saving last points
body.prototype.getVertexVelo = function(contact){
    var endPoint = new PVector(contact.x-this.pos.x,contact.y-this.pos.y);
    
    var startPoint = rotateVector(endPoint, -this.angVelo);
    
    //println(this.angVelo);
    
    startPoint.x-=this.velo.x;
    startPoint.y-=this.velo.y;
    
    
    return new PVector(endPoint.x-startPoint.x,endPoint.y-startPoint.y);
};

game.prototype.collideActvAct = function(contacts){
    for(var i = 0; i<contacts.length; i++){
        var id1 = contacts[i][0];
        var p1 = contacts[i][1];
        var id2 = contacts[i][2];
        var p2 = contacts[i][3];

        
        this.actors[id1].parts[p1].color[0] = 245;
        this.actors[id1].parts[p1].color[1] = 233;
        this.actors[id1].parts[p1].color[2] = 66;
  
        this.actors[id2].parts[p2].color[0] = 245;
        this.actors[id2].parts[p2].color[0] = 164;
        this.actors[id2].parts[p2].color[0] = 66;
        
    
        
    }
};


var checkUnbounded = function(vertexs, nrmDir, min, max){
        for(var v = 0; v < vertexs.length; v++){
            var bound = getDot(vertexs[v],nrmDir);
            if(bound > min && bound < max){
                return false;
            }
        }
    
    return true;
    
};

var getBounds = function(vertexs, nrmDir){
    var min = Infinity;
    var max = -Infinity;
    for(var v = 0; v < vertexs.length; v++){
        var bound = getDot(nrmDir,vertexs.getPoint(v));
        if(bound<min){
            min = bound;
        }
        if(bound>max){
            max = bound;
        }
    }
    
    return [min,max];
    
};



//sat collisions check
//unoptimized for squares 
//(memory vs speed)
//speed: save all bounds for own normals


game.prototype.checkActvAct = function(id1, id2){
    var body1 = this.actors[id1];
    var body2 = this.actors[id2];
    var contacts = [];
    var collision = true;
    var simple1 = 1;
    var simple2 = 1;
    
    var nrmDirs1 = [];//might not be nessesary depending on algorithm
    var bounds11 = [];
    var bounds12 = [];
    
    var nrmDirs2 = [];
    var bounds21 = [];
    var bounds22 = [];
    
    
    
    for(var p1 = 0; p1 < body1.parts.length; p1++){
        if(body1.parts[p1].parallelS){
            simple1 = 2;
        }
        else{
            simple1 = 1;
        }
        var vertexs1 = body1.parts[p1].vertexs;
        var nrmDirs1 = [];
        

        for(var v1 = 0; v1 < vertexs1.length/simple1; v1++){
            nrmDirs1.push(getNrmUV(vertexs1.getPoint(v1),vertexs1.getPoint((v1+1)%vertexs1.length)));
        }
        
        
        for(var n1 = 0; n1<nrmDirs1.length; n1++){
            bounds11[n1]=getBounds(vertexs1,nrmDirs1[n1]);
        }
        
        
        
        for(var p2 = 0; p2 < body2.parts.length; p2++){
            if(body2.parts[p2].parallelS){
                simple2 = 2;
            }
            else{
                simple2 = 1;
            }
            var vertexs2 = body2.parts[p2].vertexs;
            var nrmDirs2 = [];
            for(var v2 = 0; v2 < vertexs2.length/simple2; v2++){
                nrmDirs2.push(getNrmUV(vertexs2.getPoint(v2),vertexs2.getPoint((v2+1)%vertexs2.length)));
            }
            
            for(var n1 = 0; n1<nrmDirs1.length; n1++){
                bounds12[n1]=getBounds(vertexs2,nrmDirs1[n1]);
            }
            
            
            for(var n2 = 0; n2<nrmDirs2.length; n2++){
                bounds21[n2]=getBounds(vertexs1,nrmDirs2[n2]);
                bounds22[n2]=getBounds(vertexs2,nrmDirs2[n2]);
            }
            
            
            
            
            collision = true;
            var pener = 0;
            var minPen = Infinity;
            var minPenN = 0;
            
            
            for(var b = 0; b<nrmDirs1.length; b++){
                if(bounds11[b][0]>bounds12[b][1] || bounds11[b][1]<bounds12[b][0]){
                    collision = false;
                    break;
                }
                else{
                    var pen = min(bounds11[b][1]-bounds12[b][0],bounds12[b][1]-bounds11[b][0]);
                    if(minPen>pen){
                     pener = 2;
                     minPen =  pen;
                     var minPenN = nrmDirs1[b];
                    }
                }
            }
            
            if(!collision){
                continue;
            }

            
            collision = true;
            for(var b = 0; b<nrmDirs2.length; b++){
                if(bounds21[b][0]>bounds22[b][1] || bounds21[b][1]<bounds22[b][0]){
                    collision = false;
                    
                    
                    break;
                }
                else{
                    var pen = min(bounds21[b][1]-bounds22[b][0],bounds22[b][1]-bounds21[b][0]);
                    if(minPen>pen){
                     pener = 1;
                     minPen =  pen;
                     var minPenN = nrmDirs2[b];
                    }
                }
            }
            
            if(collision){
                if(pener === 1){
                    contacts.push([id1,p1,id2,p2,minPenN]); //p1 penetrated p2
                }
                else{
                    contacts.push([id2,p2,id1,p1,minPenN]); //p1 penetrated p2
                }
            }
            
        }
    }
    
    this.collideActvAct(contacts);
    
    
};



game.prototype.collideActvFloor = function(id,contacts){
    //first get velo of each
    
    var veloChange = new PVector(0,0);
    var angChange = 0;
    var posChange = 0;
    
    var maxPenetrate = 0;
    
    for(var i = 0; i<contacts.length; i++){
        var part = this.actors[id].parts[contacts[i][0]];
        var contact = part.vertexs.getPoint(contacts[i][1]);
        
        
        var velocity = this.actors[id].getVertexVelo(contact);
        //var velocity = new PVector(contact.x-part.vertexs.getPast(contacts[i][1]).x,contact.y-part.vertexs.getPast(contacts[i][1]).y);
        //velocity.y+=10/60;
        
        
        var impulse = new PVector(0,0);
        
        var relContact = new PVector(contact.x-this.actors[id].pos.x,contact.y-this.actors[id].pos.y);
        
        impulse.x = -(1+part.bounce)*(velocity.x)/(1/this.actors[id].mass+(relContact.x*relContact.x)/this.actors[id].inertia);
        impulse.y = -(1+part.bounce)*(velocity.y)/(1/this.actors[id].mass+(relContact.x*relContact.x)/this.actors[id].inertia);
        

        
        
        veloChange.x+=(impulse.x/this.actors[id].mass)/contacts.length;
        veloChange.y+=(impulse.y/this.actors[id].mass)/contacts.length;
        
        //println(this.actors[id].velo.y);
        
        
        angChange+=(getCross(relContact,impulse)/this.actors[id].inertia)/contacts.length;
        
        if(contact.y>maxPenetrate){
           maxPenetrate=contact.y;
        }
        
    }
    
    this.actors[id].velo.x+=veloChange.x;
    this.actors[id].velo.y+=veloChange.y;
    this.actors[id].angVelo+=angChange;
    if(maxPenetrate+this.actors[id].velo.y>375){
        this.actors[id].pos.y+=(375-maxPenetrate+this.actors[id].velo.y);
        //this.actors[id].pos.y+=(375-maxPenetrate)*0.3;
    }
    
};

//if point is under floor, has downwards velocity, and of a unique joint, collide
game.prototype.checkActvFloor = function(id){
    
    
    var contacts = [];
    
    var blacklist = [];
    
    var lowLim;
    var highLim;
    var halfPoint;
    
    for(var i = 0; i < this.actors[id].parts.length; i++){
        lowLim = 0;
        highLim = this.actors[id].parts[i].vertexs.length;
        halfPoint = highLim/2;
        for(var b = 0; b<blacklist.length; b++){
            if(this.actors[id].parts[i].ends[0] === blacklist[b]){
                lowLim = halfPoint;
            }
            
            if(this.actors[id].parts[i].ends[1] === blacklist[b]){
                highLim = halfPoint;   
            }
        }
        for(var j = lowLim; j < highLim; j++){
            if(this.actors[id].parts[i].vertexs.getPoint(j).y>this.floor){
                if(this.actors[id].getVertexVelo(this.actors[id].parts[i].vertexs.getPoint(j)).y>0){
                //if(this.actors[id].parts[i].vertexs.getPoint(j).y-this.actors[id].parts[i].vertexs.getPast(j).y>0){

                    contacts.push([i,j]);
                    
                    if(j<halfPoint){
                        blacklist.push(this.actors[id].parts[i].ends[0]);
                        j = halfPoint-1;
                    }
                    else{
                        blacklist.push(this.actors[id].parts[i].ends[1]);
                        break;
                    }
                    
                }
                
            }
        }
    }
    this.collideActvFloor(id, contacts);
                
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
                this.checkActvAct(i,j);
            }
        }
    }
};

body.prototype.getPE = function(floor){
    return 1/2*this.mass*10/60*(floor-this.pos.y);
};

body.prototype.getKE = function(floor){
    return 1/2*this.mass*pow(mag(this.velo.x,this.velo.y),2)+1/2*this.inertia*pow(this.angVelo,2);
};




body.prototype.act = function(){
  //this.updateVelo();
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

    var ant = new body(100,300);
    ant.createAnt(100,300);
    
    
    var ant2 = new body(120,100);
    ant2.createAnt(120,100);
    
    this.actors[0] = ant;
    this.actors[1] = ant2;

};


game.prototype.act = function(){
    for (var i = 0; i<this.actors.length;i++){
        this.actors[i].updateVelo();
    }
    
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
    
    //translate(250-game.actors[0].pos.x,250-game.actors[0].pos.y);
    
    game.draw();
    point(game.actors[0].pos.x,game.actors[0].pos.y);
    
    }
    
};


