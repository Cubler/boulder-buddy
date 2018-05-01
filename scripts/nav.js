let NAV = {
	// Delays (ms)
	OPACITY_DELAY: 150,
	TRANSITION_DELAY: 400,

	// Keep track of whether or not we are in transition
	transitioning: false,

	// Navigation stack
	stack: [],

	// Routes in view at the moment
	routes: [],

	// Current route of a single-route view.
	// Stored so that a user can take actions
	// on a route (e.g. edit/delete).
	currentRoute: null,

	// markers for creation view
	markers: [],

	// boolean to determine if the route is the main wall or cave
	wallKey: null, 

	// Grade filters. If a filter option is
	// true, it means to hide those routes.
	filters: LOADER.loadFilter(),

	populateRoutes: (routes) => {
		let filtered = NAV.filter(routes);
		NAV.routes = routes;

		let container = $('#route-list');
		container.html('');
		filtered.forEach((route) => {
			let entry = NAV.buildRouteEntry(route);
			container.append(entry);

			// Set click action
			entry.click(() => {
				NAV.populateRoute(route);
				NAV.transition('#route');
			});
		});

		// Display message if no routes were found
		if (filtered.length === 0) {
			let empty = $('<div>').addClass('empty');
			empty.text('No routes found!');
			container.append(empty);
		}
	},

	refreshRoutes: () => {
		NAV.populateRoutes(NAV.routes);
	},

	populateRoute: (route) => {
		let container = $('#route');
		container.html('');
		let picPath = DATABASE.walls[route.wallKey].image;
		let img = new Image;
		img.src = DATABASE.walls[route.wallKey].image;
		let aspectRatio = img.width/img.height;

		let options = {};
		options.enableFavoritesAction = true;
		let entry = NAV.buildRouteEntry(route, options);
		let setter = $('<span>').addClass('setter');
		let picture = $('<div>').addClass('picture');
		let description = $('<div>').addClass('description');
		let descriptionLabel= $('<div>').addClass('description-label');
		let viewCanvas = document.createElement("canvas");
		viewCanvas.style.width='100%';
		viewCanvas.style.height='';
		viewCanvas.width=$('#photo')[0].clientWidth;
		viewCanvas.height=viewCanvas.width/aspectRatio;
		let context = viewCanvas.getContext('2d');

		DATABASE.loadMap(route.key).then((map) =>{
			var img = new Image();
			img.onload = function(){
				context.clearRect(0,0,viewCanvas.width,viewCanvas.height);
				context.drawImage(img,0,0,viewCanvas.width,viewCanvas.height);
			};
			img.src = map;
		});

		setter.text('Setter: ' + (route.setterName || 'Unknown'));
		picture.css({
			'background-image': 'url('+picPath+')',
			'width': '100vw',
			'height': '100%',
			'background-size': '100vw auto',
			'background-repeat': 'no-repeat'
		});
		description.text('Description: ' + (route.description || 'N/A'));

		picture.append(viewCanvas);
		container.append(entry);
		container.append(setter);
		container.append(picture);
		container.append(description);

		// Store reference to route so user can
		// take action upon it (e.g. edit/delete).
		NAV.currentRoute = route;
	},

	buildRouteEntry: (route, options) => {
		options = options || {};

		let entry = $('<div>').addClass('entry');
		let grade = $('<div>').addClass('grade');
		let name = $('<span>').addClass('name');
		let favorites = $('<span>').addClass('favorites');
		let favoritesIcon = $('<i>').addClass('fa fa-heart');

		// Calculate number of favorites a route has,
		// and whether or not the user has favorited
		// this route. Expects route.favorites to be
		// an object (e.g. not undefined).
		let userIDs = Object.keys(route.favorites);
		let numFavorites = userIDs.length;
		let hasFavorited = route.favorites[LOGIN.userID] || false;

		grade.text(route.grade || 'V?');
		name.text(route.name || 'Untitled');
		favorites.text(numFavorites);

		entry.append(grade);
		entry.append(name);
		entry.append(favorites);
		entry.append(favoritesIcon);

		// Set click listener for favorites icon
		if (options.enableFavoritesAction) {
			favoritesIcon.click(function() {
				$(this).toggleClass('favorited');
				hasFavorited = ! hasFavorited;

				// Update favorited status
				if (hasFavorited) {
					route.favorites[LOGIN.userID] = true;
					DATABASE.favorite(route, LOGIN.userID);
					numFavorites++;
				} else {
					delete route.favorites[LOGIN.userID];
					DATABASE.unfavorite(route, LOGIN.userID);
					numFavorites--;
				}

				favorites.text(numFavorites);
			});
		}

		// Toggle favorites icon if this route
		// has been favorited by the user
		if (hasFavorited) {
			favoritesIcon.addClass('favorited');
		}

		return entry;
	},

	// Transition to a new page
	transition: (selector, options) => {
		options = options || {};

		// Don't transition to self
		let current = NAV.stack.slice(-1)[0];
		if (current == selector) {
			return;
		}

		// Reset stack
		if (options.reset) {
			NAV.stack = [];
		}

		// Perform transition
		let delay = 0;
		if (current) {
			delay = NAV.TRANSITION_DELAY;
			NAV.clearCurrentPage(current, options);
		}
		NAV.animateNewPage(selector, delay, options);
	},

	// Move out old page
	clearCurrentPage: (selector, options) => {
		let element = $(selector);
		element.removeClass('incoming');
		element.css('opacity', 0);
		NAV.transitioning = true;

		let translation = 0;
		if (options.back) {
			translation = 200;
			NAV.stack.pop();
			NAV.stack.pop();
		}

		let transform = 'translateX(' + translation + 'vw)';
		element.css('transform', transform);

		// Remove back button
		if (NAV.stack.length == 0) {
			$('#nav-back').addClass('disabled');
		}

		// Remove action buttons
		$('#nav-action-1').addClass('disabled');
		$('#nav-action-2').addClass('disabled');
	},

	// Intermediate animation
	animateNewPage: (selector, delay, options) => {
		let element = $(selector);
		element.addClass('incoming');

		let translation = 200;
		if (options.back) {
			translation = 0;
		}

		let transform = 'translateX(' + translation + 'vw)';
		element.css('transform', transform);
		NAV.stack.push(selector);

		// Transition incoming page after specified delay
		if (delay > 0) {
			setTimeout(() => {
				NAV.revealNewPage(element, selector);
			}, delay);
		} else {
			NAV.revealNewPage(element, selector);
		}
	},

	// Bring in new page
	revealNewPage: (element, selector) => {
		let transform = 'translateX(100vw)';
		element.css('transform', transform);

		// Hacky way to make fade-in look smoother
		setTimeout(() => {
			element.css('opacity', 1);
			NAV.transitioning = false;

			// Show/hide back button
			if (NAV.stack.length > 1) {
				$('#nav-back').removeClass('disabled');
			}

			// Show/hide appropriate actions
			NAV.revealActions(selector);
		}, NAV.TRANSITION_DELAY / 3);
	},

	// Reveal actions for appropriate page
	revealActions: (selector) => {
		let icons = [];
		let actions = [];
		if (selector == '#menu') {
			icons.push('fa-plus')
			actions.push(() => {
				// Go to location Choosing view
				NAV.currentRoute = null;
				NAV.buildLocationChooser(false);
				NAV.transition('#location-choose');
			});
		} else if (selector == '#routes') {
			icons.push('fa-search');
			actions.push(() => {
				// Go to search view
				NAV.transition('#search');
			});
		} else if (selector == '#create-route') {

			icons.push('fa-trash');
			actions.push(() => {
				// Delete currently viewed route
				if(NAV.currentRoute != null){
					DATABASE.delete(NAV.currentRoute);
				}else {
					if(confirm("Are you sure you want to delete?")){
						NAV.transition('#menu');
					}
				}
			});
			icons.push('fa-floppy-o');
			actions.push(()=> {
				// Save the Route to database and go to menu view
				NAV.buildSaveForm();
				NAV.transition('#save-route');
			});
		} else if (selector =='#save-route'){
			icons.push('fa-floppy-o');
			actions.push(()=> {
				// Save the Route to database
				DATABASE.save();
			})
		} else if (selector == '#route') {
			// Only show route actions for the user
			// that created the route.
			let route = NAV.currentRoute;
			if (route.setterID == LOGIN.userID) {
				icons.push('fa-pencil');
				actions.push(() => {
					// Delete currently viewed route
					NAV.setUpCreation(NAV.currentRoute.wallKey);
					NAV.loadEditMetaData();
					NAV.draw();
					NAV.transition("#create-route");
				});
			}
		} else if (selector == '#location-choose'){
			icons.push('fa-trash');
			actions.push(() => {
				// Delete a wall
				NAV.buildLocationChooser(true);

				// window.addEventListener('click',(e)=>{
				// 	DATABASE.deleteWall(e.target.id);
				// }, {once:true});
			});
			icons.push('fa-plus')
			actions.push(()=> {
				// Save the Route to database and go to menu view
				NAV.buildAddWallForm();
				NAV.transition('#save-wall');
			});
		} else if (selector =='#save-wall'){
			icons.push('fa-repeat');
			actions.push(()=> {
				// Save the Route to database
				NAV.rotateBase64Img($('#wallPic')[0].src).then((base64Data)=>{
					$('#wallPic')[0].src = base64Data;
				})
			})
			icons.push('fa-floppy-o');
			actions.push(()=> {
				// Save the Route to database
				DATABASE.addWall();
			})
		}


		// Reveal new actions/icons
		for (let i = 0; i < actions.length; i++) {
			let action = i + 1;
			let id = '#nav-action-' + action;
			let container = $(id);
			container.removeClass('disabled');

			// Set nav action click listener
			let handler = actions[i];
			container.off('click');
			container.click(() => {
				handler();
			});

			// Change icon
			let iconClass = icons[i];
			let icon = $(id).find('.fa');
			icon.removeClass();
			icon.addClass('fa');
			icon.addClass(iconClass);
		}
	},

	search: () => {
		// Overwrite String.prototype.contains (case-insensitive!)
		String.prototype.contains = String.prototype.contains || function(other) {
			let index = this.toLowerCase().indexOf(other.toLowerCase());
			return index >= 0;
		};

		// Perform search
		let string = $('#search input').val();
		let results = LOADER.routes.filter((route) => {
			let isMatch = false;

			let isGradeMatch = route.grade.contains(string);
			let isNameMatch = route.name.contains(string);
			let isSetterMatch = route.setterName.contains(string);
			let isDescriptionMatch = route.description.contains(string);

			isMatch = isMatch || isGradeMatch;
			isMatch = isMatch || isNameMatch;
			isMatch = isMatch || isSetterMatch;
			isMatch = isMatch || isDescriptionMatch;

			return isMatch;
		});

		// Show routes from search!
		NAV.populateRoutes(results);
		NAV.transition('#routes');
		NAV.stack.pop();
		NAV.stack.pop();
	},

	filter: (routes) => {
		// Toggle filter buttons for inactive routes
		$('#filter .grade').each((index, element) => {
			let filter = $(element);

			// By default, set filter to active
			filter.removeClass('inactive');

			// If the user has turned off this grade,
			// make the filter button inactive.
			let grade = filter.text();
			if (NAV.filters[grade]) {
				filter.addClass('inactive');
			}
		});

		let filtered = routes.filter((route) => {
			// Only grab V and number from grade
			// e.g. V2 for a route that is graded V2+
			let grade = route.grade.substring(0, 2);
			return ! NAV.filters[grade];
		});

		return filtered;
	},

	rotateBase64Img: (base64Data)=>{
		return new Promise((resolve,reject)=>{
			let canvas = document.createElement('canvas');
			let context = canvas.getContext('2d');
			let image = new Image();
			image.src = base64Data;
			canvas.width = image.height;
			canvas.height = image.width;
			image.onload = () => {
	      		context.rotate(90 * Math.PI / 180);
				context.translate(0,-canvas.width);
	        	context.drawImage(image, 0, 0); 
	        	resolve(canvas.toDataURL());
			};
		});
		
	},

	buildSaveForm: () => {

		let gradeValue,routeNameValue, subGrade, gradeProjectValue, descriptionValue;

		let container = $('#save-route');
		container.html = "";
		container.empty();

		let formDiv = $('<form>').attr('id', 'formDiv');
		let routeName = document.createElement("input");
		routeName.type = "text";
		routeName.id = "routeName";
		let grade = document.createElement("input");
		grade.type = "number";
		grade.id = "grade";
		let gradePlus = document.createElement("input");
		gradePlus.type = "checkbox";
		gradePlus.id = "gradePlus";
		let gradeMinus = document.createElement("input");
		gradeMinus.type = "checkbox";
		gradeMinus.id = "gradeMinus";
		let gradeProject = document.createElement("input");
		gradeProject.type = "checkbox";
		gradeProject.id = "gradeProject";
		let description = document.createElement("textarea");
		description.id = "description";
		description.rows = 4;
		description.cols = 50;

		if(NAV.currentRoute != null){
			let route = NAV.currentRoute;
			routeName.value = route.name;
			[gradeValue, subGrade, gradeProjectValue] = NAV.parseGradeString(route.grade);
			grade.value = gradeValue;
			if(subGrade=="+"){
				gradePlus.checked = true;
			}else if(subGrade=="-"){
				gradeMinus.checked = true;
			}else if(gradeProjectValue){
				gradeProject.checked = true;
			}
			description.value = route.description;
		}else {
			routeName.placeholder = "Route Name";
			grade.placeholder = "0";
			gradePlus.checked = false;
			gradeMinus.checked = false;
			gradeProject.checked = false;
		}

		formDiv.append(document.createTextNode("Route Name: "))
		formDiv.append(routeName);
		formDiv.append(document.createElement("br"));
		formDiv.append(document.createTextNode("Grade: "), grade)
		formDiv.append(gradePlus, document.createTextNode("(+)"));
		formDiv.append(gradeMinus, document.createTextNode("(-)"));
		formDiv.append(document.createElement("br"));
		formDiv.append(gradeProject, document.createTextNode("VProject"));
		formDiv.append(document.createElement("br"));
		formDiv.append(document.createTextNode("Description: "))
		formDiv.append(document.createElement("br"), description)
		container.append(formDiv);
	},

	buildAddWallForm: () => {

		let container = $('#save-wall');
		container.html = "";
		container.empty();

		let formDiv = $('<form>').attr('id', 'formDiv');
		let wallName = document.createElement("input");
		wallName.type = "text";
		wallName.id = "wallName";

		let img = document.createElement("img");
		img.id = 'wallPic';
		img.style.width='100%'

		let fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "image/*";
		fileInput.id = "wallInput";

        let reader = new FileReader();

		fileInput.addEventListener('change', (e)=>{
			blob = e.target.files[0];
			reader.readAsDataURL(blob);
			reader.onloadend = () => {
            	img.src = reader.result;
	        };
		});
		
		formDiv.append(document.createTextNode("Wall Name: "))
		formDiv.append(wallName);
		formDiv.append(fileInput);
		container.append(formDiv);
		container.append(img);

	},

	buildLocationChooser: (isDelete) => {

		let container = $('#location-choose');
		container.html = "";
		container.empty();
		let keys = Object.keys(DATABASE.walls)
		for(var i=0; i<keys.length; i++){
			let img = document.createElement("img");
			img.src = DATABASE.walls[keys[i]].image;
			img.id = ''+keys[i];
			img.onload = () =>{
				img.className = 'choicePic';
			};
			if(isDelete){
				img.addEventListener('click', (e)=>{
					DATABASE.deleteWall(e.target.id);
				});
			}else{
				img.addEventListener('click', (e)=>{
					NAV.setUpCreation(e.target.id);
					NAV.transition("#create-route");
				});
			}
			container.append(img);

		}
	},



	// return in form gradeNum, subGrade = {+, null, -}, vProject = {true, false}
	parseGradeString: (gradeString) => {
		if(gradeString=='VP'){
			return [null, null, true];
		}else if(gradeString.length==3){
			return [gradeString[1], gradeString[2], false];
		}else{
			return [gradeString[1], null, false];
		}
	},

	loadEditMetaData: () => {
		var metaObj = JSON.parse(NAV.currentRoute['markerMetaData']);
		// Scale Markers for current resolution
		var creationWidth = metaObj['creationWidth'];
		var creationHeight = metaObj['creationHeight'];
		var currentWidth = $('#canvas')[0].clientWidth;
		var currentHeight = $('#canvas')[0].clientHeight;

		var widthRatio = currentWidth / creationWidth;
		var heightRatio = currentHeight / creationHeight;
		var markers = metaObj['markers'];

		for (var i = 0; i < markers.length; i++){
			markers[i]['x'] = markers[i]['x'] * widthRatio;
			markers[i]['y'] = markers[i]['y'] * heightRatio;
			markers[i]['r'] = markers[i]['r'] * widthRatio;
		}
		NAV.markers = markers;
	},

	draw: () => {
		$('#canvas')[0].getContext('2d').clearRect(0,0,$('#canvas')[0].width,$('#canvas')[0].height);
		for (var i = 0; i < NAV.markers.length; i++) {
			var mark = NAV.markers[i];
			NAV.makeMarker(mark.x, mark.y, mark.r, mark.c);
		}
	},

	makeMarker: (x,y,r,c) => {
		var markerWidth =  $("#canvas").clientWidth*(0.003);
		var ctx = $('#canvas')[0].getContext('2d');
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
	},

	setUpCreation: (wallKey) => {
		// Setup creation view
		// clear
		$('#canvas')[0].getContext('2d').clearRect(0,0,$('#canvas')[0].width,$('#canvas')[0].height);
		NAV.markers=[];
		NAV.wallKey = wallKey;
		var canvas = document.getElementById("canvas");
		$('#photo').css("background-image", "url("+DATABASE.walls[wallKey].image+")"); 

		let img = new Image;
		img.src = DATABASE.walls[wallKey].image;
		let aspectRatio = img.width/img.height;

		canvas.width=$('#photo')[0].clientWidth;
		canvas.height=canvas.width/aspectRatio;
	},
};

// Setup
$(document).ready(() => {
	// Set click handlers for menu buttons
	$('.menu-button').click(function() {
		let id = $(this).attr('id');

		// Apply filters
		let routes = LOADER.routes;
		if (id == 'all-routes') {
			NAV.populateRoutes(routes);
		} else if (id == 'favorite-routes') {
			// Get favorite routes
			let filtered = routes.filter((route) => {
				return route.favorites[LOGIN.userID] || false;
			});
			NAV.populateRoutes(filtered);
		} else if (id == 'my-routes') {
			// Show routes created by logged-in user
			let filtered = routes.filter((route) => {
				return route.setterID == LOGIN.userID;
			});
			NAV.populateRoutes(filtered);
		} else {
			// Get random route
			let index = Math.floor(Math.random() * routes.length);
			let random = routes[index];
			NAV.populateRoute(random);
		}

		// Decide where to transition
		if (id == 'random-route') {
			NAV.transition('#route');
		} else {
			NAV.transition('#routes');
		}
	});

	// Set click handler for back button
	$('#nav-back').click(function() {
		let disabled = $(this).hasClass('disabled');
		if (disabled || NAV.transitioning) {
			return;
		}

		// Refresh list of routes
		NAV.refreshRoutes();
		let current = NAV.stack.slice(-1)[0];
		if(current == "#create-route" && NAV.markers.length != 0
			&& !confirm("Backing will erase route creation progress.")){
				return;
		}

		let last = NAV.stack.slice(-2)[0];
		let options = {};
		options.back = true;
		NAV.transition(last, options);
	});

	// Set click handler for filters
	$('#filter .grade').click(function() {
		let element = $(this);
		element.toggleClass('inactive');
		let grade = element.text();

		// Toggle filter setting
		if (NAV.filters[grade]) {
			delete NAV.filters[grade];
		} else {
			NAV.filters[grade] = true;
		}

		LOADER.saveFilter(NAV.filters);

		// Refresh list of routes
		NAV.refreshRoutes();
	});
});
