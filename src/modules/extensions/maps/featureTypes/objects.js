import Feature from '../classes/Feature.js';
import Sprite from '../classes/Sprite.js';

import * as mapsUtil from '../mapsUtil.js';
import * as util from '../../../util.js';

let itemNames = {
	'(BC)278': 'Cookout Kit',
	'(O)2': 'Diamond Node',
	'(O)4': 'Ruby Node',
	'(O)6': 'Jade Node',
	'(O)8': 'Amethyst Node',
	'(O)10': 'Topaz Node',
	'(O)12': 'Emerald Node',
	'(O)14': 'Aquamarine Node',
	'(O)25': 'Mussel Node',
	'(O)32': 'Earth Rock',
	'(O)34': 'Earth Rock',
	'(O)36': 'Earth Rock',
	'(O)38': 'Earth Rock',
	'(O)40': 'Earth Rock',
	'(O)42': 'Earth Rock',
	'(O)44': 'Gem Node',
	'(O)46': 'Mystic Node',
	'(O)48': 'Frozen Rock',
	'(O)50': 'Frozen Rock',
	'(O)52': 'Frozen Rock',
	'(O)54': 'Frozen Rock',
	'(O)56': 'Lava Rock',
	'(O)58': 'Lava Rock',
	'(O)75': 'Geode Node',
	'(O)76': 'Frozen Geode Node',
	'(O)77': 'Magma Geode Node',
	'(O)95': 'Radioactive Node',
	'(O)290': 'Iron Node',
	'(O)343': 'Rock',
	'(O)450': 'Rock',
	'(O)668': 'Stone Rock',
	'(O)670': 'Stone Rock',
	'(O)751': 'Copper Node',
	'(O)764': 'Gold Node',
	'(O)765': 'Iridium Node',
	'(O)792': 'Special Weeds',
	'(O)793': 'Special Weeds',
	'(O)794': 'Special Weeds',
	'(O)816': 'Bone Node',
	'(O)817': 'Bone Node',
	'(O)818': 'Clay Node',
	'(O)819': 'Omni Geode Node',
	'(O)843': 'Cinder Shard Node',
	'(O)844': 'Cinder Shard Node',
	'(O)845': 'Volcanic Rock',
	'(O)846': 'Volcanic Rock',
	'(O)847': 'Volcanic Rock',
	'(O)849': 'Copper Node',
	'(O)850': 'Iron Node',
	'(O)BasicCoalNode0': 'Coal Node',
	'(O)BasicCoalNode1': 'Coal Node',
	'(O)CalicoEggStone_0': 'Calico Egg Node',
	'(O)CalicoEggStone_1': 'Calico Egg Node',
	'(O)CalicoEggStone_2': 'Calico Egg Node',
	'(O)VolcanoCoalNode0': 'Coal Node',
	'(O)VolcanoCoalNode1': 'Coal Node',
	'(O)VolcanoGoldNode': 'Gold Node',
};

export let loadXML = function (locationElement, context) {
	let ext = context.core.extVars.maps;
	let lib = context.core.extensions.maps.lib;
	
	$(locationElement).find('> objects > item').each(function () {
		let tileX = +$(this).find('> key > Vector2 > X').first().text();
		let tileY = +$(this).find('> key > Vector2 > Y').first().text();
		
		$(this).find('> value > Object').first().each(function () {
			let feature = new Feature(
				'objects',
				tileX,
				tileY,
				util.getElementDetails(this)
			);
			context.features.push(feature);
			updateFeature(feature, context.location, context.core);
			
			if (feature.meta.artifactSpot) {
				ext.artifactSpots.push(feature.meta.artifactSpot);
			}
			
			if (feature.meta.forageable) {
				ext.forageables.push(feature.meta.forageable);
			}
		});
	});
};

export let syncDetails = function (feature, location, core) {
	feature.details.tileLocation ??= {};
	feature.details.tileLocation.X = feature.tileX + '';
	feature.details.tileLocation.Y = feature.tileY + '';
	
	switch (feature.details['@xsi:type']) {
	case 'IndoorPot':
		feature.details.TileLocation ??= {};
		feature.details.TileLocation.X = feature.tileX + '';
		feature.details.TileLocation.Y = feature.tileY + '';
		break;
	}
};

export let updateFeature = function (feature, location, core) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.maps;
	let baseUtil = core.baseUtil;
	let lib = core.extensions.maps.lib;
	
	let item = mapsUtil.getObjectItem(core, feature.details);
	
	feature.meta.name = itemNames[item.qualifiedItemId] ?? item.displayName;
	feature.meta.type = feature.details['@xsi:type'] ?? null;
	feature.meta.item = item;
	feature.meta.passable = lib.itemIsPassable(item);
	
	switch (item.itemType) {
	case 'BC':
		if (item.itemId === '10') {
			feature.meta.domainType = 'beeHouse';
			feature.meta.domainSize = 5;
		}
		else if (item.name.includes('arecrow')) {
			feature.meta.domainType = 'scarecrow';
			feature.meta.domainSize = (item.name.substring(0, 6) === 'Deluxe') ? 17 : 9;
		}
		
		break;
	
	case 'O':
		switch (item.itemId) {
		case '590': { // Artifact spot.
			feature.meta.artifactSpot = {
				type: 'artifactSpot',
				locationName: location.name,
				x: feature.tileX,
				y: feature.tileY,
			};
			
			feature.meta.artifactSpot.drops = [
				determineArtifactDrops(core, location, feature.tileX, feature.tileY),
				determineArtifactDrops(core, location, feature.tileX, feature.tileY, 1),
				determineArtifactDrops(core, location, feature.tileX, feature.tileY, 2),
				determineArtifactDrops(core, location, feature.tileX, feature.tileY, 3),
				determineArtifactDrops(core, location, feature.tileX, feature.tileY, 4),
			];
			let dropNotes = [];
			
			for (let drop of feature.meta.artifactSpot.drops[0]) {
				dropNotes.push(mapsUtil.getDropHTML(core, drop, 'plainText'));
			}
			
			feature.meta.domainType = 'artifactSpot';
			feature.addNote(dropNotes.join(', '));
			break;
		}
		case '599': // Sprinkler
			feature.meta.domainType = 'sprinkler';
			break;
		
		case '621': // Quality Sprinkler
			feature.meta.domainType = 'sprinkler';
			feature.meta.domainSize = 1;
			break;
		
		case '645': // Iridium Sprinkler
			feature.meta.domainType = 'sprinkler';
			feature.meta.domainSize = 2;
			break;
		
		case 'SeedSpot': { // Seed Spot.
			feature.meta.name = 'Seed Spot';
			feature.meta.artifactSpot = {
				type: 'seedSpot',
				locationName: location.name,
				x: feature.tileX,
				y: feature.tileY,
			};
			
			feature.meta.artifactSpot.drops = [
				determineSeedSpotDrops(core, location, feature.tileX, feature.tileY),
				determineSeedSpotDrops(core, location, feature.tileX, feature.tileY, 1),
				determineSeedSpotDrops(core, location, feature.tileX, feature.tileY, 2),
				determineSeedSpotDrops(core, location, feature.tileX, feature.tileY, 3),
				determineSeedSpotDrops(core, location, feature.tileX, feature.tileY, 4),
			];
			let dropNotes = [];
			
			for (let drop of feature.meta.artifactSpot.drops[0]) {
				dropNotes.push(mapsUtil.getDropHTML(core, drop, 'plainText'));
			}
			
			feature.meta.domainType = 'artifactSpot';
			feature.addNote(dropNotes.join(', '));
			break;
		}}
		
		break;
	}
	
	let heldItem = mapsUtil.getObjectItem(core, util.rootDetails(feature.details, 'heldObject'));
	
	if (feature.meta.domainType === 'sprinkler' && heldItem != null && heldItem.qualifiedItemId === '(O)915') {
		++feature.meta.domainSize;
	}
	
	if (feature.details.isSpawnedObject === 'true') {
		let isForage = ([-79, -81, -80, -75, -23].includes(item.category) || util.hasContextTag(item, 'forage_item') || item.qualifiedItemId === '(O)430');
		
		let drops = [];
		let stack = +feature.details.stack;
		let quality = +feature.details.quality;
		
		if (isForage) {
			let qualities = [];
			let daysPlayed = util.daysPlayed(location.gameState);
			let daysProjected = Math.min(
				7 - daysPlayed % 7, // Despawn Sunday morning.
				28 - (daysPlayed - 1) % 28, // Despawn at the start of the month.
				5 // Limit 5.
			);
			
			for (let i = 0; i < daysProjected; ++i) {
				let rng = core.createSpecificDaySaveRandom(daysPlayed + i, feature.tileX, feature.tileY * 777);
				let dropQuality = quality;
			
				if (common.player.professions.has(16)) {
					dropQuality = 4;
				}
				else if (rng.NextDouble() < common.player.foragingLevel / 30) {
					dropQuality = 2;
				}
				else if (rng.NextDouble() < common.player.foragingLevel / 15) {
					dropQuality = 1;
				}
				
				drops.push([{
					item: item,
					stack: stack,
					quality: dropQuality,
				}]);
				
				qualities.push(['_', 'S', 'G', '', '\u{1d5a8}'][dropQuality]);
			}
			
			feature.meta.domainType = 'forageable';
			let note = qualities.join(' → ');
			
			if (daysProjected < 5) {
				note += ' → (despawn)';
				drops.push(null);
			}
			
			feature.addNote(note);
		}
		else {
			drops.push([{
				item: item,
				stack: stack,
				quality: quality,
			}]);
		}
		
		feature.meta.forageable = {
			locationName: location.name,
			x: feature.tileX,
			y: feature.tileY,
			isWeekly: isForage,
			drops: drops,
		};
	}
	
	if (heldItem) {
		let heldStack = +feature.details.heldObject.stack;
		let heldQuality = +feature.details.heldObject.quality;
		
		if (feature.details.readyForHarvest === 'true') {
			feature.addNote(`holding ${util.getItemText(heldItem, heldStack, heldQuality, feature.details.heldObject.name)}`, Feature.NOTE_COMMA);
		}
		else {
			switch (feature.meta.type) {
			case 'Cask':
				let daysLeft = +feature.details.daysToMature;
				
				if (daysLeft > 0) {
					feature.addNote(`${daysLeft} days to improve from ${util.getItemText(heldItem, heldStack, heldQuality, feature.details.heldObject.name)}`, Feature.NOTE_COMMA);
				}
				else {
					feature.addNote(`holding ${util.getItemText(heldItem, heldStack, heldQuality, feature.details.heldObject.name)}`, Feature.NOTE_COMMA);
				}
				
				break;
			
			default: {
				let minutesUntilReady = +feature.details.minutesUntilReady;
				
				if (minutesUntilReady > 0) {
					let minutesLeft = minutesUntilReady;
					let daysLeft = Math.floor(minutesLeft / 1600);
					minutesLeft -= daysLeft * 1600;
					
					let note = `${daysLeft} days left`;
					
					if (minutesLeft !== 0) {
						let hoursLeft = Math.floor(minutesLeft / 60);
						minutesLeft -= hoursLeft * 60;
						let readyTime = ((hoursLeft + 6) % 24) + ':' + (minutesLeft + '').padStart(2, '0');
						note += ` @${readyTime}`;
					}
					
					note += ` for: ${util.getItemText(heldItem, heldStack, heldQuality, feature.details.heldObject.name)}`;
					feature.addNote(note, Feature.NOTE_PARENS);
				}
			}}
		}
	}
};

export let drawFeature = function (feature, location, core) {
	mapsUtil.drawObject(feature, location, core, feature.meta.item, feature.details, feature.tileX, feature.tileY);
};

export let determineArtifactDrops = function (core, location, x, y, dayOffset = 0) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.maps;
	
	// See StardewValley/GameLocation.cs:digUpArtifactSpot()
	
	let daysPlayed = util.daysPlayed(location.gameState);
	let rng = core.createSpecificDaySaveRandom(daysPlayed + dayOffset, x * 2000, y, save.treasureTotemsUsed * 777);
	let resultID = -1;
	let resultName = 'Unknown';
	let isUncertain = false;
	let possibleDrops = [];
	let drops = [];
	
	for (let drop of core.content.Data.Locations.Default.ArtifactSpots) {
		possibleDrops.push(drop);
	}
	
	for (let drop of location.data.ArtifactSpots ?? []) {
		possibleDrops.push(drop);
	}
	
	possibleDrops.sort(function (a, b) {
		return a.Precedence - b.Precedence;
	});
	
	if (common.player.mailReceived.has('sawQiPlane') && rng.NextDouble() < 0.05 + common.player.dailyLuck / 2.0) {
		drops.push([{
			item: core.items.get('O', 'MysteryBox'),
			stack: rng.Next(1, 2),
		}]);
	}
	
	// See StardewValley/Utility.cs:trySpawnRareObject()
	
	let luckMod = 1 + common.player.dailyLuck;
	
	if ((common.player.stats.mastery_0 ?? 0) !== 0 && rng.NextDouble() < 0.001 * 9.0 * luckMod) {
		drops.push([{
			item: core.items.get('O', 'GoldenAnimalCracker'),
		}]);
	}
	
	if (daysPlayed > 2 && rng.NextDouble() < 0.002 * 9.0) {
		// Non-deterministic random drop.
		
		drops.push([{
			name: 'Random Cosmetic Item',
		}]);
	}
	
	if (daysPlayed > 2 && rng.NextDouble() < 0.0006 * 9.0) {
		// Non-deterministic random drop.
		
		drops.push([{
			name: 'Random Skill Book',
		}]);
	}
	
	// See StardewValley/GameLocation.cs:digUpArtifactSpot() (continued)
	
	for (let drop of possibleDrops) {
		if (util.nextBool(rng, drop.Chance)) {
			if (!mapsUtil.checkConditions(core, drop.Condition, location, rng)) {
				continue;
			}
			
			// See StardewValley.Internal/ItemQueryResolver.cs:TryResolve()
			
			let args = drop.ItemId;
			
			if (drop.RandomItemId !== null && drop.RandomItemId.length > 0) {
				args = drop.RandomItemId[rng.Next(drop.RandomItemId.length)];
			}
			
			let results = [];
			let certain = true;
			let recurse = true;
			
			while (recurse && args != null && args != '') {
				recurse = false;
				let itemQuery;
				let splitIndex = args.indexOf(' ');
				
				if (splitIndex === -1) {
					itemQuery = args;
					args = ''
				}
				else {
					itemQuery = args.substring(0, splitIndex);
					args = args.substring(splitIndex + 1);
				}
				
				switch (itemQuery) {
				case 'LOST_BOOK_OR_ITEM': {
					if (common.lostBooksFound < 21) {
						results.push(['(O)102', 1]);
					}
					else {
						recurse = true;
					}
					
					break;
				}
				case 'RANDOM_ARTIFACT_FOR_DIG_SPOT': {
					let objects = core.content.Data.Objects;
					let chanceMultiplier = 1;
					
					// If the "inventories" extension is enabled, we'll look for any
					// hoes the player might have and apply the Archaelogist
					// enchantment if present. Otherwise, we'll assume the enchantment
					// isn't present.
					
					if (core.isExtensionEnabled('inventories')) {
						for (let tool of core.extVars.inventories.tools) {
							if (
								tool['@xsi:type'] === 'Hoe' &&
								tool['enchantments@xsi:type'] === 'ArchaeologistEnchantment' &&
								+tool.enchantments?.level > 0
							) {
								// Found a hoe with the Archaeologist enchantment. Assume we're using it.
								
								chanceMultiplier = 2;
							}
						}
					}
					
					for (let objectID in objects) {
						if (Object.hasOwn(objects, objectID)) {
							let object = objects[objectID];
							
							if (object.ArtifactSpotChances == null || object.Type !== 'Arch') {
								continue;
							}
							
							let chance = object.ArtifactSpotChances[location.name];
							
							if (chance != null && util.nextBool(rng, chanceMultiplier * chance)) {
								results.push(['(O)' + objectID, 1]);
								break;
							}
						}
					}
					
					break;
				}
				case 'SECRET_NOTE_OR_ITEM': {
					let journal = (location.getLocationContext() === 'Island');
					
					if (journal || common.player.mailReceived.has('HasMagnifyingGlass')) {
						// See StardewValley.GameLocation:tryToCreateUnseenSecretNote()
						
						let noteTypeIndex = journal ? 1 : 0;
						let totalSecretNoteCounts = [27, 11]; // From content/Data/SecretNotes.json
						let totalUnseen =
							totalSecretNoteCounts[noteTypeIndex] -
							ext.secretNotesSeenCounts[noteTypeIndex] -
							ext.inventorySecretNoteCounts[noteTypeIndex];
						
						if (totalUnseen > 0) {
							// Non-deterministic: This may or may not produce a secret note.
							
							let fractionRemaining = (totalUnseen - 1) / Math.max(1, totalSecretNoteCounts[noteTypeIndex] - 1);
							let chance = .12 + (.8 - .12) * fractionRemaining;
							results.push([['(O)79', '(O)842'][noteTypeIndex], chance]);
						}
					}
					
					recurse = true;
					break;
				}
				default:
					results.push([itemQuery, 1]);
				}
			}
			
			if (results.length == 0) {
				continue;
			}
			
			let possibilities = [];
			let chance = 1;
			
			for (let result of results) {
				// See StardewValley.Internal.ItemQueryResolver:ApplyItemFields()
				
				let item = core.items.get(result[0]);
				let stack = 1;
				
				if (!drop.IsRecipe) {
					if (drop.MinStack === -1 && drop.MaxStack === -1) {
						stack = 1;
					}
					else if (drop.MaxStack > 1) {
						let minStack = Math.max(drop.MinStack, 1);
						let maxStack = Math.max(drop.MaxStack, minStack);
						stack = rng.Next(minStack, maxStack + 1);
					}
					else if (drop.MinStack > 1) {
						stack = drop.MinStack;
					}
					
					// See Utility.ApplyQuantityModifiers()
					
					stack = mapsUtil.applyQuantityModifiers(core, stack, drop.StackModifiers, drop.StackModifierMode, location, rng);
				}
				
				let quality = (drop.Quality >= 0) ? drop.Quality : 0;
				quality = mapsUtil.applyQuantityModifiers(core, quality, drop.QualityModifiers, drop.QualityModifierMode, location, rng);
				
				possibilities.push({
					item: item,
					chance: chance * result[1],
					stack: stack,
					quality: quality,
				});
				chance *= (1 - result[1]);
			}
			
			if (chance > 0) {
				possibilities.push(null);
			}
			
			drops.push(possibilities);
			
			if (!drop.ContinueOnDrop) {
				break;
			}
		}
	}
	
	if (drops.length === 0) {
		drops.push([{
			name: 'Unknown',
		}]);
	}
	
	return drops;
};

export let determineSeedSpotDrops = function (core, location, x, y, dayOffset = 0) {
	let save = core.save;
	let common = core.common;
	
	let daysPlayed = util.daysPlayed(location.gameState);
	let rng = core.createSpecificDaySaveRandom(daysPlayed + dayOffset, x * -7, y * 777, save.treasureTotemsUsed * 777);
	let drops = [];
	
	if (common.player.stats.ArtifactSpotsDug > 1) {
		if (rng.NextDouble() < .008 + (common.player.mailReceived.has('DefenseBookDropped') ? .005 : (common.player.stats.ArtifactSpotsDug * .002))) {
			drops.push([{
				item: core.items.get('O', 'Book_Defense'),
			}]);
		}
	}
	
	let day = daysPlayed - 1 + dayOffset;
	let seasonNumber = Math.floor(day / 28) % 4;
	
	if (day % 28 >= (seasonNumber === 0 ? 23 : 20)) {
		seasonNumber = (seasonNumber + 1) % 4;
	}
	
	let drop = {
		item: core.items.get('O', ['CarrotSeeds', 'SummerSquashSeeds', 'BroccoliSeeds', 'PowdermelonSeeds'][seasonNumber]),
		stack: rng.Next(2, 4),
	};
	
	if (rng.NextDouble() < .1 + save.dailyLuck) {
		++drop.stack;
	}
	
	drops.push([drop]);
	return drops;
};
