import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.friendship;
	let baseUtil = core.baseUtil;
	let lib = extension.lib;
	
	core.addDataFile('Data/Characters');
	core.addDataFile('Data/mail');
	core.addDataFile('Data/NPCGiftTastes');
	
	const TIER_LOVE = 0;
	const TIER_LIKE = 1;
	const TIER_NEUTRAL = 2;
	const TIER_DISLIKE = 3;
	const TIER_HATE = 4;
	
	let universalTierKeys = [
		'Universal_Love',
		'Universal_Like',
		'Universal_Neutral',
		'Universal_Dislike',
		'Universal_Hate',
	];
	
	let tierNames = [
		'Loves',
		'Likes',
		'Neutrals',
		'Dislikes',
		'Hates',
	];
	
	let tierOrder = [0, 4, 1, 3, 2];
	
	core.addPageInitializer(function () {
		let giftTasteData = core.content.Data.NPCGiftTastes;
		lib.universals = [];
		lib.universalTastes = [];
		
		for (let i = 0; i < universalTierKeys.length; ++i) {
			let tierGifts = new Set();
			lib.universals.push(tierGifts);
			lib.universalTastes.push([]);
			
			for (let gift of giftTasteData[universalTierKeys[i]].trim().split(/\s+/)) {
				if (gift !== '') {
					tierGifts.add(gift);
				}
			}
		}
		
		// Catalog the universal tastes.
		
		let itemLists = [
			core.content.Data.Objects,
			core.content.Data.Trinkets,
		];
		
		for (let items of itemLists) {
			for (let itemId in items) {
				if (!Object.hasOwn(items, itemId)) {
					continue;
				}
				
				let taste = TIER_NEUTRAL;
				let item = items[itemId];
				let specificUniversal = false;
				let skipDefaultValueRules = false;
				let category = (item.Category ?? '') + '';
				
				for (let tier of tierOrder) {
					if (tier !== TIER_NEUTRAL && lib.universals[tier].has(category)) {
						taste = tier;
						break;
					}
				}
				
				if (item.ContextTags != null) {
					tierLoop: for (let tier of tierOrder) {
						if (tier !== TIER_NEUTRAL) {
							for (let contextTag of item.ContextTags) {
								if (lib.universals[tier].has(contextTag)) {
									taste = tier;
									break tierLoop;
								}
							}
						}
					}
				}
				
				for (let tier of tierOrder) {
					if (lib.universals[tier].has(itemId)) {
						taste = tier;
						specificUniversal = true;
						
						if (tier === TIER_NEUTRAL) {
							skipDefaultValueRules = true;
						}
					}
				}
				
				if (taste === TIER_NEUTRAL && !skipDefaultValueRules) {
					if (item.Edibility !== -300 && item.Edibility < 0) {
						taste = TIER_HATE;
					}
					else {
						taste = TIER_DISLIKE;
					}
				}
				
				lib.universalTastes[taste].push(itemId);
			}
		}
		
		// Catalog the character-specific tastes.
		
		lib.characterTastes = {};
		
		for (let name in giftTasteData) {
			if (!Object.hasOwn(giftTasteData, name)) {
				continue;
			}
			
			let tasteData = giftTasteData[name].split('/');
			let tastes = [];
			
			for (let i = 1; i < tasteData.length; i += 2) {
				let tierGifts = new Set();
				tastes.push(tierGifts);
				
				for (let gift of tasteData[i].trim().split(/\s+/)) {
					if (gift !== '') {
						tierGifts.add(gift);
					}
				}
			}
			
			while (tastes.length < lib.universals.length) {
				tastes.push(new Set());
			}
			
			let fullTastes = [];
			lib.characterTastes[name] = fullTastes;
			
			for (let i = 0; i < lib.universals.length; ++i) {
				fullTastes.push({
					personal: [],
					universal: [],
				});
			}
			
			for (let items of itemLists) {
				for (let itemId in items) {
					if (!Object.hasOwn(items, itemId)) {
						continue;
					}
					
					// See StardewValley.NPC:getGiftTasteForThisItem()
					
					let taste = TIER_NEUTRAL;
					let isPersonal = false;
					
					determineGiftTier: do {
						let item = items[itemId];
						
						for (let tier of tierOrder) {
							if (tastes[tier].has(itemId)) {
								taste = tier;
								isPersonal = true;
								break determineGiftTier;
							}
						}
						
						if (item.ContextTags != null) {
							for (let tier of tierOrder) {
								for (let contextTag of item.ContextTags) {
									if (tastes[tier].has(contextTag)) {
										taste = tier;
										isPersonal = true;
										break determineGiftTier;
									}
								}
							}
						}
						
						let specificUniversal = false;
						let skipDefaultValueRules = false;
						let category = (item.Category ?? '') + '';
						
						for (let tier of tierOrder) {
							if (tier !== TIER_NEUTRAL && lib.universals[tier].has(category)) {
								taste = tier;
								break;
							}
						}
						
						if (item.ContextTags != null) {
							tierLoop: for (let tier of tierOrder) {
								if (tier !== TIER_NEUTRAL) {
									for (let contextTag of item.ContextTags) {
										if (lib.universals[tier].has(contextTag)) {
											taste = tier;
											break tierLoop;
										}
									}
								}
							}
						}
						
						for (let tier of tierOrder) {
							if (lib.universals[tier].has(itemId)) {
								taste = tier;
								specificUniversal = true;
								
								if (tier === TIER_NEUTRAL) {
									skipDefaultValueRules = true;
								}
							}
						}
						
						if (item.Type === 'Arch') {
							taste = (['Penny', 'Dwarf'].includes(name) ? TIER_LIKE : TIER_DISLIKE);
						}
						
						if (taste === TIER_NEUTRAL && !skipDefaultValueRules) {
							if (item.Edibility !== -300 && item.Edibility < 0) {
								taste = TIER_HATE;
							}
							else {
								taste = TIER_DISLIKE;
							}
						}
						
						if (!specificUniversal) {
							for (let tier of tierOrder) {
								if (tastes[tier].has(category)) {
									taste = tier;
									isPersonal = true;
									break determineGiftTier;
								}
							}
						}
					}
					while (false);
					
					fullTastes[taste][isPersonal ? 'personal' : 'universal'].push(itemId);
				}
			}
		}
	});
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		ext.friendship = [];
		
		if (xmlDoc == null) {
			return;
		}
		
		let seenNames = new Set();
		
		$(xmlDoc).find(':root > player > friendshipData > item').each(function () {
			let $friendship = $(this).find('> value > Friendship');
			let name = $(this).find('> key > string').first().text();
			
			ext.friendship.push({
				name: name,
				points: +$friendship.find('> points').first().text(),
				giftsThisWeek: +$friendship.find('> giftsThisWeek').first().text(),
				status: +$friendship.find('> Status').first().text(),
				roommateMarriage: $friendship.find('> RoommateMarriage').first().text() === 'true',
				met: true,
			});
			seenNames.add(name);
		});
		
		let characters = core.content.Data.Characters;
		
		for (let name in characters) {
			if (Object.hasOwn(characters, name) && !seenNames.has(name) && characters[name].CanSocialize !== 'FALSE') {
				ext.friendship.push({
					name: name,
					points: 0,
					giftsThisWeek: 0,
					status: null,
					roommateMarriage: false,
					met: false,
				});
			}
		}
		
		ext.friendship.sort((a, b) => b.points - a.points);
	});
	
	core.addPredictor('friendship', 'Friendship', function (isSearch, offset, extra) {
		let output = '';
		output += '<table class="output"><thead><tr><th>Character</th><th>Hearts</th><th>Points</th><th>Gifts</th><th>Birthday</th><th>Loves</th>';
		
		if (core.isExtensionEnabled('inventories')) {
			output += '<th>Inventories</th>';
		}
		
		output += '<th>Mail</th></tr></thead>\n<tbody>';
		
		let characters = core.content.Data.Characters;
		
		for (let friendship of ext.friendship) {
			if (!Object.hasOwn(characters, friendship.name)) {
				continue;
			}
			
			let character = characters[friendship.name];
			
			if (character.CanSocialize === 'FALSE') {
				continue;
			}
			
			if (friendship.met) {
				output += '<tr>';
			}
			else {
				output += '<tr style="background: #eee;">';
			}
			
			// Character.
			
			let url = util.contentURI(`Characters/${character.TextureName ?? friendship.name}.png`);
			let portrait = `<span style="display: inline-block; background: url('${url}') 0 0 no-repeat; width: 16px; height: 24px; vertical-align: bottom;" title="${friendship.name}"></span> ${friendship.name}`;
			output += `<td style="white-space: nowrap;">${util.wikify('Love', friendship.name, portrait)}</td>`;
			
			// Hearts.
			
			output += '<td style="text-align: left; white-space: nowrap;">';
			let hearts = Math.floor(friendship.points / 250);
			let maxHearts = (friendship.status === 'Married') ? 14 : 10;
			let cursorsURL = util.contentURI(`${util.tx.mouseCursors}.png`);
			
			for (let i = 0; i < maxHearts; ++i) {
				if (i === 10) {
					output += '<br>';
				}
				
				output += `<span style="display: inline-block; width: 16px; height: 12px; vertical-align: bottom; image-rendering: pixelated;">`;
				
				if (hearts > i) {
					output += `<span style="display: block; background: url('${cursorsURL}') -211px -428px no-repeat; width: 7px; height: 6px; transform: scale(2, 2);"></span>`;
				}
				else if (i >= 8 && character.CanBeRomanced && !['Dating', 'Engaged', 'Married'].includes(friendship.status)) {
					output += `<span style="display: block; background: #826665; mask: url('${cursorsURL}') -211px -428px no-repeat; width: 7px; height: 6px; transform: scale(2, 2);"></span>`;
				}
				else {
					output += `<span style="display: block; background: url('${cursorsURL}') -218px -428px no-repeat; width: 7px; height: 6px; transform: scale(2, 2);"></span>`;
				}
				
				output += '</span>';
			}
			
			output += '</td>';
			
			// Points.
			
			output += `<td style="text-align: right;">${friendship.points}</td>`;
			
			// Gifts.
			
			output += `<td style="text-align: left; white-space: nowrap;"><span style="display: inline-block; background: url('${cursorsURL}') -229px -410px no-repeat; width: 14px; height: 14px; margin-right: 2px; vertical-align: middle;"></span>`;
			
			for (let i = 1; i >= 0; --i) {
				if (friendship.giftsThisWeek > i) {
					output += `<span style="display: inline-block; background: url('${cursorsURL}') -236px -425px no-repeat; width: 9px; height: 9px; margin-right: 2px; vertical-align: middle;"></span>`;
				}
				else {
					output += `<span style="display: inline-block; background: url('${cursorsURL}') -227px -425px no-repeat; width: 9px; height: 9px; margin-right: 2px; vertical-align: middle;"></span>`;
				}
			}
			
			output += '</td>';
			
			// Birthday.
			
			output += `<td>${character.BirthSeason} ${character.BirthDay}</td>`;
			
			// Loves.
			
			output += '<td style="text-align: left; vertical-align: top;">';
			
			for (let itemId of lib.characterTastes[friendship.name]?.[0]?.universal ?? lib.universalTastes[0]) {
				output += core.getItemHTML(core.items.getItemType(itemId), itemId, 'imageLink');
			}
			
			output += '<hr>';
			
			for (let itemId of lib.characterTastes[friendship.name]?.[0]?.personal ?? []) {
				output += core.getItemHTML(core.items.getItemType(itemId), itemId, 'imageLink');
			}
			
			output += '</td>';
			
			if (core.isExtensionEnabled('inventories')) {
				output += '<td style="text-align: left; vertical-align: top;">';
				
				let tasteGroups = [
					lib.characterTastes[friendship.name]?.[0]?.personal ?? [],
					lib.characterTastes[friendship.name]?.[0]?.universal ?? lib.universalTastes[0],
					lib.characterTastes[friendship.name]?.[1]?.personal ?? [],
					lib.characterTastes[friendship.name]?.[1]?.universal ?? lib.universalTastes[1],
				];
				
				for (let i = 0; i < tasteGroups.length; ++i) {
					if (i === 2) {
						output += '<hr>';
					}
					
					for (let itemId of tasteGroups[i]) {
						let itemType = core.items.getItemType(itemId);
						let count = core.extVars.inventories.itemCounts.get(`(${itemType})${itemId}`);
						
						if (count != null) {
							for (let quality = 0; quality <= 4; ++quality) {
								if (count[quality] > 0) {
									output += '<span style="display: inline-block; margin: 0 2px;">';
									output += core.getItemHTML(itemType, itemId, 'imageLink', count[quality], quality);
									output += '</span>';
								}
							}
						}
					}
				}
				
				output += '</td>';
			}
			
			// Mail.
			
			output += '<td>';
			
			let mailData = core.content.Data.mail[friendship.name];
			
			if (mailData != null) {
				for (let match of mailData.matchAll(/%item\s*(.*?)\s*%%/g)) {
					let args = match[1].split(/\s+/);
					
					switch (args[0]) {
					case 'id': {
						for (let i = 1; i < args.length; i += 2) {
							let parts = util.parseItemId(args[i]) ?? [core.items.getItemType(args[i]), args[i]];
							output += '<span style="display: inline-block; margin: 0 2px;">';
							output += core.getItemHTML(parts[0], parts[1], 'imageLink', +args[i + 1]);
							output += '</span>';
						}
						
						break;
					}
					case 'money': {
						let min = +args[1];
						let max = +(args[2] ?? args[1]) - 1;
						min -= min % 10;
						max -= max % 10;
						
						if (min === max) {
							output += core.getItemHTML('O', '-1', 'imageLink', min);
						}
						else {
							output += core.getItemHTML('O', '-1', 'imageLink', min) + ' - ';
							output += core.getItemHTML('O', '-1', 'imageLink', max);
						}
						
						break;
					}}
				}
			}
			
			output += '</td>';
			
			output += '</tr>';
			
			/*
			// Likes.
			
			output += '<tr><td colspan="3"></td><td style="text-align: left;">Likes: ';
			
			for (let itemId of lib.characterTastes[friendship.name][1].personal) {
				output += core.getItemHTML(core.items.getItemType(itemId), itemId, 'imageLink');
			}
			
			output += '<br><br>Universal Likes, except: ';
			
			for (let itemId of lib.universalTastes[1]) {
				if (
					!lib.characterTastes[friendship.name][1].universal.includes(itemId) &&
					!lib.characterTastes[friendship.name][0].personal.includes(itemId) &&
					!lib.characterTastes[friendship.name][0].universal.includes(itemId)
				) {
					output += core.getItemHTML(core.items.getItemType(itemId), itemId, 'imageLink');
				}
			}
			
			output += '</td></tr>';
			*/
		}
		
		output += '</tbody></table>';
		return output;
	});
};
