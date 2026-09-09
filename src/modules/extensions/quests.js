import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.quests;
	let baseUtil = core.baseUtil;
	let lib = this.lib;
	
	let demetriusFish = [
		['(O)129', '(O)131', '(O)136', '(O)137', '(O)142', '(O)143', '(O)145', '(O)147'],
		['(O)130', '(O)136', '(O)138', '(O)142', '(O)144', '(O)145', '(O)146', '(O)149', '(O)150'],
		['(O)129', '(O)131', '(O)136', '(O)137', '(O)139', '(O)142', '(O)143', '(O)150'],
		['(O)130', '(O)131', '(O)136', '(O)141', '(O)144', '(O)146', '(O)147', '(O)150', '(O)151'],
	];
	
	let willyFish = [
		['(O)129', '(O)131', '(O)136', '(O)137', '(O)142', '(O)143', '(O)145', '(O)147', '(O)702'],
		['(O)128', '(O)130', '(O)136', '(O)138', '(O)142', '(O)144', '(O)145', '(O)146', '(O)149', '(O)150', '(O)702'],
		['(O)129', '(O)131', '(O)136', '(O)137', '(O)139', '(O)142', '(O)143', '(O)150', '(O)699', '(O)702', '(O)705'],
		['(O)130', '(O)131', '(O)136', '(O)141', '(O)143', '(O)144', '(O)146', '(O)147', '(O)151', '(O)699', '(O)702', '(O)705'],
	];
	
	core.addDataFile('Data/Characters');
	core.addDataFile('Data/CookingRecipes');
	core.addDataFile('Data/Festivals/FestivalDates');
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		ext.cookingRecipes = [];
		ext.craftingRecipes = [];
		ext.activeQuests = [];
		ext.questTargets = [];
		
		if (xmlDoc == null) {
			return;
		}
		
		// See StardewValley.Quests.ItemDeliveryQuest:GetValidTargetList()
		
		let friendships = [];
		
		$(xmlDoc).find(':root > player > friendshipData > item').each(function () {
			let name = $(this).find('> key > string').first().text();
			
			if ($(this).find('> value > Friendship > RoommateMarriage').first().text() !== 'true') {
				friendships.push(name);
			}
		});
		
		let characters = core.content.Data.Characters;
		
		for (let name in characters) {
			if (Object.hasOwn(characters, name)) {
				let character = characters[name];
				
				if (character != null) {
					let canSocialize = false;
					
					// For simplicity, we'll just handle the specific condition strings
					// that exist in the data files, instead of using a full parser.
					
					switch (character.CanSocialize) {
					case 'FALSE':
						break;
					
					case 'PLAYER_HAS_SEEN_EVENT Any 67':
						break;
					
					case null:
						canSocialize = true;
						break;
					}
					
					if (
						checkConditions(character.CanSocialize) &&
						((character.ItemDeliveryQuests == null) ? (character.HomeRegion === 'Town') : checkConditions(character.ItemDeliveryQuests)) &&
						friendships.includes(name) &&
						character.Age !== 'Child'
					) {
						ext.questTargets.push(name);
					}
				}
			}
		}
		
		$(xmlDoc).find(':root > player > cookingRecipes > item > key > string').each(function () {
			ext.cookingRecipes.push($(this).text());
		});
		
		$(xmlDoc).find(':root > player > craftingRecipes > item > key > string').each(function () {
			ext.craftingRecipes.push($(this).text());
		});
		
		$(xmlDoc).find(':root > player > questLog > Quest').each(function () {
			if ($(this).find('> completed').first().text() === 'true') {
				return;
			}
			
			let questType = this.getAttributeNS(util.ns.xsi, 'type');
			
			let quest = {
				title: $(this).find('> questTitle').first().text(),
				daysLeft: +$(this).find('> daysLeft').first().text(),
			};
			
			$(this).find('> item, > resource, > whichFish').each(function () {
				let item = util.parseItemId($(this).text());
				quest.itemType = item[0];
				quest.itemId = item[1];
			});
			
			$(this).find('> number, > numberToKill, > numberToFish').each(function () {
				quest.stack = +$(this).text();
			});
			
			$(this).find('> moneyReward, > reward').each(function () {
				quest.reward = +$(this).text();
				
				if (quest.reward <= 0) {
					switch (questType) {
					case 'ItemDeliveryQuest':
						if (quest.itemType === 'O') {
							quest.reward = core.content.Data.Objects[quest.itemId].Price * 3;
						}
						
						// TODO: For non-objects, we should calculate from the sale price. See StardewValley.Quests/ItemDeliveryQuest.cs:GetGoldRewardPerItem().
						
						break;
					}
				}
			});
			
			quest.target = $(this).find('> target').first().text();
			
			switch (+$(this).find('> questType').first().text()) {
			case 3:
				quest.title = 'Item delivery';
				break;
			
			case 4:
				quest.title = 'Slay ' + util.wikify($(this).find('> monsterName').first().text());
				quest.verb = 'Slay';
				break;
			
			case 5:
				quest.title = 'Socialize'; // TODO
				break;
			
			case 7:
				quest.title = 'Fishing';
				quest.verb = 'Catch';
				break;
			
			case 10:
				quest.title = 'Resource collection';
				quest.verb = 'Gather';
				break;
			}
			
			ext.activeQuests.push(quest);
		});
	});
	
	core.addTodaySummaryWriter('quests.active', 'Active Quest', function () {
		let output = '';
		
		for (let quest of ext.activeQuests) {
			if (quest.daysLeft > 0) {
				output += `<span class="result">Active: ${lib.getQuestHTML(quest)}</span><br>`;
			}
		}
		
		return output;
	}, 500);
	
	core.addTodaySummaryWriter('quests.helpWanted', 'Help Wanted', function () {
		let output = '';
		let quest = lib.getQuestOfTheDay();
		
		if (quest !== null) {
			output += `<span class="result">Help Wanted: ${lib.getQuestHTML(quest)}</span><br>`;
		}
		
		return output;
	}, 500);
	
	let checkConditions = function (queryString) {
		// See StardewValley.GameStateQuery:CheckConditions()
		
		if (queryString == null || queryString.length === 0 && queryString === 'TRUE') {
			return true;
		}
		
		if (queryString === 'FALSE') {
			return false;
		}
		
		// For simplicity, we'll just handle the specific condition strings
		// that exist in the data files, instead of using a full parser.
		
		switch (queryString) {
		case 'PLAYER_HAS_SEEN_EVENT Any 67': {
			if (!common.farmers.some(function (farmer) {
				return farmer.eventsSeen.has('67');
			})) {
				return false;
			}
			
			break;
		}}
		
		return true;
	};
	
	lib.getQuestHTML = function (quest, mode = null) {
		// Modes: imageLink, image, link, text, plainText
		
		let name = quest.title;
		mode ??= 'imageLink';
		
		if (quest.itemType != null) {
			name = core.getItemHTML(quest.itemType, quest.itemId, mode, quest.stack, quest.quality);
			
			if (quest.verb != null) {
				name = `${quest.verb} ${name}`;
			}
		}
		else if (quest.stack != null && quest.stack !== 1) {
			name += ` (${quest.stack})`;
		}
		
		if (quest.target != null) {
			name += (quest.verb == null ? ' to ' : ' for ');
			
			if (mode === 'link' || mode === 'imageLink') {
				name += util.wikify(quest.target);
			}
			else {
				name += (mode === 'plainText') ? quest.target : util.escapeHTML(quest.target);
			}
		}
		
		if (quest.reward != null && quest.reward !== 0) {
			name += ` - ${quest.reward} gold`;
		}
		
		if (quest.daysLeft === 1) {
			name += ' (due today)';
		}
		else if (quest.daysLeft === 2) {
			name += ' (due tomorrow)';
		}
		else if (quest.daysLeft > 0) {
			name += ` (days left: ${quest.daysLeft - 1})`;
		}
		
		return name;
	};
	
	lib.getQuestOfTheDay = function (gameState = null) {
		gameState ??= {
			daysOfMonth: common.dayOfMonth,
			jojaMember: common.player.mailReceived.has('JojaMember'),
			seasonNumber: common.seasonNumber,
			year: common.year,
		};
		let daysPlayed = util.daysPlayed(gameState);
		
		if (daysPlayed <= 1) {
			return null;
		}
		
		let festivalDates = core.content.Data.Festivals.FestivalDates;
		let currentSeason = util.getSeasonName(gameState.seasonNumber);
		
		if (festivalDates[currentSeason + gameState.dayOfMonth] != null || festivalDates[currentSeason + (gameState.dayOfMonth + 1)] != null) {
			return null;
		}
		
		let value = core.createSpecificDaySaveRandom(daysPlayed, 100, daysPlayed * 777).NextDouble();
		
		if (value < .08) {
			return getResourceCollectionQuest(gameState);
		}
		
		if (value < .2 && save.deepestMineLevel > 1 && daysPlayed > 5) {
			return getSlayMonsterQuest(gameState);
		}
		
		if (value < .5) {
			return null;
		}
		
		if (value < .6) {
			return getFishingQuest(gameState);
		}
		
		/*
		if (value < .66 && save.daysPlayed % 7 === 1) {
			// Socialize quest logic would be here (multiplayer only).
		}
		*/
		
		return getItemDeliveryQuest(gameState);
	};
	
	let getResourceCollectionQuest = function (gameState) {
		let daysPlayed = util.daysPlayed(gameState);
		let rng = createQuestRandom(daysPlayed);
		let randomResource = rng.Next(6) * 2;
		
		for (let i = 0; i < rng.Next(1, 100); ++i) {
			rng.Next();
		}
		
		let quest = {
			title: 'Resource collection',
			verb: 'Gather',
		};
		
		switch (randomResource) {
		case 0:
			quest.itemType = 'O';
			quest.itemId = '378';
			quest.stack = 20 + common.player.miningLevel * 2 + rng.Next(-2, 4) * 2;
			quest.reward = quest.stack * 10;
			quest.stack -= quest.stack % 5;
			quest.target = 'Clint';
			break;
		
		case 2:
			quest.itemType = 'O';
			quest.itemId = '380';
			quest.stack = 15 + common.player.miningLevel + rng.Next(-1, 3) * 2;
			quest.reward = quest.stack * 15;
			quest.stack = Math.floor(quest.stack * .75);
			quest.stack -= quest.stack % 5;
			quest.target = 'Clint';
			break;
		
		case 4:
			quest.itemType = 'O';
			quest.itemId = '382';
			quest.stack = 10 + common.player.miningLevel + rng.Next(-1, 3) * 2;
			quest.reward = quest.stack * 25;
			quest.stack = Math.floor(quest.stack * .75);
			quest.stack -= quest.stack % 5;
			quest.target = 'Clint';
			break;
		
		case 6:
			quest.itemType = 'O';
			quest.itemId = save.deepestMineLevel > 40 ? '384' : '378';
			quest.stack = 8 + Math.floor(common.player.miningLevel / 2) + rng.Next(-1, 1) * 2;
			quest.reward = quest.stack * 30;
			quest.stack = Math.floor(quest.stack * .75);
			quest.stack -= quest.stack % 2;
			quest.target = 'Clint';
			break;
		
		case 8:
			quest.itemType = 'O';
			quest.itemId = '388';
			quest.stack = 25 + common.player.foragingLevel + rng.Next(-3, 3) * 2;
			quest.stack -= quest.stack % 5;
			quest.reward = quest.stack * 8;
			quest.target = 'Robin';
			break;
		
		default:
			quest.itemType = 'O';
			quest.itemId = '390';
			quest.stack = 25 + common.player.miningLevel + rng.Next(-3, 3) * 2;
			quest.stack -= quest.stack % 5;
			quest.reward = quest.stack * 8;
			quest.target = 'Robin';
			break;
		}
		
		return quest;
	};
	
	let getSlayMonsterQuest = function (gameState) {
		let daysPlayed = util.daysPlayed(gameState);
		let rng = createQuestRandom(daysPlayed);
		
		for (let i = 0; i < rng.Next(1, 100); ++i) {
			rng.Next();
		}
		
		let possibleMonsters = [];
		let level = save.deepestMineLevel;
		
		if (level < 39) {
			possibleMonsters.push('Green Slime');
			
			if (level > 10) {
				possibleMonsters.push('Rock Crab');
			}
			
			if (level > 30) {
				possibleMonsters.push('Duggy');
			}
		}
		else if (level < 79) {
			possibleMonsters.push('Frost Jelly');
			
			if (level > 70) {
				possibleMonsters.push('Skeleton');
			}
			
			possibleMonsters.push('Dust Spirit');
		}
		else {
			possibleMonsters.push('Sludge');
			possibleMonsters.push('Ghost');
			possibleMonsters.push('Lava Crab');
			possibleMonsters.push('Squid Kid');
		}
		
		let monsterName = possibleMonsters[rng.Next(0, possibleMonsters.length)];
		let quest = {
			title: `Slay ${util.wikify(monsterName)}`,
			verb: 'Slay',
		};
		
		switch (monsterName) {
		case 'Green Slime':
			quest.stack = rng.Next(4, 11);
			quest.stack -= quest.stack % 2;
			quest.reward = quest.stack * 60;
			quest.target = 'Lewis';
			break;
		
		case 'Rock Crab':
			quest.stack = rng.Next(2, 6);
			quest.reward = quest.stack * 75;
			quest.target = 'Demetrius';
			break;
		
		case 'Duggy':
			quest.stack = rng.Next(2, 4);
			quest.reward = quest.stack * 150;
			break;
		
		case 'Frost Jelly':
			quest.stack = rng.Next(4, 11);
			quest.stack -= quest.stack % 2;
			quest.reward = quest.stack * 85;
			quest.target = 'Lewis';
			break;
		
		case 'Ghost':
			quest.stack = rng.Next(2, 4);
			quest.reward = quest.stack * 250;
			break;
		
		case 'Sludge':
			quest.stack = rng.Next(4, 11);
			quest.stack -= quest.stack % 2;
			quest.reward = quest.stack * 125;
			quest.target = 'Lewis';
			break;
		
		case 'Lava Crab':
			quest.stack = rng.Next(2, 6);
			quest.reward = quest.stack * 180;
			quest.target = 'Demetrius';
			break;
		
		case 'Squid Kid':
			quest.stack = rng.Next(1, 3);
			quest.reward = quest.stack * 350;
			break;
		
		case 'Skeleton':
			quest.stack = rng.Next(6, 12);
			quest.reward = quest.stack * 100;
			break;
		
		case 'Dust Spirit':
			quest.stack = rng.Next(10, 21);
			quest.reward = quest.stack * 60;
			break;
		
		default:
			quest.stack = rng.Next(3, 7);
			quest.reward = quest.stack * 120;
			break;
		}
		
		if (quest.target == null) {
			if (!common.player.mailReceived.has('wizardJunimoNote') && !gameState.jojaMember) {
				quest.target = 'Lewis';
			}
			else {
				quest.target = 'Wizard';
			}
		}
		
		return quest;
	};
	
	let getFishingQuest = function (gameState) {
		let daysPlayed = util.daysPlayed(gameState);
		let rng = createQuestRandom(daysPlayed);
		let quest = {
			title: 'Fishing',
			verb: 'Catch',
		};
		let choices;
		
		if (util.nextBool(rng)) {
			choices = demetriusFish;
			quest.target = 'Demetrius';
		}
		else {
			choices = willyFish;
			quest.target = 'Willy';
		}
		
		let item = util.parseItemId(util.choose(rng, choices[gameState.seasonNumber]));
		quest.itemType = item[0];
		quest.itemId = item[1];
		let rewardPerFish = core.content.Data.Objects[quest.itemId].Price;
		quest.stack = Math.floor(Math.ceil(90 / Math.max(1, rewardPerFish)) + common.player.fishingLevel / 5);
		quest.reward = quest.stack * rewardPerFish;
		return quest;
	};
	
	let getItemDeliveryQuest = function (gameState) {
		if (ext.questTargets.length === 0) {
			return null;
		}
		
		let daysPlayed = util.daysPlayed(gameState);
		let rng = createQuestRandom(daysPlayed);
		
		let quest = {
			title: 'Item delivery',
			target: util.choose(rng, ext.questTargets),
		};
		
		if (quest.target === 'Wizard' && !common.player.mailReceived.has('wizardJunimoNote') && !gameState.jojaMember) {
			quest.target = 'Demetrius';
		}
		
		if (gameState.seasonNumber !== 3 && rng.NextDouble() < .15) {
			// Crop.
			
			quest.title = 'Crop delivery';
			quest.itemId = util.choose(rng, getSeasonCrops(gameState));
			quest.itemType = core.items.getItemType(quest.itemId);
		}
		else {
			// Item.
			
			quest.itemId = getRandomItem(gameState);
			
			if (quest.itemId === '-5') {
				quest.itemType = 'O';
				quest.itemId = '176';
			}
			else if (quest.itemId === '-6') {
				quest.itemType = 'O';
				quest.itemId = '184';
			}
			else {
				quest.itemType = core.items.getItemType(quest.itemId);
			}
		}
		
		let item = core.items.get(quest.itemType, quest.itemId);
		
		if (item.itemType === 'O' && !item.isError) {
			quest.reward = item.data.Price * 3;
		}
		else {
			quest.reward = -1;
		}
		
		return quest;
	};
	
	let createQuestRandom = function (daysPlayed) {
		return new CSRandom(baseUtil.getRandomSeed(save.gameID, daysPlayed));
	};
	
	let getSeasonCrops = function (gameState) {
		let daysPlayed = util.daysPlayed(gameState);
		let season = Math.floor((daysPlayed - 1) / 28) % 4;
		let year = Math.floor((daysPlayed - 1) / 112) + 1;
		let firstWeek = ((daysPlayed - 1) % 28 < 7);
		let hasCCVault = common.player.mailReceived.has('ccVault');
		
		let earlyCrops = [];
		let lateCrops = [];
		
		switch (season) {
		case 0:
			earlyCrops.push('24', '192');
			lateCrops.push('190', '188');
			
			if (year > 1) {
				earlyCrops.push('250');
			}
			
			if (hasCCVault) {
				earlyCrops.push('248');
				lateCrops.push('252');
			}
			
			break;
		
		case 1:
			earlyCrops.push('264', '262', '260');
			lateCrops.push('254', '256');
			
			if (year > 1) {
				earlyCrops.push('266');
			}
			
			if (hasCCVault) {
				lateCrops.push('258', '268');
			}
			
			break;
		
		case 2:
			earlyCrops.push('272', '278');
			lateCrops.push('270', '276', '280');
			
			if (year > 1) {
				lateCrops.push('274');
			}
			
			if (hasCCVault) {
				earlyCrops.push('284');
				lateCrops.push('282');
			}
			
			break;
		}
		
		if (firstWeek) {
			return earlyCrops;
		}
		
		lateCrops.push(...earlyCrops);
		return lateCrops;
	};
	
	let getRandomItem = function (gameState) {
		let daysPlayed = util.daysPlayed(gameState);
		let rng = new CSRandom(baseUtil.getRandomSeed(save.gameID, daysPlayed, 1000));
		let season = Math.floor((daysPlayed - 1) / 28) % 4;
		let items = ['68', '66', '78', '80', '86', '152', '167', '153', '420'];
		
		if (save.deepestMineLevel > 40) {
			items.push('62', '70', '72', '84', '422');
		}
		
		if (save.deepestMineLevel > 80) {
			items.push('64', '60', '82');
		}
		
		if (common.player.mailReceived.has('ccVault')) {
			items.push('88', '90', '164', '165');
		}
		
		if (ext.craftingRecipes.includes('Furnace')) {
			items.push('334', '335', '336', '338');
		}
		
		if (ext.craftingRecipes.includes('Quartz Globe')) {
			items.push('339');
		}
		
		switch (season) {
		case 0:
			items.push('16', '18', '20', '22', '129', '131', '132', '136', '137', '142', '143', '145', '147', '148', '152', '167', '267');
			break;
		
		case 1:
			items.push('128', '130', '132', '136', '138', '142', '144', '145', '146', '149', '150', '155', '396', '398', '402', '267');
			break;
		
		case 2:
			items.push('404', '406', '408', '410', '129', '131', '132', '136', '137', '139', '140', '142', '143', '148', '150', '154', '155', '269');
			break;
		
		case 3:
			items.push('412', '414', '416', '418', '130', '131', '132', '136', '140', '141', '144', '146', '147', '150', '151', '154', '269');
			break;
		}
		
		for (let dish of ext.cookingRecipes) {
			if (rng.NextDouble() < .4) {
				continue;
			}
			
			let recipe = core.content.Data.CookingRecipes[dish];
			
			if (recipe == null) {
				continue;
			}
			
			let fields = recipe.split('/');
			let ingredients = fields[0].trim().split(/\s+/);
			let crops = getSeasonCrops(gameState);
			let ingredientsAvailable = true;
			
			for (let i = 0; i < ingredients.length; ++i) {
				let ingredient = ingredients[i];
				
				if (!items.includes(ingredient)) {
					if (ingredient.substring(0, 1) !== '-' || ingredient === '-5' || ingredient === '-6') {
						if (!crops.includes(ingredient)) {
							ingredientsAvailable = false;
							break;
						}
					}
				}
			}
			
			if (ingredientsAvailable) {
				items.push(fields[2]);
			}
		}
		
		return util.choose(rng, items);
	};
};
