// holds key:value pair of filename:download_id
var downloads = [];

function match(text) {
	return "<match>" + text + "</match>";
}

function dim(text) {
	return "<dim>" + text + "</dim>";	
}


chrome.omnibox.setDefaultSuggestion({description: "Start typing to search for download..."});

/* Listener for input change.
*/
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {

	/* When input changes, search downloads
	 */
	chrome.downloads.search({query: [text]}, function(results) {
		suggestions = [];
		for(var i = 0; i < results.length; i++) {
			var downloadItem = results[i];
			var filename = downloadItem.filename;
			var fileExists = downloadItem.exists;

			// only if have filename & it exists in file system 
			// do we consider as suggestion
			if(filename && fileExists) {
				filename = filename.split('/').pop();

				suggestions.push({content: filename, description: match(filename)});
				downloads[filename] = downloadItem.id;
			}
		}


		if(suggestions.length > 0) {
			suggest(suggestions);
		}
	});
});

/* Listener for input being submitted.
*/
chrome.omnibox.onInputEntered.addListener(function(text) {
	// when user enters input, open the file.
	// TODO -> Add option for delete
	chrome.downloads.open(downloads[text]);
});
