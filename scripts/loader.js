let LOADER = {
	DEFAULT_FILTER: {
		'V0': true,
		'V1': true,
		'V2': true,
		'V3': true,
		'V4': true,
		'V5': true,
		'V6': true,
		'V7': true,
	},

	// All routes from server
	routes: [],

	loadRoutes: () => {
		// Return a promise containing all the routes
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				let routes = [
					{ name: 'Eas-E-Peasy', setter: 'Roman Rogowski', grade: 'V0+', favorites: 321, id: '01756dc2-98e6-4e25-a606-ad313a1e378d', description: 'Your absolute worst nightmare. Just kidding it\'s not that bad!'},
					{ name: 'Cookie Monster', setter: 'David Cubler', grade: 'V4', favorites: 0, description: '' },
					{ name: 'Dumpster Diving', setter: 'Alex Brooks', grade: 'V2', favorites: 64, description: '' },
					{ name: 'Bananas', setter: 'Kerry Scott', grade: 'V3-', favorites: 31, description: '' },
					{ name: 'Monster Truck', setter: 'Roman Rogowski', grade: 'V4', favorites: 3, description: '' },
					{ name: 'Tornado Bike', setter: 'Roman Rogowski', grade: 'V8', favorites: 3, description: '' },
					{ name: 'Reaaaaallllllyyyyyyyyyy Longgggggggggg', setter: 'Roman Rogowski', grade: 'V0', favorites: 0, description: '' },
					{ name: 'Eas-E-Peasy', setter: 'Roman Rogowski', grade: 'V0+', favorites: 321, id: '01756dc2-98e6-4e25-a606-ad313a1e378d', description: 'Your absolute worst nightmare. Just kidding it\'s not that bad!'},
					{ name: 'Cookie Monster', setter: 'David Cubler', grade: 'V4', favorites: 0, description: '' },
					{ name: 'Dumpster Diving', setter: 'Alex Brooks', grade: 'V2', favorites: 64, description: '' },
					{ name: 'Bananas', setter: 'Kerry Scott', grade: 'V3-', favorites: 31, description: '' },
					{ name: 'Monster Truck', setter: 'Roman Rogowski', grade: 'V4', favorites: 3, description: '' },
					{ name: 'Tornado Bike', setter: 'Roman Rogowski', grade: 'V8', favorites: 3, description: '' },
					{ name: 'Reaaaaallllllyyyyyyyyyy Longgggggggggg', setter: 'Roman Rogowski', grade: 'V0', favorites: 0, description: '' },
					{ name: 'Eas-E-Peasy', setter: 'Roman Rogowski', grade: 'V0+', favorites: 321, id: '01756dc2-98e6-4e25-a606-ad313a1e378d', description: 'Your absolute worst nightmare. Just kidding it\'s not that bad!'},
					{ name: 'Cookie Monster', setter: 'David Cubler', grade: 'V4', favorites: 0, description: '' },
					{ name: 'Dumpster Diving', setter: 'Alex Brooks', grade: 'V2', favorites: 64, description: '' },
					{ name: 'Bananas', setter: 'Kerry Scott', grade: 'V3-', favorites: 31, description: '' },
					{ name: 'Monster Truck', setter: 'Roman Rogowski', grade: 'V4', favorites: 3, description: '' },
					{ name: 'Tornado Bike', setter: 'Roman Rogowski', grade: 'V8', favorites: 3, description: '' },
					{ name: 'Reaaaaallllllyyyyyyyyyy Longgggggggggg', setter: 'Roman Rogowski', grade: 'V0', favorites: 0, description: '' }
				];
				resolve(routes);
			}, 100);
		});
	},

	loadFilter: () => {
		let filter = window.localStorage.getItem('filter');
		if (filter == null) {
			filter = LOADER.DEFAULT_FILTER;
		}

		return filter;
	},
};

$(document).ready(() => {
	NAV.transition('#loading');

	// Load routes from firebase
	LOADER.loadRoutes().then((routes) => {
		LOADER.routes = routes;
		//LOGIN.verify();

		let options = {};
		options.reset = true;
		NAV.transition('#menu', options);


		// let route = routes[0];
		// NAV.populateRoute(route);
		// NAV.transition('#route');
	});
});
