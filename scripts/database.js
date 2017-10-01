var config={
        apiKey: "AIzaSyBXR2PjRDWNEEVJVqFSx7Fv3BglHNCrdEg",
        authDomain: "bbtoy-c79a2.firebaseapp.com",
        databaseURL: "https://bbtoy-c79a2.firebaseio.com",
        projectId: "bbtoy-c79a2",
        storageBucket: "bbtoy-c79a2.appspot.com",
        messagingSenderId: "390406483758"
    };

firebase.initializeApp(config);

let DATABASE = {

    db: firebase.database(),
    routes: [],

    save: function(){
        
        var gradeString; 
        var creationWidth = $('#canvas')[0].clientWidth;
        var creationHeight = $('#canvas')[0].clientHeight;
        var markerMetaData = {
            'creationWidth': creationWidth,
            'creationHeight': creationHeight,
            'markers': NAV.markers,
        }

        if(jQuery('#routeName').val()=="" || (jQuery('#grade').val()==""
                && !jQuery('#gradeProject').is(":checked"))
                || jQuery('#grade').val()<0){
            alert("Please fill out grade and name");
        }else if(jQuery('#gradePlus').is(":checked")
                && jQuery('#gradeMinus').is(":checked")){
            alert("Select Plus, Minus, or Neither");
        }else if(jQuery('#grade').val()>10){
            alert("Good on ya! But we don't currently go harder than V10");
        }else {
            var pushed, key
            if(NAV.currentRoute == null){
                pushed = DATABASE.db.ref('/routes').push();
                key = pushed.getKey();
            }else {
                // Editing an existing route
                key = NAV.currentRoute.key;
                var index = LOADER.routes.indexOf(NAV.currentRoute);
                LOADER.routes.splice(index,1);
            }
            // format grade for parsing
            var gradeString;
            if(jQuery('#gradeProject').is(":checked")){
                gradeString="VP";
            }else{
                var subGrade = jQuery('#gradePlus').is(":checked") ? "+" :
                    (jQuery('#gradeMinus').is(":checked") ? "-" : "");
                gradeString="V"+jQuery('#grade').val() + subGrade;
            }
            // create database entry
            entry={
                key: key,
                name: jQuery('#routeName').val(),
                setterName: LOGIN.name,
                setterID: LOGIN.userID,
                grade: gradeString,
                description: jQuery('#description').val(),
                favorites: {},
                markerMetaData: JSON.stringify(markerMetaData),
                isMainWall: NAV.isMainWall
            };
            DATABASE.db.ref('/routes/' + key).set(entry);
            LOADER.routes.unshift(entry);
            NAV.refreshRoutes();
            DATABASE.db.ref('/routeMaps/' + key).set({
                map: canvas.toDataURL('image/png')
            });
            NAV.currentRoute = entry;
            NAV.transition('#menu');
        }
    },

    delete: function(route){
        if(confirm("Delete "+route.name+"?")){
            DATABASE.db.ref('routes/'+route.key).remove();
            DATABASE.db.ref('routeMaps/'+route.key).remove();
            var index = LOADER.routes.indexOf(route);
            if(index > -1){
                LOADER.routes.splice(index,1);
            }
            NAV.transition('#menu');
        }
    },

    loadMap: function(key){
        return new Promise((resolve, reject) =>{
            DATABASE.db.ref('/routeMaps/'+key+'/map').once('value').then(function(snapshot){
                map = snapshot.val();
                resolve(map);
            });

        });
    },

    favorite: function(route, userID){
    	DATABASE.db.ref('routes/'+route['key']+'/favorites/'+userID).set('true');
    },

    unfavorite: function(route, userID){
    	DATABASE.db.ref('routes/'+route['key']+'/favorites/'+userID).remove();
    },

    loadAllRoutes: function(resolve){
        DATABASE.db.ref("routes").once('value').then(function(snapshot){
            routesInfo = snapshot.val();
            for(var key in routesInfo){
                DATABASE.routes.unshift({
                    key: routesInfo[key]['key'],
                    name: routesInfo[key]['name'],
                    setterName: routesInfo[key]['setterName'],
                    setterID: routesInfo[key]['setterID'],
                    grade: routesInfo[key]['grade'],
                    description: routesInfo[key]['description'],
                    favorites: routesInfo[key]['favorites'] || {},
                    markerMetaData: routesInfo[key]['markerMetaData'],
                    isMainWall: routesInfo[key]['isMainWall'],
                });
            }
            resolve(DATABASE.routes);
        });
    },
}