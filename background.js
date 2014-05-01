var downloads = []; // holds key:value pair of filename:download_id
var _logo = "icon128.png";
var _default_descr = "Search for downloaded items. Type '--help' for available commands";
var help = [
	{content: "[filename]", description: "[filename]: Open folder containing specified file."},
	{content: "[filename] -d", description: "[filename] -d: Delete specified file."},
	{content: "[filename] -o", description: "[filename] -o: Open specified file."},
	{content: "[filename] -t", description: "[filename] -t: Open specified file in new tab."}
];
var CONSTANTS = {
	OPEN : 'o',
	DELETE: 'd',
	OPEN_TAB: 't',
	SPLIT_STR: ' -',
	FILE_PROTOCOL: 'file//'
};


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

	createdTab: function(filename) {
		var opt = {
			type: "basic",
			iconUrl: _logo,
			title: "Opening New Tab",
			message: filename + " opening...",
			isClickable: false
		};

		chrome.notifications.create("Tab_" + notif.tab_count++, opt, function(notificationId){});

	},

	deleted_count: 0,
	opened_count:  0,
	tab_count: 0
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

	var text_split = text.split(CONSTANTS.SPLIT_STR);

	// Case: filename w/ no spaces followed by -options
	if(text_split.length == 2) {
		input = text_split[0].trim();
		options = text_split[1].trim();

	//Case: filename w/ spaces followed by -options
	} else if(text_split.length > 2) {
		input = text_split[0];

		for(var i=1; i < text_split.length; i++) {
			if(text_split[i].trim().length == 1) {
				options = text_split[i].trim();
				break;

			} else {
				input = input + CONSTANTS.SPLIT_STR + text_split[i];

			}

		}

		input = input.trim();
		console.log("THE INPUT: " + input);

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
	var suggestions = [];

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
				var full_path = filename;
				filename = filename.split('/').pop();

				suggestions.push({content: filename, description: fmt.match(filename)});
				downloads[filename] = { id: downloadItem.id, full_path: full_path};
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
		if(options == CONSTANTS.DELETE) {
			chrome.downloads.removeFile(downloads[input].id);
			notif.deleted(input);

		} else if(options == CONSTANTS.OPEN) {
			chrome.downloads.open(downloads[input].id);
			notif.opened(input);

		} else if(options = CONSTANTS.OPEN_TAB) {
			chrome.tabs.create({ url: CONSTANTS.FILE_PROTOCOL + downloads[input].full_path });
			notif.createdTab(input);

		} else {
			// undefined option
		}

	// else, just show file in folder
	} else {
		chrome.downloads.show(downloads[input].id);
	}
});
