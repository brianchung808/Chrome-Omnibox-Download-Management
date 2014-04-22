var downloads = [];

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {

	chrome.downloads.search({query: [text]}, function(results) {
		suggestions = [];
		for(var i = 0; i < results.length; i++) {
			var filename = results[i].filename;

			if(filename) {
				suggestions.push({content: filename, description: filename});
			}

			downloads[filename] = results[i].id;
		}


		if(suggestions.length > 0) {
			suggest(suggestions);
		}
	});
});



chrome.omnibox.onInputEntered.addListener(function(text) {
	chrome.downloads.open(downloads[text]);
});
