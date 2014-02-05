(function() {
	function init() {
		window.addEventListener('load', onLoad);
	}

	function onLoad() {
		Localise.langList=['de-de','ar-eg'];
		Localise.addEventListener('complete', onLocalised);
		Localise.load(DataModel);
	}

	function onLocalised() {
		Localise.removeEventListener('complete', onLocalised);
		bindData();

	}

	function bindData() {
		DataBinder.bind(DataModel);
	}


	window.onLangChange = function(lang) {
		Localise.load(DataModel, lang, true);

	};
	init();
})();
