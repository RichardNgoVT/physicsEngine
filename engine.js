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
    this.maxAngVelo = PI/69;//PI/69
    
    //status
    this.vertexs = new pointStorage();//corners of part
    this.pos = new PVector(0, 0);//center of part
    this.turning = false;
    this.torque = 0;
    this.state = 0;
    
};



var subBody= function(){
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
    
    for(var i = 0; i < sbody.partIds.length;i++){
        if(this.getSPart(sbody,i).tipPart<0){
            continue;
        }
        var vertexs = this.getSPart(sbody,i).vertexs;
        for(var j = 0; j<vertexs.length;j++){
            var cenLen = mag(vertexs.getPoint(j).x-sbody.com.x,vertexs.getPoint(j).y-sbody.com.y);
           
            inertia += this.getSPart(sbody,i).massPerVertex*cenLen*cenLen;
        }
    }
    return inertia;
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
            sbody.inertia = this.getInertia(sbody);
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
    
        this.parts[2].turning = true;
        this.parts[2].torque = -20;
        
        
    }
    else if(keys[3]){//w

    }
    else{

    }
    if(keys[4]){//a

    }
    else if(keys[5]){//s

    }
    else{
        
    }
    if(keys[6]){//z
        //this.relaxJoint(2);
        
    }
    else if(keys[7]){//x
        
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
    if(mag(relVelo.x,relVelo.y) < 1/50){
        //drawPoints.push(contact);
        
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
        }
        else{
            this.global_Collision = true;
            //resolved = false;
        }
    }
    
    
    
    var relContact1;
    var relContact2;
    
    var res1;
    var res2;
    
    var veloDir = getUV(relVelo);
    
    var turnable = properties[1];
    
    var inertia1 = sbody1.inertia;
    if(!turnable[0]){
        var inertia1 = Infinity;
    }
    
    var inertia2 = sbody2.inertia;
    if(!turnable[1]){
        var inertia2 = Infinity;
    }
    
    if(sbody1.rest){
        res1 = 0;
    }
    else{
        var relContact1 = new PVector(contact.x-sbody1.com.x,contact.y-sbody1.com.y);
        var turnDir1 = getCross(relContact1,veloDir);
        res1 = 1/sbody1.mass + (turnDir1*turnDir1)/sbody1.inertia;
    }
    
    if(sbody2.rest){
        res2 = 0;
    }
    else{
        var relContact2 = new PVector(contact.x-sbody2.com.x,contact.y-sbody2.com.y);
        var turnDir2 = getCross(relContact2,veloDir);
        res2 = 1/sbody2.mass + (turnDir2*turnDir2)/sbody2.inertia;
    }
    
    var impulse = new PVector(0,0);
    
    var bounce = properties[0];
    impulse.x = -(1+bounce)*(relVelo.x)/(res1+res2);
    impulse.y = -(1+bounce)*(relVelo.y)/(res1+res2);
    
    return impulse;
};


body.prototype.getImpactContributions = function(p,contact){
    var part = this.parts[p];
    var sbody = this.subBodies[part.id];

    var veloContr = [];
    var totalVelo = new PVector(0,0);
    while(true){
        if(part.turning || sbody.id === this.originP){
            var velo = sbody.getVertexVelo(contact);
            totalVelo = addPVectors(totalVelo,velo);
            veloContr.push([sbody.id,velo]);
            
            if(sbody.id === this.originP){
                break;
            }
        }
        var part = this.parts[part.basePart];
        var sbody = this.subBodies[part.id];
    }
    
    
    
    var impactContr = [];
    var veloDir = normalize(totalVelo);
    var veloMag = mag(totalVelo.x,totalVelo.y);
    var totalContr = 0;
    
    for(var i = 0; i < veloContr.length; i++){
        var contribution = getDot(veloDir,veloContr[i][1]);
        if(contribution+totalContr>0){
            contribution = min(contribution,veloMag-totalContr);
            impactContr.push([veloContr[i][0], multPVector(veloDir,contribution)]);
        }
        totalContr += contribution;
        
        if(totalContr >= veloMag){
            break;
        }
    }
    
    return impactContr;
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
        
        var properties = [part1.bounce*dampen, [true,true]];
        
        var velo1;
        var velo2;
        
        if(sbody1.rest){
            velo1 = [[body1.originP,new PVector(0,0)]];
        }else{
            
            velo1 = body1.getImpactContributions(part1.id,contact);
            
            
        }
        
        if(sbody2.rest){
            velo2 = [[body2.originP,new PVector(0,0)]];
        }else{
            velo2 = body2.getImpactContributions(part2.id,contact);
        }
        
        //printout(velo1,velo2);
        
        var impulse = new PVector(0,0);
        
        var sumVelo = new PVector(0,0);//testing
        
        for(var v1 = 0; v1 < velo1.length; v1++){
            for(var v2 = 0; v2 < velo2.length; v2++){
                
                var sbodyC1 = body1.subBodies[velo1[v1][0]];
                var sbodyC2 = body2.subBodies[velo2[v2][0]];
                var relVelo = subPVectors(velo1[v1][1],velo2[v2][1]);
                
                sumVelo = addPVectors(relVelo,sumVelo);
                
                properties[1] = [(sbodyC1.id === body1.originP),(sbodyC2.id === body2.originP)];

                var imResults = getImpulse(sbodyC1,sbodyC2,contact,nrmDir,relVelo,properties);
                impulse = addPVectors(impulse,imResults);
            }
        }
        
        //
        //impulse = getImpulse(sbody1,sbody2,contact,nrmDir,sumVelo,properties);
        //
        
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
        
    }
    
    
    
    if(!sbody1.rest){
        sbody1.velo.x+=(xIpRange[0]+xIpRange[1])/sbody1.mass;
        sbody1.velo.y+=(yIpRange[0]+yIpRange[1])/sbody1.mass;
        sbody1.angVelo+=turnRange1[0]+turnRange1[1];
    }
    
    
    if(!sbody2.rest){
        sbody2.velo.x-=(xIpRange[0]+xIpRange[1])/sbody2.mass;
        sbody2.velo.y-=(yIpRange[0]+yIpRange[1])/sbody2.mass;
        sbody2.angVelo-=turnRange2[0]+turnRange2[1];
    }
    
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
        
        if(this.actors[0].activeSBs.length>1){
        if(id1 === 0 && p1 === 1 && id2 === 1 && p2 === 0){
            drawPoints.push(contact);
            //println('A0S0:'+this.actors[0].subBodies[0].rest+'A0S2:'+this.actors[0].subBodies[2].rest+'A1S0:'+this.actors[1].subBodies[0].rest+'A1S2:'+this.actors[1].subBodies[2].rest);
            //println(sbody1.id+' '+sbody2.id);
        }
        }
        
        
        //if(oneSided){//condition unessesary
        //    this.setImobileB(contact.x,contact.y);
        //}
        
        
        var part1 = body1.parts[p1];
        var part2 = body2.parts[p2];
        
        var velo1;
        var velo2;
        
        if(sbody1.rest){
            velo1 = new PVector(0,0);
        }else{
            velo1 = sbody1.getVertexVelo(contact);
            
            
        }
        
        if(sbody2.rest){
            velo2 = new PVector(0,0);
        }else{
            velo2 = sbody2.getVertexVelo(contact);
        }
        
        var relVelo = new PVector(velo1.x-velo2.x,velo1.y-velo2.y);
        
        drawPoints.push(contact);
        if(mag(relVelo.x,relVelo.y) < 1/50){
            //drawPoints.push(contact);
            
        }
        
        
        if(internal){
            if(mag(relVelo.x,relVelo.y) > 5/60){
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
                this.global_Collision = true;
                resolved = false;
            }
        }
        
        
        
        var relContact1;
        var relContact2;
        
        var res1;
        var res2;
        
        var veloDir = getUV(relVelo);
        
        if(sbody1.rest){
            res1 = 0;
        }
        else{
            var relContact1 = new PVector(contact.x-sbody1.com.x,contact.y-sbody1.com.y);
            var turnDir1 = getCross(relContact1,veloDir);
            res1 = 1/sbody1.mass + (turnDir1*turnDir1)/sbody1.inertia;
        }
        
        if(sbody2.rest){
            res2 = 0;
        }else{
            var relContact2 = new PVector(contact.x-sbody2.com.x,contact.y-sbody2.com.y);
            var turnDir2 = getCross(relContact2,veloDir);
            res2 = 1/sbody2.mass + (turnDir2*turnDir2)/sbody2.inertia;
        }
        
        var impulse = new PVector(0,0);
        
        impulse.x = -(1+dampen*part1.bounce)*(relVelo.x)/(res1+res2);
        impulse.y = -(1+dampen*part1.bounce)*(relVelo.y)/(res1+res2);
        
        
        //drawLines.push([contact,new PVector(contact.x+impulse.x,contact.y+impulse.y)]);
        
        xIpRange[0] = min(xIpRange[0], impulse.x);
        xIpRange[1] = max(xIpRange[1], impulse.x);
        
        yIpRange[0] = min(yIpRange[0], impulse.y);
        yIpRange[1] = max(yIpRange[1], impulse.y);
        
        if(!sbody1.rest){
            var angChange1=(getCross(relContact1,impulse)/sbody1.inertia);
            turnRange1[0] = min(turnRange1[0], angChange1);
            turnRange1[1] = max(turnRange1[1], angChange1);
        }
        
        if(!sbody2.rest){
            var angChange2=(getCross(relContact2,impulse)/sbody2.inertia);
            turnRange2[0] = min(turnRange2[0], angChange2);
            turnRange2[1] = max(turnRange2[1], angChange2);
        }
        
        
        if(!oneSided && false){
            this.actors[id1].parts[p1].pColor[0] = 245;
            this.actors[id1].parts[p1].pColor[1] = 233;
            this.actors[id1].parts[p1].pColor[2] = 66;
            this.actors[id2].parts[p2].pColor[0] = 245;
            this.actors[id2].parts[p2].pColor[1] = 164;
            this.actors[id2].parts[p2].pColor[2] = 66;
        }
        
        
    }

    if(!sbody1.rest){
        sbody1.velo.x+=(xIpRange[0]+xIpRange[1])/sbody1.mass;
        sbody1.velo.y+=(yIpRange[0]+yIpRange[1])/sbody1.mass;
        sbody1.angVelo+=turnRange1[0]+turnRange1[1];
    }
    
    
    if(!sbody2.rest){
        sbody2.velo.x-=(xIpRange[0]+xIpRange[1])/sbody2.mass;
        sbody2.velo.y-=(yIpRange[0]+yIpRange[1])/sbody2.mass;
        sbody2.angVelo-=turnRange2[0]+turnRange2[1];
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
        //
        drawPoints.push(sbody1.com);
        //
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
                                //drawPoints.push(penVertexs.getPoint(i));
                                //println('here'+' '+contacts);
                            }
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
        if(sbody.rest){
            continue;   
        }
        for(var p = 0; p < sbody.partIds.length; p++){
            var part = body.parts[sbody.partIds[p]];
            if(part.tipPart<0){
                continue;
            }
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
            
            this.collide(this.contacts[i][0],this.contacts[i][1],this.contacts[i][2]);
        }
        if(resCounter > 35){//move this
            this.global_Collision = false;
        }
        resCounter+=1;
    }
    
    
    
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
    
    drawPoints.push(currPart.basePos);
};

body.prototype.applyTurns = function(){
    var turnExists = false;
    for(var i = 0; i < this.parts.length; i++){
        var part = this.parts[i];
        if(part.turning && this.subBodies[part.id].angVelo !== 0){
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
        if(part.turning){

            part.pColor[0] = 245;
            part.pColor[1] = 233;
            part.pColor[2] = 66;
            //update com, mass and inertia
            var sbody = this.subBodies[part.id];
            var massResults = this.getMass(sbody);
            sbody.com = massResults[0];
            sbody.mass = massResults[1];
            sbody.inertia = this.getInertia(sbody);
            
            
            var outerSB = sbody.outerSB;
            var massResults = this.getMass(outerSB);
            outerSB.com = massResults[0];
            outerSB.mass = massResults[1];
            outerSB.inertia = this.getInertia(outerSB);
            
            
            //apply torque
            var radius = mag(sbody.com.x-part.basePos.x,sbody.com.y-part.basePos.y);
            var veloDir = getNrmUV(part.basePos,sbody.com);
            
            if(abs(sbody.angVelo)<part.maxAngVelo){
                var veloT = (part.torque/radius)/sbody.mass;//linear acceleration
                
                sbody.angVelo += veloT/radius;//angular acceleration
                //sbody.velo = multPVector(veloDir,sbody.angVelo*radius);
    
                var radiusOSB = mag(outerSB.com.x-part.basePos.x,outerSB.com.y-part.basePos.y);
                var veloDirOSB = getNrmUV(part.basePos,outerSB.com);
                var veloTOSB = (-part.torque/radiusOSB)/outerSB.mass;
                
                outerSB.angVelo = veloTOSB/radiusOSB;
                outerSB.velo = multPVector(veloDirOSB,veloTOSB);
                
    
                //align originSB with outerSB
                originSB.velo = addPVectors(originSB.velo, outerSB.getVertexVelo(originSB.com));
                originSB.angVelo += outerSB.angVelo;
                
                //originSB.velo = addPVectors(originSB.velo, outerSB.velo);
                //originSB.angVelo += outerSB.angVelo;
                
                
                //set turning SB relative to origin SB
                sbody.angCompensate = -outerSB.angVelo; //might not be needed
                sbody.angVelo -= outerSB.angVelo;
                
                
            
            }
            drawPoints.push(originSB.com);
            //println(originSB.com);
            drawLines.push([originSB.com,addPVectors(originSB.com,originSB.velo)]);
            sbody.velo = multPVector(veloDir,sbody.angVelo*radius);
            
        }
        
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
    
    finger.basePart = elbow.id;
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
    
    finger.basePart = elbow.id;
    finger.tipPart = -1;
    finger.attached = [];
    
    
    
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

    var limb = new body();
    limb.id = 0;
    limb.createLimbY(200,100);
    //limb.subBodies[0].velo.x = 1;
    
    
    var limb2 = new body();
    limb2.id = 1;
    limb2.createLimbX(200,0);
    
    
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


