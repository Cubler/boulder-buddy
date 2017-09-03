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

    save: function(){
        var pushed = DATABASE.db.ref('/routes').push();
        pushed.set({
            name: jQuery('#routeName').val(),
            setter: jQuery('#setter').val(),
            grade: jQuery('#grade').val(),
            description: jQuery('description').text()

        });
        DATABASE.db.ref('/routeMaps/'+pushed.getKey()).set({
            map: canvas.toDataURL()
        })
    },

    load: function(){
        clear();
        DATABASE.db.ref('/test/map').once('value').then(function(snapshot){
            var image = new Image();
            image.onload = function(){
                ctx.drawImage(image,0,0);
            }
            image.src = snapshot.val();
        });
    }
}