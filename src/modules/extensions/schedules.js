import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.schedules;
	let baseUtil = core.baseUtil;
	
	let regions = {
		AnimalShop: [
			{left:   1, top:   6, right:   2, bottom:   8, name: 'Jas\' bed'},
			{left:   0, top:   0, right:   9, bottom:  12, name: 'Jas\' room'},
			{left:  12, top:   4, right:  13, bottom:   6, name: 'Marnie\'s bed'},
			{left:  10, top:   0, right:  19, bottom:  12, name: 'Marnie\'s room'},
			{left:  26, top:   3, right:  27, bottom:   5, name: 'Shane\'s bed'},
			{left:  20, top:   0, right:  29, bottom:  13, name: 'Shane\'s room'},
			{left:   0, top:  13, right:   9, bottom:  19, name: 'Marnie\'s living room'},
			{left:  11, top:  14, right:  14, bottom:  15, name: 'Marnie\'s Ranch counter'},
			{left:  10, top:  13, right:  19, bottom:  19, name: 'Marnie\'s Ranch main shop'},
			{left:  24, top:  14, right:  33, bottom:  19, name: 'Marnie\'s kitchen'},
		],
		ArchaeologyHouse: [
			{left:   0, top:   0, right:   7, bottom:  19, name: 'Museum lobby'},
			{left:   8, top:   0, right:  24, bottom:  19, name: 'Library'},
			{left:  25, top:   0, right:  49, bottom:  19, name: 'Museum'},
		],
		BathHouse_Entry: [
			{left:   0, top:   0, right:   9, bottom:   9, name: 'Spa entrance area'},
		],
		BathHouse_MensLocker: [
			{left:   0, top:   0, right:   9, bottom:   8, name: 'Men\'s workout room'},
			{left:  10, top:   2, right:  16, bottom:   9, name: 'Men\'s shower'},
			{left:   5, top:  21, right:  12, bottom:  27, name: 'Men\'s lockers'},
			{left:   0, top:   0, right:  17, bottom:  27, name: 'Men\'s locker room'},
		],
		BathHouse_Pool: [
			{left:   0, top:   0, right:  27, bottom:  22, name: 'Spa upper pool area'},
			{left:   2, top:  23, right:  25, bottom:  33, name: 'Spa lower pool area'},
		],
		BathHouse_WomensLocker: [
			{left:   0, top:   0, right:   6, bottom:  10, name: 'Women\'s shower'},
			{left:   7, top:   2, right:  14, bottom:  10, name: 'Women\'s makeup area'},
			{left:   6, top:  18, right:  12, bottom:  27, name: 'Women\'s lockers'},
			{left:   0, top:   0, right:  17, bottom:  27, name: 'Women\'s locker room'},
		],
		Beach: [
			{left:   0, top:   0, right:  14, bottom:  17, name: 'west side of Beach'},
			{left:  15, top:   0, right:  28, bottom:  21, name: 'west side of Beach'},
			{left:  29, top:   0, right:  43, bottom:  18, name: 'central Beach'},
			{left:  44, top:   0, right:  52, bottom:  14, name: 'outside of Elliott\'s house'},
			{left:  53, top:   0, right:  57, bottom:  30, name: 'east side of Beach main area'},
			{left:  62, top:   0, right:  94, bottom:   8, name: 'north of Beach tide pools'},
			{left:  62, top:   9, right:  94, bottom:  25, name: 'Beach tide pools'},
			{left:  58, top:  13, right:  61, bottom:  13, name: 'Beach plank bridge'},
			{left:  10, top:  17, right:  14, bottom:  36, name: 'Beach west pier'},
			{left:  29, top:  19, right:  52, bottom:  30, name: 'south side of Beach'},
			{left:  15, top:  22, right:  22, bottom:  25, name: 'Beach west pier'},
			{left:  23, top:  22, right:  28, bottom:  30, name: 'pier to Fish Shop'},
			{left:  81, top:  26, right:  90, bottom:  41, name: 'pier south of Beach tide pools'},
			{left:  23, top:  31, right:  45, bottom:  37, name: 'outside of Fish Shop'},
			{left:  10, top:  36, right:  22, bottom:  40, name: 'south end of Beach west pier'},
		],
		Blacksmith: [
			{left:   9, top:   3, right:  10, bottom:   5, name: 'Clint\'s bed'},
			{left:   0, top:   0, right:  12, bottom:   6, name: 'Clint\'s room'},
			{left:   8, top:  11, right:  14, bottom:  13, name: 'Forge'},
			{left:   2, top:  13, right:   4, bottom:  14, name: 'the Blacksmith counter'},
			{left:   0, top:   8, right:  14, bottom:  19, name: 'Blacksmith main area'},
		],
		ElliottHouse: [
			{left:  12, top:   3, right:  13, bottom:   5, name: 'Elliott\'s bed'},
			{left:   0, top:   0, right:  15, bottom:   9, name: 'Elliott\'s Cabin'},
		],
		FishShop: [
			{left:   3, top:   4, right:   7, bottom:   5, name: 'Fish Shop counter'},
			{left:   0, top:   0, right:  11, bottom:   9, name: 'Fish Shop main area'},
		],
		Forest: [
			{left:  31, top:   4, right:  47, bottom:  14, name: 'Cindersnap Forest near the big sakura tree'},
			{left:  33, top:  18, right:  35, bottom:  24, name: 'Cindersnap Forest on the lake dock'},
			{left:   0, top:  27, right:  20, bottom:  44, name: 'the wizard\'s tower'},
			{left:  75, top:  35, right: 119, bottom:  46, name: 'the river south of Marnie\'s Ranch'},
		],
		HaleyHouse: [
			{left:   1, top:   4, right:   2, bottom:   6, name: 'Haley\'s bed'},
			{left:   0, top:   0, right:  10, bottom:  12, name: 'Haley\'s room'},
			{left:  19, top:   3, right:  21, bottom:   5, name: 'Emily\'s bed'},
			{left:  11, top:   0, right:  24, bottom:  11, name: 'Emily\'s room'},
			{left:   0, top:  14, right:  16, bottom:  23, name: 'Emily & Haley\'s living room'},
			{left:  17, top:  14, right:  24, bottom:  23, name: 'Emily & Haley\'s kitchen'},
			{left:  11, top:  24, right:  24, bottom:  28, name: 'Emily\'s sewing room'},
		],
		HarveyRoom: [
			{left:  12, top:   3, right:  13, bottom:   5, name: 'Harvey\'s bed'},
			{left:   0, top:   0, right:  15, bottom:  12, name: 'Harvey\'s room'},
			{left:  16, top:   0, right:  23, bottom:  12, name: 'Harvey\'s kitchen'},
		],
		Hospital: [
			{left:   0, top:   0, right:   7, bottom:   8, name: 'the clinic examination room'},
			{left:  14, top:   3, right:  15, bottom:   5, name: 'Clinic bed'},
			{left:  20, top:   3, right:  21, bottom:   5, name: 'Clinic bed'},
			{left:  18, top:  11, right:  19, bottom:  13, name: 'Clinic bed'},
			{left:  13, top:   3, right:  23, bottom:  13, name: 'Clinic ward'},
			{left:   1, top:  15, right:   8, bottom:  16, name: 'Clinic counter'},
			{left:   0, top:  14, right:  16, bottom:  19, name: 'Clinic main area'},
		],
		JoshHouse: [
			{left:   4, top:   3, right:   6, bottom:   5, name: 'George & Evelyn\'s bed'},
			{left:   0, top:   0, right:   7, bottom:   8, name: 'George & Evelyn\'s room'},
			{left:  20, top:   3, right:  21, bottom:   5, name: 'Alex\'s bed'},
			{left:   9, top:   0, right:  24, bottom:   8, name: 'Alex\'s room'},
			{left:   0, top:  12, right:   6, bottom:  24, name: 'George & Evelyn\'s kitchen'},
			{left:   7, top:  19, right:  12, bottom:  24, name: 'George & Evelyn\'s entrance'},
			{left:  13, top:  12, right:  24, bottom:  24, name: 'George & Evelyn\'s living room'},
		],
		LeahHouse: [
			{left:   2, top:   3, right:  3, bottom:   5, name: 'Leah\'s bed'},
		],
		ManorHouse: [
			{left:   0, top:   0, right:  14, bottom:  11, name: 'Mayor\'s Manor main area'},
			{left:  21, top:   3, right:  22, bottom:   5, name: 'Mayor Lewis\' bed'},
			{left:  15, top:   0, right:  24, bottom:   9, name: 'Mayor Lewis\' room'},
		],
		Mountain: [
			{left:   0, top:   0, right:  23, bottom:  15, name: 'Mountains north area'},
			{left:  24, top:   0, right:  36, bottom:  15, name: 'outside of Linus\' tent'},
			{left:  37, top:   0, right:  49, bottom:  33, name: 'west side of Mountain lake'},
			{left:  50, top:   0, right:  62, bottom:  15, name: 'outside of Mine entrance'},
			{left:  63, top:   0, right:  84, bottom:  16, name: 'outside of Adventurer\'s Guild'},
			{left:   0, top:  16, right:  20, bottom:  40, name: 'outside of Carpenter\'s shop'},
			{left:  21, top:  16, right:  36, bottom:  26, name: 'Mountain shrine area'},
			{left:  50, top:  16, right:  72, bottom:  33, name: 'Mountain lake islands'},
			{left:  21, top:  27, right:  36, bottom:  40, name: 'southeast of Carpenter\'s shop'},
			{left:  37, top:  34, right:  64, bottom:  40, name: 'southwest side of Mountain lake'},
		],
		Saloon: [
			{left:   2, top:   0, right:  12, bottom:   9, name: 'Saloon private room'},
			{left:  22, top:   3, right:  23, bottom:   5, name: 'Gus\' bed'},
			{left:  13, top:   0, right:  25, bottom:   9, name: 'Gus\' room'},
			{left:  27, top:   1, right:  38, bottom:  10, name: 'Saloon storage room'},
			{left:   8, top:  18, right:  19, bottom:  19, name: 'Saloon counter'},
			{left:   0, top:  16, right:  28, bottom:  24, name: 'Saloon main area'},
			{left:  29, top:  16, right:  45, bottom:  24, name: 'Saloon arcade'},
		],
		SamHouse: [
			{left:   0, top:   0, right:   8, bottom:   9, name: 'Jodi\'s kitchen'},
			{left:  21, top:   4, right:  23, bottom:   6, name: 'Jodi\'s bed'},
			{left:  17, top:   0, right:  24, bottom:   6, name: 'Jodi\'s room'},
			{left:  19, top:   7, right:  24, bottom:   7, name: 'Jodi\'s room'},
			{left:   0, top:  10, right:  11, bottom:  18, name: 'Jodi\'s living room'},
			{left:   0, top:  19, right:   6, bottom:  21, name: 'Jodi\'s living room'},
			{left:  21, top:  12, right:  22, bottom:  14, name: 'Sam\'s bed'},
			{left:  12, top:   8, right:  24, bottom:  14, name: 'Sam\'s room'},
			{left:  15, top:  15, right:  24, bottom:  19, name: 'Sam\'s room'},
			{left:   8, top:  21, right:   9, bottom:  23, name: 'Vincent\'s bed'},
			{left:   7, top:  19, right:  13, bottom:  24, name: 'Vincent\'s room'},
		],
		ScienceHouse: [
			{left:   2, top:   3, right:   3, bottom:   5, name: 'Maru\'s bed'},
			{left:   0, top:   0, right:  11, bottom:   8, name: 'Maru\'s room'},
			{left:  19, top:   3, right:  21, bottom:   5, name: 'Robin & Demetrius\' bed'},
			{left:  12, top:   0, right:  24, bottom:   8, name: 'Robin & Demetrius\' room'},
			{left:  25, top:   4, right:  31, bottom:  15, name: 'Robin\'s kitchen'},
			{left:   6, top:  17, right:   9, bottom:  19, name: 'Carpenter\'s shop counter'},
			{left:   0, top:  13, right:   9, bottom:  24, name: 'Carpenter\'s shop main area'},
			{left:  15, top:  13, right:  24, bottom:  24, name: 'Science lab'},
		],
		SebastianRoom: [
			{left:   0, top:   0, right:  12, bottom:   3, name: 'outside Sebastian\'s room'},
			{left:  10, top:   8, right:  11, bottom:  10, name: 'Sebastian\'s bed'},
			{left:   0, top:   4, right:  12, bottom:  12, name: 'Sebastian\'s room'},
		],
		SeedShop: [
			{left:   1, top:   8, right:   2, bottom:  10, name: 'Abigail\'s bed'},
			{left:   0, top:   0, right:  16, bottom:  11, name: 'Abigail\'s room'},
			{left:  23, top:   3, right:  25, bottom:   5, name: 'Pierre & Caroline\'s bed'},
			{left:  17, top:   0, right:  29, bottom:   9, name: 'Pierre & Caroline\'s room'},
			{left:  30, top:   0, right:  41, bottom:  10, name: 'Pierre & Caroline\'s kitchen'},
			{left:   3, top:  17, right:   8, bottom:  18, name: 'Pierre\'s General Store counter'},
			{left:   0, top:  13, right:  17, bottom:  30, name: 'Pierre\'s General Store main area'},
			{left:  18, top:  13, right:  30, bottom:  23, name: 'Pierre & Caroline\'s exercise room'},
			{left:  33, top:  12, right:  41, bottom:  24, name: 'Pierre & Caroline\'s shrine room'},
		],
		Town: [
			{left:  11, top:   8, right:  28, bottom:  15, name: 'Playground'},
			{left:  58, top:  13, right:  68, bottom:  19, name: 'garden east of the Community Center'},
			{left:  17, top:  20, right:  35, bottom:  33, name: 'Town fountain area'},
			{left:  69, top:  51, right:  78, bottom:  57, name: 'bridge near JojaMart'},
			{left:   2, top:  55, right:  15, bottom:  76, name: 'park west of town'},
			{left:  28, top:  55, right:  37, bottom:  61, name: 'outside of Harvey\'s Clinic'},
			{left:  38, top:  55, right:  50, bottom:  61, name: 'outside of Pierre\'s General Store'},
			{left:  16, top:  62, right:  38, bottom:  75, name: 'town square'},
			{left:  47, top:  62, right:  51, bottom:  65, name: 'George & Evelyn\'s mailbox'},
			{left:  52, top:  62, right:  63, bottom:  65, name: 'outside of George & Evelyn\'s house'},
			{left:  67, top:  64, right:  80, bottom:  72, name: 'outside of Trailer'},
			{left:  39, top:  66, right:  49, bottom:  75, name: 'outside of Saloon'},
			{left:  50, top:  66, right:  56, bottom:  75, name: 'dog run'},
			{left:  30, top:  76, right:  38, bottom:  83, name: 'the flowers south of town square'},
			{left:  39, top:  76, right:  48, bottom:  83, name: 'the benches south of the Saloon'},
			{left:  30, top:  84, right:  38, bottom:  92, name: 'the big tree east of the graveyard'},
			{left:  39, top:  84, right:  53, bottom:  94, name: 'the graveyard'},
			{left:  55, top:  84, right:  59, bottom:  91, name: 'outside of Mayor\'s Manor'},
			{left:  60, top:  84, right:  66, bottom:  91, name: 'Mayor Lewis\' garden'},
			{left:  96, top:  84, right: 111, bottom:  95, name: 'outside of Museum'},
			{left:   4, top:  86, right:  17, bottom:  92, name: 'outside of Jodi\'s house'},
			{left:  85, top:  87, right:  91, bottom:  95, name: 'ice cream stand near Museum'},
			{left:  18, top:  88, right:  29, bottom:  92, name: 'outside of Emily & Haley\'s house'},
			{left:  68, top:  88, right:  73, bottom:  95, name: 'table southeast of Mayor\'s Manor'},
			{left:  74, top:  88, right:  84, bottom: 103, name: 'bridge near Museum'},
			{left:  20, top:  98, right:  46, bottom: 102, name: 'the river south of town'},
			{left:  52, top: 101, right:  56, bottom: 109, name: 'bridge south of town'},
		],
		Trailer: [
			{left:   3, top:   8, right:   4, bottom:  10, name: 'Penny\'s bed'},
			{left:   0, top:   0, right:   7, bottom:   7, name: 'Penny\'s room'},
			{left:   0, top:   8, right:   5, bottom:  11, name: 'Penny\'s room'},
			{left:   9, top:   3, right:  12, bottom:   8, name: 'Trailer kitchen'},
			{left:  13, top:   0, right:  19, bottom:  11, name: 'Trailer living room'},
		],
	};
	
	core.addPageInitializer(function () {
		$('#schedules-character').change(function () {
			core.baseUtil.updateTab('schedules', false);
		});
	});
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		ext.scheduleCharacters = new Map();
		
		if (xmlDoc == null) {
			return;
		}
		
		let spouses = new Set();
		
		$(xmlDoc).find(':root > player, :root > farmhands > Farmer').each(function () {
			let spouse = $(this).find('> spouse').first().text();
			
			if ((spouse ?? '') !== '') {
				$(this).find('> friendshipData > item').each(function () {
					if ($(this).find('> key > string').first().text() === spouse) {
						if ($(this).find('> value > Friendship > Status').first().text() !== 'Enagaged') {
							spouses.add(spouse);
						}
						
						return false;
					}
				});
			}
		});
		
		$(xmlDoc).find(':root > locations > GameLocation > characters > NPC').each(function () {
			if ($(this).find('> followSchedule').first().text() === 'true') {
				let dayScheduleName = $(this).find('> dayScheduleName').first().text();
				
				if (dayScheduleName !== '') {
					let name = $(this).find('> name').first().text();
					
					ext.scheduleCharacters.set(name, {
						defaultMap: $(this).find('> defaultMap').first().text(),
						scheduleName: dayScheduleName,
						defaultX: Math.floor(+$(this).find('> DefaultPosition > X').first().text() / 64),
						defaultY: Math.floor(+$(this).find('> DefaultPosition > Y').first().text() / 64),
						friendship: 0,
						isMarried: spouses.has(name),
					});
				}
			}
		});
		
		$(xmlDoc).find(':root > player > friendshipData > item').each(function () {
			let character = ext.scheduleCharacters.get($(this).find('> key > string').first().text());
			
			if (character != null) {
				character.friendship = +$(this).find('> value > Friendship > Points').first().text();
			}
		});
		
		let characterNames = ext.scheduleCharacters.keys().toArray();
		characterNames.sort();
		
		let optionsOutput = '';
		
		for (let name of characterNames) {
			optionsOutput += `<option>${util.escapeHTML(name)}</option>`;
		}
		
		$('#schedules-character').html(optionsOutput);
	});
	
	core.addPredictor('schedules', 'Schedules', function (isSearch, offset, extra) {
		let output = '';
		
		let characterFile = $('#schedules-character').val();
		
		$.getJSON(util.contentURI(`Characters/schedules/${characterFile}.json`), function (json) {
			updateSchedule(characterFile, json);
		});
		
		return output;
	});
	
	let updateSchedule = function (characterName, schedules) {
		let output = '';
		
		let character = ext.scheduleCharacters.get(characterName);
		character.schedules = schedules;
		let possibleScheduleNames = [];
		
		switch (character.scheduleName) {
		case 'rain':
		case 'rain2':
			possibleScheduleNames.push('rain');
			
			if (Object.hasOwn(schedules, 'rain2')) {
				possibleScheduleNames.push('rain2');
			}
			
			break;
		
		default:
			possibleScheduleNames.push(character.scheduleName);
		}
		
		for (let i = 0; i < possibleScheduleNames.length; ++i) {
			if (possibleScheduleNames.length > 1) {
				output += `<h4>Possibility ${i + 1}:</h4>`;
			}
			
			let scheduleName = possibleScheduleNames[i];
			let routes = getRoutes(character, scheduleName);
			output += '<table class="output"><thead><tr><th>Time</th><th>Description</th><th>Location</th></tr></thead><tbody>';
			let isFirst = true;
			
			for (let route of routes) {
				output += '<tr>';
				output += `<td style="text-align: right">${util.formatTimeOfDay(route.time)}</td>`;
				output += '<td style="text-align: left;">';
				
				if (isFirst) {
					output += 'At';
				}
				else {
					output += route.isArrivalTime ? 'Arrives at' : 'Heads to';
				}
				
				output += ' ';
				let locationDisplayName = core.localizer.parseText(core.content.Data.Locations[route.locationName].DisplayName ?? route.locationName);
				let destinationName = locationDisplayName;
				
				if (Object.hasOwn(regions, route.locationName)) {
					for (let region of regions[route.locationName]) {
						if (route.x >= region.left && route.y >= region.top && route.x <= region.right && route.y <= region.bottom) {
							destinationName = region.name;
							break;
						}
					}
				}
				
				if (route.x != null || route.y != null) {
					locationDisplayName += ` (${route.x ?? 0}, ${route.y ?? 0})`;
				}
				
				let destinationHTML = util.escapeHTML(destinationName);
				let locationHTML = util.escapeHTML(locationDisplayName);
				
				if (core.isExtensionEnabled('maps')) {
					let dataAttrs = `data-location-id="${util.escapeHTML(route.locationName)}" data-x="${util.escapeHTML(route.x ?? 0)}" data-y="${util.escapeHTML(route.y ?? 0)}"`;
					destinationHTML = `<a href="#out-maps" class="schedules-warp" ${dataAttrs}>${destinationHTML}</a>`;
					locationHTML = `<a href="#out-maps" class="schedules-warp" ${dataAttrs}>${locationHTML}</a>`;
				}
				
				output += destinationHTML;
				output += '</td>';
				output += `<td style="text-align: left">${locationHTML}</td>`;
				output += '</tr>';
				
				isFirst = false;
			}
			
			output += '</tbody></table><br>';
		}
		
		$('#async-schedules').html(output);
		
		$('#async-schedules .schedules-warp').on('click', function (e) {
			e.preventDefault();
			core.extensions.maps.lib.warp(this.dataset.locationId, +this.dataset.x, +this.dataset.y);
		});
	};
	
	let getRoutes = function (character, scheduleName) {
		// See StardewValley.NPC:parseMasterScheduleImpl()
		
		let visited = [];
		let routes = [];
		
		while (!visited.includes(scheduleName)) {
			visited.push(scheduleName);
			let schedule = splitSchedule(character.schedules[scheduleName] ?? character.schedules.spring);
			let args = schedule[0].split(/ +/);
			let routesToSkip = 0;
			
			if (schedule[0].includes('GOTO')) {
				scheduleName = args[1];
				
				if (scheduleName.toLowerCase() === 'season') {
					scheduleName = Object.hasOwn(character.schedules, common.currentSeason) ? common.currentSeason : 'spring';
				}
				
				continue;
			}
			else if (schedule[0].includes('NOT')) {
				if (args[1].toLowerCase() === 'friendship') {
					let conditionMet = false;
					
					for (let i = 2; i < args.length; i += 2) {
						if (ext.scheduleCharacters.get(args[i])?.friendship >= +args[i + 1]) {
							conditionMet = true;
							break;
						}
					}
					
					if (conditionMet) {
						scheduleName = 'spring';
						continue;
					}
					
					++routesToSkip;
				}
			}
			else if (schedule[0].includes('MAIL')) {
				routesToSkip += common.player.mailReceived.has(args[2]) ? 2 : 1;
			}
			
			if (schedule[routesToSkip].includes('GOTO')) {
				let args = schedule[routesToSkip].split(/ +/);
				scheduleName = args[1];
				let scheduleNameLower = scheduleName.toLowerCase();
				
				if (scheduleNameLower === 'season') {
					scheduleName = Object.hasOwn(character.schedules, common.currentSeason) ? common.currentSeason : 'spring';
					continue;
				}
				else if (scheduleNameLower === 'no_schedule') {
					return [];
				}
				
				continue;
			}
			
			let previousLocationName = character.isMarried ? 'FarmHouse' : character.defaultMap;
			
			if (character.isMarried) {
				// Note: The game puts the NPC at the bus stop.
				
				routes.push({
					isArrivalTime: false,
					time: 600,
					locationName: previousLocationName,
					x: null,
					y: null,
				});
			}
			else {
				routes.push({
					isArrivalTime: false,
					time: 600,
					locationName: previousLocationName,
					x: character.defaultX,
					y: character.defaultY,
				});
			}
			
			for (let i = routesToSkip; i < schedule.length; ++i) {
				let args = schedule[i].split(/ +/);
				let route = {
					isArrivalTime: false,
				};
				
				if (args[0].substring(0, 1) === 'a') {
					route.isArrivalTime = true;
					route.time = +args[0].substring(1);
				}
				else {
					route.time = +args[0];
				}
				
				let index = 2;
				
				if (args[1] === 'bed') {
					if (character.isMarried) {
						route.locationName = 'FarmHouse';
						route.x = null;
						route.y = null;
						
						// Note: The game sends the NPC to the bus stop.
						//
						// route.locationName = 'BusStop';
						// route.x = 9;
						// route.y = 23;
					}
					else {
						route.locationName = character.defaultMap;
						route.x = character.defaultX;
						route.y = character.defaultY;
						let schedule = splitSchedule(character.schedules.default ?? character.schedules.spring ?? null);
						
						if (schedule !== null) {
							let args = schedule[schedule.length - 1].split(/ +/);
							
							if (args.length > 3 && /^-?\d+$/.test(args[2]) && /^-?\d+$/.test(args[3])) {
								route.locationName = args[1];
								route.x = +args[2];
								route.y = +args[3];
							}
						}
					}
				}
				else {
					if (/^-?\d+$/.test(args[1])) {
						route.locationName = previousLocationName;
						--index;
					}
					else {
						route.locationName = args[1];
					}
					
					route.x = +args[index++];
					route.y = +args[index++];
				}
				
				previousLocationName = route.locationName;
				routes.push(route);
			}
			
			break;
		}
		
		return routes;
	};
	
	let splitSchedule = function (schedule) {
		if (schedule === null) {
			return null;
		}
		
		return schedule
			.replace(/^[\s\/]+/, '')
			.replace(/[\s\/]+$/, '')
			.split(/(?:\s*\/)+\s*/);
	};
};
