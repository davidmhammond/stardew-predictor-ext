import ItemRegistry from './modules/classes/ItemRegistry.js';
import TokenParser from './modules/classes/TokenParser.js';

import * as util from './modules/util.js';

let core = {};
window.stardewPredictorExt = core;

// Information gathered from the saved game.

core.save = {}; // Gathered by the base Stardew Predictor.
core.common = {}; // Gathered by the extended Predictor core.
core.extVars = {}; // Gathered by extensions (core.extVars[extensionId]).

core.backgroundPredictors = [];
core.baseUtil = {};
core.content = {};
core.dataFiles = new Set();
core.dragHandler = null;
core.extensions = {};
core.extensionIds = [];
core.options = {
	...util.retrieve('options'),
};
core.pageInitializers = [];
core.predictors = new Map();
core.promises = [];
core.saveLoaders = [];
core.settings = {};
core.summaryWriters = [];
core.tabScrollPositions = new Map();
core.tabsUpdated = new Set();
core.todaySummaryWriters = [];

let settingsElement = document.getElementById('stardew-predictor-ext-settings');

if (settingsElement !== null) {
	core.settings = JSON.parse(settingsElement.textContent) || core.settings;
}

core.localizer = new TokenParser({
	EscapedText: function (args, rng) {
		let replacement = args.slice(1).join(' ');
		return (replacement === '') ? '\u200b' : replacement.replaceAll(' ', '\u00a0');
	},
	FarmName: function (args, rng) {
		return core.common.player.farmName;
	},
	LocalizedText: function (args, rng) {
		let data = core.content;
		let parts = args[1].split(':');
		
		for (let component of parts[0].split('\\')) {
			data = data[component];
			
			if (data == null) {
				console.log(`Missing localization file: ${parts[0]}`);
				return null;
			}
		}
		
		if (data[parts[1]] == null) {
			console.log(`Missing localization: ${args[1]}`);
			return null;
		}
		
		return data[parts[1]].replace(/\{(\d+)\}/g, function (match, index) {
			return args[+index + 2] ?? match;
		});
	},
});
core.items = new ItemRegistry(core.localizer);

let common = core.common;

core.addExtensions = function (extensionIds) {
	for (let extensionId of extensionIds) {
		core.addExtension(extensionId);
	}
};

core.addExtension = function (extensionId, initializer = null) {
	if (Object.hasOwn(this.extensions, extensionId)) {
		throw new Error(`Extension ID already in use: ${extensionId}`);
	}
	
	core.extVars[extensionId] = {};
	let extension = {
		id: extensionId,
		initializer: initializer,
		enabled: core.options.extensions?.[extensionId]?.enabled ?? true,
		state: 0,
		lib: {},
		mod: {},
		hasUnsavedChanges: false,
		addModule: function (moduleName, path = null, registry = null) {
			if (typeof path === 'string' && path.charAt(0) !== '/') {
				path = `./extensions/${extensionId}/${path}`;
			}
			
			path ??= `./extensions/${extensionId}/${moduleName}.js`;
			
			if (!(path instanceof Promise)) {
				path = import(path);
			}
			
			registry ??= this.mod;
			core.addPromise(path.then(function (module) {
				registry[moduleName] = module;
			}));
		},
		addClassModule: function (moduleName, path = null, registry = null) {
			if (typeof path === 'string' && path.charAt(0) !== '/') {
				path = `./extensions/${extensionId}/${path}`;
			}
			
			path ??= `./extensions/${extensionId}/classes/${moduleName}.js`;
			
			if (!(path instanceof Promise)) {
				path = import(path);
			}
			
			registry ??= this.mod;
			core.addPromise(path.then(function (module) {
				registry[moduleName] = module.default;
			}));
		},
	};
	this.extensions[extensionId] = extension;
	this.extensionIds.push(extensionId);
	
	if (initializer === null && extension.enabled) {
		core.addPromise(import(`./modules/extensions/${extensionId}.js`).then(function (module) {
			extension.initializer = module.initialize;
		}));
	}
};

core.depend = function (extensionIds, skipDisabled = false) {
	for (let extensionId of extensionIds) {
		if (!Object.hasOwn(this.extensions, extensionId)) {
			return false;
		}
		
		let extension = this.extensions[extensionId];
		
		if (!extension.enabled) {
			if (skipDisabled) {
				continue;
			}
			
			return false;
		}
		
		if (extension.state < 2) {
			if (extension.state === 1) {
				throw new Error(`Circular dependency detected while loading extension: ${extensionId}`);
			}
			
			extension.state = 1;
			extension.initializer(this, extension);
			extension.state = 2;
		}
	}
	
	return true;
};

core.addPageInitializer = function (pageInitializer) {
	this.pageInitializers.push(pageInitializer);
};

core.addSaveLoader = function (saveLoader) {
	this.saveLoaders.push(saveLoader);
};

core.addBackgroundPredictor = function (handler = null) {
	this.backgroundPredictors.push({
		handler: handler,
	});
};

core.addPredictor = function (tabId, tabName, handler = null) {
	this.predictors.set(tabId, {
		tabId: tabId,
		tabName: tabName,
		handler: handler,
	});
};

core.addDataFile = function (path) {
	this.dataFiles.add(path);
};

core.addPromise = function (promise) {
	this.promises.push(promise);
};

core.addSummaryWriter = function (summaryId, name, writer, order = null) {
	this.summaryWriters.push({
		summaryId: summaryId,
		name: name,
		order: order,
		writer: writer,
	});
};

core.addTodaySummaryWriter = function (todaySummaryId, name, writer, order = null) {
	this.todaySummaryWriters.push({
		todaySummaryId: todaySummaryId,
		name: name,
		order: order,
		writer: writer,
	});
};

core.setBaseUtil = function (baseUtil) {
	Object.assign(this.baseUtil, baseUtil);
};

core.sortOrderables = function (orderables) {
	// Determine the default value for any unset orders.
	
	let defaultValue = 0;
	
	for (let value of orderables) {
		// null and undefined will not be greater than 0, so they're implicitly ignored.
		
		if (value.order > defaultValue) {
			defaultValue = value.order;
		}
	}
	
	defaultValue += 1;
	
	orderables.sort(function (a, b) {
		return (a.order ?? defaultValue) - (b.order ?? defaultValue);
	});
};

core.getItemHTML = function (itemType, itemId, mode, stack, quality, details) {
	// Modes: imageLink, image, link, text, plainText
	
	stack ??= 1;
	quality ??= 0;
	
	let item = core.items.get(itemType, itemId);
	
	if (item.isError && itemType === 'O') {
		switch (itemId) {
		case '-1':
			item = core.items.get('O', 'GoldCoin');
			quality = 0;
			break;
		
		case '-5':
			item.spriteIndex = 176;
			item.texture = util.tx.objectSpriteSheet;
			item.name = 'Egg';
			item.displayName = 'Any Egg';
			break;
		
		case '-6':
			item.spriteIndex = 184;
			item.texture = util.tx.objectSpriteSheet;
			item.name = 'Milk';
			item.displayName = 'Any Milk';
			break;
		}
	}
	
	let output = details?.name ?? item.displayName;
	
	if (mode !== 'plainText') {
		output = util.escapeHTML(output);
	}
	
	let qualityName = util.getQualityName(quality);
	
	if (qualityName != '') {
		output = `${qualityName} ${output}`;
	}
	
	output += (stack == 1) ? '' : ` (${stack})`;
	
	if (details?.['sp:note'] != null) {
		let note = details['sp:note'];
		
		if (mode !== 'plainText') {
			note = util.escapeHTML(note);
		}
		
		output += ' - ' + note;
	}
	
	if (mode === 'image' || mode === 'imageLink') {
		let url = util.contentURI(`${item.texture}.png`);
		let qualityHTML = '';
		let stackHTML = '';
		let donatableHTML = '';
		let waterHTML = '';
		let innerHTML = '';
		
		if (quality != 0) {
			let positionX = [-338, -338, -346, 0, -346][quality];
			let positionY = [-392, -400, -400, 0, -392][quality];
			qualityHTML = `<span class="sd-item-quality" style="background-position: ${positionX}px ${positionY}px;"></span>`;
		}
		
		if (stack != 1) {
			let right = -1;
			
			do {
				let positionX = (stack % 10) * -5 - 368;
				stackHTML = `<span class="sd-item-stack" style="right: ${right}px; background-position: ${positionX}px -56px;"></span>${stackHTML}`;
				stack = Math.floor(stack / 10);
				right += 4;
			}
			while (stack > 0);
		}
		
		if (itemType === 'O' && ['Arch', 'Minerals'].includes(item.type) && !common.donatedItems.has(itemId)) {
			donatableHTML = '<span class="sd-item-donatable"></span>';
		}
		
		let textureSize = util.textureSizes[item.texture];
		let spriteRect = item.spriteRect;
		let scale = 1;
		
		if (spriteRect.width > 16 || spriteRect.height > 16) {
			scale = 16 / Math.max(item.spriteRect.width, item.spriteRect.height);
		}
		
		let marginLeft = Math.max(0, Math.floor(8 - item.spriteRect.width * scale * .5));
		let marginTop = Math.max(0, Math.floor(8 - item.spriteRect.height * scale * .5));
		let marginRight = marginLeft;
		let marginBottom = marginTop;
		let styleExtra = '';
		
		if (details != null) {
			switch (details['@xsi:type']) {
			case 'Clothing': {
				let filter = util.getTintFilter(+details.clothesColor.R, +details.clothesColor.G, +details.clothesColor.B);
				
				switch (details.clothesType) {
				case 'SHIRT':
					innerHTML = `<span style="background: url('${url}') ${-(spriteRect.x + 128)}px ${-spriteRect.y}px no-repeat; filter: ${util.escapeHTML(filter)};"></span>`;
					break;
				
				case 'PANTS':
					styleExtra = ` filter: ${util.escapeHTML(filter)};`;
					break;
				}
				
				if (+details.clothesColor.A !== 255) {
					styleExtra += ` opacity: ${(+details.clothesColor.A / 255).toFixed(4)};`
				}
				
				break;
			}
			case 'ColoredObject': {
				spriteRect = util.getItemRect(item, 0, details.parentSheetIndex);
				let filter = util.getTintFilter(+details.color.R, +details.color.G, +details.color.B);
				
				if (details.colorSameIndexAsParentSheetIndex === 'true') {
					styleExtra = ` filter: ${util.escapeHTML(filter)};`;
				}
				else {
					let coloredSourceRect = util.getItemRect(item, 1, details.parentSheetIndex);
					innerHTML = `<span style="background: url('${url}') ${-coloredSourceRect.x}px ${-coloredSourceRect.y}px no-repeat; filter: ${util.escapeHTML(filter)};"></span>`;
				}
				
				if (+details.color.A !== 255) {
					styleExtra += ` opacity: ${(+details.clothesColor.A / 255).toFixed(4)};`
				}
				
				break;
			}
			case 'WateringCan': {
				styleExtra += ' top: -3px;';
				let max = [40, 55, 70, 85][+(details.upgradeLevel ?? 0)] ?? 100;
				let waterWidth = Math.floor(+details.WaterLeft / max * 12);
				let className = 'sd-item-water';
				
				if (details.IsBottomless === 'true') {
					className += 'bottomless';
				}
				
				waterHTML = `<span class="${className}"><span style="width: ${waterWidth}px;"></span></span>`;
				break;
			}}
		}
		
		let background = `url('${url}') ${-spriteRect.x * scale}px ${-spriteRect.y * scale}px / ${textureSize.width * scale}px ${textureSize.height * scale}px no-repeat`;
		output = `<span class="sd-item" title="${output}">${donatableHTML}<span class="sd-item-icon" style="width: ${spriteRect.width * scale}px; height: ${spriteRect.height * scale}px; background: ${background};${styleExtra}; margin: ${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px;">${innerHTML}</span>${qualityHTML}${stackHTML}${waterHTML}</span>`;
	}
	
	if ((mode === 'link' || mode === 'imageLink') && item.name != null) {
		output = util.wikify(item.name, null, output);
	}
	
	return output;
}

core.createDaySaveRandom = function (a, b, c) {
	return core.createSpecificDaySaveRandom(core.save.daysPlayed, a, b, c);
};

core.createSpecificDaySaveRandom = function (daysPlayed, a, b, c) {
	return new CSRandom(core.baseUtil.getRandomSeed(daysPlayed, Math.floor(core.save.gameID / 2), a, b, c));
};

core.isExtensionEnabled = function (extensionId) {
	return Object.hasOwn(core.extensions, extensionId) && core.extensions[extensionId].enabled;
};

core.parseSummary = function (xmlDoc, save, wasChanged) {
	// Clear all save var objects without breaking their references.
	
	for (let key of Object.keys(core.save)) {
		delete core.save[key];
	}
	
	for (let key of Object.keys(core.common)) {
		delete core.common[key];
	}
	
	for (let ext of Object.values(core.extVars)) {
		for (let key of Object.keys(ext)) {
			delete ext[key];
		}
	}
	
	Object.assign(core.save, save);
	
	common.year = 1;
	common.currentSeason = 'spring';
	common.seasonNumber = 0;
	common.dayOfMonth = 1;
	common.farmType = '0';
	common.lostBooksFound = 0;
	common.treasureTotemsUsed = 0;
	common.teamDailyLuck = 0;
	
	let farmerTemplate = {
		name: '',
		uniqueMultiplayerId: '',
		
		farmName: 'Unknown',
		houseUpgradeLevel: 0,
		money: 500,
		spouse: null,
		
		farmingLevel: 0,
		miningLevel: 0,
		combatLevel: 0,
		foragingLevel: 0,
		fishingLevel: 0,
		
		mailReceived: new Set(),
		eventsSeen: new Set(),
		professions: new Set(),
		stats: {},
		
		dailyLuck: 0,
		isEngaged: false,
		isMarriedOrRoommates: false,
	};
	
	common.player = window.structuredClone(farmerTemplate);
	common.farmhands = [];
	common.farmers = [common.player];
	common.farmersById = {};
	
	common.donatedItems = new Set();
	common.worldStateIds = new Set();
	
	common.weather = '(Unknown)';
	common.weatherForTomorrow = '(Unknown)';
	common.locationWeather = {};
	common.dishOfTheDay = null;
	
	if (xmlDoc != null) {
		common.year = +$(xmlDoc).find(':root > year').first().text();
		common.currentSeason = $(xmlDoc).find(':root > currentSeason').first().text();
		common.seasonNumber = util.seasonNumberMap.get(common.currentSeason);
		common.dayOfMonth = +$(xmlDoc).find(':root > dayOfMonth').first().text();
		common.farmType = $(xmlDoc).find(':root > whichFarm').first().text();
		common.lostBooksFound = +$(xmlDoc).find(':root > lostBooksFound').first().text();
		common.treasureTotemsUsed = +$(xmlDoc).find(':root > treasureTotemsUsed').first().text();
		common.teamDailyLuck = +$(xmlDoc).find(':root > dailyLuck').first().text();
		
		$(xmlDoc).find(':root > player, :root > farmhands > Farmer').each(function () {
			let farmer = common.player;
			
			if (this.tagName !== 'player') {
				farmer = window.structuredClone(farmerTemplate);
				common.farmhands.push(farmer);
				common.farmers.push(farmer);
			}
			
			farmer.name = $(this).find('> name').first().text();
			farmer.uniqueMultiplayerId = $(this).find('> UniqueMultiplayerID').first().text();
			common.farmersById[farmer.uniqueMultiplayerId] = farmer;
			
			farmer.farmName = $(this).find('> farmName').first().text();
			farmer.houseUpgradeLevel = +$(xmlDoc).find(':root > player > houseUpgradeLevel').first().text();
			farmer.money = +$(xmlDoc).find(':root > player > money').first().text();
			farmer.spouse = $(xmlDoc).find(':root > player > spouse').first().text() || null;
			
			farmer.farmingLevel = +$(xmlDoc).find(':root > player > farmingLevel').first().text();
			farmer.miningLevel = +$(xmlDoc).find(':root > player > miningLevel').first().text();
			farmer.combatLevel = +$(xmlDoc).find(':root > player > combatLevel').first().text();
			farmer.foragingLevel = +$(xmlDoc).find(':root > player > foragingLevel').first().text();
			farmer.fishingLevel = +$(xmlDoc).find(':root > player > fishingLevel').first().text();
			
			$(this).find('> mailReceived > string').each(function () {
				farmer.mailReceived.add($(this).text());
			});
			
			$(this).find('> eventsSeen > *').each(function () {
				farmer.eventsSeen.add($(this).text());
			});
			
			$(this).find('> professions > int').each(function () {
				farmer.professions.add(+$(this).text());
			});
			
			$(this).find('> stats > Values > item').each(function () {
				farmer.stats[$(this).find('> key > string').first().text()] = +$(this).find('> value > *').first().text();
			});
			
			farmer.dailyLuck = common.teamDailyLuck;
			
			if (farmer.mailReceived.has('HasSpecialCharm')) {
				farmer.dailyLuck += .025;
			}
			
			if (farmer.spouse !== null) {
				$(this).find('> friendshipData > item').each(function () {
					if ($(this).find('> key > string').first().text() === farmer.spouse) {
						let status = $(this).find('> value > Friendship > Status').first().text();
						farmer.isEngaged = (status === 'Engaged');
						farmer.isMarriedOrRoommates = (status === 'Married');
						return false;
					}
				});
			}
		});
		
		$(xmlDoc).find(':root > locations > GameLocation').each(function () {
			if (this.getAttributeNS(util.ns.xsi, 'type') === 'LibraryMuseum') {
				$(this).find('> museumPieces > item').each(function () {
					common.donatedItems.add($(this).find('> value > string').first().text());
				});
			}
		});
		
		$(xmlDoc).find(':root > worldStateIDs > string').each(function () {
			common.worldStateIds.add($(this).text());
		});
		
		$(xmlDoc).find(':root > locationWeather > item').each(function () {
			common.locationWeather[$(this).find('> key > string').first().text()] = {
				weatherForTomorrow: $(this).find('> value > LocationWeather > weatherForTomorrow').first().text(),
				weather: $(this).find('> value > LocationWeather > weather > string').first().text(),
				isRaining: $(this).find('> value > LocationWeather > isRaining > boolean').first().text() === 'true',
				isSnowing: $(this).find('> value > LocationWeather > isSnowing > boolean').first().text() === 'true',
				isLightning: $(this).find('> value > LocationWeather > isLightning > boolean').first().text() === 'true',
				isDebrisWeather: $(this).find('> value > LocationWeather > isDebrisWeather > boolean').first().text() === 'true',
				isGreenRain: $(this).find('> value > LocationWeather > isGreenRain > boolean').first().text() === 'true',
				monthlyNonRainyDayCount: +$(this).find('> value > LocationWeather > monthlyNonRainyDayCount > int').first().text(),
			};
		});
		
		common.weather = common.locationWeather.Default.weather;
		common.weatherForTomorrow = common.locationWeather.Default.weatherForTomorrow;
		
		$(xmlDoc).find(':root > dishOfTheDay').each(function () {
			common.dishOfTheDay = {
				name: $(this).find('> name').first().text(),
				stack: +$(this).find('> stack').first().text(),
				price: +$(this).find('> price').first().text(),
			};
		});
	}
	
	for (let saveLoader of core.saveLoaders) {
		saveLoader(xmlDoc, wasChanged);
	}
	
	// Help the garbage collector free the memory more quickly. Save
	// loaders aren't supposed to hold onto the XML DOM objects anyway.
	
	xmlDoc.documentElement.replaceChildren();
	
	core.sortOrderables(core.summaryWriters);
	
	let output = '';
	
	for (let summaryWriter of core.summaryWriters) {
		output += `<div id="summary-${util.escapeHTML(summaryWriter.summaryId)}">`;
		output += summaryWriter.writer(wasChanged);
		output += '</div>';
	}
	
	return output;
};

core.setOption = function (key, value) {
	core.options[key] = value;
	
	if (!util.store('options', core.options)) {
		window.alert('Unable to save options, because storage is full. Try deleting some stored data first.');
		return false;
	}
	
	return true;
};

core.updateTab = function (tabId, isSearch, offset, extra) {
	if (tabId === '.background') {
		for (let backgroundPredictor of this.backgroundPredictors) {
			if (backgroundPredictor.handler != null) {
				backgroundPredictor.handler();
			}
		}
		
		return true;
	}
	
	if (!$(`#tab-${tabId}`).prop('checked')) {
		core.tabsUpdated.delete(tabId);
		return true;
	}
	
	core.tabsUpdated.add(tabId);
	let predictor = this.predictors.get(tabId);
	
	if (predictor === undefined || predictor.handler == null) {
		return false;
	}
	
	let result = predictor.handler(isSearch, offset, extra);
	
	if (typeof result === 'string') {
		result = {
			output: result,
		};
	}
	
	let container = document.getElementById('out-' + tabId);
	container.innerHTML = result.output;
	
	if (result.afterUpdate != null) {
		result.afterUpdate(container);
	}
	
	return true;
};

core.addSummaryWriter('baseSaveState', 'Save State Summary', function (wasChanged) { // Base summary writer.
	let save = core.save;
	let output = '';
	output += '<h3>Save State Summary</h3><p>Important information taken from the save file which is needed for predictions. Anything that was overridden by <a href="#advanced_usage">a URL parameter</a> is marked with an asterisk (*).</p>';
	
	output += '<div class="summary-list">';
	output += '<span class="result">' + (wasChanged.gameID ? "*":'') + 'Game ID: ' + save.gameID + '</span><br>';
	output += '<span class="result">' + (wasChanged.version ? "*":'') + 'Stardew version: ' + save.version + '</span><br>';
	if (save.names.length === 0) { save.names[0] = "Unknown Farmer"; }
	output += '<span class="result">Farmer ' + save.names[0] + ' of ' + save.farmName + '</span><br>';
	if (save.names.length > 1) {
		output += '<span class="result">Farmhands: ' + save.names.slice(1).join(', ') + '</span><br>';
	}
	if (save.niceDate !== '') {
		output += '<span class="result">' + save.niceDate + ' (' + save.daysPlayed + ' days played)</span><br>\n';
	} else {
		output += '<span class="result">' + ((wasChanged.daysPlayed || wasChanged.dayAdjust) ? '*' : '') +
			(save.daysPlayed + save.dayAdjust) + ' days played</span><br>\n';
	}
	output += '<span class="result">' + (wasChanged.geodesCracked ? "*":'') + 'Geodes cracked: ';
	for (let i = 0; i < save.names.length; i++) {
		output += save.geodesCracked[i] + ' (' + save.names[i] + ') ';
	}
	output += '</span><br>';
	if (core.baseUtil.compareSemVer(save.version, "1.6") >= 0) {
		output += '<span class="result">' + (wasChanged.mysteryBoxesOpened ? "*":'') + 'Mystery Boxes opened: ';
		for (let i = 0; i < save.names.length; i++) {
			output += save.mysteryBoxesOpened[i] + ' (' + save.names[i] + ') ';
		}
		output += '</span><br>';
		output += '<span class="result">' + (wasChanged.ticketPrizesClaimed ? "*":'') + 'Prize Tickets claimed: ';
		for (let i = 0; i < save.names.length; i++) {
			output += save.ticketPrizesClaimed[i] + ' (' + save.names[i] + ') ';
		}
		output += '</span><br>';
	}
	if (core.baseUtil.compareSemVer(save.version, "1.5") >= 0) {
		output += '<span class="result">' + (wasChanged.timesEnchanted ? "*":'') + 'Times enchanted: ';
		for (let i = 0; i < save.names.length; i++) {
			output += save.timesEnchanted[i] + ' (' + save.names[i] + ') ';
		}
		output += '</span><br>';
	}
	output += '<span class="result">' + (wasChanged.trashCansChecked ? "*":'') + 'Trash cans checked: ';
	for (let i = 0; i < save.names.length; i++) {
		output += save.trashCansChecked[i] + ' (' + save.names[i] + ') ';
	}
	output += '</span><br>';
	output += '<span class="result">' + (wasChanged.deepestMineLevel ? "*":'') + 'Deepest mine level: ' + Math.min(120, save.deepestMineLevel) + '</span><br>';
	output += '<span class="result">' + (wasChanged.timesFedRaccoons ? "*":'') + 'Times fed raccoons: ' + save.timesFedRaccoons + '</span><br>';
	output += '<span class="result">' + (wasChanged.visitsUntilY1Guarantee ? "*":'') + 'Cart Y1 Guarantee: ';
	if (save.visitsUntilY1Guarantee >= 0) {
		output += save.visitsUntilY1Guarantee + " visits left";
	} else if (save.originalGuarantee > 0) {
		output += save.originalGuarantee + " visits originally rolled";
	} else {
		output += " not active or already past";
	}
	output += '</span><br>';
	output += '<span class="result">' + (wasChanged.dailyLuck ? "*":'') + 'Daily Luck is assumed to be ' + common.teamDailyLuck;
	if (save.hasSpecialCharm) {
		output += ' (' + common.player.dailyLuck.toFixed(3) + ' with charm)';
	}
	output += '</span><br>';
	output += '<span class="result">' + (wasChanged.luckLevel ? "*":'') + 'Luck buffs are assumed to be ' + save.luckLevel + '</span><br>';
	output += '</td><td>';
	
	output += '<span class="result">' + (wasChanged.useLegacyRandom ? "*":'') + 'Legacy RNG Seeding is ' + (save.useLegacyRandom ? "on" : "off") +
		'</span><br>';
	output += '<span class="result">' + (wasChanged.quarryUnlocked ? "*":'') + 'Quarry is ' + (save.quarryUnlocked ? "" : "not") +
		' unlocked</span><br>';
	output += '<span class="result">' + (wasChanged.desertUnlocked ? "*":'') + 'Desert is ' + (save.desertUnlocked ? "" : "not") +
		' unlocked</span><br>';
	output += '<span class="result">' + (wasChanged.greenhouseUnlocked ? "*":'') + 'Greenhouse is ' + (save.greenhouseUnlocked ? "" : "not") +
		' unlocked</span><br>';
	output += '<span class="result">' + (wasChanged.ccComplete ? "*":'') + 'Community Center is ' + (save.ccComplete ? "" : "not") +
		' complete</span><br>';
	output += '<span class="result">' + (wasChanged.jojaComplete ? "*":'') + 'Joja Community Development is ' + (save.jojaComplete ? "" : "not") +
		' complete</span><br>';
	output += '<span class="result">' + (wasChanged.theaterUnlocked ? "*":'') + 'Theater is ' + (save.theaterUnlocked ? "" : "not") +
		' unlocked</span><br>';
	if (core.baseUtil.compareSemVer(save.version, "1.3") < 0) {
		output += '<span class="result">' + (wasChanged.canHaveChildren ? "*":'') + 'Farmer can' + (save.canHaveChildren ? "" : "not") +
		' have more children</span><br>';
	}
	output += '<span class="result">' + (wasChanged.hasFurnaceRecipe ? "*":'') + 'Farmer ' + (save.hasFurnaceRecipe ? "has" : "does not have") +
		' furnace recipe</span><br>';
	output += '<span class="result">' + (wasChanged.hasSpecialCharm ? "*":'') + 'Farmer ' + (save.hasSpecialCharm ? "has" : "does not have") +
		' special luck charm</span><br>';
	output += '<span class="result">' + (wasChanged.hasGarbageBook ? "*":'') + 'Farmer has ' + (save.hasGarbageBook ? "" : "not") +
		' read <span class="book">The Alleyway Buffet</span></span><br>';
	output += '<span class="result">' + (wasChanged.gotMysteryBook ? "*":'') + 'Farmer has ' + (save.gotMysteryBook ? "" : "not") +
		' gotten <span class="book">Mystery Book</span> from Mystery Boxes</span><br>';
	output += '<span class="result">' + (wasChanged.leoMoved ? "*":'') + 'Leo has ' + (save.leoMoved ? "" : "not") +
		' moved to the Valley</span><br>';
	output += '<span class="result">' + (wasChanged.hardmodeMines ? "*":'') + 'Mines are ' + (save.hardmodeMines ? "" : "not") +
		' currently hard difficulty</span><br>';
	output += '<span class="result">' + (wasChanged.qiCropsActive ? "*":'') + 'Qi Crops special order is ' + (save.qiCropsActive ? "" : "not") +
		' active</span><br>';
	output += '</div>';
	
	return output;
}, 0);

core.addSummaryWriter('today', 'Today\'s Summary', function (wasChanged) {
	let output = '';
	
	let date =
		['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][core.save.daysPlayed % 7] + ', ' +
		core.baseUtil.capitalize(common.currentSeason) + ' ' +
		((core.save.daysPlayed - 1) % 28 + 1) + ', Year ' +
		Math.floor((core.save.daysPlayed - 1) / 112 + 1);
	
	output += `<h3>Today's Summary - ${date}</h3>`;
	output += '<div class="summary-list">';
	
	core.sortOrderables(core.todaySummaryWriters);
	
	for (let todaySummaryWriter of core.todaySummaryWriters) {
		output += `<div id="today-summary-${util.escapeHTML(todaySummaryWriter.todaySummaryId)}">`;
		output += todaySummaryWriter.writer();
		output += '</div>';
	}
	
	output += '</div>';
	return output;
}, 100);

// Today's summary.

core.addTodaySummaryWriter('funds', 'Funds', function () { // Funds
	let output = '';
	output += `<span class="result">Funds: ${core.baseUtil.addCommas(common.player.money)}g</span><br>`;
	return output;
}, 0);

core.addTodaySummaryWriter('weather', 'Weather', function () { // Weather
	let output = '';
	let forecast = [
		common.weather,
		common.weatherForTomorrow,
	];
	
	if (core.isExtensionEnabled('calendar')) {
		let calendarLib = core.extensions.calendar.lib;
		
		for (let i = 0; i < forecast.length; ++i) {
			forecast[i] = calendarLib.getWeatherIcon(forecast[i], common.seasonNumber) + ` ${forecast[i]}`;
		}
	}
	
	output += '<span class="result">Weather: ' + forecast.join(' &rarr; ') + '</span><br>';
	return output;
}, 100);

core.addTodaySummaryWriter('luck', 'Luck', function () { // Luck
	let output = '';
	output += '<span class="result">Luck: <span class="range luck-range"><span class="range-threshold" style="left:10%"></span><span class="range-threshold minor" style="left:22%"></span><span class="range-threshold minor" style="left:42%"></span><span class="range-threshold" style="left:50%"></span><span class="range-threshold minor" style="left:58%"></span><span class="range-threshold minor" style="left:78%"></span><span class="range-threshold" style="left:90%"></span><span class="range-marker" style="left: ' + (Math.max(Math.min(common.player.dailyLuck + .125, .25), 0) * 400) + '%" title="' + common.player.dailyLuck + '"></span></span> ';
	
	if (common.player.dailyLuck > .07) {
		output += 'Very happy';
	}
	else if (common.player.dailyLuck > .02) {
		output += 'In good humor';
	}
	else if (common.player.dailyLuck == 0) {
		output += 'Absolutely neutral';
	}
	else if (common.player.dailyLuck >= -.02) {
		output += 'Neutral';
	}
	else if (common.player.dailyLuck >= -.07) {
		output += 'Somewhat annoyed';
	}
	else {
		output += 'Very displeased';
	}
	
	output += '<br>';
	return output;
}, 200);

core.addTodaySummaryWriter('saloon', 'Saloon', function () { // Dish of the day
	let output = '';
	output += `<span class="result">Saloon: ${util.wikify(common.dishOfTheDay.name)} (${common.dishOfTheDay.stack}) ${core.baseUtil.addCommas(common.dishOfTheDay.price)}g</span><br>`;
	return output;
}, 600);

// Add tab information for the base predictors.

core.addPredictor('book', 'Bookseller');
core.addPredictor('cj', 'Calico\nJack');
core.addPredictor('crane', 'Crane\nGame');
core.addPredictor('makeover', 'Desert\nFestival');
core.addPredictor('enchant', 'Enchants');
core.addPredictor('trash', 'Garbage\nCans');
core.addPredictor('gembirds', 'Gem\nBirds');
core.addPredictor('geode', 'Geodes');
core.addPredictor('krobus', 'Krobus');
core.addPredictor('mines', 'Mines');
core.addPredictor('minechest', 'Mine\nChests');
core.addPredictor('mystery', 'Mystery\nBoxes');
core.addPredictor('night', 'Night\nEvents');
core.addPredictor('prize', 'Prize\nTickets');
core.addPredictor('raccoon', 'Raccoon\nBundles');
core.addPredictor('sandy', 'Sandy');
core.addPredictor('statue', 'Statue\nBlessings');
core.addPredictor('train', 'Trains');
core.addPredictor('cart', 'Traveling\nCart');
core.addPredictor('wallpaper', 'Wallpaper');
core.addPredictor('greenrain', 'Weather');
core.addPredictor('winterstar', 'Winter\nStar');

core.addExtensions(core.settings.extensions ?? []);

core.addDataFile('Data/AdditionalWallpaperFlooring');
core.addDataFile('Data/BigCraftables');
core.addDataFile('Data/Boots');
core.addDataFile('Data/Furniture');
core.addDataFile('Data/hats');
core.addDataFile('Data/Objects');
core.addDataFile('Data/Mannequins');
core.addDataFile('Data/Pants');
core.addDataFile('Data/Shirts');
core.addDataFile('Data/Tools');
core.addDataFile('Data/Trinkets');
core.addDataFile('Data/Weapons');
core.addDataFile('Strings/1_6_Strings');
core.addDataFile('Strings/BigCraftables');
core.addDataFile('Strings/Furniture');
core.addDataFile('Strings/Objects');
core.addDataFile('Strings/Pants');
core.addDataFile('Strings/Shirts');
core.addDataFile('Strings/StringsFromCSFiles');
core.addDataFile('Strings/Tools');
core.addDataFile('Strings/Weapons');

let oldOnload = window.onload;
window.onload = function () {
	Promise.all(core.promises).then(function () {
		core.promises.splice(0);
		core.depend(core.extensionIds, true);
		
		for (let dataFile of core.dataFiles) {
			let store;
			let key = null;
			
			for (let component of dataFile.split('/')) {
				store = (key === null) ? core.content : store[key];
				key = component;
				
				if (store[component] === undefined) {
					store[component] = {};
				}
			}
			
			core.addPromise(window.fetch(util.contentURI(`${dataFile}.json`))
				.then(function (response) {return response.json();})
				.then(function (json) {
					store[key] = json;
				})
			);
		}
		
		return Promise.all(core.promises);
	}).then(function () {
		core.items.load(core.content);
		
		let tabsHTML = '';
		
		// Add a hidden "tab" element, to serve as a hook for updateOutput()
		// to trigger our background predictors.
		
		tabsHTML += '<input type="hidden" name="tabset" id="tab-.background">';
		
		// Prepare the predictor tabs.
		
		let predictorList = core.predictors.values().toArray();
		predictorList.sort(function (a, b) {
			return a.tabName.localeCompare(b.tabName);
		});
		let firstTabId = null;
		
		for (let predictor of predictorList) {
			let tabId = util.escapeHTML(predictor.tabId);
			let tabName = util.escapeHTML(predictor.tabName.trim());
			tabName = tabName.includes('\n') ? tabName.replace(/\n/g, '<br>') : (tabName + '<br>&nbsp;');
			tabsHTML += `<input type="radio" name="tabset" id="tab-${tabId}">`;
			tabsHTML += `<label for="tab-${tabId}">${tabName}</label>`;
			
			if (firstTabId === null && (core.options.tabs?.[tabId]?.show ?? true)) {
				firstTabId = tabId;
			}
		}
		
		$('#tabset-div').html(tabsHTML);
		let initialTab = document.getElementById('tab-' + (core.options.tabId ?? firstTabId ?? '')) ??
			document.getElementById('tab-' + (firstTabId ?? ''));
		
		if (initialTab != null) {
			initialTab.checked = true;
		}
		
		$(document.body).prepend('<input type="hidden"');
		
		for (let pageInitializer of core.pageInitializers) {
			pageInitializer();
		}
		
		// Event listeners for dragging UIs (example: color sliders). We
		// need to register these in the capturing phase so they can
		// override the more element-specific listeners. This means we can't
		// use jQuery to register these.
		
		document.documentElement.addEventListener('mousemove', function (e) {
			if (core.dragHandler !== null) {
				e.stopPropagation();
				e.preventDefault();
				
				if (e.buttons === 1) {
					core.dragHandler.move(e);
				}
				else {
					let dragHandler = core.dragHandler;
					core.dragHandler = null;
					
					if (dragHandler.release != null) {
						dragHandler.release(e);
					}
				}
			}
		}, true);
		
		document.documentElement.addEventListener('mouseup', function (e) {
			if (core.dragHandler !== null) {
				e.stopPropagation();
				e.preventDefault();
				let dragHandler = core.dragHandler;
				core.dragHandler = null;
				
				if (dragHandler.release != null) {
					dragHandler.release(e);
				}
			}
		}, true);
		
		let stopCapture = function (e) {
			if (core.dragHandler !== null) {
				e.stopPropagation();
				e.preventDefault();
			}
		};
		
		document.documentElement.addEventListener('mouseenter', stopCapture, true);
		document.documentElement.addEventListener('mouseleave', stopCapture, true);
		document.documentElement.addEventListener('mouseover', stopCapture, true);
		document.documentElement.addEventListener('mouseout', stopCapture, true);
		
		$('.tab-container').each(function () {
			let callback = null;
			
			if (this.id === 'main-tab-container') {
				callback = function (tabRadio) {
					let tabId = tabRadio.id.replace(/^tab-/, '');
					core.setOption('tabId', tabId);
					
					if (!core.tabsUpdated.has(tabId) && Object.hasOwn(core.baseUtil, 'updateTab')) {
						core.baseUtil.updateTab(tabId, false);
					}
				};
			}
			
			util.initTabContainer(core, this, callback);
		});
		
		document.getElementById('file_select').addEventListener('change', function (e) {
			let confirmed = false;
			
			for (let extensionId of core.extensionIds) {
				let extension = core.extensions[extensionId];
				
				if (extension.hasUnsavedChanges && !confirmed) {
					if (!window.confirm('Discard unsaved changes?')) {
						e.stopImmediatePropagation();
						return;
					}
					
					confirmed = true;
				}
				
				extension.hasUnsavedChanges = false;
			}
		}, true);
		
		window.addEventListener('beforeunload', function (e) {
			for (let extensionId of core.extensionIds) {
				if (core.extensions[extensionId].hasUnsavedChanges) {
					e.preventDefault();
				}
			}
		});
		
		oldOnload.apply();
	});
};
