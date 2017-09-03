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

	// Grade filters
	filters: LOADER.loadFilter(),

	populateRoutes: (routes) => {
		let filtered = NAV.filter(routes);

		console.log(filtered);

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

	populateRoute: (route) => {
		let container = $('#route');
		container.html('');

		let options = {};
		options.enableFavoritesAction = true;
		let entry = NAV.buildRouteEntry(route, options);
		let setter = $('<span>').addClass('setter');
		let picture = $('<img>').addClass('picture');
		let description = $('<div>').addClass('description');
		let descriptionLabel= $('<div>').addClass('description-label');

		setter.text('Setter: ' + (route.setter || 'Unknown'));
		picture.attr('src', route.picture);
		description.text('Description: ' + (route.description || 'N/A'));

		container.append(entry);
		container.append(setter);
		container.append(picture);
		container.append(description);
	},

	buildRouteEntry: (route, options) => {
		options = options || {};

		let entry = $('<div>').addClass('entry');
		let grade = $('<div>').addClass('grade');
		let name = $('<span>').addClass('name');
		let favorites = $('<span>').addClass('favorites');
		let favoritesIcon = $('<i>').addClass('fa fa-heart');

		grade.text(route.grade || 'V?');
		name.text(route.name || 'Untitled');
		favorites.text(route.favorites || 0);

		entry.append(grade);
		entry.append(name);
		entry.append(favorites);
		entry.append(favoritesIcon);

		// Set click listener for favorites icon
		if (options.enableFavoritesAction) {
			favoritesIcon.click(function() {
				$(this).toggleClass('favorited');
			});
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
			console.log('nav stack', NAV.stack);
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
				NAV.transition('#create-route');
			});
		} else if (selector == '#routes') {
			icons.push('fa-search');
			actions.push(() => {
				// Go to search view
				NAV.transition('#search');
			});
		} else if (selector == '#create-route') {
			icons.push('fa-floppy-o');
			actions.push(() => {
				alert('You can save the PNG from here, and maybe transition to a new page!');
			});
		};

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
			// TODO
			NAV.populateRoutes(routes);
		} else if (id == 'my-routes') {
			// Show routes created by logged-in user
			let filtered = routes.filter((route) => {
				return route.setter == LOGIN.name;
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
		NAV.populateRoutes(NAV.routes);
	});
});
