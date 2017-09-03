let LOGIN = {
	name: 'Roman Rogowski',

	// Check facebook authentication status
	verify: () => {
		FB.getLoginStatus((response) => {
			let options = {};
			options.reset = true;

			if (response.status == 'connected') {
				NAV.transition('#menu', options);
			} else {
				NAV.transition('#login', options);
			}
		});
	}
};

// Called when the FB SDK is loaded
window.fbAsyncInit = () => {
	FB.init({
		appId      : '134015107210005',
		cookie     : true,
		xfbml      : true,
		version    : 'v2.10'
	});
};