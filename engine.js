frameRate(60);//60 frames per second
angleMode = "radians";

var drawPoints = [];
var drawLines = [];
var debugTest;
var global_Collision = true;

var keys = [];
var oneFrame = false;
keyPressed = function() {
    if(keyCode === 32)//spacebar
    {
        keys[0] = true;
    }
    if(keyCode === 190)//.
    {
        keys[1] = true;
    }
    if(keyCode === 81)//q
    {
       keys[2] = true; 
    }
    if(keyCode === 87)//w
    {
       keys[3] = true; 
    }
    if(keyCode === 65)//a
    {
        keys[4] = true; 
    }
    if(keyCode === 83)//s
    {
       keys[5] = true; 
    }
    if(keyCode === 90)//z
    {
        keys[6] = true; 
    }
    if(keyCode === 88)//x
    {
       keys[7] = true; 
    }
    if(keyCode === 67)//c
    {
        keys[8] = true; 
    }
    if(keyCode === 86)//v
    {
       keys[9] = true; 
    }
    
};

keyReleased = function() {

    if(keyCode === 32)//spacebar
    {
        keys[0] = false;
        
    }
    if(keyCode === 190)//.
    {
        keys[1] = false;
        oneFrame = true;
    }
    if(keyCode === 81)//q
    {
       keys[2] = false; 
    }
    if(keyCode === 87)//w
    {
       keys[3] = false; 
    }
    if(keyCode === 65)//a
    {
        keys[4] = false; 
    }
    if(keyCode === 83)//s
    {
       keys[5] = false; 
    }
    if(keyCode === 90)//z
    {
        keys[6] = false; 
    }
    if(keyCode === 88)//x
    {
       keys[7] = false; 
    }
    if(keyCode === 67)//c
    {
        keys[8] = false; 
    }
    if(keyCode === 86)//v
    {
       keys[9] = false; 
    }
};



//stores past and present values, present values meant to be updated all at once
var pointStorage = function(){
    this.present = 0;
    
    this.storage = [];
    
    this.length = 0;
    this.autoSave = true;
    this.type = 'PS';
       
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

pointStorage.prototype.getArray = function(){
    var select = 0;
    if(arguments.length>0){
        select = arguments[0];
    }
    
    var past = this.present-select;
    if(past<0){
        past+=this.storage.length;
    }
    
    return this.storage[past];
};





var part = function(e1, e2){
   
    this.ends = [e1, e2];//joint connections
    this.vertexs = new pointStorage();//corners of part
    this.pos = new PVector(0, 0);//center
    this.id = 0;
    this.color = [230, 0, 255];
    this.name = "";
    this.massPerVertex = 1;
    this.sF = 0.9;//static friction
    this.kF = 0.1;//kinetic friction
    this.bounce = 0.1;
    this.width = 10;
    this.parallelS = true;//parallel sides
    this.orgBody = 0;
    
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
    this.angVelo = 0;
    this.cenAng=0;
    this.cenLen=0;
    this.mass = 1;
    this.orgBody = 0;
    this.partPair = 0;
    this.state = 0; //0 is stiff, 1 is relaxed
};

var subBody= function(){
    this.id = 0;
    
    this.jointIds = [];
    this.partIds = [];
    
    this.pos = new PVector(0, 0);//center of mass, make actual center of body eventually
        
    this.velo = new PVector(1, 0);
    
    this.accel = new PVector(0, 10/60);//10/60
    
    this.ang = 0;
        
    this.angVelo = 0;
    
    this.inertia = 0;
    
    this.mass = 0;
    
    this.maxlen = 0;
    
    this.rest = false;
    
    this.stableS = [[0,-1,new PVector(0,0)],[0,-1,new PVector(0,0)]]; //source
    this.stableC = []; //contributions
};

var body= function(x,y){
    this.joints = [];
    this.parts = [];
    this.subBodies = [];
    this.activeSBs = [];//for speed
    this.active = 0;
    this.hp = 500;
    /*
    this.dragging = false;
    this.lens = [];
    
    
    this.maxlen = 0;
    
    this.pos = new PVector(x, y);//center of mass, make actual center of body eventually
        
    this.velo = new PVector(0, 0);
    
    this.accel = new PVector(0, 10/60);//10/60
    
    this.ang = 0;
        
    this.angVelo = 2*PI/180 * 0;
    
    this.torque = 0;
    
    this.inertia = 0;
    
    
    */
    this.mass = 0;
    this.penetrate = new PVector(0,0);
    this.conCount = 0;
    this.xRange = [Infinity,-Infinity];
    this.yRange = [Infinity,-Infinity];
    this.interCol = [];
    this.baseJoints = [];
};

var game = function(){
    this.actors = [];
    this.floor = 375;
    this.contacts = [];
    this.global_Collision = true;
    this.imobileB = new body(0,0);
};

var normalize = function(p) {
    var len = mag(p.x,p.y);
    return new PVector(p.x/len,p.y/len);
};

var getUV = function() {
    var p1;
    var p2;
    if(arguments.length===2){
        p1 = arguments[0];
        p2 = arguments[1];
    }
    else{
        p1 = new PVector(0,0);
        p2 = arguments[0];
    }
    
    var magni = mag(p2.x-p1.x,p2.y-p1.y);
    return new PVector((p2.x-p1.x)/magni,(p2.y-p1.y)/magni);
};

var getNrmUV = function() {
    var p1;
    var p2;
    if(arguments.length===2){
        p1 = arguments[0];
        p2 = arguments[1];
    }
    else{
        p1 = new PVector(0,0);
        p2 = arguments[0];
    }
    
    var magni = mag(p2.x-p1.x,p2.y-p1.y);
    return new PVector(-(p2.y-p1.y)/magni,(p2.x-p1.x)/magni);
};

var getDot = function(p1, p2) {
    return p1.x*p2.x+p1.y*p2.y;
};


var getCross = function(p1, p2) {
    return p1.x*p2.y-p1.y*p2.x;
};

var rotateVector = function(p, rad) {
    var cs = cos(rad);
    var sn = sin(rad);
    return new PVector(cs*p.x-sn*p.y,sn*p.x+cs*p.y);
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
    var minI = 0;
    var maxI = 0;
    for(var v = 0; v < vertexs.length; v++){
        var bound = getDot(nrmDir,vertexs.getPoint(v));
        if(bound<min){
            min = bound;
            minI = v;
        }
        if(bound>max){
            max = bound;
            maxI = v;
        }
    }
    
    return [[min,max],[minI,maxI]];
    
};


var checkBounded = function(p,vertexs){
    var v2;
    var dir;
    var checkPoint;
    var checkEnd1;
    var checkEnd2;
    
    if(vertexs.type === 'PS'){
        var vertexs = vertexs.getArray();
    }
    
    for(var v = 0; v < vertexs.length; v++){
        v2 = (v+1)%vertexs.length;
        dir = getUV(vertexs[v],vertexs[v2]);
        checkPoint = getDot(p,dir);
        checkEnd1 = getDot(vertexs[v],dir);
        checkEnd2 = getDot(vertexs[v2],dir);
        if(checkPoint<min(checkEnd1,checkEnd2) || checkPoint>max(checkEnd1,checkEnd2)){
            return false;
        }
    }
    return true;
};


var checkIntersect = function(p11,p12,p21,p22){
    var nrmDir1 = getNrmUV(p11,p12);
    var nrmDir2 = getNrmUV(p21,p22);
    
    var checkPoint = getDot(p11,nrmDir1);
    var checkEnd1 = getDot(p21,nrmDir1);
    var checkEnd2 = getDot(p22,nrmDir1);
    
    if(checkPoint<=min(checkEnd1,checkEnd2) || checkPoint>=max(checkEnd1,checkEnd2)){
        return false;
    }
    
    checkPoint = getDot(p21,nrmDir2);
    checkEnd1 = getDot(p11,nrmDir2);
    checkEnd2 = getDot(p12,nrmDir2);
    
    if(checkPoint<=min(checkEnd1,checkEnd2) || checkPoint >=max(checkEnd1,checkEnd2)){
        return false;
    }
    
    return true;
};

var getPVector = function(p){
    return new PVector(p.x,p.y);
};

joint.prototype.setCenter = function(x,y,ang){
    
    this.cenAng = atan2(this.pos.y-y,this.pos.x-x)-ang;
    this.cenLen = mag(this.pos.x-x,this.pos.y-y);
    
};

joint.prototype.setPos = function(x,y){
    this.pos.x=x;
    this.pos.y=y;
};



part.prototype.initSquare = function(){
    this.vertexs.initStorage(4,2);   
};

body.prototype.getSPart = function(sbody, id){
    return this.parts[sbody.partIds[id]];
};

body.prototype.getSJoint = function(sbody, id){
    return this.joints[sbody.jointIds[id]];
};

body.prototype.getSBody = function(id){//returns pointer...
    return this.subBodies[id];
};



body.prototype.updateInertia = function(s){
    

        var sbody = this.subBodies[s];
        sbody.inertia = 0;
        for(var i = 0; i < sbody.partIds.length;i++){
            var vertexs = this.getSPart(sbody,i).vertexs;
            for(var j = 0; j<vertexs.length;j++){
                var cenLen = mag(vertexs.getPoint(j).x-sbody.pos.x,vertexs.getPoint(j).y-sbody.pos.y);
                sbody.inertia += this.getSPart(sbody,i).massPerVertex*cenLen*cenLen;
            }
        }
    
};

//whenever limbs lost or rotated
body.prototype.updateCenter = function(){
    this.mass = 0;
    for(var s = 0; s<this.activeSBs.length; s++){
        
        var sbody = this.subBodies[this.activeSBs[s]];
        var xSum = 0;
        var ySum = 0;
        var massSum = 0;
        for(var i = 0; i < sbody.partIds.length;i++){
            var vertexs = this.getSPart(sbody,i).vertexs;
            for(var j = 0; j<vertexs.length;j++){
                xSum+=vertexs.getPoint(j).x*this.getSPart(sbody,i).massPerVertex;
                ySum+=vertexs.getPoint(j).y*this.getSPart(sbody,i).massPerVertex;
                massSum+=this.getSPart(sbody,i).massPerVertex;
            }
        }
        sbody.pos.x = xSum/massSum;
        sbody.pos.y = ySum/massSum;
        sbody.mass = massSum;
        this.mass+=massSum;
        var oldInertia = sbody.inertia;
        this.updateInertia(this.activeSBs[s]);
         if(sbody.inertia>0){
            sbody.angVelo*=oldInertia/sbody.inertia;   
         }
        
        
        for(var i = 0; i < sbody.jointIds.length;i++){
            
            this.joints[sbody.jointIds[i]].setCenter(sbody.pos.x,sbody.pos.y,sbody.ang);
            
            
        }
    }
    
};


body.prototype.getAttached = function(idSource, idAttached){
    return this.joints[this.joints[idSource].attached[idAttached]];
};




body.prototype.updateVelo = function(){
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        sbody.velo.x+=sbody.accel.x;
        sbody.velo.y+=sbody.accel.y;
    }
};

body.prototype.updatePos = function(){
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        sbody.pos.x+=sbody.velo.x;
        sbody.pos.y+=sbody.velo.y;
    }
};



body.prototype.updateAng = function(){
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        sbody.ang+=sbody.angVelo;
    }
};

//using angle and radius
body.prototype.rotate = function(){
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        for(var i = 0; i < sbody.jointIds.length; i++){
            this.joints[sbody.jointIds[i]].setPos(cos(sbody.ang+this.getSJoint(sbody,i).cenAng)*this.getSJoint(sbody,i).cenLen+sbody.pos.x,sin(sbody.ang+this.getSJoint(sbody,i).cenAng)*this.getSJoint(sbody,i).cenLen+sbody.pos.y);
        }
    }
};


body.prototype.getEnds = function(id){
    return [this.joints[this.parts[id].ends[0]].pos, this.joints[this.parts[id].ends[1]].pos];
};


body.prototype.updateParts = function(){
    var ends;
    var nrm;
    this.xRange = [Infinity,-Infinity];
    this.yRange = [Infinity,-Infinity];
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
        
        for(var j = 0; j < this.parts[i].vertexs.length; j++){
            this.xRange[0] = min(this.xRange[0],this.parts[i].vertexs.getPoint(j).x);
            this.xRange[1] = max(this.xRange[1],this.parts[i].vertexs.getPoint(j).x);
            
            this.yRange[0] = min(this.yRange[0],this.parts[i].vertexs.getPoint(j).y);
            this.yRange[1] = max(this.yRange[1],this.parts[i].vertexs.getPoint(j).y);
        }
    }
    
};



//ang velocity of last and present
//can be shortened by saving last points
/*
body.prototype.getVertexVelo = function(contact, p){
    var endPoint = new PVector(contact.x-this.pos.x,contact.y-this.pos.y);
    
    var startPoint = rotateVector(endPoint, -this.angVelo);
    
    
    startPoint.x-=this.velo.x;
    startPoint.y-=this.velo.y;
    
    
    return new PVector(endPoint.x-startPoint.x,endPoint.y-startPoint.y);
};
*/
/*
body.prototype.getlocalVelo = function(point, j, totalVelo){
    if(this.joints[j].angVelo !== 0){
    
        var veloDir = getNrmUV(this.joints[j].pos, point);
        
        var radius = mag(point.x-this.joints[j].pos.x,point.y-this.joints[j].pos.y);
        
        var veloMag = radius*this.joints[j].angVelo;
        
        totalVelo.x+= veloDir.x*veloMag;
        totalVelo.y+= veloDir.y*veloMag;
    }
    var nextj = this.joints[j].attached[0];
    if(nextj === j){
        return totalVelo;   
    }
    return this.getlocalVelo(point, nextj, totalVelo);
};

//overall velocity (retired)
body.prototype.getVertexVelo = function(point, p){
    
    var totalVelo = new PVector(0,0);

    totalVelo = this.getlocalVelo(point, this.parts[p].ends[0], totalVelo);
    
    
    
    var veloDir = getNrmUV(this.pos, point);
        
    var radius = mag(point.x-this.pos.x,point.y-this.pos.y);
    
    var veloMag = radius*this.angVelo;
    
    
    totalVelo.x+= veloDir.x*veloMag+this.velo.x;
    totalVelo.y+= veloDir.y*veloMag+this.velo.y;
    
    return totalVelo;
};
*/

subBody.prototype.getVertexVelo = function(point){
    var totalVelo = new PVector(0,0);
    
    var veloDir = getNrmUV(this.pos, point);
    
    var radius = mag(point.x-this.pos.x,point.y-this.pos.y);
    
    var veloMag = radius*this.angVelo;
    
    
    totalVelo.x = veloDir.x*veloMag+this.velo.x;
    totalVelo.y = veloDir.y*veloMag+this.velo.y;
    
    return totalVelo;
};

body.prototype.getVertexVelo = function(point, p){
    
    var sbody = this.subBodies[this.parts[p].orgBody];
    
    return sbody.getVertexVelo(point);
};


//retired, possible use on move setup side
body.prototype.bendJoints = function(turnJ, J){
    var currJoint = this.joints[J];
    
    for(var i = 1; i < currJoint.attached.length; i++){
        this.bendJoints(turnJ,currJoint.attached[i]);
    }
    
    var baseJoint = this.getAttached(turnJ,0);
    var turn = new PVector(currJoint.pos.x-baseJoint.pos.x, currJoint.pos.y-baseJoint.pos.y);
    var turned = rotateVector(turn, this.joints[turnJ].angVelo);
    
    currJoint.pos.x = baseJoint.pos.x+turned.x;
    currJoint.pos.y = baseJoint.pos.y+turned.y;
    
};

//retired
body.prototype.checkJointBends = function(){
    var bend = false;
    
    for(var i = 0; i < this.joints.length; i++){
        
        if(this.joints[i].angVelo !== 0){
            this.bendJoints(i,i);
            bend = true;
        }
    }
    return bend;
};

body.prototype.getPartPair = function(j){
    return this.joints[j].partPair;
};

body.prototype.getPriorJoint = function(j){
    return this.parts[this.joints[j].partPair].ends[0];
};

body.prototype.setOriginBodies = function(j,oB){
    var joint = this.joints[j];
    var part = this.parts[joint.partPair];
    
    if(joint.state === 0){
        joint.orgBody = oB;
        part.orgBody = oB;
    }
    for(var i = 1; i < joint.attached.length; i++){
        this.setOriginBodies(joint.attached[i],oB);
    }
};

body.prototype.relaxJoint = function(j){
    if(this.joints[j].state === 1){
        return;   
    }
    
    var oSB = this.joints[this.getPriorJoint(j)].orgBody;
    var oldSBody = this.subBodies[oSB];
    var oldPos = getPVector(oldSBody.pos);
    var oldVelo = getPVector(oldSBody.velo);
    var oldAngVelo = 0.0+oldSBody.angVelo;
    
    this.subBodies[j] = new subBody();
    this.subBodies[j].id = j;
    this.activeSBs.push(j);
    this.setOriginBodies(j,j);
    this.joints[j].state = 1;
    //if slow, can just slice and splice oldSB assuming no branching paths
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        sbody.jointIds = [];
        sbody.partIds = [];
    }
    
    for(var i = 0; i<this.baseJoints.length; i++){
        this.subBodies[0].jointIds.push(this.baseJoints[i]);
    }
    
    
    for(var i = 0; i<this.parts.length; i++){
        var part = this.parts[i];
        this.subBodies[part.orgBody].partIds.push(i);
        this.subBodies[part.orgBody].jointIds.push(part.ends[1]);
    }
    
    
    this.subBodies[oSB].inertia = 0;
    this.updateCenter();
    var oldSBody = new subBody();
    oldSBody.pos = oldPos;
    oldSBody.velo = oldVelo;
    oldSBody.angVelo = oldAngVelo;
    
    
    
    this.subBodies[oSB].velo = oldSBody.getVertexVelo(this.subBodies[oSB].pos);
    this.subBodies[oSB].angVelo = oldSBody.angVelo;
    
    this.subBodies[j].velo = oldSBody.getVertexVelo(this.subBodies[j].pos);
    this.subBodies[j].angVelo = oldSBody.angVelo;
};

body.prototype.controls = function(){
    var turnVelo = PI/69;
    if(keys[2]){
        this.joints[0].angVelo = turnVelo;
    }
    else if(keys[3]){
       this.joints[0].angVelo = -turnVelo; 
    }
    else{
        this.joints[0].angVelo = 0; 
    }
    if(keys[4]){
        this.joints[3].angVelo = turnVelo;
    }
    else if(keys[5]){
        this.joints[3].angVelo = -turnVelo;
    }
    else{
        this.joints[3].angVelo = 0; 
    }
    if(keys[6]){
        this.relaxJoint(2);
    }
    else if(keys[7]){
        
    }
    
};


body.prototype.getPE = function(floor){
    var PE = 0;
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        PE += 1/2*sbody.mass*10/60*(floor-sbody.pos.y);
    }
    return PE;
};

body.prototype.getKE = function(floor){
    var KE = 0;
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        KE += 1/2*sbody.mass*pow(mag(sbody.velo.x,sbody.velo.y),2)+1/2*sbody.inertia*pow(sbody.angVelo,2);
    }
    return KE;
};


game.prototype.collide = function(id1, id2, contacts){
    
    var veloChange = new PVector(0,0);
    var angChange = 0;
    
    var xIpRange = [0,0];
    var yIpRange = [0,0];
    var turnRange1 = [0,0];
    var turnRange2 = [0,0];
    
    var resolved = true;
    
    var oneSided = (id2 < 0);
    
    var body1 = this.actors[id1];
    var body2;
    if(oneSided){
        body2 = this.imobileB;
    }
    else{
        body2 = this.actors[id2];   
    }
    
    var sbody1 = body1.subBodies[body1.parts[contacts[0][0]].orgBody];
    var sbody2 = body2.subBodies[body2.parts[contacts[0][1]].orgBody];
    
    
    var internal = false;
    var dampen = 1;
    if(id1 === id2){
        internal = true;
        dampen = 0;
    }
    
    for(var i = 0; i<contacts.length; i++){
        
        var p1 = contacts[i][0];
        var p2 = contacts[i][1];
        var contact = contacts[i][2];
        var nrmDir = contacts[i][3];
        
        if(oneSided){//condition unessesary
            this.setImobileB(contact.x,contact.y);
        }
        
        
        var part1 = body1.parts[p1];
        var part2 = body2.parts[p2];
        
        
        var velo1 = sbody1.getVertexVelo(contact);
        var velo2 = sbody2.getVertexVelo(contact);
        
        var relVelo = new PVector(velo1.x-velo2.x,velo1.y-velo2.y);
        
        
        if(mag(relVelo.x,relVelo.y) < 1/60){
            drawPoints.push(contact);
            //break;
        }
        
        
        
        if(internal){//always true
            if(mag(relVelo.x,relVelo.y) > 5/60){
                sbody1.resolved = false;
                sbody2.resolved = false;
                this.global_Collision = true;
                resolved = false;
            }
        }
        else{
            var veloCheck = getDot(relVelo, nrmDir);
            if(veloCheck>0){
                relVelo.x-=nrmDir.x*veloCheck;
                relVelo.y-=nrmDir.y*veloCheck;
            }
            else{
                sbody1.resolved = false;
                sbody2.resolved = false;
                this.global_Collision = true;
                resolved = false;
            }
        }
        
        
        
        
        var relContact1 = new PVector(contact.x-sbody1.pos.x,contact.y-sbody1.pos.y);
        var relContact2 = new PVector(contact.x-sbody2.pos.x,contact.y-sbody2.pos.y);
        
        var impulse = new PVector(0,0);
        
        var veloDir = getUV(relVelo);
        
        var turnDir1 = getCross(relContact1,veloDir);
        var turnDir2 = getCross(relContact2,veloDir);
        
        var res1 = 1/sbody1.mass + (turnDir1*turnDir1)/sbody1.inertia;
        var res2 = 1/sbody2.mass + (turnDir2*turnDir2)/sbody2.inertia;
        
        
        impulse.x = -(1+dampen*part1.bounce)*(relVelo.x)/(res1+res2);
        impulse.y = -(1+dampen*part1.bounce)*(relVelo.y)/(res1+res2);
        
        
        //drawLines.push([contact,new PVector(contact.x+impulse.x,contact.y+impulse.y)]);
        
        xIpRange[0] = min(xIpRange[0], impulse.x);
        xIpRange[1] = max(xIpRange[1], impulse.x);
        
        yIpRange[0] = min(yIpRange[0], impulse.y);
        yIpRange[1] = max(yIpRange[1], impulse.y);

        var angChange1=(getCross(relContact1,impulse)/sbody1.inertia);
        turnRange1[0] = min(turnRange1[0], angChange1);
        turnRange1[1] = max(turnRange1[1], angChange1);
        
        var angChange2=(getCross(relContact2,impulse)/sbody2.inertia);
        turnRange2[0] = min(turnRange2[0], angChange2);
        turnRange2[1] = max(turnRange2[1], angChange2);
        
        
        
        if(!oneSided && false){
            this.actors[id1].parts[p1].color[0] = 245;
            this.actors[id1].parts[p1].color[1] = 233;
            this.actors[id1].parts[p1].color[2] = 66;
            this.actors[id2].parts[p2].color[0] = 245;
            this.actors[id2].parts[p2].color[1] = 164;
            this.actors[id2].parts[p2].color[2] = 66;
        }
        
        
    }
    
    sbody1.velo.x+=(xIpRange[0]+xIpRange[1])/sbody1.mass;
    sbody1.velo.y+=(yIpRange[0]+yIpRange[1])/sbody1.mass;
    sbody1.angVelo+=turnRange1[0]+turnRange1[1];

    sbody2.velo.x-=(xIpRange[0]+xIpRange[1])/sbody2.mass;
    sbody2.velo.y-=(yIpRange[0]+yIpRange[1])/sbody2.mass;
    sbody2.angVelo-=turnRange2[0]+turnRange2[1];
    
    

    
    
};


//sat collisions check
//unoptimized for squares 
//(memory vs speed)
//speed: save all bounds for own normals


game.prototype.checkActvAct = function(id1, id2){
    
    var body1 = this.actors[id1];

    
    var body2 = this.actors[id2];

    
    var contacts = [];
    
    var simple1 = 1;
    var simple2 = 1;
    
    var nrmDirs1 = [];//might not be nessesary depending on algorithm
    var bounds11 = [];
    var bounds12 = [];
    var boundsI11 = [];
    var boundsI12 = [];
    
    var skipEdges1;
    
    
    var nrmDirs2 = [];
    var bounds21 = [];
    var bounds22 = [];
    var boundsI21 = [];
    var boundsI22 = [];
    
    var xPenRange = [0,0];
    var yPenRange = [0,0];
    
    var collided = false;
    
    
    for(var s1 = 0; s1 < body1.activeSBs.length; s1++){
        var sbody1 = body1.subBodies[body1.activeSBs[s1]];
        for(var p1 = 0; p1 < sbody1.partIds.length; p1++){
            var part1 = body1.parts[sbody1.partIds[p1]];
            
            var vertexs1 =part1.vertexs;
            
            if(vertexs1.length%2===0){
                simple1 = 2;
            }
            else{
                simple1 = 1;
            }
            
            var nrmDirs1 = [];
            
    
            for(var v1 = 0; v1 < vertexs1.length/simple1; v1++){
                
                
                
                nrmDirs1.push(getNrmUV(vertexs1.getPoint(v1),vertexs1.getPoint((v1+1)%vertexs1.length)));
            }
            
            
            for(var n1 = 0; n1<nrmDirs1.length; n1++){
                var holder = getBounds(vertexs1,nrmDirs1[n1]);
                bounds11[n1]=holder[0];
                boundsI11[n1]=holder[1];
            }
            
            
            
            for(var s2 = 0; s2 < body2.activeSBs.length; s2++){
                collided = false;
                var contacts = [];
                var sbody2 = body2.subBodies[body2.activeSBs[s2]];
                for(var p2 = 0; p2 < sbody2.partIds.length; p2++){
                    var part2 = body2.parts[sbody2.partIds[p2]];
                    var vertexs2 = part2.vertexs;
                    if(vertexs2.length%2===0){
                        simple2 = 2;
                    }
                    else{
                        simple2 = 1;
                    }
                    var nrmDirs2 = [];
                    for(var v2 = 0; v2 < vertexs2.length/simple2; v2++){
                        nrmDirs2.push(getNrmUV(vertexs2.getPoint(v2),vertexs2.getPoint((v2+1)%vertexs2.length)));
                    }
                    
                    for(var n1 = 0; n1<nrmDirs1.length; n1++){
                        var holder = getBounds(vertexs2,nrmDirs1[n1]);
                        bounds12[n1]=holder[0];
                        boundsI12[n1]=holder[1];
                    }
                    
                    
                    for(var n2 = 0; n2<nrmDirs2.length; n2++){
                        
                        var holder = getBounds(vertexs1,nrmDirs2[n2]);
                        bounds21[n2] = holder[0];
                        boundsI21[n2] = holder[1];
                        
                        var holder = getBounds(vertexs2,nrmDirs2[n2]);
                        bounds22[n2] = holder[0];
                        boundsI22[n2] = holder[1];
                    }
        
                    
                    var collision = true;
                    var pener = 0;
                    var penI;
                    var minPen = Infinity;
                    var con_nrmDir = new PVector(0,0);
                    //var edgeGuess = 0;
                    
                    
                   
                    for(var b = 0; b<nrmDirs1.length; b++){
                        if(bounds11[b][0]>bounds12[b][1] || bounds11[b][1]<bounds12[b][0]){
                            collision = false;
                            break;
                        }
                        else{
                            if(minPen>bounds11[b][1]-bounds12[b][0]){
                                //side correctly chosen
                                //store min of 2
                                
                                    //outdated if more complex shape and joints, change to blacklist method
                                    pener = 2;
                                    penI = boundsI12[b][0];
                                    minPen = bounds11[b][1]-bounds12[b][0];
                                    con_nrmDir.x = nrmDirs1[b].x;
                                    con_nrmDir.y = nrmDirs1[b].y;
                                
                            }
                            
                            if(minPen>bounds12[b][1]-bounds11[b][0]){
                                //get opposite side
                                //store max of 2
                                //if(vertexs1.length%2===0){//parallel
                                
                                pener = 2;
                                penI = boundsI12[b][1];
                                minPen = bounds12[b][1]-bounds11[b][0];
                                con_nrmDir.x = nrmDirs1[b].x;
                                con_nrmDir.y = nrmDirs1[b].y;
                                con_nrmDir.x*=-1;
                                con_nrmDir.y*=-1;
                                //}
                                
                                
                            }
                        }
                            
                    }
                    
                    if(!collision){
                        continue;
                    }
        
                    
                    for(var b = 0; b<nrmDirs2.length; b++){
                        if(bounds21[b][0]>bounds22[b][1] || bounds21[b][1]<bounds22[b][0]){
                            collision = false;
                            break;
                        }
                        else{
                            if(minPen>bounds22[b][1]-bounds21[b][0]){
                                //side correctly chosen
                                //store min of 1
                                
                                    
                                    pener = 1;
                                    penI = boundsI21[b][0];
                                    minPen = bounds22[b][1]-bounds21[b][0];
                                    con_nrmDir.x = nrmDirs2[b].x;
                                    con_nrmDir.y = nrmDirs2[b].y;
                                    
                            }
                            
                            if(minPen>bounds21[b][1]-bounds22[b][0]){
                                //get opposite side
                                //store max of 1
                                
                                //if(vertexs2.length%2===0){//parallel
                                
                                pener = 1;
                                penI = boundsI21[b][1];
                                minPen = bounds21[b][1]-bounds22[b][0];
                                con_nrmDir.x = nrmDirs2[b].x;
                                con_nrmDir.y = nrmDirs2[b].y;
                                con_nrmDir.x*=-1;
                                con_nrmDir.y*=-1;
                                
                                //}
                                
                                
                            }
                            
                        }
                    }
                    
                    if(collision){
                        collided = true;
        
                        var penVertexs;
                        var edgeVertexs;
                        
                        
                        
                        if(pener === 1){
                            penVertexs = vertexs1;
                            
                            edgeVertexs = vertexs2;
        
                        }
                        else{
                            penVertexs = vertexs2;
                            
                            con_nrmDir.x*=-1;
                            con_nrmDir.y*=-1;
                            edgeVertexs = vertexs1;
                        }
        
                        xPenRange[0] = min(xPenRange[0], con_nrmDir.x*minPen);
                        xPenRange[1] = max(xPenRange[1], con_nrmDir.x*minPen);
                        
                        yPenRange[0] = min(yPenRange[0], con_nrmDir.y*minPen);
                        yPenRange[1] = max(yPenRange[1], con_nrmDir.y*minPen);
                        
                        
                        for(var i = 0; i<penVertexs.length; i++){
                            if(checkBounded(penVertexs.getPoint(i), edgeVertexs)){
                                
                                contacts.push([part1.id,part2.id,penVertexs.getPoint(i),con_nrmDir]);
                            }
                        }
                            
           
                    }
                    
                }
                if(collided){
                    this.contacts.push([id1,id2,contacts]);
                }
            }
        }
    }
    if((xPenRange[0]+xPenRange[1]) !== 0 || (yPenRange[0]+yPenRange[1]) !== 0){
        var totalMass = body1.mass+body2.mass;
        var partialPen = 0.3;
        body1.penetrate.x+=(xPenRange[0]+xPenRange[1])*partialPen*body1.mass/totalMass;
        body1.penetrate.y+=(yPenRange[0]+yPenRange[1])*partialPen*body1.mass/totalMass;
        body1.conCount+=1;
        
        body2.penetrate.x-=(xPenRange[0]+xPenRange[1])*partialPen*body2.mass/totalMass;
        body2.penetrate.y-=(yPenRange[0]+yPenRange[1])*partialPen*body2.mass/totalMass;
        body2.conCount+=1;
    }
    
    
};


//if point is under floor, has downwards velocity, and of a unique joint, collide
game.prototype.checkActvFloor = function(id){
    
    var contacts;
    
    var maxPenetrate = 0;
    
    var nrmDir = new PVector(0,-1);
    var body = this.actors[id];
    
    
    
    for(var s = 0; s < body.activeSBs.length; s++){
        var contacts = [];
        var collided = false;
        var sbody = body.subBodies[body.activeSBs[s]];
        for(var p = 0; p < sbody.partIds.length; p++){
            var part = body.parts[sbody.partIds[p]];
            for(var v = 0; v < part.vertexs.length; v++){
                if(part.vertexs.getPoint(v).y>this.floor){
                    if(part.vertexs.getPoint(v).y>maxPenetrate){
                       maxPenetrate=part.vertexs.getPoint(v).y;
                       //this.actors[id].penetrate.y=(this.floor-maxPenetrate+this.actors[id].velo.y);
                    }
                    collided = true;
                    contacts.push([part.id,0,part.vertexs.getPoint(v),nrmDir]);
                }
            }
        }
        if(collided){
            this.contacts.push([id,-1,contacts]);
        }
    }
    
    var partialPen = 0.3;
    var weight = 1;
    if(maxPenetrate>0){
        this.actors[id].penetrate.y+=(this.floor-maxPenetrate)*partialPen*weight;
        this.actors[id].conCount+=weight;
    }
    
};

game.prototype.setRestedSBodies = function(){
    for(var i = 0; i<this.actors.length;i++){
        for(var b = 0; b<this.actors[i].activeSBs.length; b++){
            var sbody = this.actors[i].subBodies[this.actors[i].activeSBs[b]];
            if(!sbody.rest){
                if(sbody.stableS[0][1]>=0 && sbody.stableS[1][1]>=0){
                    sbody.rest = true;
                    println(i);
                }
            }
        }
    }
};

game.prototype.setStablePoints = function(){
    var still = 1/60;
    for(var c = 0; c<this.contacts.length; c++){
        var id1 = this.contacts[c][0];
        var id2 = this.contacts[c][1];

        var oneSided = (id2 < 0);
    
        var body1 = this.actors[id1];
        var body2;
        if(oneSided){
            body2 = this.imobileB;
        }
        else{
            body2 = this.actors[id2];   
        }
        
        var contInfo = this.contacts[c][2];
        
        var sbody1 = body1.subBodies[body1.parts[contInfo[0][0]].orgBody];
        var sbody2 = body2.subBodies[body2.parts[contInfo[0][1]].orgBody];
        
        if(c === this.contacts.length-1){
            //println(sbody1.rest+' '+sbody2.rest);
        }
        
        if((!sbody1.rest && sbody2.rest) || (!sbody2.rest && sbody1.rest)){
            var rested = true;
            var id;
            var sbody;
            var sbodySup;
            var p;
            if(!sbody1.rest){
                id = id1;
                sbody = sbody1;
                sbodySup = sbody2;
                p = 0;
            }
            else{
                id = id2;
                sbody = sbody2;
                sbodySup = sbody1;
                p = 1;
            }
            var accel = normalize(sbody.accel);
            var accelNrm = getNrmUV(accel);
            
            //stillness check (might be easier/quicker to just have a ang limit as well)
            
            if(mag(sbody.velo.x,sbody.velo.y) > still){
                continue;
            }
            
            for(var i = 0; i<contInfo.length; i++){
                var point = contInfo[i][2];
                
                var velo = sbody.getVertexVelo(point);
                
                if(mag(velo.x,velo.y) > still){
                    break;
                }
                  
                //supported check
                if(getDot(getUV(sbody.pos,point),accel)>0){
                    
                    sbodySup.stableC.push([id,sbody.id]);//inform of support
                    
                    var supportDist = getDot(accelNrm, point);
                    var baseDist = getDot(accelNrm,sbody.pos);
                    if(supportDist<=baseDist){
                        
                        if(sbody.stableS[0][1]<0 || (sbody.stableS[0][1]>=0 && supportDist< getDot(accelNrm,sbody.stableS[0][2]))){
                            sbody.stableS[0] = [id,contInfo[i][p],point];
                        }
                    }
                    
                    if(supportDist>=baseDist){
                        if(sbody.stableS[1][1]<0 || (sbody.stableS[1][1]>=0 && supportDist> getDot(accelNrm,sbody.stableS[1][2]))){//unset when part id is -1
                            sbody.stableS[1] = [id,contInfo[i][p],point];
                        }
                    }
                    //println(sbody.stableS);
                }
            }
        }
    }
    
};

game.prototype.applyCollisions = function(){
    var resCounter = 0;
    this.global_Collision = true;
    while(this.global_Collision){
        this.global_Collision = false;
        //println(resCounter);
        for(var i = 0; i<this.contacts.length; i++){
            
            this.collide(this.contacts[i][0],this.contacts[i][1],this.contacts[i][2]);
        }
        if(resCounter > 15){//move this
            this.global_Collision = false;
        }
        resCounter+=1;
    }
    
    this.setStablePoints();
    
    this.setRestedSBodies();
    
    
    for(var i = 0; i<this.actors.length ;i++){
        for(var s = 0; s<this.actors[i].activeSBs.length; s++){
            var sbody = this.actors[i].subBodies[this.actors[i].activeSBs[s]];

            sbody.pos.x+=this.actors[i].penetrate.x/max(1,this.actors[i].conCount);
            sbody.pos.y+=this.actors[i].penetrate.y/max(1,this.actors[i].conCount);

        }
    }
    
};


game.prototype.checkCollisions = function(){
    var resCounter = 0;
    this.contacts = [];//rename to collisions?
    
    for(var i = 0; i<this.actors.length ;i++){
        this.actors[i].penetrate.x = 0;
        this.actors[i].penetrate.y = 0;
        this.actors[i].conCount = 0;
    }
    
    
    
    
    //quick check for floor
    for(var i = 0; i<this.actors.length;i++){
        if(this.actors[i].yRange[1]>this.floor){
            this.checkActvFloor(i);
        }
    }
        
    
    //quick check between actors
    for(var i = 0; i<this.actors.length-1;i++){
        for(var j = i+1; j<this.actors.length;j++){
            if(!(this.actors[i].xRange[0]>this.actors[j].xRange[1] || this.actors[i].xRange[1]<this.actors[j].xRange[0] || this.actors[i].yRange[0]>this.actors[j].yRange[1] || this.actors[i].yRange[1]<this.actors[j].yRange[0])){
                this.checkActvAct(i,j);
            }
        }
    }
    
    
    for(var i = 0; i<this.actors.length;i++){
        for(var j = 1; j<this.actors[i].activeSBs.length; j++){
            var looseJ = this.actors[i].activeSBs[j];
            var p2 = this.actors[i].getPartPair(looseJ);
            var part2 = this.actors[i].parts[p2];
            
            var p1 = this.actors[i].getPartPair(part2.ends[0]);
            var part1 = this.actors[i].parts[p1];
            var point = this.actors[i].joints[part1.ends[1]].pos;
            this.contacts.push([i,i,[[p1,p2,point,new PVector(0,0)]]]);
            
        }
    }
    
    
    this.applyCollisions();
            
};



body.prototype.act = function(){
  
  this.controls();
  
  this.updateVelo();
  
  this.updatePos();
  this.updateAng();
  this.rotate();
  
/*
  if(this.checkJointBends()){
    this.updateCenter();
    this.updateParts();
  }
  */
  this.updateParts();
  
  
    
};

game.prototype.act = function(){
    //for (var i = 0; i<this.actors.length;i++){
        //this.actors[i].updateVelo();
    //}
    for (var i = 0; i<this.actors.length;i++){
        this.actors[i].act();
        
    }
    this.checkCollisions();
    
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

//visuals
body.prototype.draw = function() {
    this.drawLimbs();
    this.drawBones();
    this.drawJoints();
};

game.prototype.draw = function(){
    for (var i = 0; i<this.actors.length;i++){
        this.actors[i].draw();
    }
    stroke(255, 0, 0);
    line(-10000,this.floor,10000,this.floor);
};

//object initializations 

body.prototype.createLimbX = function(x,y){
    var j_hip = new joint(x,y);
    var j_should = new joint(x+50,y);
    var j_elbow = new joint(x+100,y);
    var j_wrist = new joint(x+150,y);
    var j_finger = new joint(x+200,y);
    
    var sbody = new subBody();
        
    this.joints = [j_hip,j_should,j_elbow,j_wrist,j_finger];
    
    for(var i = 0;i<this.joints.length;i++){
        sbody.jointIds.push(i);
        this.joints[i].id = i;
    }
    
    this.baseJoints.push(j_hip.id);
    
    j_hip.attached = [j_hip.id,j_should.id];
    j_hip.len = [0,50];
    
    j_should.attached = [j_hip.id,j_elbow.id];
    j_should.len = [50,50];
    
    j_elbow.attached = [j_should.id,j_wrist.id];
    j_elbow.len = [50,50];
    
    j_wrist.attached = [j_elbow.id,j_finger.id];
    j_wrist.len = [50,50];
    
    j_finger.attached = [j_wrist.id];
    j_finger.len = [50];
    
    
    var p_chest = new part(j_hip.id,j_should.id);
    var p_arm = new part(j_should.id,j_elbow.id);
    var p_forearm = new part(j_elbow.id,j_wrist.id);
    var p_hand = new part(j_wrist.id,j_finger.id);
    
    this.parts = [p_chest, p_arm, p_forearm, p_hand];
    
    for(var i = 0;i<this.parts.length;i++){
        sbody.partIds.push(i);
        this.parts[i].id = i;
        this.joints[this.parts[i].ends[this.parts[i].ends.length-1]].partPair = this.parts[i].id;
        this.parts[i].initSquare();
    }
    
    this.subBodies[0] = sbody;
    this.activeSBs.push(0);
    this.updateParts();
    this.updateCenter();
    

};

body.prototype.createLimbY = function(x,y){
    var j_hip = new joint(x,y);
    var j_should = new joint(x,y+50);
    var j_elbow = new joint(x,y+100);
    var j_wrist = new joint(x,y+150);
    var j_finger = new joint(x,y+200);
    
    var sbody = new subBody();
        
    this.joints = [j_hip,j_should,j_elbow,j_wrist,j_finger];
    
    for(var i = 0;i<this.joints.length;i++){
        sbody.jointIds.push(i);
        this.joints[i].id = i;
    }
    
    this.baseJoints.push(j_hip.id);
    
    j_hip.attached = [j_hip.id,j_should.id];
    j_hip.len = [0,50];
    
    j_should.attached = [j_hip.id,j_elbow.id];
    j_should.len = [50,50];
    
    j_elbow.attached = [j_should.id,j_wrist.id];
    j_elbow.len = [50,50];
    
    j_wrist.attached = [j_elbow.id,j_finger.id];
    j_wrist.len = [50,50];
    
    j_finger.attached = [j_wrist.id];
    j_finger.len = [50];
    
    
    var p_chest = new part(j_hip.id,j_should.id);
    var p_arm = new part(j_should.id,j_elbow.id);
    var p_forearm = new part(j_elbow.id,j_wrist.id);
    var p_hand = new part(j_wrist.id,j_finger.id);
    
    this.parts = [p_chest, p_arm, p_forearm, p_hand];
    
    for(var i = 0;i<this.parts.length;i++){
        sbody.partIds.push(i);
        this.parts[i].id = i;
        this.joints[this.parts[i].ends[this.parts[i].ends.length-1]].partPair = this.parts[i].id;
        this.parts[i].initSquare();
    }
    
    this.subBodies[0] = sbody;
    this.activeSBs.push(0);
    this.updateParts();
    this.updateCenter();
    

};

game.prototype.getImobileB = function(){
    return this.imobileB;
};

game.prototype.setImobileB = function(x,y){
    this.imobileB.subBodies[0].pos.x = x;
    this.imobileB.subBodies[0].pos.y = y;
    this.imobileB.subBodies[0].velo.x = 0;
    this.imobileB.subBodies[0].velo.y = 0;
    this.imobileB.subBodies[0].angVelo = 0;
    this.imobileB.subBodies[0].rest = true;
};

body.prototype.createImobileB = function(){
    var j_1 = new joint(0,0);
    var j_2 = new joint(0,0);

    var sbody = new subBody();
        
    this.joints = [j_1,j_2];
    
    for(var i = 0;i<this.joints.length;i++){
        sbody.jointIds.push(i);
        this.joints[i].id = i;
    }
    
    j_1.attached = [j_1.id,j_2.id];
    j_1.len = [0,0];
    
    j_2.attached = [j_1.id];
    j_2.len = [0];
    
    
    var p_1 = new part(j_1.id,j_2.id);
    
    this.parts = [p_1];
    
    for(var i = 0;i<this.parts.length;i++){
        sbody.partIds.push(i);
        this.parts[i].id = i;
    }
    
    sbody.mass = Infinity;
    sbody.inertia = Infinity;
    this.subBodies[0] = sbody;
    this.activeSBs.push(0);
    this.subBodies.push(sbody);
};


game.prototype.initGame = function(){
    
    this.imobileB = new body(0,0);
    this.imobileB.createImobileB();

    var limb = new body(100,100);
    limb.createLimbY(100,100);
    
    var limb2 = new body(200,200);
    limb2.createLimbX(200,200);
    
    this.actors[0] = limb;
    this.actors[1] = limb2;
    

};


var clock = function(x,y){
    this.base = new PVector(x,y);
    this.radius = 25;
    this.tip = new PVector(0,-this.radius);
    this.angVelo = 2*PI/(60*3);
    this.sWeight = 3;
    this.color = [255,255,255];
};

clock.prototype.act = function(){
    strokeWeight(this.sWeight);
    stroke(this.color[0],this.color[1],this.color[2]);
    line(this.base.x,this.base.y,this.base.x+this.tip.x,this.base.y+this.tip.y);
    this.tip = rotateVector(this.tip,this.angVelo);
    
};

var timer = new clock(50,50);


var game = new game();
game.initGame();
var draw = function() {
    pushMatrix();
    if(keys[0] || oneFrame){
        oneFrame = false;
        
        background(0, 0, 0);
        
        game.act();
        
        //translate(250-game.actors[0].pos.x,250-game.actors[0].pos.y);
        
        game.draw();
        
        
        
        
        for(var d = 0; d<drawLines.length; d++){
            strokeWeight(3);
            stroke(0, 21, 255);
            line(drawLines[d][0].x,drawLines[d][0].y,drawLines[d][1].x,drawLines[d][1].y);
        }
        drawLines = [];
        
        for(var d = 0; d<drawPoints.length; d++){
            strokeWeight(3);
            stroke(255, 225, 0);
            point(drawPoints[d].x,drawPoints[d].y);
        }
        drawPoints = [];
        timer.act();
    }
    popMatrix();
    
    
};


