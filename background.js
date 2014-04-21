
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {

	chrome.downloads.search({query: [text]}, function(results) {
		suggestions = [];
		for(var i = 0; i < results.length; i++) {
			suggestions.push({content: results[i].filename, description: results[i].filename});
		}


		if(suggestions.length > 0) {
			suggest(suggestions);
		}
	});

});
