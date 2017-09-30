$(document).ready(function (){

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    canvas.style.width='100%';
    canvas.style.height='';
    var PORTRAITWIDTH = 0;
    var PORTRAITHEIGHT = 0;
    var LANDSCAPEWIDTH = 0;
    var LANDSCAPEHEIGHT = 0;
    var BB = canvas.getBoundingClientRect();
    var offsetX = 0;
    var offsetY = BB.top;
    var sButRadius = canvas.clientWidth*(0.014);
    var mButRadius = canvas.clientWidth*(0.025);
    var lButRadius = canvas.clientWidth*(0.036);
    var markerWidth = canvas.clientWidth*(0.003);
    var smallBut = document.getElementById("smallBut");
    var medBut = document.getElementById("medBut");
    var larBut = document.getElementById("largeBut");
    var delBut = document.getElementById("delBut");
    var startBut = document.getElementById("startBut");
    var timeout, longtouch
    var timeoutDuration = 300;
    var moved=false;
    var hardCaliX=-5;
    var hardCaliY=-2;
    
    // drag related variables
    var dragok = false;
    var startX;
    var startY;

    var scrnclkX=lButRadius;
    var scrnclkY=lButRadius;
    var canvasclkX=0;
    var canvasclkY=0;

    // an array of objects that define different rectangles
    NAV.markers = [];

    //set up orientation heights and widths
    var defaultOrientation = null;
    defaultOrientation = getOrientation();

    if(defaultOrientation == "portrait-primary" || defaultOrientation== "portrait-secondary"){ 
        var PORTRAITWIDTH = canvas.clientWidth;
        var PORTRAITHEIGHT = canvas.clientHeight;
    }else {
        var LANDSCAPEWIDTH = canvas.clientWidth;
        var LANDSCAPEHEIGHT = canvas.clientHeight;    
    }

    // listen for mouse events
    canvas.onmousedown = myDown;
    canvas.onmouseup = myUp;
    canvas.onmousemove = myMove;
    canvas.onclick = function(){
        jQuery("#chooseWindow").css({
            display: 'none'});
        jQuery("#selectWindow").css({
            display: 'none'});

    };

    smallBut.addEventListener("click" , function (e){
        add(canvasclkX,canvasclkY,sButRadius);
    });
    medBut.addEventListener("click" , function (e){
        add(canvasclkX,canvasclkY,mButRadius);
    });
    largeBut.addEventListener("click" , function (e){
        add(canvasclkX,canvasclkY,lButRadius);
    });
    delBut.addEventListener("click" , function (e){
        del();
    });
    startBut.addEventListener("click" , function (e){
        makeStartHold();
    });
    canvas.addEventListener('dblclick', function (e){
        setClkPositions(e);
        if(detectMarksAt(canvasclkX,canvasclkY)){
            displayDel();
        }else{
            displaySizeChoose();
        }
        
    });

    // Mobile Support mouse events
    canvas.addEventListener('touchstart', function (e){
		myTouchStart(e);
	});
    canvas.addEventListener('touchend', function (e){
        myTouchEnd(e);
    });

    canvas.addEventListener('touchmove', function (e){
        myTouchMove(e);
    });

    window.onload = function() {
        document.onselectstart = function() {return false;} // ie
    }

    var butWidth = canvas.clientWidth*(0.1);
    var fontSize = canvas.clientWidth*(0.015);
    var buttonCSS={
		'width': butWidth,
		'font-size': fontSize,
		'text-align': 'center',
		'border': '2px solid',
		'background-color': 'white',
		'border-radius': '12px'
    }
    // set button display based on screen resolution
    $('#smallBut').css(buttonCSS);
	$('#medBut').css(buttonCSS);    
	$('#largeBut').css(buttonCSS);
	$('#delBut').css(buttonCSS);
	$('#startBut').css(buttonCSS);

    $('#smallBut').on("touchstart" , function (e){
        add(canvasclkX,canvasclkY,sButRadius);
    });
    $('#medBut').on("touchstart" , function (e){
        add(canvasclkX,canvasclkY,mButRadius);
    });
    $('#largeBut').on("touchstart" , function (e){
        add(canvasclkX,canvasclkY,lButRadius);
    });
    $('#delBut').on("touchstart" , function (e){
        del();
    });
    $('#startBut').on("touchstart" , function (e){
        makeStartHold();
    });

    function makeMarker(x,y,r,c){
        ctx.beginPath();
        ctx.lineWidth=markerWidth;
        ctx.arc(x, y, r, 0, 2*Math.PI);
        ctx.closePath();
        if(c==0){
            ctx.strokeStyle = 'rgba(255,0,0,1)';
        }else {
            ctx.strokeStyle = 'rgba(0,255,0,1)';
        }
        ctx.stroke();
    }

    function clear() {
        var maxWidth = (PORTRAITWIDTH>LANDSCAPEWIDTH) ? PORTRAITWIDTH: LANDSCAPEWIDTH;
        var maxHeight = (PORTRAITHEIGHT>LANDSCAPEHEIGHT) ? PORTRAITHEIGHT: LANDSCAPEHEIGHT;
        ctx.clearRect(0, 0, maxWidth, maxHeight);
    }

    function draw() {
        clear();
        for (var i = 0; i < NAV.markers.length; i++) {
            var mark = NAV.markers[i];
            makeMarker(mark.x, mark.y, mark.r, mark.c);
        }
    }

    function myTouchStart(e){
		jQuery("#chooseWindow").css({
            display: 'none'});
        jQuery("#selectWindow").css({
            display: 'none'});
		timeout = setTimeout(function() {
            setClkPositions(e);
            if(!detectMarksAt(canvasclkX,canvasclkY)){
                displaySizeChoose();
            }
        }, timeoutDuration);
		setClkPositions(e);
		if(detectMarksAt(canvasclkX,canvasclkY)){
			displayDel();
			myDown(e);
		}
	}

    function myTouchEnd(e){
		clearTimeout(timeout);
		myUp(e);
    }

    function myTouchMove(e){
		clearTimeout(timeout);
		myMove(e);
    }

    // handle mousedown events
    function myDown(e) {

        // tell the browser we're handling this mouse event
        e.preventDefault();
        e.stopPropagation();
        var mx,my;

        // get the current mouse position
        setClkPositions(e);
        mx = canvasclkX;
        my = canvasclkY;

        // test each rect to see if mouse is inside
        dragok = false;
        for (var i = 0; i < NAV.markers.length; i++) {
            var mark = NAV.markers[i];
            if (mx > mark.x - mark.r && mx < mark.x + mark.r && my > mark.y - mark.r && my < mark.y + mark.r) {
                // if yes, set that rects isDragging=true
                dragok = true;
                mark.isDragging = true;
            }
        }
        // save the current mouse position
        startX = mx;
        startY = my;
    }


    // handle mouseup events
    function myUp(e) {  
        // tell the browser we're handling this mouse event
        e.preventDefault();
        e.stopPropagation();

        // clear all the dragging flags
        dragok = false;
        for (var i = 0; i < NAV.markers.length; i++) {
            NAV.markers[i].isDragging = false;
        }
    }


    // handle mouse moves
    function myMove(e) {
        // if we're dragging anything...
        if (dragok) {

            // tell the browser we're handling this mouse event
            e.preventDefault();
            e.stopPropagation();
            var mx, my;
            // get the current mouse position

           	setClkPositions(e);
          	mx = canvasclkX;
           	my = canvasclkY;
            
            // calculate the distance the mouse has moved
            // since the last mousemove
            var dx = mx - startX;
            var dy = my - startY;

            // move each rect that isDragging 
            // by the distance the mouse has moved
            // since the last mousemove
            for (var i = 0; i < NAV.markers.length; i++) {
                var mark = NAV.markers[i];
                if (mark.isDragging) {
                    mark.x += dx;
                    mark.y += dy;
                }
            }

            // redraw the scene with the new rect positions
            draw();

            // reset the starting mouse position for the next mousemove
            startX = mx;
            startY = my;

        }
    }
    //Adds a new marker
    function add(x, y, r){
        NAV.markers.push({
            x: x,
            y: y,
            r: r,
            c: 0,
            isDragging: false
        });
        draw();
        jQuery("#chooseWindow").css({
            display: 'none'});

    }
    function del(){
        for (var i = 0; i < NAV.markers.length; i++) {
            var mark = NAV.markers[i];
            if (canvasclkX > mark.x - mark.r && canvasclkX < mark.x + mark.r && canvasclkY > mark.y - mark.r && canvasclkY < mark.y + mark.r) {
                NAV.markers.splice(i,1);
            }
        }
        draw();
        jQuery("#selectWindow").css({
            display: 'none'});
    }

    function displaySizeChoose(){
    	jQuery("#selectWindow").css({
            display: 'none'
        });
        var div = jQuery("#chooseWindow");
        var h=(scrnclkY-div[0].clientHeight);
        var w=(scrnclkX-div[0].clientWidth);
        div.css({
            display: 'block',
            position:"absolute", 
            top: h,
            left: w});
    }
    function displayDel(){
    	jQuery("#chooseWindow").css({
            display: 'none'
        });
        var div = jQuery("#selectWindow");
        var h=(scrnclkY-div[0].clientHeight);
        var w=(scrnclkX-div[0].clientWidth);
        div.css({
            display: 'block',
            position:"absolute", 
            top:h, 
            left: w});
    }
    function makeStartHold(){
        for (var i = 0; i < NAV.markers.length; i++) {
            var mark = NAV.markers[i];
            if (canvasclkX > mark.x - mark.r && canvasclkX < mark.x + mark.r && canvasclkY > mark.y - mark.r && canvasclkY < mark.y + mark.r) {
                if(mark.c==0){
                    mark.c=1;
                }else{
                    mark.c=0;
                }
            }
        }
        draw();
        jQuery("#selectWindow").css({
            display: 'none'});
    }

    function setClkPositions(e){

    	if(e.type=="touchend"){
    		scrnclkX = e.changedTouches[0].pageX;
        	scrnclkY = e.changedTouches[0].pageY-$('#navbar')[0].clientHeight;
    	}else if(e.type =="touchstart" || e.type =="touchmove"){
    		scrnclkX= e.touches[0].pageX;
    		scrnclkY= e.touches[0].pageY-$('#navbar')[0].clientHeight;
    	}
    	else{
        	scrnclkX = e.pageX;
        	scrnclkY = e.pageY-$('#navbar')[0].clientHeight;
    	}
        //Orientation depended position for canvas
        var orientation = getOrientation();

        if(orientation == defaultOrientation){ 
            canvasclkX = scrnclkX
            canvasclkY = scrnclkY
        }else {
            //ratio = DEFAULT / NEW
            var aspectRatioX, aspectRatioY;
            //not default oridentation
            if(orientation == "portrait-primary" || defaultOrientation == "portrait-secondary"){
                PORTRAITWIDTH = canvas.clientWidth;
                PORTRAITHEIGHT = canvas.clientHeight;
                
                aspectRatioX = LANDSCAPEWIDTH / PORTRAITWIDTH;
                aspectRatioY  = LANDSCAPEHEIGHT / PORTRAITHEIGHT;
            }else {
                LANDSCAPEWIDTH = canvas.clientWidth;
                LANDSCAPEHEIGHT = canvas.clientHeight;

                aspectRatioX = PORTRAITWIDTH / LANDSCAPEWIDTH;
                aspectRatioY  = PORTRAITHEIGHT / LANDSCAPEHEIGHT;
            }
            canvasclkX = scrnclkX * aspectRatioX;
            canvasclkY = scrnclkY * aspectRatioY;
        }
        canvasclkX+=hardCaliX;
        canvasclkY+=hardCaliY;
        scrnclkX+=hardCaliX;
        scrnclkY+=hardCaliY;

    }

    function getOrientation(){
		var orient = null;
		try{
			orient = window.screen.orientation.type;
		}catch(err){
			console.log(err.message);
		}try{
			//ios
			switch(window.orientation){
				case 0:
				case 180:
					orient = "portrait-primary";
					break;
				case -90:
				case 90:
					orient = "landscape-primary";
					break;
				default:
					console.log("Invalid Window.orientation")
			}
		}catch(err){
			console.log(err.message);
		}
		return orient;
	}

    function detectMarksAt(x,y){
        for (var i = 0; i < NAV.markers.length; i++) {
            var mark = NAV.markers[i];
            if (canvasclkX > mark.x - mark.r && canvasclkX < mark.x + mark.r && canvasclkY > mark.y - mark.r && canvasclkY < mark.y + mark.r) {
                return true;
            }
        }
        return false;
    }

});
