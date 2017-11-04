let LOADER = {
	DEFAULT_FILTER: {
		'VP': true,
	},

	// All routes from server
	routes: [],
	mainWallAspect: 3024/4032,
	caveAspect: 3024/4032,
	cavePath: "./assets/cave.jpg",
	mainWallPath: "./assets/mainWall.jpg",

	loadRoutes: () => {
		// Return a promise containing all the routes
		return new Promise((resolve, reject) => {
			DATABASE.loadAllRoutes(resolve);
		});
	},

	loadFilter: () => {
		let filter = window.localStorage.getItem('filter');
		if (filter == null) {
			LOADER.saveFilter(LOADER.DEFAULT_FILTER);
			return LOADER.loadFilter();
		}

		return JSON.parse(filter);
	},

	saveFilter: (filter) => {
		let json = JSON.stringify(filter);
		window.localStorage.setItem('filter', json);
	},
};

$(document).ready(() => {
	NAV.transition('#loading');

	// Load routes from firebase
	LOADER.loadRoutes().then((routes) => {
		LOADER.routes = routes;

		// Uncomment this line to bypass facebook login
		// LOGIN.bypass();

		// Verify using facebook login
		LOGIN.verify();
	});
});
