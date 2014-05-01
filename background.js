/////////////////////////////////////////////////////////////////////////
////////////////// Download Management Through Omnibox //////////////////
///////////////// Authors: Brian Chung, Ronald Castillo /////////////////
/////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////
//////////////// Helper Functions, Constants ////////////////////////////
/////////////////////////////////////////////////////////////////////////
var downloads = []; // holds <key, value> pair of <filename, {download_id, full_path}>
var _logo = "icon128.png";
var _default_descr = "Search for downloaded items. Type '--help' for available commands.";
var help = [
	{content: "[filename]", description: "[filename]: Open folder containing specified file."},
	{content: "[filename] -d", description: "[filename] -d: Delete specified file."},
	{content: "[filename] -o", description: "[filename] -o: Open specified file."},
	{content: "[filename] -t", description: "[filename] -t: Open specified file in new tab."}
];
var ACTION_ENUM = {
	OPEN : 'o',
	DELETE: 'd',
	OPEN_TAB: 't'
};
var CONSTANTS = {
	SPLIT_STR: " -",
	FILE_PROTOCOL: "file://"
};

function isActionEnum(str) {
	for(var key in ACTION_ENUM) {
		var obj = ACTION_ENUM[key];
		if(obj == str) {
			return true;
		}
	}

	return false;
}

var LOGGING = false;

function LOG(message) {
	if(LOGGING) {
		console.log(message);
	}
}

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

// function to pass to notifications.
function clearNotification(notificationId) {
	setTimeout(function(){
		chrome.notifications.clear(notificationId, function(){});
	}, 1500);
}

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

		chrome.notifications.create("Deletion_" + notif.deleted_count++, opt, clearNotification);
	},

	invalidOption: function(option) {
		var opt = {
			type: "basic",
			iconUrl: _logo,
			title: "Error",
			message: 
			"Unrecognized option '-" + option + "'.\n\n" + 
			"-d: Delete specified file.\n" +
			"-o: Open specified file.\n" +
			"-t: Open specified file in new tab.",
			isClickable: false
		};

		chrome.notifications.create("invalidOption_" + notif.option_error_count++, opt, clearNotification);

	},

	unknownFile: function(filename) {
		var opt = {
			type: "basic",
			iconUrl: _logo,
			title: "Error",
			message: "Cannot find file " + filename, 
			isClickable: false
		};

		chrome.notifications.create("unknownFile_" + notif.file_error_count++, opt, clearNotification);

	},

	// counts for notification IDs
	deleted_count: 0,
	opened_count:  0,
	opened_folder_count:0,
	tab_count: 0,
	option_error_count: 0,
	file_error_count: 0
};

/* Parse user input for filename & options
 * Return: {string filename, string options}
 */
function parseOptions(text) {
	var input, options;

	var text_split = text.split(CONSTANTS.SPLIT_STR);

	// Case: filename w/ no spaces followed by -options
	if(text_split.length == 2) {
		input = text_split[0].trim();
		options = text_split[1].trim();

	//Case: filename w/ spaces followed by -options
	} else if(text_split.length > 2) {
		input = text_split[0];

		var potential_option = text_split[text_split.length-1].trim();
		LOG("potential_option: " + potential_option);
		// if potential_option is enum, then valid option
		if(isActionEnum(potential_option)) {
			options = text_split.pop();
		}

		input = text_split.join(CONSTANTS.SPLIT_STR).trim();

		LOG("THE INPUT: " + input);

	// Case: no options, no-spaces-in-filename
	} else {
		input = text.trim();
	}


	LOG("file: " + input);
	LOG("options: " + options);

	return {
		input: input,
		options: options
	}
}

/* Complete the user action on the specified file
 */
function doAction(filename, action) {

	// file doesn't exist, tell user
	if(! downloads[filename] ) {
		notif.unknownFile(filename);
		return;
	}

	// match action to an action enum
	switch(action) {
		case ACTION_ENUM.DELETE:
			chrome.downloads.removeFile(downloads[filename].id);
			notif.deleted(filename);
			break;

		case ACTION_ENUM.OPEN:
			chrome.downloads.open(downloads[filename].id);
			break;

		case ACTION_ENUM.OPEN_TAB:
			chrome.tabs.create({ url: CONSTANTS.FILE_PROTOCOL + downloads[filename].full_path });
			break;

		case undefined:
			// opening folder passes undefined for action
			chrome.downloads.show(downloads[filename].id);
			break;

		default:
			// unsupported option
			notif.invalidOption(action);
	}
}

/////////////////////////////////////////////////////////////////////////
///////////////////// Chrome Listeners //////////////////////////////////
/////////////////////////////////////////////////////////////////////////

// set the default suggestion 
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
				downloads[filename] = { 
					id: downloadItem.id, 
					full_path: full_path
				};
			}
		}

		if(suggestions.length > 0) {
			suggest(suggestions);
		}
	});
});

/* Listener for input being entered.
*/
chrome.omnibox.onInputEntered.addListener(function(text) {
	var parse = parseOptions(text);

	var filename = parse.input;
	var action = parse.options;

	// complete user action on filename
	doAction(filename, action);
});
