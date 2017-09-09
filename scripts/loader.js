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
	wallAspect: 4032/3024;
	caveAspect: 1/wallAspect;

	loadRoutes: () => {
		// Return a promise containing all the routes
		return new Promise((resolve, reject) => {
			DATABASE.loadAllRoutes(resolve);
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
		LOADER.routes=routes;
		// LOGIN.verify();
		NAV.transition('#menu');	
	});
});
