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



var part = function(x, y){
   
    //surroundings
    this.basePos = new PVector(x, y);//where connected on base part
    this.basePart = 0;
    this.tipPart = 0;//part used for orientation, -1 if a tip itself
    this.attached = [];//base part for attached
    this.orgBody = 0;//only changed when detached or relaxed from base part
    
    this.cenLen = 0;//relation to center
    this.cenAng = 0;
    
    //properties
    this.id = 0;
    this.pColor = [230, 0, 255];
    this.jColor = [16, 145, 40];
    this.name = "";
    this.massPerVertex = 1;
    this.sF = 0.9;//static friction
    this.kF = 0.1;//kinetic friction
    this.bounce = 0.1;
    this.width = 10;//length is from base part to tipPart
    this.goalAngVelo = 0;//PI/69
    this.torqueMax = 1;//max torque that can be supplied
    //status
    this.vertexs = new pointStorage();//corners of part
    this.pos = new PVector(0, 0);//center of part
    this.turning = false;
    this.torqueSup = 1;
    this.state = 0;
    
};



var subBody = function(){
    this.id = 0;
    
    this.ownerId = 0;
    
    this.partIds = [];//parts contained within body
    
    this.com = new PVector(0, 0);//center of mass
        
    this.velo = new PVector(0, 0);
    
    //this.accel = new PVector(0, 0);//10/60
    this.accel = new PVector(0, 10/60);//10/60
    
    this.ang = 0;
        
    this.angVelo = 0;
    
    this.inertia = 0;
    
    this.ghInertia = 0;//easier collisions
    
    this.mass = 0;//mass of all contained parts
    
    this.maxlen = 0;
    
    this.rest = false;
    
    this.outerSB = 0;
    
    this.angCompensate = 0;
    
    //if uncompatible with relax, make a sepBody obj...
    this.stableS = [[0,0,-1,-1,new PVector(0,0),new PVector(0,0)],[0,-1,new PVector(0,0),new PVector(0,0)]]; //source
    this.stableP = []; //participants
    this.stableC = []; //contributions
    this.stableT = [-1,-1];
};

var body= function(){
    this.id = 0;
    this.originP = 0;
    this.parts = [];
    this.subBodies = [];
    this.activeSBs = [];//for speed, rename to looseSBs
    this.active = 0;
    this.hp = 500;
    
    this.mass = 0;
    this.inertia = 0;
    this.penetrate = new PVector(0,0);
    this.conCount = 0;//used to get average penetration
    this.xRange = [Infinity,-Infinity];
    this.yRange = [Infinity,-Infinity];
    this.interCol = [];//all rotating/unrigid joints (remove eventually)
    this.baseJoints = [];//remove
};

var game = function(){
    this.actors = [];
    this.floor = 375;
    this.contacts = [];
    this.contactsvR = [];
    this.justWoken = [];
    this.global_Collision = true;
    this.imobileB = new body(0,0);
};

var printout = function(){
    print(arguments[0]);
    for(var i = 1; i < arguments.length; i++){
        print(';'+arguments[i]);
    }
    println('');
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
    
    if(vertexs.type === 'PS'){
        var vertexs = vertexs.getArray();
    }
    
    for(var v = 0; v < vertexs.length; v++){
        var bound = getDot(nrmDir,vertexs[v]);
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

var getPVector = function(p){//unessesary
    return new PVector(p.x,p.y);
};

part.prototype.setCenter = function(x,y,ang){
    
    this.cenAng = atan2(this.basePos.y-y,this.basePos.x-x)-ang;
    this.cenLen = mag(this.basePos.x-x,this.basePos.y-y);
    
};


part.prototype.initSquare = function(){
    this.vertexs.initStorage(4,2);   
};

body.prototype.getSPart = function(sbody, id){
    return this.parts[sbody.partIds[id]];
};


body.prototype.getSBody = function(id){//returns pointer...
    return this.subBodies[id];
};

body.prototype.getMass = function(sbody){
    var posSum = new PVector(0,0);
    var massSum = 0;
    
    
    for(var i = 0; i < sbody.partIds.length;i++){
        if(this.getSPart(sbody,i).tipPart<0){
            continue;
        }
        var vertexs = this.getSPart(sbody,i).vertexs;
        for(var j = 0; j<vertexs.length;j++){
            
            posSum.x+=vertexs.getPoint(j).x*this.getSPart(sbody,i).massPerVertex;
            posSum.y+=vertexs.getPoint(j).y*this.getSPart(sbody,i).massPerVertex;
            massSum+=this.getSPart(sbody,i).massPerVertex;
        }
    }
    
    
    
    posSum.x = posSum.x/massSum;
    posSum.y = posSum.y/massSum;
    return [posSum, massSum];
};

body.prototype.getInertia = function(sbody){
    var inertia = 0;
    var ghostInertia = 0;
    for(var i = 0; i < sbody.partIds.length;i++){
        if(this.getSPart(sbody,i).tipPart<0){
            continue;
        }
        var vertexs = this.getSPart(sbody,i).vertexs;
        for(var j = 0; j<vertexs.length;j++){
            var cenLen = mag(vertexs.getPoint(j).x-sbody.com.x,vertexs.getPoint(j).y-sbody.com.y);
           
            inertia += this.getSPart(sbody,i).massPerVertex*cenLen*cenLen;
            
            var jointPos = this.parts[sbody.id].basePos;
            var ghCenLen = mag(vertexs.getPoint(j).x-jointPos.x,vertexs.getPoint(j).y-jointPos.y);
            ghostInertia += this.getSPart(sbody,i).massPerVertex*ghCenLen*ghCenLen;
        }   
    }
    return [inertia,ghostInertia];
};

//whenever limbs lost or rotated
body.prototype.updateShape = function(){
    this.mass = 0;
    this.inertia = 0;
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        if(!sbody.rest){
            var oldInertia = sbody.inertia;
            var massResults = this.getMass(sbody);
            sbody.com = massResults[0];
            sbody.mass = massResults[1];
            var inertiaResults = this.getInertia(sbody);
            sbody.inertia = inertiaResults[0];
            sbody.ghInertia = inertiaResults[1];
            this.mass+=sbody.mass;
            this.inertia+=sbody.inertial;
            if(sbody.inertia>0){
                sbody.angVelo*=oldInertia/sbody.inertia;   
            }
            for(var i = 0; i < sbody.partIds.length;i++){
                this.parts[sbody.partIds[i]].setCenter(sbody.com.x,sbody.com.y,sbody.ang);
            }
        }
    }
};

body.prototype.applyAccel = function(){
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        if(sbody.rest){
            continue;   
        }
        sbody.velo.x+=sbody.accel.x;
        sbody.velo.y+=sbody.accel.y;
    }
};

body.prototype.applyVelo = function(){
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        if(sbody.rest){
            continue;   
        }
        sbody.com.x+=sbody.velo.x;
        sbody.com.y+=sbody.velo.y;
    }
};

body.prototype.applyAngVelo = function(){
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        if(sbody.rest){
            continue;   
        }
        sbody.ang+=sbody.angVelo;
    }
};


var addPVectors = function(p1, p2){
    return new PVector(p1.x+p2.x,p1.y+p2.y);
};

var subPVectors = function(p1, p2){
    return new PVector(p1.x-p2.x,p1.y-p2.y);
};

var multPVector = function(p, M){
    return new PVector(p.x*M,p.y*M);
};

var getLinearVelo = function(base,angVelo,tip){
    var veloDir = getNrmUV(base, tip);
    
    var radius = mag(tip.x-base.x,tip.y-base.y);
    
    var veloMag = radius*angVelo;
    
    return new PVector(veloDir.x*veloMag,veloDir.y*veloMag);
};

var zeroOutDir = function(vect,zDir){
    var zeroMag = getDot(vect,zDir);
    var zeroVect = multPVector(zDir,zeroMag);
    
    return subPVectors(vect,zeroVect);
};


body.prototype.updateJoints = function(){
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        if(sbody.rest){
            continue;   
        }

        for(var i = 0; i < sbody.partIds.length; i++){
            var part = this.parts[sbody.partIds[i]];
            part.basePos.x = cos(sbody.ang+part.cenAng)*part.cenLen+sbody.com.x;
            part.basePos.y = sin(sbody.ang+part.cenAng)*part.cenLen+sbody.com.y;
        }
    }
};


body.prototype.updateParts = function(){
    var ends;
    var nrm;
    this.xRange = [Infinity,-Infinity];
    this.yRange = [Infinity,-Infinity];
    for(var i = 0; i < this.parts.length; i++){
        if(this.parts[i].tipPart<0){
            continue;
        }
        ends = [this.parts[i].basePos, this.parts[this.parts[i].tipPart].basePos];
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



subBody.prototype.getVertexVelo = function(point){
    var totalVelo = new PVector(0,0);
    
    var veloDir = getNrmUV(this.com, point);
    
    var radius = mag(point.x-this.com.x,point.y-this.com.y);
    
    var veloMag = radius*this.angVelo;
    
    totalVelo.x = veloDir.x*veloMag+this.velo.x;
    totalVelo.y = veloDir.y*veloMag+this.velo.y;
    
    return totalVelo;
};

body.prototype.getVertexVelo = function(point, p){
    
    var sbody = this.subBodies[this.parts[p].orgBody];
    
    return sbody.getVertexVelo(point);
};




body.prototype.setOriginBodies = function(j,oB){
    var part = this.parts[j];
    
    if(part.state === 0){
        part.orgBody = oB;
    }
    
    for(var i = 0; i < part.attached.length; i++){
        
        this.setOriginBodies(part.attached[i],oB);
    }
};

body.prototype.relaxJoint = function(j){
    
    if(this.parts[j].state === 1 || this.parts[j].tipPart<0){
        return;   
    }
    
    var oSB = this.parts[this.parts[j].basePart].orgBody;//could just get current org
    var oldSBody = this.subBodies[oSB];
    var oldCom = getPVector(oldSBody.com);
    var oldVelo = getPVector(oldSBody.velo);
    var oldAngVelo = 0.0+oldSBody.angVelo;
    
    this.subBodies[j] = new subBody();
    this.subBodies[j].id = j;
    this.subBodies[j].ownerId = this.id;
    this.activeSBs.push(j);
    this.setOriginBodies(j,j);
    this.parts[j].state = 1;
    //if slow, can just slice and splice oldSB assuming no branching paths
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        sbody.partIds = [];
        
    }
    
    
    
    for(var i = 0; i<this.parts.length; i++){
        var part = this.parts[i];
        this.subBodies[part.orgBody].partIds.push(i);
        
    }
    
    this.subBodies[oSB].inertia = 0;
    
    
    //BANDADE SOLUTION, NEED TO UNREST ALL CONTRIBUTIONS AS WELL
    this.subBodies[oSB].stableS[0][2] = -1;
    this.subBodies[oSB].stableS[1][2] = -1;
    this.subBodies[oSB].rest = false;
    this.updateShape();
    
    var oldSBody = new subBody();
    oldSBody.com = oldCom;
    oldSBody.velo = oldVelo;
    oldSBody.angVelo = oldAngVelo;
    
    
    
    this.subBodies[oSB].velo = oldSBody.getVertexVelo(this.subBodies[oSB].com);
    this.subBodies[oSB].angVelo = oldSBody.angVelo;
    
    
    this.subBodies[j].velo = oldSBody.getVertexVelo(this.subBodies[j].com);
    this.subBodies[j].angVelo = oldSBody.angVelo;
    
    //println(this.subBodies[oSB].partIds+'!'+this.subBodies[j].partIds);
};

body.prototype.controls = function(){
    var turnVelo = PI/69;
    if(keys[2]){//q
    
        this.parts[4].turning = true;
        this.parts[4].goalAngVelo = -PI/69;
        this.parts[4].torqueMax = 7000;
        
        
    }
    else if(keys[3]){//w
        this.parts[4].turning = true;
        this.parts[4].goalAngVelo = PI/69;
        this.parts[4].torqueMax = 7000;
    }
    else{

    }
    if(keys[4]){//a
        this.parts[4].turning = true;
        this.parts[4].goalAngVelo = 0;
        this.parts[4].torqueMax = 0;
        
        this.parts[8].turning = true;
        this.parts[8].goalAngVelo = 0;
        this.parts[8].torqueMax = 1;
    }
    else if(keys[5]){//s
        this.parts[4].turning = true;
        this.parts[4].goalAngVelo = 0;
        this.parts[4].torqueMax = 100000;
        
        this.parts[8].turning = true;
        this.parts[8].goalAngVelo = 0;
        this.parts[8].torqueMax = 100000;
    }
    else{
        
    }
    if(keys[6]){//z
        this.subBodies[0].velo.x = -1;
        
    }
    else if(keys[7]){//x
        this.subBodies[0].velo.x = 1;
    }
    
};


body.prototype.getPE = function(floor){
    var PE = 0;
    for(var s = 0; s<this.activeSBs.length; s++){
        var sbody = this.subBodies[this.activeSBs[s]];
        PE += 1/2*sbody.mass*10/60*(floor-sbody.com.y);
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

game.prototype.wakeUp = function(id, idSB){
    //println(id+','+idSB);
    //println(id);
    if(id<0){
        println('error in wake');
    }
    var body = this.actors[id];
    var sbody = body.subBodies[idSB];
    
    if(!sbody.rest){
        return;   
    }
    
    
    sbody.rest = false;
    
    for(var i = 0; i < sbody.stableC.length; i++){
        this.wakeUp(sbody.stableC[i][0],sbody.stableC[i][1]);
    }
    //sbody.stableC = [];
    
    var sameSB = false;
    
    if(sbody.stableS[0][1] === sbody.stableS[1][1]){
        if(sbody.stableS[0][1]<0){
            sameSB = true;
        }
        else{
            var bodyS = this.actors[sbody.stableS[0][1]];
            
            if(bodyS.parts[sbody.stableS[0][3]].orgBody === bodyS.parts[sbody.stableS[1][3]].orgBody){
                sameSB = true;
            }
        }
    }
    
    
    var contacts = [];//likely to be repeats down the line
    if(sameSB){
        //println('same');

        for(var i = 0; i < sbody.stableS.length; i++){
            contacts.push([sbody.stableS[i][2], sbody.stableS[i][3], sbody.stableS[i][4], sbody.stableS[i][5]]);

        }

        
        this.contacts.push([sbody.stableS[0][0],sbody.stableS[0][1],contacts]);
        //println(this.contacts[this.contacts.length-1]);
    }
    else{
        //println('diff');
        for(var i = 0; i < sbody.stableS.length; i++){
            
            var contacts = [[sbody.stableS[i][2], sbody.stableS[i][3], sbody.stableS[i][4], sbody.stableS[i][5]]];
            this.contacts.push([sbody.stableS[i][0],sbody.stableS[i][1],contacts]);
        }
    }
    
};


game.prototype.checkAwakened = function(idw, idr, pw, pr, point, nrmDir, velo){
    //println(idw+','+idr+','+pw+','+pr+','+point+','+nrmDir+','+velo);
    if(idr<0){
        println('huh');
    }
    if(getDot(velo,nrmDir)>0){//holds up when part v part
        return;   
    }
    
    var bodyW = this.actors[idw];//waker
    var partW = bodyW.parts[pw];//to get friction and bounce values...
    var sbodyW = bodyW.subBodies[partW.orgBody];
    
    var bodyR = this.actors[idr];//rested
    var partR = bodyR.parts[pr];
    var sbodyR = bodyR.subBodies[partR.orgBody];
    
    var centerDir = getUV(point,sbodyR.com);
    var veloDMag = getDot(velo,centerDir);
    
    
    
    var veloD = new PVector(centerDir.x*veloDMag,centerDir.y*veloDMag);//direct
    
    var veloRMag = getCross(velo,centerDir);
    
    var sRange = [Infinity,-Infinity];
    
    if(sbodyR.stableS[0][2]<0 || sbodyR.stableS[1][2]<0){
        println('error in checkAw');   
    }
    
    for(var i = 0; i < sbodyR.stableS.length; i++){//should only be 2
    
        var idrS = sbodyR.stableS[i][1];
        var pwS = sbodyR.stableS[i][2];
        var prS = sbodyR.stableS[i][3];
        var pointS = sbodyR.stableS[i][4];
        var nrmDirS = sbodyR.stableS[i][5];
        
        
        sRange[0] = min(sRange[0],getCross(velo,pointS));
        sRange[1] = max(sRange[1],getCross(velo,pointS));
        
        if(idrS<0){
        //drawPoints.push(pointS);
        //drawLines.push([point, pointS]);
            continue;
        }
        
        var veloRDir = getNrmUV(pointS,sbodyR.com);
        var veloR = new PVector(veloRDir.x*veloRMag,veloRDir.y*veloRMag);
        var propVelo = new PVector(veloD.x+veloR.x,veloD.y+veloR.y);
        
        
        
        this.checkAwakened(idr,idrS,pwS,prS,pointS,nrmDirS,propVelo);
    }
    
    var sCheck = getCross(velo,point);
    //println(point+' '+new PVector(point.x+velo.x*20,point.y+velo.y*20));
    //drawLines.push([point,new PVector(point.x+velo.x*50,point.y+velo.y*50)]);
    
    if(sCheck<sRange[0]-1 || sCheck>sRange[1]+1){//if velocity outside of stability
        //println(sCheck+' '+sRange[0]+' '+sRange[1]);
        //println(idw+' '+sbodyW.id+' '+idr+' '+sbodyR.id+' '+sCheck+' '+sRange);
        //println('$ '+point+' '+velo);
        //println('$ '+sbodyW.com);
        drawLines.push([point,new PVector(point.x+velo.x*50,point.y+velo.y*50)]);
        
        this.wakeUp(idr, sbodyR.id); 
    }

};

game.prototype.setAwakened = function(){
    this.contacts = this.contacts.concat(this.contactsvR);
    for(var c = 0; c<this.contactsvR.length; c++){
        
        var id1 = this.contactsvR[c][0];
        var id2 = this.contactsvR[c][1];
        
        
        
        if(id1<0||id2<0){
            continue;
        }
        
        var body1 = this.actors[id1];
        var body2 = this.actors[id2];   
        
        
        var contInfo = this.contactsvR[c][2];
        
        var sbody1 = body1.subBodies[body1.parts[contInfo[0][0]].orgBody];
        var sbody2 = body2.subBodies[body2.parts[contInfo[0][1]].orgBody];
        
        var idw;
        var pw;
        var idr;
        var pr;
        var sbody;
        var sbodyR;
        var orient;
        
        if(sbody1.stableS[0][2]<0 && sbody2.stableS[0][2]<0){
            println('error in setAw');
            println(id1+' '+id2+' '+sbody1.id+' '+sbody2.id);
        }
        
        if(sbody1.stableS[0][2]>-1 && sbody2.stableS[0][2]>-1){
            println('error in setAw');
            println(id1+' '+id2+' '+sbody1.id+' '+sbody2.id);
        }
        
        if(sbody1.stableS[0][2]<0){//rest state can change
            idw = id1;
            idr = id2;
            pw = 0;
            pr = 1;
            sbody = sbody1;
            sbodyR = sbody2;
            orient = 1;
            
        }
        
        if(sbody2.stableS[0][2]<0){
            idw = id2;
            idr = id1;
            pw = 1;
            pr = 0;
            sbody = sbody2;
            sbodyR = sbody1;
            orient = -1;
        }

        var point;
        for(var i = 0; i<contInfo.length; i++){
            point = contInfo[i][2];
            var nrmDir = new PVector(contInfo[i][3].x*orient,contInfo[i][3].y*orient);
            var velo = sbody.getVertexVelo(point);
            this.checkAwakened(idw, idr, contInfo[i][pw], contInfo[i][pr], point, nrmDir, velo);
        }
        this.justWoken.push([idr,sbodyR.id,point]);
        
    }
    
};

game.prototype.setRestedSBodies = function(){
    for(var i = 0; i<this.actors.length;i++){
        for(var b = 0; b<this.actors[i].activeSBs.length; b++){
            var sbody = this.actors[i].subBodies[this.actors[i].activeSBs[b]];
            if(!sbody.rest){
                if(sbody.stableS[0][2]>=0 && sbody.stableS[1][2]>=0){
                    sbody.rest = true;
                    for(var c = 0; c < sbody.stableP.length; c++){
                        this.actors[sbody.stableP[c][0]].subBodies[sbody.stableP[c][1]].stableC.push([i,sbody.id]);
                    }
                    
                this.actors[i].parts[sbody.partIds[0]].pColor[0] = 245;
                this.actors[i].parts[sbody.partIds[0]].pColor[1] = 233;
                this.actors[i].parts[sbody.partIds[0]].pColor[2] = 66;
                
                sbody.velo.x = 0;
                sbody.velo.y = 0;
                sbody.angVelo.x = 0;
                    //println('R)actor '+i+' sB '+sbody.id+'$'+this.actors[i].subBodies[sbody.id].rest);
                }
                else{
                    sbody.stableS[0][2]=-1;//probably a better way to do this
                    sbody.stableS[1][2]=-1;
                    sbody.stableT[0]=-1;//^replace occurances of above eventually
                    sbody.stableT[1]=-1;
                    sbody.stableC = [];
                    
                    this.actors[i].parts[sbody.partIds[0]].pColor[0] = 230;
                    this.actors[i].parts[sbody.partIds[0]].pColor[1] = 0;
                    this.actors[i].parts[sbody.partIds[0]].pColor[2] = 255;
                    //println('UR)actor '+i+' sB '+sbody.id);
                }
                sbody.stableP = [];
            }
        }
    }
};

game.prototype.checkWoken = function(b, sb, point){
    
    
    if(b<0){
        return;
    }

    var sbody = this.actors[b].subBodies[sb];
    
    if(sbody.rest){
        return;
    }
    
    var stableBase = true;
    
    for(var i = 0; i<sbody.stableS.length; i++){
        var baseB = sbody.stableS[i][1];
        if(baseB < 0){
            continue;
        }
        
        var baseSb = this.actors[baseB].parts[sbody.stableS[i][3]].orgBody;
        this.checkWoken(baseB, baseSb, sbody.stableS[i][4]);

        if(!this.actors[baseB].subBodies[baseSb].rest){
            stableBase = false;
        }
        
    }
    
    
    if(stableBase){
        var still = 1/50;
        if(mag(sbody.velo.x,sbody.velo.y)<still){
            var velo = sbody.getVertexVelo(point);
            if(mag(sbody.velo.x,sbody.velo.y)<still){
                sbody.rest = true;
                //println('hi');
            }
        }
    }
    
};

game.prototype.setStablePoints = function(){
    var still = 1/50;

    for(var i = 0; i < this.justWoken.length; i++){
        this.checkWoken(this.justWoken[i][0],this.justWoken[i][1],this.justWoken[i][2]);
    }
    
    this.justWoken = [];
    
    
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
        
        
        if(sbody1.rest || sbody2.rest){
            var rested = true;
            var id;
            var idSup;
            var sbody;
            var sbodySup;
            var p;
            var pSup;
            var orient;
            if(!sbody1.rest){
                id = id1;
                idSup = id2;
                sbody = sbody1;
                sbodySup = sbody2;
                p = 0;
                pSup = 1;
                orient = 1;
            }
            else if(!sbody2.rest){
                id = id2;
                idSup = id1;
                sbody = sbody2;
                sbodySup = sbody1;
                p = 1;
                pSup = 0;
                orient = -1;
            }
            else{
                continue;
            }
            
            if(id === 0 && sbody.id === 2){
                //println(idSup+' '+sbodySup.id);
            }
            
            var accel = normalize(sbody.accel);
            var accelNrm = getNrmUV(accel);
            
            //stillness check (might be easier/quicker to just have a ang limit as well)
            
            if(mag(sbody.velo.x,sbody.velo.y) > still){
                continue;
            }
            
            var ticket = true;
            for(var i = 0; i<contInfo.length; i++){
                var point = contInfo[i][2];
                var nrmDir = new PVector(contInfo[i][3].x*orient,contInfo[i][3].y*orient);
                
                var velo = sbody.getVertexVelo(point);
                
                
                
                if(mag(velo.x,velo.y) > still){
                    break;
                }
                  
                //if(id === 0 && sbody.id === 2){
                //    println(mag(velo.x,velo.y));
                //}
                //supported check
                
                if(getDot(nrmDir,accel)<=0){//switch to <= to enable local stable points
                    //sbodySup.stableC.push([id,sbody.id]);//inform of support
                    //^THREAT TO MEMORY, alternative below
                    if(ticket){
                        if(idSup>-1){
                            sbody.stableP.push([idSup,sbodySup.id]);
                        }
                        ticket = false;
                    }
                    
                    var tier;
                    if(id === idSup){
                        //favors seperate bodies over own limbs, both pros and cons...
                        tier = 0;
                    }else{
                        tier = 1;
                    }
                    
                    
                    var supportDist = getDot(accelNrm, point);
                    var baseDist = getDot(accelNrm,sbody.com);
                    if(supportDist<=baseDist){
                        //checking part replaced by checking stableT in the future
                        if(sbody.stableS[0][2]<0 || tier>sbody.stableT[0] || (tier>=sbody.stableT[0] && sbody.stableS[0][2]>=0 && supportDist< getDot(accelNrm,sbody.stableS[0][2]))){
                            sbody.stableS[0] = [id,idSup,contInfo[i][p],contInfo[i][pSup], point,nrmDir];
                            sbody.stableT[0] = tier;
                        }
                    }
                    
                    if(supportDist>=baseDist){
                        if(sbody.stableS[1][2]<0 || tier>sbody.stableT[1]  || (tier>=sbody.stableT[1] && sbody.stableS[1][2]>=0 && supportDist> getDot(accelNrm,sbody.stableS[1][2]))){//unset when part id is -1
                            sbody.stableS[1] = [id,idSup,contInfo[i][p],contInfo[i][pSup], point,nrmDir];
                            sbody.stableT[1] = tier;
                        }
                    }
                    //println(sbody.stableS);
                }
            }
        }
    }
    
};


var getImpulse = function(sbody1, sbody2, contact, nrmDir, relVelo, properties){
    drawPoints.push(contact);
    
    var com1;
    var com2;
    
    var mass1;
    var mass2;
    
    var inertia1;
    var inertia2;
    
    var relContact1;
    var relContact2;
    
    var res1;
    var res2;
    
    var veloDir = getUV(relVelo);
    
    
    var constrained = properties[1];
    var basePos = properties[2];
    
    if(!constrained[0]){
        mass1 = sbody1.mass;
        inertia1 = sbody1.inertia;
        com1 = sbody1.com;
    }else{
        mass1 = Infinity;
        inertia1 = sbody1.ghInertia;
        com1 = basePos[0];
    }
    
    if(!constrained[1]){
        mass2 = sbody2.mass;
        inertia2 = sbody2.inertia;
        com2 = sbody2.com;
    }else{
        mass2 = Infinity;
        inertia2 = sbody2.ghInertia;
        com2 = basePos[1];
    }
    
    
    if(sbody1.rest){
        res1 = 0;
    }
    else{
        var relContact1 = new PVector(contact.x-com1.x,contact.y-com1.y);
        var turnDir1 = getCross(relContact1,veloDir);
        res1 = 1/mass1 + (turnDir1*turnDir1)/inertia1;
    }
    
    if(sbody2.rest){
        res2 = 0;
    }
    else{
        var relContact2 = new PVector(contact.x-com2.x,contact.y-com2.y);
        var turnDir2 = getCross(relContact2,veloDir);
        res2 = 1/mass2 + (turnDir2*turnDir2)/inertia2;
    }
    
    var impulse = new PVector(0,0);
    
    if(res1 === 0 && res2 === 0){
        var relContact1 = new PVector(contact.x-com1.x,contact.y-com1.y);
        var turnDir1 = getCross(relContact1,veloDir);
        return impulse;
    }
    
    var bounce = properties[0];
    impulse.x = -(1+bounce)*(relVelo.x)/(res1+res2);
    impulse.y = -(1+bounce)*(relVelo.y)/(res1+res2);
    
    return impulse;
};


body.prototype.getVelocityContributions = function(p,contact){
    var part = this.parts[p];
    var sbody = this.subBodies[part.id];

    var totalVelo = new PVector(0,0);
    while(true){
        if(sbody.id === this.originP){
            
            var velo = sbody.getVertexVelo(contact);
            totalVelo = addPVectors(totalVelo,velo);
            return totalVelo;

        }
        
        if(sbody.angVelo !== 0){
            
            var veloDir = getNrmUV(part.basePos, contact);
    
            var radius = mag(contact.x-part.basePos.x,contact.y-part.basePos.y);
            
            var veloMag = radius*sbody.angVelo;
            
            totalVelo.x += veloDir.x*veloMag;
            totalVelo.y += veloDir.y*veloMag;

        }
        
        var part = this.parts[part.basePart];
        var sbody = this.subBodies[part.id];
    }
    
    
};

game.prototype.collide = function(id1, id2, contacts){
    var veloChange = new PVector(0,0);
    var angChange = 0;
    
    var xIpRange = [0,0];
    var yIpRange = [0,0];
    var turnRange1 = [0,0];
    var turnRange2 = [0,0];
    
    var resolved = true;
    
    var oneSided = false;
    
    var body1;
    var sbody1;
    
    var body2;
    var sbody2;
    
    var active = [];
    var contactPoints = [];
    var velocities = [];
    var sortedVelocities = [];
    
    var sortedCollisions = [];
    
    var impulses = [];
    var angChanges1 = [];
    var angChanges2 = [];
    
    var tight = [];
    var tested = [];
    
    var shields = [];
    
    var partsCollided = [];
    
    var DEV_Friction = 1;
    
    if(id1<0){
        body1 = this.imobileB;
        oneSided = true;
    }
    else{
        body1 = this.actors[id1];
    }
    
    if(id2<0){
        body2 = this.imobileB;
        oneSided = true;
    }
    else{
        body2 = this.actors[id2];   
    }
    
    var sbody1 = body1.subBodies[body1.parts[contacts[0][0]].orgBody];
    var sbody2 = body2.subBodies[body2.parts[contacts[0][1]].orgBody];
    
    
    
    
    var ghost = false;
    if(sbody1.rest && sbody2.rest){
        ghost = true;
        this.global_Collision = true;
        println('oi');
        return;
    }
    
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

        var part1 = body1.parts[p1];
        var part2 = body2.parts[p2];
        
        
        //for the sake of easier, refine later
        var properties = [part1.bounce*dampen, [false,false], [part1.basePos,part2.basePos]];
        
        
        tested.push(false);
        
        var velo1;
        var velo2;
        
        if(sbody1.rest){
            velo1 = PVector(0,0);
        }else{
            velo1 = body1.getVelocityContributions(part1.id,contact);
        }
        
        if(sbody2.rest){
            velo2 = new PVector(0,0);
        }else{
            velo2 = body2.getVelocityContributions(part2.id,contact);
        }

        var relVelo = subPVectors(velo1,velo2);
        relVelo.x*=DEV_Friction;
        
        
        
        if(mag(relVelo.x,relVelo.y)<1/60){
            return;
        }
        
        
        if(nrmDir.x === 0 && nrmDir.y === 0){
            println('retired...');
            if(mag(relVelo.x,relVelo.y) > 5/60){
                this.global_Collision = true;
                //resolved = false;
                
            }
        }
        else{
            var veloCheck = getDot(relVelo, nrmDir);
            if(veloCheck>0){
                relVelo.x-=nrmDir.x*veloCheck;
                relVelo.y-=nrmDir.y*veloCheck;
                active.push(false);
                continue;
            }
            else{
                //this.global_Collision = true;
            }
        }
        
        active.push(true);
        
        tight[i] = false;
        /*
        if(part1.id !== body1.orginP){
            tight[i] = false;
            shields[i] = [normalize(subPVectors(contact,part1.basePos)), new PVector(0,0)];
        }
        else{
            tight[i] = true;
            shields[i] = [new PVector(0,0), new PVector(0,0)];
        }
        */
        
        /* if any joints on limb is broken, save some time
        if(){
            var passDir = normalize(subPVectors(contact,part1.basePos));
            var passVelo = multPVector(passDir,getDot(relVelo,passDir));
            var relVelo = subPVectors(relVelo,passVelo);
        }
        */
        
        properties[1] = [false,false];
        var impulse = getImpulse(sbody1,sbody2,contact,nrmDir,relVelo,properties);
        
        impulses[i] = impulse;
        velocities[i] = relVelo;
        
        var k = 0;

        while(k<sortedVelocities.length && mag(relVelo.x,relVelo.y)>mag(sortedVelocities[k][0].x,sortedVelocities[k][0].y))
        {
            k++;
        }
        
        sortedVelocities.splice(k, 0, [relVelo,i]);
        
        var k = 0;

        while(k<sortedCollisions.length && part1.id>sortedCollisions[k][0])
        {
            k++;
        }
        
        sortedCollisions.splice(k, 0, [part1.id,i]);
        
        partsCollided[part1.id] = true;
        
        
        
        
        contactPoints[i] = contact;
        
        
        
        var angChange1 = 0;
        if(!sbody1.rest){
            var relContact1 = new PVector(contact.x-sbody1.com.x,contact.y-sbody1.com.y);
            angChange1=(getCross(relContact1,impulse)/sbody1.inertia);
            
        }
        var angChange2 = 0;
        if(!sbody2.rest){
            var relContact2 = new PVector(contact.x-sbody2.com.x,contact.y-sbody2.com.y);
            angChange2=(getCross(relContact2,impulse)/sbody2.inertia);
        }
        
        angChanges1[i] = angChange1;
        angChanges2[i] = angChange2;
        
        
        //drawLines.push([contact,new PVector(contact.x+impulse.x,contact.y+impulse.y)]);
        /*
        
        xIpRange[0] = min(xIpRange[0], impulse.x);
        xIpRange[1] = max(xIpRange[1], impulse.x);
        
        yIpRange[0] = min(yIpRange[0], impulse.y);
        yIpRange[1] = max(yIpRange[1], impulse.y);

        
        if(!sbody1.rest){
            turnRange1[0] = min(turnRange1[0], angChange1);
            turnRange1[1] = max(turnRange1[1], angChange1);
        }
        
        if(!sbody2.rest){
            turnRange2[0] = min(turnRange2[0], angChange2);
            turnRange2[1] = max(turnRange2[1], angChange2);
        }
        */
        
        /*
        if(!sbody1.rest){
            //drawLines.push([sbody1.com,addPVectors(sbody1.com,multPVector(new PVector(xIpRange[0]+xIpRange[1],yIpRange[0]+yIpRange[1]),1000))]);
            
            sbody1.velo.x+=(impulse.x)/sbody1.mass;
            sbody1.velo.y+=(impulse.y)/sbody1.mass;
            sbody1.angVelo+=angChange1;
            //println(id1+': '+sbody1.velo.y);
        
        }
        */
        
    }
    
    var rankings = [];
    for(var i = 0; i < sortedVelocities.length; i++){
        rankings[sortedVelocities[i][1]] = i;
    }
    
    var secured = [false,false];
    
    
    
    while(!secured[0] || !secured[1]){
        var secured = [false,false];
        xIpRange = [0,0];
        yIpRange = [0,0];
        turnRange1 = [0,0];
        turnRange2 = [0,0];
    
        for(var i = 0; i < impulses.length; i++){
            if(!active[i]){
                continue;
            }
            xIpRange[0] = min(xIpRange[0], impulses[i].x);
            xIpRange[1] = max(xIpRange[1], impulses[i].x);
            
            yIpRange[0] = min(yIpRange[0], impulses[i].y);
            yIpRange[1] = max(yIpRange[1], impulses[i].y);
            
            turnRange1[0] = min(turnRange1[0], angChanges1[i]);
            turnRange1[1] = max(turnRange1[1], angChanges1[i]);
            
            turnRange2[0] = min(turnRange2[0], angChanges2[i]);
            turnRange2[1] = max(turnRange2[1], angChanges2[i]);
        }
        
        
        var netDir = normalize(new PVector(xIpRange[0]+xIpRange[1],yIpRange[0]+yIpRange[1]));
        netDir = multPVector(netDir,-1);
        
        var splitter = getCross(netDir,sbody1.com);
        
        var checkPoints = [-1,-1];
        
        var sideSorted = [[],[]];
        var rankL = -1;
        var rankR = -1;
        
        
        
        for(var c = 0; c < contacts.length; c++){
            if(!active[c] || tested[c]){
                continue;
            }
            var contact = contacts[c][2];
            
            if(splitter>=getCross(netDir,contact)){
                sideSorted[0].push(c);
                if(tight[c] || rankings[c] > rankL && !tested[c]){//redundent testing check
                    rankL = rankings[c];
                    checkPoints[0] = c;
                }
                
            }
            
            if(splitter<=getCross(netDir,contact)){
                sideSorted[1].push(c);
                if(tight[c] || rankings[c] > rankR && !tested[c]){
                    rankR = rankings[c];
                    checkPoints[1] = c;
                }
                
            }

            
        }
        
        for(var c = 0; c < checkPoints.length; c++){
            
            var i = checkPoints[c];
            
            if(i<0 || secured[c] || tight[i]){
                secured[c] = true;
                continue;
            }
            
            
            var p1 = contacts[i][0];
            var p2 = contacts[i][1];
            var contact = contacts[i][2];
            var nrmDir = contacts[i][3];
    
            var part1 = body1.parts[p1];
            var part2 = body2.parts[p2];
            
            //simplify to [true,false] when safe
            var properties = [part1.bounce*dampen, [false,false], [part1.basePos,part2.basePos]];
            
            var relVelo = velocities[i];
            

                    
            for(var h = 0; h < sideSorted[c].length; h++){
                if(tested[sideSorted[c][h]]){
                    var shield = shields[sideSorted[c][h]];
                    if(getDot(relVelo,shield[0])>0){
                        relVelo = zeroOutDir(relVelo,shield[0]);
                    }
                    
                    
                    
                    var cushion = getDot(normalize(relVelo),shield[1]);
                    var relMag = mag(relVelo.x,relVelo.y);
                    if(cushion>0){
                        relVelo = multPVector(relVelo,max((relMag-cushion),0)/relMag);
                    }
                }
            }
            
            var breakCount = 0;
            var aidVelo = new PVector(0,0); //need better names...
            var limitDir = new PVector(0,0);
            
            var block = false;
            
            
            while(part1.id !== body1.originP){//replace with (if not origin part) eventually
                part1.pColor = [230, 0, 255];
                var passDir = normalize(subPVectors(contact,part1.basePos));
                var passVelo = multPVector(passDir,getDot(relVelo,passDir));
                var turnVelo = subPVectors(relVelo,passVelo);
    
                var sbodyT1 = body1.subBodies[part1.id];
                
                properties[1] = [true,false];
    
    
                var impulse = getImpulse(sbodyT1,sbody2,contact,nrmDir,turnVelo,properties);
                
                
                var relContact1 = new PVector(contact.x-part1.basePos.x,contact.y-part1.basePos.y);
                
                var angOffset = getCross(relContact1,impulse)/sbodyT1.ghInertia;
    
                
                var radiusOSB = mag(sbodyT1.outerSB.com.x-part1.basePos.x,sbodyT1.outerSB.com.y-part1.basePos.y);
                
                var torqueReq = angOffset/(1/sbodyT1.outerSB.mass/radiusOSB/radiusOSB);
                
                //println(torqueReq);
                
                var stiffness = min(part1.torqueSup/abs(torqueReq),1);
                
                
                //drawLines.push([part1.basePos,addPVectors(part1.basePos,multPVector(turnVelo,100))]);
                drawLines.push([part1.basePos,addPVectors(part1.basePos,multPVector(passVelo,10))]);
                
                if(sortedVelocities[0][0].x>112){
                    println('in1');
                    println(relVelo);
                    println(passDir);
                    println(passVelo);
                    println(turnVelo);
                    
                    
                    println('out');
                }
                
                
                
                turnVelo = multPVector(turnVelo,stiffness);
                
                
                passVelo = addPVectors(turnVelo,passVelo);
                
                //println(torqueReq);
                
                if(stiffness<1){//sent turnVelo will also need to include friction
                    //println(stiffness);
                    tested[i] = true;
                    breakCount+=1;
                    aidVelo = addPVectors(aidVelo,turnVelo);
                    limitDir = passDir;
                    if(breakCount > 1){//or more than two joint breaks
                        limitDir = new PVector(0,0);

                    }
                    part1.pColor = [149, 235, 52];
                    //part1.pColor[0] = 149;
                    //part1.pColor[1] = 235;
                    //part1.pColor[2] = 52;
        
                }
                
                
    
                part1.torqueSup -= min(abs(torqueReq),part1.torqueSup);
                
                if(sortedVelocities[0][0].x>112){
                    println('in2');
                    println(relVelo);
                    println(passDir);
                    println(passVelo);
                    println(turnVelo);
                    
                    println('out');
                }
                
                
                
                
                var relVelo = passVelo;
                
                
                //var spot1 = new PVector(100,100);
                //var spot2 = new PVector(300,100);
     
                //drawLines.push([spot1,addPVectors(spot1,multPVector(turnVelo,1000))]);
                //drawLines.push([spot2,addPVectors(spot2,multPVector(passVelo,1000))]);
            
               //drawLines.push([part1.pos,addPVectors(part1.pos,multPVector(passVelo,10))]);
               //drawLines.push([part1.pos,addPVectors(part1.pos,multPVector(turnVelo,10))]);
            
                
                if(partsCollided[part1.basePart]){
                   block = true;
                   limitDir = new PVector(0,0);
                   break;
                }

                    var part1 = body1.parts[part1.basePart];
                
    
            }
            
            shields[i] = [normalize(limitDir),aidVelo];
            
            if(block){//can be done much better...
                tested[i] = true;
                impulses[i] = new PVector(0,0);
                continue;
            }
            
            if(breakCount === 0){
                secured[c] = true;
                tight[i] = true;
            }
            
            
                
            
            
            
            if(secured[c]){
                continue;
            }
            
            
            
            
            properties[1] = [false,false];
            var impulse = getImpulse(sbody1,sbody2,contact,nrmDir,relVelo,properties);
            
            impulses[i] = impulse;
            //velocities[i] = relVelo;
            
            var angChange1 = 0;
            if(!sbody1.rest){
                var relContact1 = new PVector(contact.x-sbody1.com.x,contact.y-sbody1.com.y);
                angChange1=(getCross(relContact1,impulse)/sbody1.inertia);
                
            }
            var angChange2 = 0;
            if(!sbody2.rest){
                var relContact2 = new PVector(contact.x-sbody2.com.x,contact.y-sbody2.com.y);
                angChange2=(getCross(relContact2,impulse)/sbody2.inertia);
            }
            
            angChanges1[i] = angChange1;
            angChanges2[i] = angChange2;
            
            
        }
        
    }
    
    
    for(var T = 0; T < impulses.length;T++){
        if(active[T]){
            if(impulses[T].y<-200){
                println(contacts[T][0]+':'+multPVector(impulses[T],1/sbody1.mass));
                println(sortedVelocities);
            }
        }
        
    }
    
    //println(impulses);
    //println('');
    if(!sbody1.rest){
        //println(frameCount+' '+multPVector(new PVector(xIpRange[0]+xIpRange[1],yIpRange[0]+yIpRange[1]),1/sbody1.mass));
        drawLines.push([sbody1.com,addPVectors(sbody1.com,multPVector(new PVector(xIpRange[0]+xIpRange[1],yIpRange[0]+yIpRange[1]),10/sbody1.mass))]);
        //println(id1+': '+new PVector(xIpRange[0]+xIpRange[1],yIpRange[0]+yIpRange[1]));
        sbody1.velo.x+=(xIpRange[0]+xIpRange[1])/sbody1.mass;
        sbody1.velo.y+=(yIpRange[0]+yIpRange[1])/sbody1.mass;
        sbody1.angVelo+=turnRange1[0]+turnRange1[1];
        //println('V'+id1+': '+sbody1.velo.y);
    }
    
    
    if(!sbody2.rest){
        sbody2.velo.x-=(xIpRange[0]+xIpRange[1])/sbody2.mass;
        sbody2.velo.y-=(yIpRange[0]+yIpRange[1])/sbody2.mass;
        sbody2.angVelo-=turnRange2[0]+turnRange2[1];
    }
    
    //for(var i = 0; i<contacts.length; i++){ 
    
    for(var s = 0; s<sortedCollisions.length; s++){
        var i = sortedCollisions[s][1];
   
        
        if(!active[i]){
            continue;
        }
        var p1 = contacts[i][0];
        var p2 = contacts[i][1];
        var contact = contacts[i][2];
        var nrmDir = contacts[i][3];

        var part1 = body1.parts[p1];
        var part2 = body2.parts[p2];
        
        //for the sake of easier, refine later
        var properties = [part1.bounce*dampen, [false,false], [part1.basePos,part2.basePos]];
        
        var velo1;
        var velo2;
        
        if(sbody1.rest){
            velo1 = PVector(0,0);
        }else{
            velo1 = body1.getVelocityContributions(part1.id,contact);
        }
        
        if(sbody2.rest){
            velo2 = new PVector(0,0);
        }else{
            velo2 = body2.getVelocityContributions(part2.id,contact);
        }

        var relVelo = subPVectors(velo1,velo2);
        relVelo.x*=DEV_Friction;
        
        
        
        if(nrmDir.x === 0 && nrmDir.y === 0){
            if(mag(relVelo.x,relVelo.y) > 5/60){
                this.global_Collision = true;
                //resolved = false;
                
            }
        }
        else{
            var veloCheck = getDot(relVelo, nrmDir);
            if(veloCheck>0){
                relVelo.x-=nrmDir.x*veloCheck;
                relVelo.y-=nrmDir.y*veloCheck;
                //continue;
            }
            else{
                //this.global_Collision = true;
            }
        }
        
        //println(part1.torqueSup<=0);
        
        while(part1.id !== body1.originP){
            
            if(part1.torqueSup<=0){//replace with (if not origin part) eventually
    
                
                
                var passDir = normalize(subPVectors(contact,part1.basePos));
                var passVelo = multPVector(passDir,getDot(relVelo,passDir));
                var turnVelo = subPVectors(relVelo,passVelo);
                
                if(getDot(turnVelo, nrmDir)>0){
                    break;
                }
    
                var sbodyT1 = body1.subBodies[part1.id];
                
                properties[1] = [true,false];
                
                //var spot1 = new PVector(100,100);
                //var spot2 = new PVector(300,100);
     
                //drawLines.push([spot1,addPVectors(spot1,multPVector(turnVelo,1000))]);
                //drawLines.push([spot2,addPVectors(spot2,multPVector(passVelo,1000))]);
    
                var impulse = getImpulse(sbodyT1,sbody2,contact,nrmDir,turnVelo,properties);
                //impulse.x*=DEV_Friction;
                
                var relContact1 = new PVector(contact.x-part1.basePos.x,contact.y-part1.basePos.y);
                
                var angOffset = getCross(relContact1,impulse)/sbodyT1.ghInertia;
                
                
                sbodyT1.angVelo+=angOffset;
                //println(sbodyT1.angVelo);
                
                //figure out how to transfer linear impulse to main later
                
                relVelo = passVelo;
    
            }
            
            
            var part1 = body1.parts[part1.basePart];
            

            
            
        
        }
    }

    //println(this.global_Collision);
};


game.prototype.collideBup = function(id1, id2, contacts){
        var veloChange = new PVector(0,0);
    var angChange = 0;
    
    var xIpRange = [0,0];
    var yIpRange = [0,0];
    var turnRange1 = [0,0];
    var turnRange2 = [0,0];
    
    var resolved = true;
    
    var oneSided = false;
    
    var body1;
    var sbody1;
    
    var body2;
    var sbody2;
    
    var leftovers = [];
    
    var DEV_Friction = 1;
    
    if(id1<0){
        body1 = this.imobileB;
        oneSided = true;
    }
    else{
        body1 = this.actors[id1];
    }
    
    if(id2<0){
        body2 = this.imobileB;
        oneSided = true;
    }
    else{
        body2 = this.actors[id2];   
    }
    
    var sbody1 = body1.subBodies[body1.parts[contacts[0][0]].orgBody];
    var sbody2 = body2.subBodies[body2.parts[contacts[0][1]].orgBody];
    
    
    
    
    var ghost = false;
    if(sbody1.rest && sbody2.rest){
        ghost = true;
        this.global_Collision = true;
        println('oi');
        return;
    }
    
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

        var part1 = body1.parts[p1];
        var part2 = body2.parts[p2];
        
        //for the sake of easier, refine later
        var properties = [part1.bounce*dampen, [false,false], [part1.basePos,part2.basePos]];
        
        var velo1;
        var velo2;
        
        if(sbody1.rest){
            velo1 = PVector(0,0);
        }else{
            velo1 = body1.getVelocityContributions(part1.id,contact);
        }
        
        if(sbody2.rest){
            velo2 = new PVector(0,0);
        }else{
            velo2 = body2.getVelocityContributions(part2.id,contact);
        }

        var relVelo = subPVectors(velo1,velo2);
        relVelo.x*=DEV_Friction;
        if(mag(relVelo.x,relVelo.y)<1/60){
            return;
        }
        
        
        if(nrmDir.x === 0 && nrmDir.y === 0){
            if(mag(relVelo.x,relVelo.y) > 5/60){
                this.global_Collision = true;
                //resolved = false;
                
            }
        }
        else{
            var veloCheck = getDot(relVelo, nrmDir);
            if(veloCheck>0){
                relVelo.x-=nrmDir.x*veloCheck;
                relVelo.y-=nrmDir.y*veloCheck;
                continue;
            }
            else{
                this.global_Collision = true;
            }
        }
        
        //drawLines.push([contact,addPVectors(contact,multPVector(relVelo,1000))]);
        
        if(part1.turning&&getDot(relVelo, nrmDir)<=0){//replace with (if not origin part) eventually
            
            var passDir = normalize(subPVectors(contact,part1.basePos));
            var passVelo = multPVector(passDir,getDot(relVelo,passDir));
            var turnVelo = subPVectors(relVelo,passVelo);

            var sbodyT1 = body1.subBodies[part1.id];
            
            properties[1] = [true,false];
            
            //var spot1 = new PVector(100,100);
            //var spot2 = new PVector(300,100);
 
            //drawLines.push([spot1,addPVectors(spot1,multPVector(turnVelo,1000))]);
            //drawLines.push([spot2,addPVectors(spot2,multPVector(passVelo,1000))]);

            var impulse = getImpulse(sbodyT1,sbody2,contact,nrmDir,turnVelo,properties);
            
            
            var relContact1 = new PVector(contact.x-part1.basePos.x,contact.y-part1.basePos.y);
            
            var angOffset = getCross(relContact1,impulse)/sbodyT1.ghInertia;

            
            var radiusOSB = mag(sbodyT1.outerSB.com.x-part1.basePos.x,sbodyT1.outerSB.com.y-part1.basePos.y);
            
            var torqueReq = angOffset/(1/sbodyT1.outerSB.mass/radiusOSB/radiusOSB);
            
            var stiffness = min(part1.torqueSup/abs(torqueReq),1);
            
            turnVelo = multPVector(turnVelo,stiffness);
            
            passVelo = addPVectors(turnVelo,passVelo);
            
            if(part1.torqueSup === part1.torqueMax){
                //println('');
                //println('new');
            }
            
            if(part1.torqueSup>0 && abs(torqueReq)>part1.torqueSup){
                //println('broke');
            }
            
            //println(part1.torqueSup+' '+torqueReq+' '+angOffset);
            
            part1.torqueSup -= min(abs(torqueReq),part1.torqueSup);

            //sbodyT1.angVelo+=angOffset*(1-stiffness);
            leftovers[i]=(1-stiffness);
            
            //figure out how to transfer linear impulse to main later
            
            relVelo = passVelo;

        }
        
        properties[1] = [false,false];
        var impulse = getImpulse(sbody1,sbody2,contact,nrmDir,relVelo,properties);
        
        
        var angChange1 = 0;
        if(!sbody1.rest){
            var relContact1 = new PVector(contact.x-sbody1.com.x,contact.y-sbody1.com.y);
            angChange1=(getCross(relContact1,impulse)/sbody1.inertia);
        }
        var angChange2 = 0;
        if(!sbody2.rest){
            var relContact2 = new PVector(contact.x-sbody2.com.x,contact.y-sbody2.com.y);
            angChange2=(getCross(relContact2,impulse)/sbody2.inertia);
        }
        
        //drawLines.push([contact,new PVector(contact.x+impulse.x,contact.y+impulse.y)]);
        
        
        xIpRange[0] = min(xIpRange[0], impulse.x);
        xIpRange[1] = max(xIpRange[1], impulse.x);
        
        yIpRange[0] = min(yIpRange[0], impulse.y);
        yIpRange[1] = max(yIpRange[1], impulse.y);
        
        
        
        
        if(!sbody1.rest){
            turnRange1[0] = min(turnRange1[0], angChange1);
            turnRange1[1] = max(turnRange1[1], angChange1);
        }
        
        if(!sbody2.rest){
            turnRange2[0] = min(turnRange2[0], angChange2);
            turnRange2[1] = max(turnRange2[1], angChange2);
        }
        
        
        /*
        if(!sbody1.rest){
            //drawLines.push([sbody1.com,addPVectors(sbody1.com,multPVector(new PVector(xIpRange[0]+xIpRange[1],yIpRange[0]+yIpRange[1]),1000))]);
            
            sbody1.velo.x+=(impulse.x)/sbody1.mass;
            sbody1.velo.y+=(impulse.y)/sbody1.mass;
            sbody1.angVelo+=angChange1;
            //println(id1+': '+sbody1.velo.y);
        
        }
        */
        
    }
    
    
    
    if(!sbody1.rest){
        //drawLines.push([sbody1.com,addPVectors(sbody1.com,multPVector(new PVector(xIpRange[0]+xIpRange[1],yIpRange[0]+yIpRange[1]),1))]);
        //println(id1+': '+new PVector(xIpRange[0]+xIpRange[1],yIpRange[0]+yIpRange[1]));
        sbody1.velo.x+=(xIpRange[0]+xIpRange[1])/sbody1.mass;
        sbody1.velo.y+=(yIpRange[0]+yIpRange[1])/sbody1.mass;
        sbody1.angVelo+=turnRange1[0]+turnRange1[1];
        //println('V'+id1+': '+sbody1.velo.y);
    }
    
    
    if(!sbody2.rest){
        sbody2.velo.x-=(xIpRange[0]+xIpRange[1])/sbody2.mass;
        sbody2.velo.y-=(yIpRange[0]+yIpRange[1])/sbody2.mass;
        sbody2.angVelo-=turnRange2[0]+turnRange2[1];
    }
    
    
    
    
    for(var i = 0; i<contacts.length; i++){
        var p1 = contacts[i][0];
        var p2 = contacts[i][1];
        var contact = contacts[i][2];
        var nrmDir = contacts[i][3];

        var part1 = body1.parts[p1];
        var part2 = body2.parts[p2];
        
        //for the sake of easier, refine later
        var properties = [part1.bounce*dampen, [false,false], [part1.basePos,part2.basePos]];
        
        var velo1;
        var velo2;
        
        if(sbody1.rest){
            velo1 = PVector(0,0);
        }else{
            velo1 = body1.getVelocityContributions(part1.id,contact);
        }
        
        if(sbody2.rest){
            velo2 = new PVector(0,0);
        }else{
            velo2 = body2.getVelocityContributions(part2.id,contact);
        }

        var relVelo = subPVectors(velo1,velo2);
        relVelo.x*=DEV_Friction;
        
        
        
        if(nrmDir.x === 0 && nrmDir.y === 0){
            if(mag(relVelo.x,relVelo.y) > 5/60){
                this.global_Collision = true;
                //resolved = false;
                
            }
        }
        else{
            var veloCheck = getDot(relVelo, nrmDir);
            if(veloCheck>0){
                relVelo.x-=nrmDir.x*veloCheck;
                relVelo.y-=nrmDir.y*veloCheck;
                //continue;
            }
            else{
                this.global_Collision = true;
            }
        }
        
        if(part1.turning&&part1.torqueSup<=0){//replace with (if not origin part) eventually

            
            var passDir = normalize(subPVectors(contact,part1.basePos));
            var passVelo = multPVector(passDir,getDot(relVelo,passDir));
            var turnVelo = subPVectors(relVelo,passVelo);

            var sbodyT1 = body1.subBodies[part1.id];
            
            properties[1] = [true,false];
            
            //var spot1 = new PVector(100,100);
            //var spot2 = new PVector(300,100);
 
            //drawLines.push([spot1,addPVectors(spot1,multPVector(turnVelo,1000))]);
            //drawLines.push([spot2,addPVectors(spot2,multPVector(passVelo,1000))]);

            var impulse = getImpulse(sbodyT1,sbody2,contact,nrmDir,turnVelo,properties);
            impulse.x*=DEV_Friction;
            
            var relContact1 = new PVector(contact.x-part1.basePos.x,contact.y-part1.basePos.y);
            
            var angOffset = getCross(relContact1,impulse)/sbodyT1.ghInertia;
            
            
            sbodyT1.angVelo+=angOffset;
            //println(sbodyT1.angVelo);
            
            //figure out how to transfer linear impulse to main later
            
            relVelo = passVelo;

        }
        
    }
    
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
            if(part1.tipPart<0){
                continue;
            }
            var vertexs1 = part1.vertexs;
            
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
            
            //for rectangles only... doesn't work with current method of checking no collision, may update later
            var tipVertexs1;
            if(part1.id === body1.originP || true){
                tipVertexs1 = vertexs1.getArray();
            }else{
                tipVertexs1 = [vertexs1.getPoint(2),vertexs1.getPoint(3)];
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
                
                //
                drawPoints.push(sbody2.com);
                //
                
                var vsRest = false;
                if(sbody1.rest || sbody2.rest){
                    if(!sbody1.rest || !sbody2.rest){
                        vsRest = true;
                    }
                    else
                    {
                        continue;
                    }
                }

                
                
                for(var p2 = 0; p2 < sbody2.partIds.length; p2++){
                    var part2 = body2.parts[sbody2.partIds[p2]];
                    if(part2.tipPart<0){
                        continue;
                    }
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
                    
                    
                    var tipVertexs2;
                    if(part2.id === body2.originP || true){
                        tipVertexs2 = vertexs2.getArray();
                    }
                    else{
                        tipVertexs2 = [vertexs2.getPoint(2),vertexs2.getPoint(3)];
                    }
                    
                    
                    for(var n1 = 0; n1<nrmDirs1.length; n1++){
                        var holder = getBounds(tipVertexs2,nrmDirs1[n1]);
                        bounds12[n1]=holder[0];
                        boundsI12[n1]=holder[1];
                    }
                    
                    
                    for(var n2 = 0; n2<nrmDirs2.length; n2++){
                        //for squares, only get bounds of tip vertex points for less empty checks
                        var holder = getBounds(tipVertexs1,nrmDirs2[n2]);
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
                        var penPart;
                        var penVertexs;
                        var edgeVertexs;
                        var penBody;
                        
                        
                        if(pener === 1){
                            penPart = part1;
                            penVertexs = vertexs1;
                            
                            edgeVertexs = vertexs2;
                            
                            penBody = body1;
        
                        }
                        else{
                            penPart = part2;
                            penVertexs = vertexs2;
                            
                            con_nrmDir.x*=-1;
                            con_nrmDir.y*=-1;
                            edgeVertexs = vertexs1;
                            
                            penBody = body2;
                        }
        
                        xPenRange[0] = min(xPenRange[0], con_nrmDir.x*minPen);
                        xPenRange[1] = max(xPenRange[1], con_nrmDir.x*minPen);
                        
                        yPenRange[0] = min(yPenRange[0], con_nrmDir.y*minPen);
                        yPenRange[1] = max(yPenRange[1], con_nrmDir.y*minPen);
                        
                        var DEV_posSum = new PVector(0,0);
                        var DEV_countSum = 0;
                        
                        var DEV_tipIds;
                        
                        //println([penPart.id,penBody.originP]);
                        if(penPart.id === penBody.originP){//hardcoded for rectangles
                            DEV_tipIds = [0,1,2,3];
                        }else{
                            DEV_tipIds = [2,3];
                        }
                        
                        for(var i = 0; i<DEV_tipIds.length; i++){
                            if(checkBounded(penVertexs.getPoint(DEV_tipIds[i]), edgeVertexs)){
                                
                                //contacts.push([part1.id,part2.id,penVertexs.getPoint(i),con_nrmDir]);                 //^old
                                DEV_posSum = addPVectors(DEV_posSum,penVertexs.getPoint(DEV_tipIds[i]));
                                DEV_countSum+=1;
                                
                            }
                        }
                        if(DEV_countSum>0){
                            collided = true;
                            DEV_posSum = multPVector(DEV_posSum,1/DEV_countSum);
                            contacts.push([part1.id,part2.id,DEV_posSum,con_nrmDir]);
                        }
           
                    }
                    
                }
                if(collided){
                    if(vsRest){
                        this.contactsvR.push([id1,id2,contacts]);
                    }
                    else
                    {
                        this.contacts.push([id1,id2,contacts]);
                    }
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
        
        drawPoints.push(sbody.com);
        
        
        if(sbody.rest){
            continue;   
        }
        for(var p = 0; p < sbody.partIds.length; p++){
            var part = body.parts[sbody.partIds[p]];
            if(part.tipPart<0){
                continue;
            }
            var DEV_posSum = new PVector(0,0);
            var DEV_countSum = 0;
            
            var DEV_tipIds;
                        
            
            if(part.id === body.originP){//hardcoded for rectangles
                DEV_tipIds = [0,1,2,3];
            }else{
                DEV_tipIds = [2,3];
            }
            
            for(var v = 0; v < DEV_tipIds.length; v++){
                if(part.vertexs.getPoint(DEV_tipIds[v]).y>this.floor){
                    if(part.vertexs.getPoint(DEV_tipIds[v]).y>maxPenetrate){
                       maxPenetrate=part.vertexs.getPoint(DEV_tipIds[v]).y;
                       //this.actors[id].penetrate.y=(this.floor-maxPenetrate+this.actors[id].velo.y);
                    }
                    collided = true;
                    
                    //contacts.push([part.id,0,part.vertexs.getPoint(DEV_tipIds[v]),nrmDir]);
                    //^old
                    
                    DEV_posSum = addPVectors(DEV_posSum,part.vertexs.getPoint(DEV_tipIds[v]));
                    DEV_countSum+=1;
                    
                }
            }
            if(DEV_countSum>0){
                DEV_posSum = multPVector(DEV_posSum,1/DEV_countSum);
                contacts.push([part.id,0,DEV_posSum,nrmDir]);
            }
        }
        if(collided){
            this.contactsvR.push([id,-1,contacts]);
        }
    }
    
    var partialPen = 0.3;
    var weight = 1;
    if(maxPenetrate>0){
        this.actors[id].penetrate.y+=(this.floor-maxPenetrate)*partialPen*weight;
        this.actors[id].conCount+=weight;
    }
    
};

game.prototype.applyCollisions = function(){
    var resCounter = 0;
    this.global_Collision = true;

    while(this.global_Collision){
        this.global_Collision = false;
        for(var i = 0; i<this.contacts.length; i++){
            this.collide(this.contacts[i][0],this.contacts[i][1],this.contacts[i][2]);
        }
        if(resCounter > 35){//move this
            this.global_Collision = false;
        }
        resCounter+=1;
    }
    
    this.setAwakened();
    
    
    var resCounter = 0;
    this.global_Collision = true;
    while(this.global_Collision){
        this.global_Collision = false;
        for(var i = 0; i<this.contacts.length; i++){
            /*
            if(this.contacts[i][0] === 0){
                this.collide(this.contacts[i][0],this.contacts[i][1],this.contacts[i][2]);
            }
            
            if(this.contacts[i][0] === 1){
                this.collideBup(this.contacts[i][0],this.contacts[i][1],this.contacts[i][2]);
            }
            */
            this.collide(this.contacts[i][0],this.contacts[i][1],this.contacts[i][2]);
        }
        if(resCounter > 35){//move this
            this.global_Collision = false;
        }
        resCounter+=1;
    }
    //println(resCounter);
    
    //uncomment to enable rest
    //this.setStablePoints();
    //this.setRestedSBodies();
    
    
    for(var i = 0; i<this.actors.length ;i++){
        for(var s = 0; s<this.actors[i].activeSBs.length; s++){
            var sbody = this.actors[i].subBodies[this.actors[i].activeSBs[s]];
            if(sbody.rest){
                continue;
            }
            sbody.com.x+=this.actors[i].penetrate.x/max(1,this.actors[i].conCount);
            sbody.com.y+=this.actors[i].penetrate.y/max(1,this.actors[i].conCount);

        }
    }
    
};

game.prototype.checkCollisions = function(){
    var resCounter = 0;
    this.contacts = [];//rename to collisions?
    this.contactsvR = [];
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
            var p2 = this.actors[i].activeSBs[j];
            var part2 = this.actors[i].parts[p2];
            
            var p1 = part2.basePart;
            var part1 = this.actors[i].parts[p1];
            var point = part2.basePos;
            
            if(this.actors[i].subBodies[part1.orgBody].rest || this.actors[i].subBodies[part2.orgBody].rest){
                if(!this.actors[i].subBodies[part1.orgBody].rest || !this.actors[i].subBodies[part2.orgBody].rest){
                    this.contactsvR.push([i,i,[[p1,p2,point,new PVector(0,0)]]]);
                }
                else{
                    continue;
                }
            }
            else{
                this.contacts.push([i,i,[[p1,p2,point,new PVector(0,0)]]]);
            }
            
        }
    }
    
    
    this.applyCollisions();
            
};

body.prototype.getAttachedParts = function(p,partIds){
    var part = this.parts[p];
    partIds.push(part.id);
    
    for(var i = 0; i < part.attached.length; i++){
        partIds = this.getAttachedParts(part.attached[i],partIds);
    }
    return partIds;
};

body.prototype.getOutsideParts = function(p,outPartIds,insideP){
    if(p !== insideP){
        var part = this.parts[p];
        outPartIds.push(part.id);
        
        for(var i = 0; i < part.attached.length; i++){
            outPartIds = this.getOutsideParts(part.attached[i],outPartIds,insideP);
        }
    }
    return outPartIds;
};


body.prototype.initSubbodies = function(){
    var partIds = [];
    for(var p = 0; p<this.parts.length; p++){
        var partIds = [];
        partIds = this.getAttachedParts(p,partIds);
        var outPartIds = [];
        outPartIds = this.getOutsideParts(this.originP,outPartIds,p);
        
        var sbody = new subBody();
        sbody.id = p;
        sbody.partIds = partIds;
        sbody.ownerId = this.id;
        sbody.outerSB = new subBody();
        sbody.outerSB.partIds = outPartIds;
        sbody.outerSB.ownerId = this.id;
        
        this.subBodies[p] = sbody;
    }
    
};


body.prototype.bendJoints = function(turnJ, J){
    var currPart = this.parts[J];

    for(var i = 0; i < currPart.attached.length; i++){
        this.bendJoints(turnJ,currPart.attached[i]);
    }
    
    if(turnJ === J){
        return;
    }
    
    var turnPart = this.parts[turnJ];
    
    var radius = subPVectors(currPart.basePos,turnPart.basePos);
    var turned = rotateVector(radius, this.subBodies[turnPart.id].angVelo);
    
    
    currPart.basePos.x = turnPart.basePos.x+turned.x;
    currPart.basePos.y = turnPart.basePos.y+turned.y;
    
    //drawPoints.push(currPart.basePos);
};

body.prototype.applyTurns = function(){
    var turnExists = false;
    for(var i = 0; i < this.parts.length; i++){
        var part = this.parts[i];
        if(part.id !== this.originP && this.subBodies[part.id].angVelo !== 0){
            //printout(this.subBodies[part.id].angVelo);
            this.bendJoints(part.id,part.id);
            turnExists = true;
        }
    }
    
    return turnExists;
};


body.prototype.activateTurns = function(){
    var originSB = this.subBodies[this.originP];
    for(var i = 0; i < this.parts.length; i++){
        var part = this.parts[i];
        part.torqueSup = part.torqueMax;
        var sbody = this.subBodies[part.id];
        if(part.id !== this.originP){

            
            //update com, mass and inertia
            
            var massResults = this.getMass(sbody);
            sbody.com = massResults[0];
            sbody.mass = massResults[1];
            var inertiaResults = this.getInertia(sbody);
            sbody.inertia = inertiaResults[0];
            sbody.ghInertia = inertiaResults[1];
            
            
            var outerSB = sbody.outerSB;
            var massResults = this.getMass(outerSB);
            outerSB.com = massResults[0];
            outerSB.mass = massResults[1];
            var inertiaResults = this.getInertia(outerSB);
            outerSB.inertia = inertiaResults[0];
            outerSB.ghInertia = inertiaResults[1];
            
            var veloDir = getNrmUV(part.basePos,sbody.com);
            var radius = mag(sbody.com.x-part.basePos.x,sbody.com.y-part.basePos.y);
            if(sbody.angVelo !== part.goalAngVelo){
                //apply torque
                
                var radiusOSB = mag(outerSB.com.x-part.basePos.x,outerSB.com.y-part.basePos.y);
                
                var torqueReq = 2*(part.goalAngVelo-sbody.angVelo)/(1/sbody.mass/radius/radius+1/outerSB.mass/radiusOSB/radiusOSB);
                
                var torqueUse = min(part.torqueSup,abs(torqueReq));
                
                if(torqueReq<0){
                    torqueUse*=-1;
                }
                
                if(abs(torqueUse)>0){
                    
                    sbody.angVelo += torqueUse/2/sbody.mass/radius/radius;
                    outerSB.angVelo += -torqueUse/2/outerSB.mass/radiusOSB/radiusOSB;
                    
                    //align originSB with outerSB
                    var origVeloDir = getNrmUV(part.basePos,originSB.com);
                    
                    var origVelo = multPVector(origVeloDir,outerSB.angVelo*mag(originSB.com.x-part.basePos.x,originSB.com.y-part.basePos.y));
                    
                    originSB.velo = addPVectors(originSB.velo, origVelo);
                    originSB.angVelo += outerSB.angVelo;
                    
                    //set turning SB relative to origin SB
                    sbody.angVelo -= outerSB.angVelo;
                    outerSB.angVelo = 0;
                    
                }
            }
            //drawPoints.push(originSB.com);
            //drawLines.push([originSB.com,addPVectors(originSB.com,originSB.velo)]);
            
        }
        //part.torqueSup = part.torqueMax;
        
    }
};


body.prototype.setAct = function(){
  this.controls();
  
  this.applyAccel();
  
}; 

body.prototype.act = function(){

    
  this.applyVelo();
  this.applyAngVelo();
  this.updateJoints();
  
  var newShape = this.applyTurns();
  
  
  this.updateParts();

    
  if(newShape){
      this.updateShape();
  }
  
  this.activateTurns();
  
};

game.prototype.act = function(){

    

    this.checkCollisions();
    for (var i = 0; i<this.actors.length;i++){
        this.actors[i].setAct();
        this.actors[i].act();
        
    }
    
};

//optimizable

body.prototype.drawLimbs = function(){
    noStroke();
    for(var i = 0; i < this.parts.length; i++){
        if(this.parts[i].tipPart<0){
            continue;
        }
        fill(this.parts[i].pColor[0], this.parts[i].pColor[1], this.parts[i].pColor[2]);
        quad(this.parts[i].vertexs.getPoint(0).x, this.parts[i].vertexs.getPoint(0).y, this.parts[i].vertexs.getPoint(1).x, this.parts[i].vertexs.getPoint(1).y, this.parts[i].vertexs.getPoint(2).x, this.parts[i].vertexs.getPoint(2).y, this.parts[i].vertexs.getPoint(3).x, this.parts[i].vertexs.getPoint(3).y);
    }
};

body.prototype.drawBones = function() {
    strokeWeight(3);
    for(var i = 0; i < this.parts.length; i++){
        if(this.parts[i].tipPart<0){
            continue;
        }

        stroke(this.parts[i].jColor[0], this.parts[i].jColor[1], this.parts[i].jColor[2]);
        line(this.parts[i].basePos.x,this.parts[i].basePos.y,this.parts[this.parts[i].tipPart].basePos.x,this.parts[this.parts[i].tipPart].basePos.y);
    }
};

body.prototype.drawJoints = function() {
    strokeWeight(2);
    for(var i = 0; i < this.parts.length; i++){
        stroke(255,255,255);
        point(this.parts[i].basePos.x,this.parts[i].basePos.y);
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
    var hip = new part(x,y);
    var should = new part(x+50,y);
    var elbow = new part(x+100,y);
    var wrist = new part(x+150,y);
    var finger = new part(x+200,y);
    
    this.parts = [hip,should,elbow,wrist,finger];
    
    for(var i = 0;i<this.parts.length;i++){
        this.parts[i].id = i;
        this.parts[i].initSquare();
    }
    
    
    hip.basePart = hip.id;
    hip.tipPart = should.id;
    hip.attached = [should.id];
    
    should.basePart = hip.id;
    should.tipPart = elbow.id;
    should.attached = [elbow.id];
    
    elbow.basePart = should.id;
    elbow.tipPart = wrist.id;
    elbow.attached = [wrist.id];
    
    wrist.basePart = elbow.id;
    wrist.tipPart = finger.id;
    wrist.attached = [finger.id];
    
    finger.basePart = wrist.id;
    finger.tipPart = -1;
    finger.attached = [];
    
    
    this.originP = 0;
    this.activeSBs.push(this.originP);
    this.initSubbodies();
    this.updateParts();
    this.updateShape();
};

body.prototype.createLimbY = function(x,y){
    var hip = new part(x,y);
    var should = new part(x,y+50);
    var elbow = new part(x,y+100);
    var wrist = new part(x,y+150);
    var finger = new part(x,y+200);
    
    hip.massPerVertex = 10;
    
    this.parts = [hip,should,elbow,wrist,finger];
    
    for(var i = 0;i<this.parts.length;i++){
        this.parts[i].id = i;
        this.parts[i].initSquare();
    }
    
    
    hip.basePart = hip.id;
    hip.tipPart = should.id;
    hip.attached = [should.id];
    
    should.basePart = hip.id;
    should.tipPart = elbow.id;
    should.attached = [elbow.id];
    
    elbow.basePart = should.id;
    elbow.tipPart = wrist.id;
    elbow.attached = [wrist.id];
    
    wrist.basePart = elbow.id;
    wrist.tipPart = finger.id;
    wrist.attached = [finger.id];
    
    finger.basePart = wrist.id;
    finger.tipPart = -1;
    finger.attached = [];
    
    
    
    this.originP = 0;
    this.activeSBs.push(this.originP);
    this.initSubbodies();
    this.updateParts();
    this.updateShape();
};

body.prototype.createLegs = function(x,y){
    var hip = new part(x,y);
    var chest = new part(x,y-25);
    
    var thighL = new part(x,y);
    var shinL = new part(x-25,y+50);
    var footL = new part(x-70,y+80);
    var toeL = new part(x-75,y+150);
    
    var thighR = new part(x,y);
    var shinR = new part(x+25,y+50);
    var footR = new part(x+70,y+80);
    var toeR = new part(x+75,y+150);
    
    hip.massPerVertex = 10;
    
    this.parts = [hip,chest,thighL,shinL,footL,toeL,thighR,shinR,footR,toeR];
    
    for(var i = 0;i<this.parts.length;i++){
        this.parts[i].id = i;
        this.parts[i].initSquare();
    }
    
    
    hip.basePart = hip.id;
    hip.tipPart = chest.id;
    hip.attached = [chest.id,thighL.id,thighR.id];
    
    chest.basePart = hip.id;
    chest.tipPart = -1;
    chest.attached = [];
    
    thighL.basePart = hip.id;
    thighL.tipPart = shinL.id;
    thighL.attached = [shinL.id];
    
    shinL.basePart = thighL.id;
    shinL.tipPart = footL.id;
    shinL.attached = [footL.id];
    
    footL.basePart = shinL.id;
    footL.tipPart = toeL.id;
    footL.attached = [toeL.id];
    
    toeL.basePart = footL.id;
    toeL.tipPart = -1;
    toeL.attached = [];
    
    thighR.basePart = hip.id;
    thighR.tipPart = shinR.id;
    thighR.attached = [shinR.id];
    
    shinR.basePart = thighR.id;
    shinR.tipPart = footR.id;
    shinR.attached = [footR.id];
    
    footR.basePart = shinR.id;
    footR.tipPart = toeR.id;
    footR.attached = [toeR.id];
    
    toeR.basePart = footR.id;
    toeR.tipPart = -1;
    toeR.attached = [];
    
    
    
    this.originP = 0;
    this.activeSBs.push(this.originP);
    this.initSubbodies();
    this.updateParts();
    this.updateShape();
};

game.prototype.getImobileB = function(){
    return this.imobileB;
};

subBody.prototype.setImobileB = function(){
    this.com.x = 0;
    this.com.y = 0;
    this.velo.x = 0;
    this.velo.y = 0;
    this.angVelo = 0;
    this.mass = Infinity;
    this.inertia = Infinity;
    this.rest = true;
};

body.prototype.createImobileB = function(){
    var p_1 = new part(0,0);
    var p_2 = new part(0,0);

    var sbody = new subBody();
    sbody.ownerId = -1;
        
    this.parts = [p_1,p_2];
    
    for(var i = 0;i<this.parts.length;i++){
        sbody.partIds.push(i);
        this.parts[i].id = i;
    }
    
    p_1.basePart = p_1.id;
    p_1.tipPart = p_2.id;
    p_1.attached = [p_2.id];
    
    p_2.basePart = p_1.id;
    p_2.tipPart = -1;
    p_2.attached = [];
    //sbody.mass = Infinity;
    //sbody.inertia = Infinity;
    //sbody.rest = true;
    sbody.setImobileB();
    this.originP = 0;
    this.subBodies[0] = sbody;
    this.activeSBs.push(0);
    
    
};

game.prototype.initGame = function(){
    
    this.imobileB = new body();
    this.imobileB.createImobileB();

    var legs1 = new body();
    legs1.id = 0;
    legs1.createLegs(200,100);
    //legs1.subBodies[0].velo.x = 1;
    
    var legs2 = new body();
    legs2.id = 1;
    legs2.createLegs(325,100);
    //legs2.subBodies[0].velo.x = 1;
    
    var limb1 = new body();
    limb1.id = 0;
    limb1.createLimbX(10,0);
    //limb1.subBodies[0].velo.x = 1;
    
    var limb2 = new body();
    limb2.id = 1;
    limb2.createLimbX(230,0);
    //limb2.subBodies[0].velo.x = 1;
    
    //this.actors[0] = limb1;
    //this.actors[1] = limb2;
    this.actors[0] = legs1;
    //this.actors[1] = legs2;

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


