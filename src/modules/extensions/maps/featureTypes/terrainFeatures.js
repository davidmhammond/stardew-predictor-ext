import Feature from '../classes/Feature.js';
import Sprite from '../classes/Sprite.js';

import * as mapsUtil from '../mapsUtil.js';
import * as util from '../../../util.js';

let pathTiles = [
	[0, 0], // none
	[0, 3], // N
	[1, 3], // E
	[1, 2], // NE
	[0, 1], // S
	[0, 2], // NS
	[1, 0], // SE
	[1, 1], // NSE
	[3, 3], // W
	[3, 2], // NW
	[2, 3], // EW
	[2, 2], // NEW
	[3, 0], // SW
	[3, 1], // NSW
	[2, 0], // SEW
	[2, 1], // NSEW
];

let staticVals = {
	Tree: {
		treeTopSourceRect: new util.Rect(0, 0, 48, 96),
		stumpSourceRect: new util.Rect(32, 96, 16, 32),
		shadowSourceRect: new util.Rect(663, 1011, 41, 30),
	}
};

export let loadXML = function (locationElement, context) {
	let ext = context.core.extVars.maps;
	let lib = context.core.extensions.maps.lib;
	
	$(locationElement).find('> terrainFeatures > item').each(function () {
		let tileX = +$(this).find('key > Vector2 > X').first().text();
		let tileY = +$(this).find('key > Vector2 > Y').first().text();
		
		$(this).find('> value > TerrainFeature').first().each(function () {
			let feature = new Feature(
				'terrainFeatures',
				tileX,
				tileY,
				util.getElementDetails(this)
			);
			context.features.push(feature);
			updateFeature(feature, context.location, context.core);
			
			if (feature.meta.dailyForageable) {
				ext.dailyForageables.push(feature.meta.dailyForageable);
			}
		});
	});
};

export let syncDetails = function (feature, location, core) {
};

export let updateFeature = function (feature, location, core) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.maps;
	let baseUtil = core.baseUtil;
	let lib = core.extensions.maps.lib;
	
	let daysPlayed = util.daysPlayed(location.gameState);
	feature.meta.type = feature.details['@xsi:type'] ?? null;
	
	switch (feature.meta.type) {
	case 'Flooring': {
		let data = core.content.Data.FloorsAndPaths[feature.details.whichFloor] ?? {};
		let item = core.items.resolve(data.ItemId);
		let pathKey = `FloorsAndPaths:${feature.details.whichFloor}`;
		feature.meta.name = item.displayName;
		feature.meta.item = item;
		feature.meta.passable = true;
		feature.meta.pathTypes = [pathKey];
		break;
	}
	case 'FruitTree': {
		// See StardewValley.TerrainFeatures.FruitTree.cs:draw()
		
		let data = core.content.Data.FruitTrees[feature.details.treeId] ?? {};
		feature.meta.name = core.localizer.parseText(data.DisplayName ?? 'Fruit') + ' Tree';
		feature.meta.domainType = 'fruitTree';
		feature.meta.domainSize = 1;
		
		if (+(feature.details.health ?? 10) <= -99) {
			feature.meta.passable = true;
		}
		
		if (+feature.details.growthStage < 4) {
			feature.addNote(`days left: ${+feature.details.daysUntilMature}`, Feature.NOTE_PARENS);
		}
		
		break;
	}
	case 'Grass': {
		feature.meta.name = 'Grass';
		feature.meta.passable = true;
		let grassType = +feature.details.grassType;
		
		if (grassType === 7) {
			feature.meta.name = 'Blue Grass';
		}
		
		break;
	}
	case 'HoeDirt': {
		let path = pathTiles[mapsUtil.getPathMask(lib.paths.HoeDirt, feature.tileX, feature.tileY) & 0x0f];
		feature.meta.name = 'Tilled Soil';
		feature.meta.passable = true;
		feature.meta.pathTypes = ['HoeDirt'];
		
		if (+feature.details.state === 1) {
			feature.meta.name += ' (Watered)';
			feature.meta.pathTypes.push('WateredHoeDirt');
			path = pathTiles[mapsUtil.getPathMask(lib.paths.WateredHoeDirt, feature.tileX, feature.tileY) & 0x0f];
		}
		
		if (feature.details.crop) {
			let crop = feature.details.crop;
			let cropData = core.content.Data.Crops[crop.seedIndex] ?? {};
			
			if (crop.forageCrop === 'true') {
				let forageCrop = crop.whichForageCrop;
				let itemId = null;
				let drops = [];
				
				switch (forageCrop) {
				case '1':
					itemId = '399';
					feature.meta.name = 'Spring Onion';
					break;
				
				case '2':
					itemId = '829';
					feature.meta.name = 'Ginger';
					break;
				
				default:
					feature.meta.name = 'Unknown Forage Crop ' + forageCrop;
					break;
				}
				
				let rng = core.createSpecificDaySaveRandom(daysPlayed, feature.tileX * 1000, feature.tileY * 2000);
				let quality = 0;
				
				if (common.player.professions.has(16)) {
					quality = 4;
				}
				else if (rng.NextDouble() < common.player.foragingLevel / 30) {
					quality = 2;
				}
				else if (rng.NextDouble() < common.player.foragingLevel / 15) {
					quality = 1;
				}
				
				feature.meta.item = core.items.get('O', itemId);
				drops.push([{
					item: feature.meta.item,
					stack: 1,
					quality: quality,
				}]);
				
				if (quality > 0) {
					feature.addNote(util.getQualityName(quality), Feature.NOTE_PARENS);
				}
				
				feature.meta.dailyForageable = {
					locationName: location.name,
					x: feature.tileX,
					y: feature.tileY,
					drops: drops,
				};
			}
			else {
				let override = crop.overrideHarvestItemId;
				
				if (override) {
					let parts = util.parseItemId(override);
					feature.meta.item = core.items.get(parts[0], parts[1]);
					feature.meta.name = feature.meta.item.displayName;
				}
				else {
					feature.meta.item = core.items.resolve(crop.indexOfHarvest);
					feature.meta.name = feature.meta.item.displayName;
				}
				
				let currentPhase = +crop.currentPhase;
				let dayOfCurrentPhase = +crop.dayOfCurrentPhase;
				let daysRemaining = 0;
				let phaseDays = [];
				
				if (crop.phaseDays) {
					for (let int of util.getDetailsMultiple(crop.phaseDays, 'int')) {
						phaseDays.push(+int.$);
					}
				}
				
				for (let i = phaseDays.length - 2; i >= currentPhase; --i) {
					daysRemaining += phaseDays[i];
				}
				
				daysRemaining -= dayOfCurrentPhase;
				
				if ((cropData.RegrowDays ?? -1) < 0) {
					daysRemaining = Math.max(daysRemaining, 0);
				}
				
				if (daysRemaining > 0) {
					feature.addNote(`days left: ${daysRemaining}`, Feature.NOTE_PARENS);
				}
				else if (daysRemaining < 0) {
					feature.addNote(`days to regrow: ${-daysRemaining}`, Feature.NOTE_PARENS);
				}
				else {
					feature.addNote('ready', Feature.NOTE_PARENS);
					//feature.types = ['harvest'];
					feature.meta.domainType = 'harvest';
				}
				
				let qualities = [];
				
				for (let i = daysRemaining; i < daysRemaining + 5; ++i) {
					let rng = new CSRandom(baseUtil.getRandomSeed(feature.tileX * 7, feature.tileY * 11, daysPlayed + i, save.gameID));
					let fertilizer = feature.details.fertilizer;
					let fertilizerQualityLevel = new Map([['368', 1], ['369', 2], ['919', 3]]).get(fertilizer) ?? 0;
					let goldChance = .2 * (common.player.farmingLevel / 10) + .2 * fertilizerQualityLevel * ((common.player.farmingLevel + 2) / 12) + .01;
					let silverChance = Math.min(.75, goldChance * 2);
					let quality = 0;
					
					if (fertilizerQualityLevel >= 3 && rng.NextDouble() < goldChance / 2) {
						quality = 4;
					}
					else if (rng.NextDouble() < goldChance) {
						quality = 2;
					}
					else if (rng.NextDouble() < silverChance || fertilizerQualityLevel >= 3) {
						quality = 1;
					}
					
					qualities.push(['_', 'S', 'G', '', '\u{1d5a8}'][quality]);
				}
				
				feature.addNote(qualities.join(' → '));
			}
		}
		
		break;
	}
	case 'Tree': {
		feature.meta.treeType = feature.details.treeType;
		feature.meta.name = {
			1: 'Oak Tree',
			2: 'Maple Tree',
			3: 'Pine Tree',
			6: 'Palm Tree', // Desert
			7: 'Mushroom Tree',
			8: 'Mahogany Tree',
			9: 'Palm Tree', // Island
			10: 'Green Rain Tree',
			11: 'Green Rain Tree',
			12: 'Green Rain Tree',
			13: 'Mystic Tree',
		}[feature.meta.treeType] ?? `Unknown tree #${feature.meta.treeType}`;
		
		let growthStage = +feature.details.growthStage;
		let meanDaysRemaining = (5 - growthStage) * 5; // (times 5 to divide by .2)
		let note = (growthStage === 0) ? 'seed' : `growth ${growthStage}/5`;
		note += `, avg. ${meanDaysRemaining} days left`;
		
		if (+(feature.details.health ?? 0) <= -99 || growthStage === 0) {
			feature.meta.passable = true;
		}
		
		if (growthStage >= 5 || growthStage < 0) {
			let hasMoss = (feature.details.hasMoss === 'true');
			
			if (feature.details.stump === 'true') {
				note = `stump${hasMoss ? ' mossy' : ''}`;
			}
			else {
				note = hasMoss ? 'mossy' : null;
			}
		}
		
		if (note !== null) {
			feature.addNote(note, Feature.NOTE_PARENS);
		}
		
		break;
	}}
};

export let drawFeature = function (feature, location, core) {
	let save = core.save;
	let baseUtil = core.baseUtil;
	let lib = core.extensions.maps.lib;
	
	let zTileX = feature.tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = feature.tileY + ((feature.index >= 0) ? 0 : 20);
	let flipEffect = (feature.details.flipped === 'true') ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE;
	let locationSeasonNumber = location.getSeasonNumber();
	let daysPlayed = util.daysPlayed(location.gameState);
	
	switch (feature.meta.type) {
	case 'Flooring': {
		let data = core.content.Data.FloorsAndPaths[feature.details.whichFloor] ?? {};
		let pathKey = `FloorsAndPaths:${feature.details.whichFloor}`;
		
		let pathMask = mapsUtil.getPathMask(lib.paths[pathKey], feature.tileX, feature.tileY);
		let texture = util.normalizeTexture(data[locationSeasonNumber === 3 ? 'WinterTexture' : 'Texture']);
		let corner = data[locationSeasonNumber === 3 ? 'WinterCorner' : 'Corner'];
		let path = pathTiles[pathMask & 0x0f];
		
		switch (data.ConnectType) {
		case 'CornerDecorated':
		case 'Default':
			if ((pathMask & 0x29) === 0x09) { // N, W, !NW
				feature.drawSprite(texture, [feature.tileX * 64, feature.tileY * 64], new util.Rect(64 - data.CornerSize + corner.X, 48 - data.CornerSize + corner.Y, data.CornerSize, data.CornerSize), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 2 + zTileX / 10000) / 20000);
			}
			
			if ((pathMask & 0x13) === 0x03) { // N, E, !NE
				feature.drawSprite(texture, [feature.tileX * 64 + 64 - data.CornerSize * 4, feature.tileY * 64], new util.Rect(16 + corner.X, 48 - data.CornerSize + corner.Y, data.CornerSize, data.CornerSize), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 2 + zTileX / 10000 + 1) / 20000);
			}
			
			if ((pathMask & 0x46) === 0x06) { // S, E, !SE
				feature.drawSprite(texture, [feature.tileX * 64 + 64 - data.CornerSize * 4, feature.tileY * 64 + (data.ConnectType === 'Default' ? 48 : 64 - data.CornerSize * 4)], new util.Rect(16 + corner.X, corner.Y, data.CornerSize, data.CornerSize), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 2 + zTileX / 10000) / 20000);
			}
			
			if ((pathMask & 0x8c) === 0x0c) { // S, W, !SW
				feature.drawSprite(texture, [feature.tileX * 64, feature.tileY * 64 + 64 - data.CornerSize * 4], new util.Rect(64 - data.CornerSize + corner.X, corner.Y, data.CornerSize, data.CornerSize), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 2 + zTileX / 10000) / 20000);
			}
			
			break;
		
		case 'Random':
			let pathList = [0, 6, 14, 12, 4, 7, 15, 13, 5, 3, 11, 9, 1, 2, 10, 8];
			path = pathTiles[pathList[feature.details.whichView ?? 0]];
			break;
		}
		
		switch (data.ShadowType) {
		case 'Square':
			feature.drawRect(new util.Rect(feature.tileX * 64 - 4, feature.tileY * 64 + 4, 64, 64), [0, 0, 0, 255 * .33], 0, null, 4, Sprite.EF_NONE, 0, {isShadow: true});
			break;
		
		case 'Contoured':
			feature.drawSprite(texture, [feature.tileX * 64 - 4, feature.tileY * 64 + 4], new util.Rect(corner.X + path[0] * 16, corner.Y + path[1] * 16, 16, 16), [0, 0, 0, 255 * .33], 0, null, 4, Sprite.EF_NONE, 1e-10, {isShadow: true});
			break;
		}
		
		feature.drawSprite(texture, [feature.tileX * 64, feature.tileY * 64], new util.Rect(corner.X + path[0] * 16, corner.Y + path[1] * 16, 16, 16), null, 0, null, 4, Sprite.EF_NONE, 1e-9);
		break;
	}
	case 'FruitTree': {
		// See StardewValley.TerrainFeatures.FruitTree.cs:draw()
		
		let data = core.content.Data.FruitTrees[feature.details.treeId] ?? {};
		let health = +(feature.details.health ?? 10);
		
		if (feature.details.greenHouseTileTree === 'true') {
			feature.drawSprite(util.tx.mouseCursors, [feature.tileX * 64, feature.tileY * 64], new util.Rect(669, 1957, 16, 16), null, 0, null, 4, Sprite.EF_NONE, 1e-8);
		}
		
		let growthStage = +feature.details.growthStage;
		let daysUntilMature = +feature.details.daysUntilMature;
		let texture = util.normalizeTexture(data.Texture) ?? 'TileSheets/fruitTrees';
		
		if (growthStage < 4) {
			// Immature tree.
			
			let positionOffset = Math.max(-4, Math.min(32, Math.sin(feature.tileX * 200 / (Math.PI * 2)) * -8));
			let sourceRect = new util.Rect(48 * Math.min(3, growthStage), data.TextureSpriteRow * 80, 48, 80);
			feature.drawSprite(texture, [feature.tileX * 64 + 32 + positionOffset, feature.tileY * 64 - sourceRect.height + 128 + positionOffset], sourceRect, null, 0, [24, 80], 4, flipEffect, (feature.tileY + 1) * 64 / 10000 - feature.tileX / 1000000);
		}
		else {
			// Mature tree.
			
			if (feature.details.stump !== 'true') {
				let cosmeticSeason = location.seedsIgnoreSeasonsHere() ? 1 : locationSeasonNumber;
				
				// Bottom.
				
				feature.drawSprite(texture, [feature.tileX * 64 + 32, feature.tileY * 64 + 64], new util.Rect((12 + cosmeticSeason * 3) * 16, data.TextureSpriteRow * 80 + 64, 48, 16), (+feature.details.struckByLightningCountdown > 0) ? util.namedColors.Gray : null, 0, [24, 16], 4, flipEffect, 1e-7);
				
				// Top.
				
				feature.drawSprite(texture, [feature.tileX * 64 + 32, feature.tileY * 64 + 64], new util.Rect((12 + cosmeticSeason * 3) * 16, data.TextureSpriteRow * 80, 48, 64), (+feature.details.struckByLightningCountdown > 0) ? util.namedColors.Gray : null, 0, [24, 80], 4, flipEffect, (feature.tileY + 1) * 64 / 10000 + .001 - feature.tileX / 1000000);
			}
			
			if (health > -99) {
				// Stump.
				
				let depthLayer = (feature.details.stump === 'true') ? ((feature.tileY + 1) * 64 / 10000) : ((feature.tileY + 1) * 64 / 10000 - .001 - feature.tileX / 1000000);
				feature.drawSprite(texture, [feature.tileX * 64 + 32, feature.tileY * 64 + 64], new util.Rect(384, data.TextureSpriteRow * 80 + 48, 48, 32), (+feature.details.struckByLightningCountdown > 0) ? util.namedColors.Gray : null, 0, [24, 32], 4, flipEffect, depthLayer);
			}
			
			// Fruit.
			
			let fruitIndex = 0;
			
			for (let fruit of util.getDetailsMultiple(feature.details, 'fruit')) {
				let item = (+feature.details.struckByLightningCountdown > 0) ? core.items.get('O', '382') : core.items.resolve(fruit.itemId, fruit);
				let sourceRect = util.getItemRect(item);
				
				switch (fruitIndex) {
				case 0:
					feature.drawSprite(item.texture, [feature.tileX * 64 - 64 + feature.tileX * 200 % 64 / 2, feature.tileY * 64 - 192 - feature.tileX % 64 / 3], sourceRect, null, 0, null, 4, Sprite.EF_NONE, (feature.tileY + 1) * 64 / 10000 + .002 - feature.tileX / 1000000);
					break;
				
				case 1:
					feature.drawSprite(item.texture, [feature.tileX * 64 + 32, feature.tileY * 64 - 256 + feature.tileX * 232 % 64 / 3], sourceRect, null, 0, null, 4, Sprite.EF_NONE, (feature.tileY + 1) * 64 / 10000 + .002 - feature.tileX / 1000000);
					break;
				
				case 2:
					feature.drawSprite(item.texture, [feature.tileX * 64 + feature.tileX * 200 % 64 / 3, feature.tileY * 64 - 160 + feature.tileX * 200 % 64 / 3], sourceRect, null, 0, null, 4, Sprite.EF_FLIP_HORIZONTALLY, (feature.tileY + 1) * 64 / 10000 + .002 - feature.tileX / 1000000);
					break;
				}
				
				++fruitIndex;
			}
		}
		
		break;
	}
	case 'Grass': {
		// See StardewValley.TerrainFeatures.Grass:loadSprite()
		
		let grassSourceOffset = 0;
		let grassType = +feature.details.grassType;
		
		switch (grassType) {
		case 1:
			switch (locationSeasonNumber) {
			case 0: grassSourceOffset = 0; break;
			case 1: grassSourceOffset = 20; break;
			case 2: grassSourceOffset = 40; break;
			default:
				grassSourceOffset = (location.details.isOutdoors === 'true') ? 80 : 0;
			}
			
			break;
		
		case 2: grassSourceOffset = 60; break;
		case 3: grassSourceOffset = 80; break;
		case 4: grassSourceOffset = 100; break;
		case 7:
			switch (locationSeasonNumber) {
			case 0: grassSourceOffset = 160; break;
			case 1: grassSourceOffset = 180; break;
			case 2: grassSourceOffset = 200; break;
			default:
				grassSourceOffset = (location.details.isOutdoors === 'true') ? 220 : 160;
			}
			
			break;
		
		default:
			grassSourceOffset = (grassType + 1) * 20;
		}
		
		// See StardewValley.TerrainFeatures.Grass:setUpRandom() and :draw()
		
		let rng = new CSRandom(baseUtil.getRandomSeed(save.gameID, Math.floor(daysPlayed / 28), feature.tileX * 7, feature.tileY * 11));
		let numberOfWeeds = +feature.details.numberOfWeeds;
		let front = (feature.index >= 0 && lib.mapLocation.map.getTile(feature.tileX, feature.tileY, 'Front') >= 0);
		
		for (let i = 0; i < numberOfWeeds; ++i) {
			let whichWeed = rng.Next(3);
			let offset1 = rng.Next(-2, 3);
			let offset2 = rng.Next(-2, 3) + (front ? -7 : 0);
			let offset3 = rng.Next(-2, 3);
			let offset4 = rng.Next(-2, 3) + (front ? -7 : 0);
			let flip = rng.NextDouble() < .5;
			let shakeRandom = rng.NextDouble();
			let x = (i === 4) ? (offset1 * 4 + 42) : ((i % 2) * 32 + offset3 * 4 + 26);
			let y = (i === 4) ? (offset2 * 4 + 56) : (Math.floor(i / 2) * 32 + offset4 * 4 + 40);
			
			feature.drawSprite('TerrainFeatures/grass', [feature.tileX * 64 + x, feature.tileY * 64 + y], new util.Rect(whichWeed * 15, grassSourceOffset, 15, 20), null, 0, [7.5, 17.5], 4, flip ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, (zTileY * 64 + y - 4) / 10000 + (zTileX * 64 + x) / 10000000);
		}
		
		break;
	}
	case 'HoeDirt': {
		let state = +feature.details.state;
		let cropData = ((feature.details.crop == null) ? null : (core.content.Data.Crops[feature.details.crop.seedIndex] ?? {}));
		
		if (state !== 2) {
			// Note: There should be a little more logic here for mines/volcano,
			// but we currently don't support those in the planner.
			
			let texture = ['Mountain', 'Mine'].includes(location.name) ? 'TerrainFeatures/hoeDirtDark' : 'TerrainFeatures/hoeDirt';
			
			if (locationSeasonNumber === 3 && !location.seedsIgnoreSeasonsHere()) {
				texture = 'TerrainFeatures/hoeDirtSnow';
			}
			
			let drawPos = [feature.tileX * 64, feature.tileY * 64];
			let path = pathTiles[mapsUtil.getPathMask(lib.paths.HoeDirt, feature.tileX, feature.tileY) & 0x0f];
			feature.drawSprite(texture, drawPos, new util.Rect(path[0] * 16, path[1] * 16, 16, 16), null, 0, null, 4, Sprite.EF_NONE, 1e-8);
			
			if (state === 1) {
				let nearWaterForPaddy = (feature.index >= 0 && cropData?.IsPaddyCrop) ? lib.mapLocation.nearWaterForPaddy(feature.tileX, feature.tileY) : false;
				path = pathTiles[mapsUtil.getPathMask(lib.paths.WateredHoeDirt, feature.tileX, feature.tileY) & 0x0f];
				feature.drawSprite(texture, drawPos, new util.Rect(path[0] * 16 + (nearWaterForPaddy ? 128 : 64), path[1] * 16, 16, 16), null, 0, null, 4, Sprite.EF_NONE, 1.2e-8);
			}
			
			if ((feature.details.fertilizer ?? '0') !== '0') {
				feature.drawSprite(util.tx.mouseCursors, drawPos, mapsUtil.getFertilizerSourceRect(feature.details.fertilizer), null, 0, null, 4, Sprite.EF_NONE, 1.9e-8);
			}
		}
		
		if (feature.details.crop != null) {
			let shouldDrawDarkWhenWatered = (!cropData.IsPaddyCrop && feature.details.crop.raisedSeeds !== 'true');
			let tintColor = (state === 1 && +feature.details.crop.currentPhase === 0 && shouldDrawDarkWhenWatered) ? [180, 100, 200, 255] : null;
			mapsUtil.drawCrop(feature, location, core, util.rootDetails(feature.details, 'crop'), feature.tileX, feature.tileY, tintColor);
		}
		
		break;
	}
	case 'Tree': {
		let wildTreeData = core.content.Data.WildTrees[feature.meta.treeType];
		
		// See StardewValley.TerrainFeatures.Tree:ChooseTexture()
		
		let texture = null;
		
		for (let entry of wildTreeData.Textures) {
			if (location.details.IsGreenhouse === 'true' && entry.Season != null) {
				if (entry.Season === 'Spring') {
					texture = entry.Texture;
					break;
				}
			}
			else if (entry.Season == null || entry.Season === util.getSeasonName(locationSeasonNumber)) {
				texture = entry.Texture;
				break;
			}
		}
		
		texture ??= wildTreeData.Textures[0].Texture;
		
		// See StardewValley.TerrainFeatures.Tree:IsLeafy()
		
		let isLeafy = wildTreeData.IsLeafy;
		
		if (isLeafy) {
			if (locationSeasonNumber === 3 && !wildTreeData.IsLeafyInWinter) {
				isLeafy = false;
			}
			else if (locationSeasonNumber === 2 && !wildTreeData.IsLeafyInFall) {
				isLeafy = false;
			}
		}
		
		// See StardewValley.TerrainFeatures.Tree:draw()
		
		let baseSortPosition = zTileY * 64 + 64;
		let growthStage = +feature.details.growthStage;
		
		if (growthStage < 5) {
			let sourceRect;
			
			switch (growthStage) {
			case 0: sourceRect = new util.Rect(32, 128, 16, 16); break;
			case 1: sourceRect = new util.Rect(0, 128, 16, 16); break;
			case 2: sourceRect = new util.Rect(16, 128, 16, 16); break;
			default: sourceRect = new util.Rect(0, 96, 16, 32);
			}
			
			feature.drawSprite(texture, [feature.tileX * 64 + 32, feature.tileY * 64 - (sourceRect.height * 4 - 64) + ((growthStage >= 3) ? 128 : 64)], sourceRect, (feature.details.fertilized === 'true') ? util.namedColors.HotPink : null, 0, [8, (growthStage >= 3) ? 32 : 16], 4, flipEffect, (growthStage === 0) ? .0001 : (baseSortPosition / 10000));
		}
		else {
			if (feature.details.stump !== 'true') {
				if (isLeafy) {
					feature.drawSprite(util.tx.mouseCursors, [feature.tileX * 64 - 51, feature.tileY * 64 - 16], staticVals.Tree.shadowSourceRect, null, 0, null, 4, flipEffect, 1e-6, {isShadow: true});
				}
				else {
					feature.drawSprite(util.tx.mouseCursors_1_6, [feature.tileX * 64 - 51, feature.tileY * 64 - 16], new util.Rect(469, 298, 42, 31), null, 0, null, 4, flipEffect, 1e-6, {isShadow: true});
				}
				
				let sourceRect = util.Rect.from(staticVals.Tree.treeTopSourceRect);
				
				if ((wildTreeData.UseAlternateSpriteWhenSeedReady && feature.details.hasSeed === 'true') || wildTreeData.UseAlternateSpriteWhenNotShaken) {
					sourceRect.x = 48;
				}
				else {
					sourceRect.x = 0;
				}
				
				if (feature.details.hasMoss === 'true') {
					sourceRect.x = 96;
				}
				
				feature.drawSprite(texture, [feature.tileX * 64 + 32, feature.tileY * 64 + 64], sourceRect, null, 0, [24, 96], 4, flipEffect, (baseSortPosition + 2) / 10000 - feature.tileX / 1000000);
			}
			
			let stumpSource = util.Rect.from(staticVals.Tree.stumpSourceRect);
			
			if (feature.details.hasMoss === 'true') {
				stumpSource.x += 96;
			}
			
			let health = +(feature.details.health ?? 0);
			
			if (health >= -99) {
				feature.drawSprite(texture, [feature.tileX * 64, feature.tileY * 64 - 64], stumpSource, null, 0, null, 4, flipEffect, baseSortPosition / 10000);
				
				if (feature.details.stump === 'true' && health < 4) {
					feature.drawSprite(texture, [feature.tileX * 64, feature.tileY * 64], new util.Rect(Math.min(2, 3 - health) * 16, 144, 16, 16), null, 0, null, 4, flipEffect, (baseSortPosition + 1) / 10000);
				}
			}
		}
		break;
	}}
};
