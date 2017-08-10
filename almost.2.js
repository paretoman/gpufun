
var left = document.getElementById('left')
var right = document.getElementById('right')

const gpu = new GPU();
left.innerHTML += gpu.getMode()
left.innerHTML += 'left is gpu output. right is true values.'
right.innerHTML += gpu.getMode()
right.innerHTML += 'left is gpu output. right is true values.'


// i is instances
// v is voters
// c is candidates
// l is a prefix for length of array

// there are three constructors here to make the datasets.
// 1. random voter and candidate positions
// 2. raster a group of voters
// 3. raster a candidate

// make variables

var lc = 5
var lv = 2
var li = 10 // 400
var xf = []
for (i =0;i<lc;i++) xf.push(Math.random())
var xv=[]
for (i =0;i<li;i++) {
	var da = []
	for (j =0;j<lv;j++) da.push(Math.random())
	xv.push(da)
}
var yv=xv
var yf=xf







const d = gpu.createKernel( function(xv, yv, xf, yf) {
	var civ,i,v,c,d,dx,dy,ci
	civ = this.thread.x
	v = Math.floor((civ) / (lc*li)); // z
	//v = civ / (lc*lv) >> 0
	ci = civ - v * lc * li
	//ci = civ % (lc*li)
	i = Math.floor((ci) / lc)
	//i = Math.floor(civ/lc)%li
	//i = tmp / lc >> 0; // y
	c = ci % lc; // x
	//c=civ%lc
	// d is indexed as civ

	dx = xv[i][v] - xf[c]
	dy = yv[i][v] - yf[c]
	d = Math.sqrt(dx*dx + dy*dy)
	return d
}, {
	dimensions: [lv*lc*li], // y,x
	constants: {lv:lv,lc:lc,li:li}
})


var cube = d(xv, yv, xf, yf)
//left.innerHTML += "<br>"+cube

left.innerHTML += "<br>"+"cube"
left.innerHTML += "<br>"+cube.slice(0,100).join("<br>")
right.innerHTML += "<br>"+"cube"
for (var civ=0; civ<lc*li*lv; civ++) {
	v = Math.floor((civ) / (lc*li)); // z
	//v = civ / (lc*lv) >> 0
	ci = civ - v * lc * li
	//ci = civ % (lc*li)
	i = Math.floor((ci) / lc)
	//i = Math.floor(civ/lc)%li
	//i = tmp / lc >> 0; // y
	c = ci % lc; // x
	//c=civ%lc
	// d is indexed as civ

	dx = xv[i][v] - xf[c]
	dy = yv[i][v] - yf[c]
	d2 = Math.sqrt(dx*dx + dy*dy)
	right.innerHTML += "<br>"+d2
}










// make grid of instances, i
WIDTH = 300
HEIGHT = 300
pixelsize = 30
lix = WIDTH / pixelsize // called density
liy = HEIGHT / pixelsize
li = lix * liy










var xc=xf
var yc=yf


votergrouptomove = 0 // edit this
vg = [] // which group does the voter belong to?
nvg = 3 // how many voter groups are there?
for (j =0;j<lv;j++) vg.push(Math.floor(nvg*Math.random()))
xvcenter = []
for (j =0;j<nvg;j++) xvcenter.push(Math.random())
yvcenter = xvcenter

const cubeVoter = gpu.createKernel( function(xv,yv,xc,yc,xvcenter,yvcenter,vg,votergrouptomove,pixelsize,liy,lix){
	var civ,i,v,c,d,dx,dy,ci,xnewv,ynewv,xnewvcenter,ynewvcenter

	civ = this.thread.x
	v = Math.floor(civ / (lc*li))
	ci = civ - v * lc * li
	i = Math.floor((ci) / lc)
	c = ci % lc; // x


	if (vg[v]==votergrouptomove){
		xnewvcenter = pixelsize * i / liy // rounding is actually done in the gpu.js code, so I don't actually need it here.  otherwise I would put a Math.round on this
		ynewvcenter = pixelsize * i % liy
		// next, shift the center to this new center
		xnewv = xv[v] + (xnewvcenter - xvcenter[votergrouptomove])
		ynewv = yv[v] + (ynewvcenter - yvcenter[votergrouptomove])
	} else {
		xnewv = xv[v]
		ynewv = yv[v]
	}
	dx = xc[c] - xnewv
	dy = yc[c] - ynewv
	d = Math.sqrt(dx*dx + dy*dy)
	return d
}, {
	dimensions: [lv*lc*li], // y,x
	constants: {lv:lv,lc:lc,li:li}
})

cubeV = cubeVoter(xv,yv,xc,yc,xvcenter,yvcenter,vg,votergrouptomove,pixelsize,liy,lix)


left.innerHTML += "<br>"+"cubeV"
left.innerHTML += "<br>"+cubeV.slice(0,100).join("<br>")








candidatetomove = 0 // edit this

var notcandidatetomove = []
var boolcanmove = []
for (i =0;i<lc;i++) {notcandidatetomove.push(i); boolcanmove.push(0) }
notcandidatetomove.splice(candidatetomove,1)
boolcanmove[candidatetomove]=1

const cubeCandidate = gpu.createKernel( function(xv,yv,xc,yc,candidatetomove,pixelsize,liy,lix){
	var civ,i,v,c,d,dx,dy,ci,xnewc,ynewc

	civ = this.thread.x
	v = Math.floor(civ / (lc*li))
	ci = civ - v * lc * li
	i = Math.floor((ci) / lc)
	c = ci % lc; // x

	//xnewc = xc[c] * (1-boolcanmove[c]) + xmoved * boolcanmove[c]
	if (c==candidatetomove){
		xnewc = pixelsize * i / liy // rounding is actually done in the gpu.js code, so I don't actually need it here.  otherwise I would put a Math.round on this
		ynewc = pixelsize * i % liy
	} else {
		xnewc = xc[c]
		ynewc = yc[c]
	}
	dx = xv[v] - xnewc
	dy = yv[v] - ynewc
	d = Math.sqrt(dx*dx + dy*dy)
	return d
}, {
	dimensions: [lv*lc*li], // y,x
	constants: {lv:lv,lc:lc,li:li}
})

cubeC = cubeCandidate(xv,yv,xc,yc,candidatetomove,pixelsize,liy,lix)

left.innerHTML += "<br>"+"cubeC"
left.innerHTML += "<br>"+cubeC.slice(0,100).join("<br>")



const minCube = gpu.createKernel( function(d) {
	var iv,civ,n,d1
	iv = this.thread.x
	
	n=1000
	for (var c = 0; c < lc; c++) {
		civ = c + iv* lc
		// d1 = d[c][i][v] // d at x,y,z
		//(z * xMax * yMax) + (y * xMax) + x;
	
		d1 = d[civ]
		if (d1 < n) {
			n = d1 //min
		}
	}
	return n
}, {
	dimensions: [lv*li*lc], // y,x
	constants: {lv:lv,lc:lc,li:li}
})

var min = minCube(cube).slice(0,lv*li) // weird. we need to slice because there is something weird going on with the output dimensions
left.innerHTML += "<br>"+"min"
left.innerHTML += "<br>"+min.slice(0,100).join("<br>")
right.innerHTML += "<br>"+"min"
for (var iv=0; iv<li*lv; iv++) {
	n=1000
	for (var c = 0; c < lc; c++) {
		civ = c + iv * lc
		// d1 = d[c][i][v] // d at x,y,z
		//(z * xMax * yMax) + (y * xMax) + x;
	
		d1 = cube[civ]
		if (d1 < n) {
			n = d1 //min
		}
	}
	right.innerHTML += "<br>"+n
}

// oh, heres a problem... 
// gpu.js doesn't allow integers
// so I can't index by anything other than this.thread.x


const maxCube = gpu.createKernel( function(d) {
	var iv,i,v,dx,dy,civ,n,m,d1
	iv = this.thread.x

	
	m=0
	for (var c = 0; c < lc; c++) {
		civ = c + iv *lc
		// d1 = d[c][i][v] // d at x,y,z
		//(z * xMax * yMax) + (y * xMax) + x;
		d1 = d[civ]
		if (d1 > m) {
			m = d1 //max
		}
	}
	return m
}, {
	dimensions: [lv*li*lc], // y,x
	constants: {lv:lv,lc:lc,li:li}
})

var max = maxCube(cube).slice(0,lv*li)
left.innerHTML += "<br>"+"max"
left.innerHTML += "<br>"+max.slice(0,100).join("<br>")

right.innerHTML += "<br>"+"max"

for (var iv=0; iv<li*lv; iv++) {
	m=-1
	for (var c = 0; c < lc; c++) {
		civ = c + iv * lc
		// d1 = d[c][i][v] // d at x,y,z
		//(z * xMax * yMax) + (y * xMax) + x;
	
		d1 = cube[civ]
		if (d1 > m) {
			m = d1 //min
		}
	}
	right.innerHTML += "<br>"+m
}




const doFnorm = gpu.createKernel(function(m,n) {
	var iv = this.thread.x
	var fnorm
	//fnorm =  (m[iv]-n[iv])
	fnorm = 1/ (m[iv]-n[iv])
	return fnorm
}, {
	dimensions: [li*lv*lc],
})
var fnormdone = doFnorm(max,min).slice(0,li*lv)


left.innerHTML += "<br>"+"fnorm"
left.innerHTML += "<br>"+fnormdone.slice(0,100).join("<br>")

right.innerHTML += "<br>"+"fnorm"

for (var iv=0; iv<li*lv; iv++) {
	fnorm = 1/ (max[iv]-min[iv])
	right.innerHTML += "<br>"+fnorm
}



const doScores = gpu.createKernel(function(d,m,n,fnorm, minscore, maxscore) {
	var v,i,iv,civ,ci,normit,score
	civ = this.thread.x

	v = Math.floor(civ / (lc*li))
	ci = civ - v*lc*li
	i = Math.floor(ci / lc)
	iv = v * li + i

	//normit = (d[civ]-n[iv])*fnorm[iv] // indices must be wrong earlier
	normit = (d[civ]-n[iv]) / (m[iv]-n[iv])  
	score = Math.floor(.5+minscore+(maxscore-minscore)*(1-normit))
	//return normit
	return score
}, {
	dimensions: [lc*li*lv],
	constants: {lv:lv,lc:lc,li:li}
})

var scores = doScores(cube,max,min,fnormdone,0,5).slice(0,lc*li*lv)
left.innerHTML += "<br>"+"scores"
left.innerHTML += "<br>"+scores.slice(0,100).join("<br>")

right.innerHTML += "<br>"+"scores"
maxscore=5
minscore=0

for (var civ=0; civ<lc*li*lv; civ++) {
	v = Math.floor(civ / (lc*li))
	ci = civ - v*lc*li
	i = Math.floor(ci / lc)
	iv = v * li + i

	//normit = (d[civ]-n[iv])*fnorm[iv] // indices must be wrong earlier
	normit = (cube[civ]-min[iv]) / (max[iv]-min[iv])  
	score = Math.floor(.5+minscore+(maxscore-minscore)*(1-normit))

	right.innerHTML += "<br>"+score
}

const doTally = gpu.createKernel(function(scores) {
	var ci,sum
	ci = this.thread.x
	sum = 0
	for (var v = 0; v < lv; v++) {
		//var civ = ci + v *lc*li
		//civ = c + i *lc + v *lc*li
		//sum += scores[civ]
		sum += scores[ci + v *lc*li]
	}
	return sum
}, {
	dimensions: [li*lc*lv], // weird that we need this extra lv dimension, which we remove later
	constants: {lv:lv,lc:lc,li:li}
})
var tally = doTally(scores).slice(0,li*lc)
left.innerHTML += "<br>"+"tally"
left.innerHTML += "<br>"+tally.slice(0,100).join("<br>")

right.innerHTML += "<br>"+"tally"

for (var ci = 0; ci< lc*li; ci++) {
	
	sum = 0
	for (var v = 0; v < lv; v++) {
		civ = ci + v *lc*li
		//civ = c + i *lc + v *lc*li
		sum += scores[civ]
	}
	right.innerHTML += "<br>"+sum
}

const findWinner = gpu.createKernel(function(tally) {
	var i,ci,m,t1,mi
	i = this.thread.x
	m = -1
	mi = -1
	for (var c = 0; c < lc; c++) {
		ci = c + i * lc
		t1 = tally[ci]
		if(t1 > m) {
			m = t1
			mi = c
		}
	}
	return mi
}, {
	dimensions: [li*lv*lc],
	constants: {lv:lv,lc:lc,li:li}
})
var winner = findWinner(tally).slice(0,li)
left.innerHTML += "<br>"+"winner"
left.innerHTML += "<br>"+winner.join("<br>")

right.innerHTML += "<br>"+"winner"

miset=[]
for (var i = 0; i < li; i++) {
	m = -1
	mi = -1
	for (var c = 0; c < lc; c++) {
		ci = c + i * lc
		t1 = tally[ci]
		if(t1 > m) {
			m = t1
			mi = c
		}
	}
	right.innerHTML += "<br>"+mi
	miset.push(mi)
}


const superKernel = gpu.combineKernels(d,minCube,maxCube,doFnorm,doScores,doTally,findWinner, function(xv,yv,xf,yf) {
		var cube,min,max,fnorm,scores,tally,winner
		cube = d(xv, yv, xf, yf)
		min = minCube(cube)
		max = maxCube(cube)
		fnorm = doFnorm(max,min)
		scores = doScores(cube,max,min,fnorm,5,0)
		
		tally = doTally(scores)
		winner = findWinner(tally)
		return winner
	})
var winner = superKernel(xv,yv,xf,yf).slice(0,li);
left.innerHTML += "<br>"+"megawinner"
left.innerHTML += "<br>"+winner.join("<br>")
right.innerHTML += "<br>"+"winner again"
right.innerHTML += "<br>"+miset.join("<br>")

// for ( var j=0;j<100;j++) {
// 	var winner = superKernel(xv,yv,xf,yf);
// 	left.innerHTML += "<br>"+winner[0])
// }
left.innerHTML += "<br>"+"done"
right.innerHTML += "<br>"+"done"
	
