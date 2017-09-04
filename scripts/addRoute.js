$(document).ready(function (){

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    canvas.style.width='100%';
    canvas.style.height='100%';
    canvas.width=canvas.offsetWidth;
    canvas.height=canvas.offsetHeight;
    var BB = canvas.getBoundingClientRect();
    var offsetX = BB.left;
    var offsetY = BB.top;
    var WIDTH = canvas.width;
    var HEIGHT = canvas.height;
    var sButRadius = 10;
    var mButRadius = 15;
    var lButRadius = 25;
    var smallBut = document.getElementById("smallBut");
    var medBut = document.getElementById("medBut");
    var larBut = document.getElementById("largeBut");
    var delBut = document.getElementById("delBut");
    var startBut = document.getElementById("startBut");
    
    // drag related variables
    var dragok = false;
    var startX;
    var startY;

    var clickedX=lButRadius;
    var clickedY=lButRadius;

    // an array of objects that define different rectangles
    var markers = [];


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
        add(clickedX,clickedY,sButRadius);
    });
    medBut.addEventListener("click" , function (e){
        add(clickedX,clickedY,mButRadius);
    });
    largeBut.addEventListener("click" , function (e){
        add(clickedX,clickedY,lButRadius);
    });
    delBut.addEventListener("click" , function (e){
        del();
    });
    startBut.addEventListener("click" , function (e){
        makeStartHold();
    });
    canvas.addEventListener('dblclick', function (e){

        clickedX = getMouseX(e);
        clickedY = getMouseY(e);

        if(detectMarksAt(clickedX,clickedY)){
            displayDel();
        }else{
            displaySizeChoose();
        }
        
    });

    function makeMarker(x,y,r,c){
        ctx.beginPath();
        ctx.lineWidth=5;
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
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
    }

    function draw() {
        clear();
        for (var i = 0; i < markers.length; i++) {
            var mark = markers[i];
            makeMarker(mark.x, mark.y, mark.r, mark.c);
        }
    }


    // handle mousedown events
    function myDown(e) {

        // tell the browser we're handling this mouse event
        e.preventDefault();
        e.stopPropagation();

        // get the current mouse position
        var mx = getMouseX(e);
        var my = getMouseY(e);

        // test each rect to see if mouse is inside
        dragok = false;
        for (var i = 0; i < markers.length; i++) {
            var mark = markers[i];
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
        for (var i = 0; i < markers.length; i++) {
            markers[i].isDragging = false;
        }
    }


    // handle mouse moves
    function myMove(e) {
        // if we're dragging anything...
        if (dragok) {

            // tell the browser we're handling this mouse event
            e.preventDefault();
            e.stopPropagation();

            // get the current mouse position
            var mx = parseInt(e.clientX - offsetX);
            var my = parseInt(e.clientY - offsetY);

            // calculate the distance the mouse has moved
            // since the last mousemove
            var dx = mx - startX;
            var dy = my - startY;

            // move each rect that isDragging 
            // by the distance the mouse has moved
            // since the last mousemove
            for (var i = 0; i < markers.length; i++) {
                var mark = markers[i];
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
        markers.push({
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
        for (var i = 0; i < markers.length; i++) {
            var mark = markers[i];
            if (clickedX > mark.x - mark.r && clickedX < mark.x + mark.r && clickedY > mark.y - mark.r && clickedY < mark.y + mark.r) {
                markers.splice(i,1);
            }
        }
        draw();
        jQuery("#selectWindow").css({
            display: 'none'});
    }

    function displaySizeChoose(){
        var div = jQuery("#chooseWindow");
        div.css({
            display: 'block',
            position:"absolute", 
            top:event.pageY, 
            left: event.pageX});
    }
    function displayDel(){
        var div = jQuery("#selectWindow");
        div.css({
            display: 'block',
            position:"absolute", 
            top:event.pageY, 
            left: event.pageX});
    }
    function makeStartHold(){
        for (var i = 0; i < markers.length; i++) {
            var mark = markers[i];
            if (clickedX > mark.x - mark.r && clickedX < mark.x + mark.r && clickedY > mark.y - mark.r && clickedY < mark.y + mark.r) {
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

    function getMouseX(e){
        return e.clientX;
    }

    function getMouseY(e){
        return e.clientY;
    }
    function detectMarksAt(x,y){
        for (var i = 0; i < markers.length; i++) {
            var mark = markers[i];
            if (clickedX > mark.x - mark.r && clickedX < mark.x + mark.r && clickedY > mark.y - mark.r && clickedY < mark.y + mark.r) {
                return true;
            }
        }
        return false;
    }
});

let ADDROUTE = {
    clear: function(){
        ctx
    }
}