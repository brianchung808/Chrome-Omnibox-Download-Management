// holds key:value pair of filename:download_id
var downloads = [];
var _default_descr = "Search for downloaded items. Type '--help' for available commands";
var help = [
	{content: "[filename]", description: "[filename]: Open folder containing specified file."},
	{content: "[filename] -d", description: "[filename] -d: Delete specified file."},
	{content: "[filename] -o", description: "[filename] -o: Open specified file."}
];

// object for formatting description text
var fmt = {
	match: function (text) {
		return "<match>" + text + "</match>";
	}, 

	dim: function (text) {
		return "<dim>" + text + "</dim>";	
	}, 

	url: function (text) {
		return "<url>" + text + "</url>";		
	}
}

chrome.omnibox.setDefaultSuggestion({description: _default_descr});

/* Listener for input change.
*/
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
	suggestions = [];

	text = text.trim();

	if(text == "--help") {
		suggest(help);
		return;
	}

	var input;
	var options;

	var text_split = text.split(' ');

	if(text_split.length == 2) {
		input = text_split[0].trim();
		options = text_split[1].trim();

		console.log("file: " + input);
		console.log("options: " + options);

	} else {
		input = text;
	}

	/* When input changes, search downloads
	 */
	chrome.downloads.search({query: [input]}, function(results) {
		for(var i = 0; i < results.length; i++) {
			var downloadItem = results[i];
			var filename = downloadItem.filename;
			var fileExists = downloadItem.exists;	

			// only if have filename & it exists in file system 
			// do we consider as suggestion
			if(filename && fileExists) {
				filename = filename.split('/').pop();

				suggestions.push({content: filename, description: fmt.match(filename)});
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

	var text_split = text.split(' ');

	var input;
	var options;

	if(text_split.length == 2) {
		input = text_split[0].trim();
		options = text_split[1].trim();

	} else {
		input = text;
	}
	// if options specified
	if(options) {

		// TODO -> more options, not mutually exclusive.
		if(options.indexOf("d") > -1) {
			chrome.downloads.removeFile(downloads[input]);

		} else if(options.indexOf("o") > -1) {
			chrome.downloads.open(downloads[input]);

		} else {
			// undefined option
		}

	// else, just show file in folder
	} else {
		chrome.downloads.show(downloads[input]);
	}
});
