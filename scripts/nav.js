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

	// Grade filters
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
		viewCanvas.height=viewCanvas.width/LOADER.caveAspect;
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
			'background-image': 'url(../assets/cave.jpg)',
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
				// Go to creation view
				// clear
				$('#canvas')[0].getContext('2d').clearRect(0,0,$('#canvas')[0].width,$('#canvas')[0].height);
				NAV.markers=[];
				NAV.currentRoute = null;
				NAV.transition('#create-route');
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
				DATABASE.delete();
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
				// Save the Route to database and go to menu view
				DATABASE.save();
				NAV.transition('#menu');
			})
		} else if (selector == '#route') {
			// Only show route actions for the user
			// that created the route.
			let route = NAV.currentRoute;
			if (route.setterID == LOGIN.userID) {
				icons.push('fa-pencil');
				actions.push(() => {
					// Delete currently viewed route
					NAV.loadEditMetaData();
					NAV.draw();
					NAV.transition('#create-route');
				});
			}
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
			let isSetterMatch = route.setter.contains(string);
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
		let filtered = routes.filter((route) => {
			// Only grab V and number from grade
			// e.g. V2 for a route that is graded V2+
			let grade = route.grade.substring(0, 2);
			return NAV.filters[grade];
		});

		return filtered;
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
		grade.min = "0";
		grade.max = "7";
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
			}else if(subGrade == null){
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
		NAV.filters[grade] = ! NAV.filters[grade];

		// Refresh list of routes
		NAV.refreshRoutes();
	});
});
