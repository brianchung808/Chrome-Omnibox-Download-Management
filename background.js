var downloads = []; // holds key:value pair of filename:download_id
var _logo = "icon128.png";
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
};

// notification creating functions
var notif = {
	deleted: function(filename) {
		var opt = {
			type: "basic",
			iconUrl: _logo,
			title: "Deletion Successful",
			message: filename + " successfully deleted.",
			isClickable: false
		};

		chrome.notifications.create("Deletion_" + notif.deleted_count++, opt, function(notificationId){});
	},

	opened: function(filename) {
		var opt = {
			type: "basic",
			iconUrl: _logo,
			title: "Opening File",
			message: filename + " opening...",
			isClickable: false
		};

		chrome.notifications.create("Open_" + notif.opened_count++, opt, function(notificationId){});
	},

	deleted_count: 0,
	opened_count:  0
};

/* Parse user input for filename & options
 * Return: {string filename, string options}
 */
function parseOptions(text) {
	/* TODO:
	 * - Do better check than lastIndexOf('-') -> check if it's the last contin. sequence of char
	 *   to match filename -[options]. There can be no spaces after -[options]
	 * - Clean up logic. Rely more on finding '-[option]' rather than space-separated words
	 *
	 * - Return an error type if input not in accordance to 'filename -[options]' & show notification
	 *   if user tries to enter input with incorrect format.
	 */


	var input, options;

	var text_split = text.split(' ');

	// Case: filename w/ no spaces followed by -options
	if(text_split.length == 2) {
		input = text_split[0].trim();
		options = text_split[1].trim();

		// check if options is in correct format "-[options]"
		if(options.indexOf('-') != 0) {
			// searching for file w/ spaces, fallback to no-option case
			console.log("Searching for filename w/ spaces");
			options = undefined;
			input = text.trim();
		}

	// Case: File w/ spaces & (maybe) -options 
	} else if(text_split.length > 2) {
		var options_index = text.lastIndexOf('-');

		// check option case for files w/ spaces in name
		if(options_index != -1) {
			input = text.substring(0, options_index).trim();
			options = text.substring(options_index, text.length).trim();

		// else, no options & spaces-in-filename
		} else {
			input = text.trim();
		}

	// Case: no options, no-spaces-in-filename
	} else {
		input = text.trim();
	}


	console.log("file: " + input);
	console.log("options: " + options);

	return {
		input: input,
		options: options
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

	var parse = parseOptions(text);

	var input = parse.input;
	var options = parse.options;

	/* When input changes, search downloads
	 */
	chrome.downloads.search({query: [input], orderBy: ['-startTime']}, function(results) {
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
	var parse = parseOptions(text);

	var input = parse.input;
	var options = parse.options;

	// if options specified
	if(options) {

		// TODO -> more options, not mutually exclusive.
		if(options.indexOf("d") > -1) {
			chrome.downloads.removeFile(downloads[input]);
			notif.deleted(input);

		} else if(options.indexOf("o") > -1) {
			chrome.downloads.open(downloads[input]);
			notif.opened(input);

		} else {
			// undefined option
		}

	// else, just show file in folder
	} else {
		chrome.downloads.show(downloads[input]);
	}
});
