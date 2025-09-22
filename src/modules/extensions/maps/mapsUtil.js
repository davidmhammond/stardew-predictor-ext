import Feature from './classes/Feature.js';
import Sprite from './classes/Sprite.js';

import * as util from '../../util.js';

export let ccAreaGameStateKeys = [
	'ccAreasCompletePantry',
	'ccAreasCompleteCraftsRoom',
	'ccAreasCompleteFishTank',
	'ccAreasCompleteBoilerRoom',
	'ccAreasCompleteVault',
	'ccAreasCompleteBB',
];

export let farmLocationDataIds = new Map([
	['0', 'Farm_Standard'],
	['1', 'Farm_Riverland'],
	['2', 'Farm_Forest'],
	['3', 'Farm_Hilltop'],
	['4', 'Farm_Wilderness'],
	['5', 'Farm_FourCorners'],
	['6', 'Farm_Beach'],
	['MeadowlandsFarm', 'Farm_MeadowlandsFarm'],
]);

export let farmMapPaths = new Map([
	['0', 'Maps/Farm'],
	['1', 'Maps/Farm_Fishing'],
	['2', 'Maps/Farm_Foraging'],
	['3', 'Maps/Farm_Mining'],
	['4', 'Maps/Farm_Combat'],
	['5', 'Maps/Farm_FourCorners'],
	['6', 'Maps/Farm_Island'],
	['MeadowlandsFarm', 'Maps/Farm_Ranching'],
]);

export let farmerSpriteLayers = [
	// See StardewValley.FarmerRenderer:FarmerSpriteLayers
	
	'SlingshotUp',
	'ToolUp',
	'Base',
	'Pants',
	'FaceSkin',
	'Eyes',
	'Shirt',
	'AccessoryUnderHair',
	'ArmsUp',
	'HatMaskUp',
	'Hair',
	'Accessory',
	'Hat',
	'Tool',
	'Arms',
	'ToolDown',
	'Slingshot',
	'PantsPassedOut',
	'SwimWaterRing',
	'MAX',
	'TOOL_IN_USE_SIDE',
];

export let fenceTiles = [
	[2, 1], // none
	[0, 1], // N
	[1, 3], // E
	[0, 2], // NE
	[2, 1], // S
	[0, 1], // NS
	[0, 0], // SE
	[0, 0], // NSE
	[0, 3], // W
	[2, 2], // NW
	[1, 2], // EW
	[1, 2], // NEW
	[2, 0], // SW
	[2, 2], // NSW
	[1, 1], // SEW
	[1, 1], // NSEW
];

export let addMapPropertyElement = function (properties, propertyElement) {
	let value = propertyElement.getAttribute('value');
	
	switch (propertyElement.getAttribute('type')) {
	case 'bool':
		value = (value === 'True');
		break;
	
	case 'float':
	case 'int':
		value = +value;
		break;
	}
	
	properties[propertyElement.getAttribute('name')] = value;
};

export let allCCAreasComplete = function (gameState) {
	for (let key of ccAreaGameStateKeys) {
		if (!gameState[key]) {
			return false;
		}
	}
	
	return true;
};

export let daysPlayed = function (gameState) {
	return (gameState.year - 1) * 112 + gameState.seasonNumber * 28 + gameState.dayOfMonth;
};

export let getDropHTML = function (core, possibilities, mode = null) {
	// Modes: imageLink, image, link, text, plainText
	
	mode ??= 'imageLink';
	let html = [];
	
	for (let drop of possibilities) {
		let chance = drop.chance ?? 1;
		
		if (chance === 0) {
			continue;
		}
		
		let dropOutput;
		
		if (drop == null) {
			dropOutput = 'nothing';
		}
		else if (drop.item != null) {
			dropOutput = core.getItemHTML(drop.item.itemType, drop.item.itemId, mode, drop.stack, drop.quality);
		}
		else {
			dropOutput = (mode === 'plainText') ? drop.name : util.escapeHTML(drop.name);
		}
		
		if (chance !== 1) {
			let chanceRounded = Math.round(drop.chance * 1000) / 10;
			dropOutput += ` (${chanceRounded.toFixed(1)}%)`;
		}
		
		html.push(dropOutput);
	}
	
	return html.join(' or ');
};

export let getFertilizerSourceRect = function (fertilizer) {
	// See StardewValley.TerrainFeatures.HoeDirt:GetFertilizerSourceRect()
	
	let index = {
		'(O)369': 1, '369': 1,
		'(O)370': 3, '370': 3,
		'(O)371': 4, '371': 4,
		'(O)465': 6, '465': 6,
		'(O)466': 7, '466': 7,
		'(O)918': 8, '918': 8,
		'(O)919': 2, '919': 2,
		'(O)920': 5, '920': 5,
	}[fertilizer] ?? 0;
	
	return new util.Rect(173 + Math.floor(index / 3) * 16, 462 + index % 3 * 16, 16, 16);
};

export let getPaintImageDataKey = function (sprite) {
	if (sprite.paint == null) {
		return sprite.texture;
	}
	
	return `${sprite.texture}\u0000${sprite.paint.type}\u0000${sprite.paint.mask}`;
};

// Paths are calculated without map dimensions. We'll account for map
// widths up to 9999. A map width of 10000 would also work, but would
// have a wraparound bug: a path on the left edge would connect to a
// path on the right edge of the previous row.

export let getPathMask = function (paths, tileX, tileY) {
	if (paths == null) {
		return 0;
	}
	
	let index = tileX + tileY * 10000;
	return (
		(paths.has(index - 10000) ? 0x01 : 0) | // N
		(paths.has(index +     1) ? 0x02 : 0) | // E
		(paths.has(index + 10000) ? 0x04 : 0) | // S
		(paths.has(index -     1) ? 0x08 : 0) | // W
		(paths.has(index -  9999) ? 0x10 : 0) | // NE
		(paths.has(index - 10001) ? 0x20 : 0) | // NW
		(paths.has(index + 10001) ? 0x40 : 0) | // SE
		(paths.has(index +  9999) ? 0x80 : 0)   // SW
	);
};

export let getWidthOfTinyDigitString = function (stack, scale) {
	let numDigits = Math.floor(Math.log10(Math.max(1, stack))) + 1;
	return Math.floor(numDigits * 5 * scale);
};

//== Bush Drawing ==//

export let drawBush = function (feature, location, core, details, tileX, tileY, yDrawOffset = 0) {
	let save = core.save;
	
	let zTileX = tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = tileY + ((feature.index >= 0) ? 0 : 20);
	
	let size = +details.size;
	let effectiveSize = {3: 0, 4: 1}[size] ?? size;
	
	if (details.drawShadow === 'true') {
		if (effectiveSize > 0) {
			feature.drawSprite(util.tx.mouseCursors, [(tileX + ((effectiveSize === 1) ? .5 : 1)) * 64 - 51, tileY * 64 - 16 + yDrawOffset], new util.Rect(663, 1011, 41, 30), null, 0, null, 4, (details.flipped === 'true') ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, 1e-6, {isShadow: true});
		}
		else {
			feature.drawBasicShadow([tileX * 64 + 32, tileY * 64 + 60 + yDrawOffset], 1e-6);
		}
	}
	
	let tileSheetOffset = +details.tileSheetOffset;
	let townBush = (details.townBush === 'true');
	let locationSeasonNumber = location.getSeasonNumber();
	let sourceRect;
	
	switch (size) {
	case 0:
		sourceRect = new util.Rect(locationSeasonNumber * 32 + tileSheetOffset * 16, 224, 16, 32);
		break;
	
	case 1:
		if (townBush) {
			sourceRect = new util.Rect(locationSeasonNumber * 32, 96, 32, 32);
		}
		else {
			let xOffset = locationSeasonNumber * 64 + tileSheetOffset * 32;
			sourceRect = new util.Rect(xOffset % 128, Math.floor(xOffset / 128) * 48, 32, 48);
		}
		
		break;
	
	case 2:
		if (townBush && (locationSeasonNumber == 0 || locationSeasonNumber == 1)) {
			sourceRect = new util.Rect(48, 176, 48, 48);
		}
		else {
			switch (locationSeasonNumber) {
			case 0:
			case 1:
				sourceRect = new util.Rect(0, 128, 48, 48);
				break;
			
			case 2:
				sourceRect = new util.Rect(48, 128, 48, 48);
				break;
			
			case 3:
				sourceRect = new util.Rect(0, 176, 48, 48);
				break;
			}
		}
		
		break;
	
	case 3: {
		let age = daysPlayed(location.gameState) - +details.datePlanted;
		
		switch (locationSeasonNumber) {
		case 0:
			sourceRect = new util.Rect(Math.min(2, Math.floor(age / 10)) * 16 + tileSheetOffset * 16, 256, 16, 32);
			break;
		
		case 1:
			sourceRect = new util.Rect(64 + Math.min(2, Math.floor(age / 10)) * 16 + tileSheetOffset * 16, 256, 16, 32);
			break;
		
		case 2:
			sourceRect = new util.Rect(Math.min(2, Math.floor(age / 10)) * 16 + tileSheetOffset * 16, 288, 16, 32);
			break;
		
		case 3:
			sourceRect = new util.Rect(64 + Math.min(2, Math.floor(age / 10)) * 16 + tileSheetOffset * 16, 288, 16, 32);
			break;
		}
		
		break;
	}
	case 4:
		sourceRect = new util.Rect(tileSheetOffset * 32, 320, 32, 32);
		break;
	}
	
	let drawPosition = [tileX * 64 + Math.floor((effectiveSize + 1) * 64 / 2), (tileY + 1) * 64 - ((effectiveSize > 0 && (!townBush || effectiveSize !== 1) && size !== 4) ? 64 : 0) + yDrawOffset];
	feature.drawSprite('TileSheets/bushes', drawPosition, sourceRect, null, 0, [Math.floor((effectiveSize + 1) * 16 / 2), 32], 4, (details.flipped === 'true') ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, (zTileY * 64 + 80) / 10000 - zTileX / 1000000);
};

//== Crop Drawing ==//

export let getCropDrawValues = function (feature, location, core, details, tileX, tileY) {
	// See StardewValley.Crop:updateDrawMath()
	
	let zTileX = tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = tileY + ((feature.index >= 0) ? 0 : 20);
	
	let cropData = core.content.Data.Crops[details.seedIndex] ?? {};
	let tileNumber = tileX * 7 + tileY * 11;
	let invTileNumber = tileX * 11 + tileY * 7;
	
	let texture = null;
	let drawPosition = null;
	let sourceRect = null;
	let layerDepth = null;
	let coloredSourceRect = null;
	let coloredLayerDepth = null;
	
	// See StardewValley.Crop:updateDrawMath() and :draw()
	
	if (details.forageCrop === 'true') {
		let forageCrop = +details.whichForageCrop;
		
		if (isNaN(forageCrop)) {
			forageCrop = 1;
		}
		
		drawPosition = [tileX * 64 + invTileNumber % 10 - 5 + 32, tileY * 64 + tileNumber % 10 - 5 + 32];
		layerDepth = (zTileY * 64 + 32 + (zTileY * 11 + zTileX * 7) % 10 - 5) / 10000;
		sourceRect = new util.Rect((tileX * 51 + tileY * 77) % 3 * 16, 128 + forageCrop * 16, 16, 16);
	}
	else {
		let shouldDrawDarkWhenWatered = (!cropData.IsPaddyCrop && details.raisedSeeds !== 'true');
		let currentPhase = +details.currentPhase ?? 0;
		let phaseDaysCount = util.countDetails(details.phaseDays, 'int');
		drawPosition = [tileX * 64 + 32, tileY * 64 + 32];
		layerDepth = zTileY * 64 + 32;
		
		if (currentPhase < phaseDaysCount - 1) {
			if (shouldDrawDarkWhenWatered) {
				drawPosition[0] += invTileNumber % 10 - 5;
				layerDepth += tileNumber % 10 - 5;
			}
			
			if (details.raisedSeeds !== 'true') {
				drawPosition[1] += tileNumber % 10 - 5;
			}
		}
		
		layerDepth /= (currentPhase === 0 && shouldDrawDarkWhenWatered) ? 20000 : 10000;
		
		// See StardewValley.Crop:getSourceRect()
		
		if (details.dead === 'true') {
			texture = util.tx.cropSpriteSheet;
			sourceRect = new util.Rect(192 + tileNumber % 4 * 16, 384, 16, 32);
		}
		else {
			texture = details.overrideTexturePath ?? cropData.Texture ?? 'TileSheets/crops';
			let effectiveRow = +details.rowInSpriteSheet;
			
			if (details.indexOfHarvest === '771') {
				switch (location.getSeasonNumber()) {
				case 2: effectiveRow += 1; break;
				case 3: effectiveRow += 2; break;
				}
			}
			
			sourceRect = new util.Rect(0, Math.floor(effectiveRow / 2) * 32, 16, 32);
			coloredSourceRect = new util.Rect(0, Math.floor(+details.rowInSpriteSheet / 2) * 32, 16, 32);
			
			if (details.fullGrown === 'true') {
				sourceRect.x = (+details.dayOfCurrentPhase <= 0) ? 6 : 7;
				coloredSourceRect.x = sourceRect.x;
			}
			else {
				let phaseToShow = (details.phaseToShow === '-1') ? currentPhase : +details.phaseToShow;
				sourceRect.x = phaseToShow + ((phaseToShow == 0 && tileNumber % 2 == 0) ? 0 : 1);
				coloredSourceRect.x = currentPhase + 2;
			}
			
			sourceRect.x = Math.min(240, sourceRect.x * 16 + ((effectiveRow % 2 === 0) ? 0 : 128));
			coloredSourceRect.x = coloredSourceRect.x * 16 + ((+details.rowInSpriteSheet % 2 === 0) ? 0 : 128);
			coloredLayerDepth = (zTileY * 64 + 32 + (tileNumber % 10 - 5)) / ((currentPhase === 0 && shouldDrawDarkWhenWatered) ? 20000 : 10000);
		}
	}
	
	return {
		texture,
		drawPosition,
		sourceRect,
		layerDepth,
		coloredSourceRect,
		coloredLayerDepth,
	};
};

export let drawCrop = function (feature, location, core, details, tileX, tileY, color) {
	let drawValues = getCropDrawValues(feature, location, core, details, tileX, tileY);
	
	// See StardewValley.Crop:updateDrawMath() and :draw()
	
	if (details.forageCrop === 'true') {
		let origin = [8, 8];
		
		if (details.whichForageCrop === '2') {
			drawValues.drawPosition[1] += 32;
			drawValues.sourceRect = new util.Rect(128 + Math.floor((tileX * 111 + tileY * 77) % 800 / 200) * 16, 128, 16, 16);
			origin[1] = 16;
		}
		
		feature.drawSprite(util.tx.mouseCursors, drawValues.drawPosition, drawValues.sourceRect, null, 0, origin, 4, Sprite.EF_NONE, drawValues.layerDepth);
		return;
	}
	
	let effect = (details.flip === 'true') ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE;
	feature.drawSprite(drawValues.texture, drawValues.drawPosition, drawValues.sourceRect, color, 0, [8, 24], 4, effect, drawValues.layerDepth);
	let tintColor = null;
	
	if (details.tintColor != null) {
		tintColor = [+details.tintColor.R, +details.tintColor.G, +details.tintColor.B, +details.tintColor.A];
	}
	else {
		let cropData = core.content.Data.Crops[details.seedIndex] ?? {};
		
		if (cropData.TintColors?.length > 0) {
			tintColor = util.stringToColor(cropData.TintColors[0]);
		}
	}
	
	if (
		tintColor != null &&
		(tintColor[0] !== 255 || tintColor[1] !== 255 || tintColor[2] !== 255 || tintColor[3] !== 255) &&
		(+details.currentPhase ?? 0) === util.countDetails(details.phaseDays, 'int') - 1 &&
		details.dead !== 'true'
	) {
		feature.drawSprite(drawValues.texture, drawValues.drawPosition, drawValues.coloredSourceRect, tintColor, 0, [8, 24], 4, effect, drawValues.coloredLayerDepth);
	}
};

export let drawCropWithOffset = function (feature, location, core, details, tileX, tileY, color, offsetX, offsetY) {
	// See StardewValley.Crop:drawWithOffset()
	
	let zTileX = tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = tileY + ((feature.index >= 0) ? 0 : 20);
	let drawValues = getCropDrawValues(feature, location, core, details, tileX, tileY);
	let drawPosition = [tileX * 64 + offsetX, tileY * 64 + offsetY];
	
	if (details.forageCrop === 'true') {
		feature.drawSprite(util.tx.mouseCursors, drawPosition, drawValues.sourceRect, null, 0, [8, 8], 4, Sprite.EF_NONE, (zTileY + .66) * 64 / 10000 + zTileX * 1e-5);
		return;
	}
	
	let effect = (details.flip === 'true') ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE;
	feature.drawSprite(drawValues.texture, drawPosition, drawValues.sourceRect, color, 0, [8, 24], 4, effect, (zTileY + .66) * 64 / 10000 + zTileX * 1e-5);
	let tintColor = null;
	
	if (details.tintColor != null) {
		tintColor = [+details.tintColor.R, +details.tintColor.G, +details.tintColor.B, +details.tintColor.A];
	}
	else {
		let cropData = core.content.Data.Crops[details.seedIndex] ?? {};
		
		if (cropData.TintColors?.length > 0) {
			tintColor = util.stringToColor(cropData.TintColors[0]);
		}
	}
	
	if (
		tintColor != null &&
		(tintColor[0] !== 255 || tintColor[1] !== 255 || tintColor[2] !== 255 || tintColor[3] !== 255) &&
		(+details.currentPhase ?? 0) === util.countDetails(details.phaseDays, 'int') - 1 &&
		details.dead !== 'true'
	) {
		feature.drawSprite(drawValues.texture, drawPosition, drawValues.coloredSourceRect, tintColor, 0, [8, 24], 4, effect, (zTileY + 0.67) * 64 / 10000 + zTileX * 1e-5);
	}
};

//== Furniture ==//

export let getFurnitureSize = function (furnitureItem, forceFurnitureType = null) {
	if (furnitureItem.data[3] !== '-1') {
		return furnitureItem.data[3].split(/ +/);
	}
	
	// See StardewValley.Objects.Furniture:getDefaultBoundingBoxForType()
	
	return {
		1: [2, 1],
		2: [3, 1],
		3: [2, 1],
		4: [2, 1],
		5: [5, 2],
		6: [2, 2],
		10: [2, 1],
		11: [2, 2],
		12: [3, 2],
		13: [1, 2],
		14: [2, 1],
		17: [1, 2],
	}[forceFurnitureType ?? getFurnitureType(furnitureItem)] ?? [1, 1];
};

export let getFurnitureType = function (furnitureItem) {
	let typeName = furnitureItem.data[1].toLowerCase();
	
	if (typeName.substring(0, 3) === 'bed') {
		return 15;
	}
	
	switch (typeName) {
	case 'chair': return 0;
	case 'bench': return 1;
	case 'couch': return 2;
	case 'armchair': return 3; 
	case 'dresser': return 4;
	case 'long table': return 5;
	case 'painting': return 6;
	case 'lamp': return 7;
	case 'decor': return 8;
	case 'bookcase': return 10;
	case 'table': return 11;
	case 'rug': return 12;
	case 'window': return 13;
	case 'fireplace': return 14;
	case 'torch': return 16;
	case 'sconce': return 17;
	default: return 9;
	}
};

//== Game State Query ==//

export let checkConditions = function (core, queryString, location, rng) {
	// See StardewValley.GameStateQuery
	
	let common = core.common;
	let ext = core.extVars.maps;
	
	if (queryString == null || queryString === '' || queryString === 'TRUE') {
		return true;
	}
	
	if (queryString === 'FALSE') {
		return false;
	}
	
	for (let query of queryString.split(',')) {
		query = query.trim();
		
		if (query === '') {
			continue;
		}
		
		query = query.split(/ +/);
		let result = false;
		let negated = query[0].substring(0, 1) === '!';
		
		if (negated) {
			query[0] = query[0].substring(1);
		}
		
		// For simplicity, we've only implemented enough to cover the
		// conditions actively used in the relevant data files.
		
		switch (query[0].toUpperCase()) {
		case 'DAYS_PLAYED':
			result = (util.daysPlayed(location.gameState) >= +query[1]);
			break;
		
		case 'IS_ISLAND_NORTH_BRIDGE_FIXED':
			result = location.gameState.islandNorthBridgeFixed;
			break;
		
		case 'LOCATION_SEASON':
			result = false;
			
			for (let i = 2; i < query.length; ++i) {
				result ||= (location.getSeasonName() === query[i].toLowerCase());
			}
			
			break;
		
		case 'PLAYER_HAS_MAIL':
			result = withFarmer(core, query[1], function (farmer) {
				return farmer.mailReceived.has(query[2]);
			});
			break;
		
		case 'PLAYER_HAS_SEEN_EVENT':
			result = withFarmer(core, query[1], function (farmer) {
				return farmer.eventsSeen.has(query[2]);
			});
			break;
		
		case 'PLAYER_LOCATION_NAME':
			result = (location.name.toLowerCase() === query[2].toLowerCase());
			break;
		
		case 'PLAYER_COMBAT_LEVEL':
			result = withFarmer(core, query[1], function (farmer) {
				return (farmer.combatLevel >= +query[2]);
			});
			break;
		
		case 'PLAYER_FARMING_LEVEL':
			result = withFarmer(core, query[1], function (farmer) {
				return (farmer.farmingLevel >= +query[2]);
			});
			break;
		
		case 'PLAYER_FISHING_LEVEL':
			result = withFarmer(core, query[1], function (farmer) {
				return (farmer.fishingLevel >= +query[2]);
			});
			break;
		
		case 'PLAYER_FORAGING_LEVEL':
			result = withFarmer(core, query[1], function (farmer) {
				return (farmer.foragingLevel >= +query[2]);
			});
			break;
		
		case 'PLAYER_LUCK_LEVEL':
			// Non-deterministic: This should use the player's current luck, not just daily luck.
			
			result = withFarmer(core, query[1], function (farmer) {
				return (farmer.dailyLuck >= +query[2]);
			});
			break;
		
		case 'PLAYER_MINING_LEVEL':
			result = withFarmer(core, query[1], function (farmer) {
				return (common.player.miningLevel >= +query[2]);
			});
			break;
		
		case 'PLAYER_SPECIAL_ORDER_RULE_ACTIVE':
			result = ext.specialOrderRulesActive.includes(query[2]);
			break;
		
		case 'RANDOM': {
			let chance = +query[1];
			
			for (let i = 2; i < query.length; ++i) {
				if (query[i].toLowerCase() === '@adddailyluck') {
					chance += common.player.dailyLuck;
					break;
				}
			}
			
			result = (rng.NextDouble() < chance);
			break;
		}}
		
		if (result === negated) {
			return false;
		}
	}
	
	return true;
};

export let withFarmer = function (core, farmerKey, check) {
	// See StardewValley.GameStateQuery:Helpers.WithPlayer()
	
	let common = core.common;
	
	switch (farmerKey.toLowerCase()) {
	case 'any':
		return common.farmers.some(check);
	
	case 'all':
		return common.farmers.every(check);
	
	case 'current':
	case 'target':
	case 'host':
		return check(common.player);
	
	default:
		if (Object.hasOwn(common.farmersById, farmerKey)) {
			return check(common.farmersById[farmerKey]);
		}
	}
	
	return false;
};

export let applyQuantityModifiers = function (core, value, modifiers, mode, location, rng) {
	if (modifiers == null || modifiers.length === 0) {
		return value;
	}
	
	let newValue = null;
	
	for (let modifier of modifiers) {
		let amount = modifier.Amount;
		
		if (modifier.RandomAmount != null && modifier.RandomAmount.length > 0) {
			amount = util.choose(rng, modifier.RandomAmount);
		}
		
		if (!checkConditions(core, modifier.Condition, location, rng)) {
			continue;
		}
		
		let applied = value;
		
		switch (modifier.Modification.toLowerCase()) {
		case 'add': applied += amount; break;
		case 'subtract': applied -= amount; break;
		case 'multiply': applied *= amount; break;
		case 'divide': applied /= amount; break;
		case 'set': applied = amount; break;
		}
		
		switch (mode) {
		case 'Minimum':
			newValue = Math.min(newValue ?? applied, applied);
			break;
		
		case 'Maximum':
			newValue = Math.max(newValue ?? applied, applied);
			break;
		
		default:
			newValue = applied;
		}
	}
	
	return newValue ?? value;
};

//== Object drawing ==//

export let drawObject = function (feature, location, core, item, details, tileX, tileY) {
	let save = core.save;
	let lib = core.extensions.maps.lib;
	
	let zTileX = tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = tileY + ((feature.index >= 0) ? 0 : 20);
	
	switch (details['@xsi:type'] ?? null) {
	case 'Chest': {
		let tint = (details.tint == null) ? [255, 255, 255, 255] : [+details.tint.R, details.tint.G, details.tint.B, details.tint.A];
		let playerChoiceColor = (details.playerChoiceColor == null) ? [0, 0, 0, 255] : [+details.playerChoiceColor.R, +details.playerChoiceColor.G, +details.playerChoiceColor.B, +details.playerChoiceColor.A];
		let baseSortOrder = Math.max(0, ((zTileY + 1) * 64 - 24) / 10000) + zTileX * 1e-5;
		let currentLidFrame = +(details.currentLidFrame ?? 501);
		
		if (details.playerChest === 'true' && ['(BC)130', '(BC)232', '(BC)BigChest', '(BC)BigStoneChest'].includes(item.qualifiedItemId)) {
			if (details.playerChoiceColor == null || details.playerChoiceColor.R === '0' && details.playerChoiceColor.G === '0' && details.playerChoiceColor.B === '0' && details.playerChoiceColor.A === '255') {
				feature.drawSprite(item.texture, [tileX * 64, (tileY - 1) * 64], item.spriteRect, tint, 0, null, 4, Sprite.EF_NONE, baseSortOrder);
				return;
			}
			
			let spriteIndex = +(details.parentSheetIndex ?? item.spriteIndex);
			let lidIndex = spriteIndex + 8;
			
			if (item.qualifiedItemId === '(BC)BigChest') {
				lidIndex = spriteIndex + 16;
				spriteIndex = 312;
			}
			else if (item.qualifiedItemId === '(BC)130') {
				lidIndex = spriteIndex + 46;
				spriteIndex = 168;
			}
			
			feature.drawSprite(item.texture, [tileX * 64, (tileY - 1) * 64], util.getItemRect(item, 0, spriteIndex), playerChoiceColor, 0, null, 4, Sprite.EF_NONE, baseSortOrder);
			feature.drawSprite(item.texture, [tileX * 64, (tileY - 1) * 64], util.getItemRect(item, 0, lidIndex), null, 0, null, 4, Sprite.EF_NONE, baseSortOrder + 2e-5);
			return;
		}
		
		if (details.playerChest === 'true') {
			feature.drawSprite(item.texture, [tileX * 64, (tileY - 1) * 64], item.spriteRect, tint, 0, null, 4, Sprite.EF_NONE, baseSortOrder);
			return;
		}
		
		if (details.giftbox === 'true') {
			feature.meta.name = 'Gift Box';
			feature.drawBasicShadow([tileX * 64 + 16, tileY * 64 + 53], 1e-7);
			feature.drawSprite(util.tx.giftboxTexture, [tileX * 64, tileY * 64 - 52], new util.Rect(0, +(details.giftboxIndex ?? 0) * 32, 16, 32), tint, 0, null, 4, Sprite.EF_NONE, baseSortOrder);
			return;
		}
		
		feature.meta.name = 'Treasure Chest';
		let spriteIndex = 500;
		let spriteSheet = util.tx.objectSpriteSheet;
		let spriteSheetHeight = 16;
		let yOffset = 0;
		
		if (+details.spriteIndexOverride >= 0) {
			spriteIndex = +details.spriteIndexOverride;
			spriteSheet = util.tx.bigCraftableSpriteSheet;
			spriteSheetHeight = 32;
			yOffset = -64;
		}
		else {
			feature.drawBasicShadow([tileX * 64 + 16, tileY * 64 + 53], 1e-7);
		}
		
		feature.drawSprite(spriteSheet, [tileX * 64, tileY * 64 + yOffset], util.getStandardTextureRect(util.textureSizes[spriteSheet], spriteIndex, 16, spriteSheetHeight), tint, 0, null, 4, Sprite.EF_NONE, baseSortOrder);
		let lidPosition = [tileX * 64, tileY * 64 + yOffset];
		
		if (+(details.spriteIndexOverride ?? -1) < 0) {
			switch (currentLidFrame) {
			case 501: lidPosition[1] -= 32; break;
			case 502: lidPosition[1] -= 40; break;
			case 503: lidPosition[1] -= 60; break;
			}
		}
		
		feature.drawSprite(spriteSheet, lidPosition, util.getStandardTextureRect(util.textureSizes[spriteSheet], currentLidFrame, 16, spriteSheetHeight), tint, 0, null, 4, Sprite.EF_NONE, baseSortOrder + 1e-5);
		return;
	}
	// TODO: ColoredObject
	case 'Fence': {
		feature.meta.pathTypes = ['FencesAndGates'];
		let fenceData = core.content.Data.Fences[item.itemId];
		
		if (fenceData == null) {
			feature.drawSprite(item.texture, [tileX * 64, tileY * 64], item.spriteRect, null, 0, null, 4, Sprite.EF_NONE, 1e-9);
			return;
		}
		
		let path = [0, 1];
		
		if (+(details.health ?? fenceData.Health) > 1) {
			if (details.isGate === 'true') {
				switch (getPathMask(lib.paths.Fences, tileX, tileY) & 0x0f) {
				case 0x08: // W
					feature.drawSprite(fenceData.Texture, [tileX * 64 - 16, tileY * 64 - 128], new util.Rect((details.gatePosition === '88') ? 24 : 0, 192, 24, 48), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 32 + 1) / 10000);
					return;
				
				case 0x02: // E
					feature.drawSprite(fenceData.Texture, [tileX * 64 - 16, tileY * 64 - 128], new util.Rect((details.gatePosition === '88') ? 24 : 0, 240, 24, 48), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 32 + 1) / 10000);
					return;
				
				case 0x01: // N
					feature.drawSprite(fenceData.Texture, [tileX * 64 + 20, tileY * 64 - 64 - 20], new util.Rect((details.gatePosition === '88') ? 24 : 0, 288, 24, 32), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 - 32 + 2) / 10000);
					return;
				
				case 0x04: // S
					feature.drawSprite(fenceData.Texture, [tileX * 64 + 20, tileY * 64 - 64 - 20], new util.Rect((details.gatePosition === '88') ? 24 : 0, 320, 24, 32), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 96 - 1) / 10000);
					return;
				
				case 0x0a: // EW
					feature.drawSprite(fenceData.Texture, [tileX * 64 - 16, tileY * 64 - 64], new util.Rect((details.gatePosition === '88') ? 24 : 0, 128, 24, 32), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 32 + 1) / 10000);
					return;
				
				case 0x05: // NS
					feature.drawSprite(fenceData.Texture, [tileX * 64 + 20, tileY * 64 - 64 - 20], new util.Rect((details.gatePosition === '88') ? 16 : 0, 160, 16, 16), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 - 32 + 2) / 10000);
					feature.drawSprite(fenceData.Texture, [tileX * 64 + 20, tileY * 64 - 64 + 44], new util.Rect((details.gatePosition === '88') ? 16 : 0, 176, 16, 16), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 96 - 1) / 10000);
					return;
				}
				
				path = [2, 5];
			}
			else {
				let pathKey = `Fences:${item.itemId}`;
				feature.meta.pathTypes.push('Fences');
				feature.meta.pathTypes.push(pathKey);
				let pathMask = getPathMask(lib.paths[pathKey], tileX, tileY) & 0x0f;
				path = fenceTiles[pathMask];
				let heldItem = getObjectItem(core, util.rootDetails(details, 'heldObject'));
				
				if (heldItem != null) {
					let offset = fenceData.HeldObjectDrawOffset.split(/, */);
					offset[0] = +offset[0];
					offset[1] = +offset[1];
					
					switch (pathMask) {
					case 0x08: // W
						offset[0] = fenceData.RightEndHeldObjectDrawX;
						break;
					
					case 0x02: // E
						offset[0] = fenceData.LeftEndHeldObjectDrawX;
						break;
					}
					
					feature.beginAccessory('Fence.heldObject');
					
					try {
						drawObjectNonTile(feature, location, core, heldItem, util.rootDetails(details, 'heldObject'), tileX * 64 + offset[0] * 4, tileY * 64 + offset[1] * 4, (zTileY * 64 + 64) / 10000);
					}
					finally {
						feature.endAccessory();
					}
				}
			}
		}
		
		feature.drawSprite(fenceData.Texture, [tileX * 64, tileY * 64 - 64], new util.Rect(path[0] * 16, path[1] * 32, 16, 32), null, 0, null, 4, Sprite.EF_NONE, (zTileY * 64 + 32) / 10000);
		return;
	}
	case 'IndoorPot': {
		feature.drawSprite(item.texture, [tileX * 64, tileY * 64 - 64], util.getItemRect(item, (details.showNextIndex === 'true') ? 1 : 0), null, 0, null, 4, Sprite.EF_NONE, Math.max(0, ((zTileY + 1) * 64 - 24) / 10000) + zTileX * 1e-5);
		
		if ((details.hoeDirt?.fertilizer ?? '0') !== '0') {
			let rect = getFertilizerSourceRect(details.hoeDirt.fertilizer);
			rect.width = 13;
			rect.height = 13;
			feature.drawSprite(util.tx.mouseCursors, [tileX * 64 + 4, tileY * 64 - 12], rect, null, 0, null, 4, Sprite.EF_NONE, (zTileY + .65) * 64 / 10000 + zTileX * 1e-5);
		}
		
		if (details.hoeDirt?.crop != null || details.heldObject != null || details.bush != null) {
			feature.beginAccessory('IndoorPot.crop');
			
			try {
				let tintColor = (
					+(details.hoeDirt?.state ?? 0) === 1 &&
					+(details.hoeDirt?.crop.currentPhase ?? 0) === 0 &&
					details.hoeDirt?.crop.raisedSeeds !== 'true'
				) ? [180, 100, 200, 255] : null;
				
				if (details.hoeDirt?.crop != null) {
					drawCropWithOffset(feature, location, core, util.rootDetails(details.hoeDirt, 'crop'), tileX, tileY, tintColor, 32, 8);
				}
				
				if (details.heldObject != null) {
					let heldObject = util.rootDetails(details, 'heldObject');
					let item = core.items.resolve(heldObject.itemId, heldObject);
					drawObjectNonTile(feature, location, core, item, heldObject, tileX * 64, tileY * 64 - 48, (zTileY + .66) * 64 / 10000 + zTileX * 1e-5);
				}
				
				if (details.bush != null) {
					drawBush(feature, location, core, util.rootDetails(details, 'bush'), tileX, tileY, -24);
				}
			}
			finally {
				feature.endAccessory();
			}
		}
		
		return;
	}
	case 'Mannequin': {
		drawBaseObject(feature, location, core, item, details, tileX, tileY);
		
		let data = core.content.Data.Mannequins[feature.details.itemId];
		
		if (data == null) {
			return;
		}
		
		let male = data.DisplaysClothingAsMale;
		let facing = +(feature.details.facing?.int ?? 0);
		let drawLayer = Math.max(0, ((zTileY + 1) * 64 - 24) / 10000) + zTileX * 1e-5 + .0001;
		let position = [feature.tileX * 64, feature.tileY * 64 - 4 + (male ? 20 : 16)];
		let flip = (facing === 3);
		let origin = [0, 24];
		let heightOffset = male ? 0 : 4;
		let frameYOffset = [0, 1, 1, 1][facing]; // See StardewValley.FarmerRenderer:featureYOffsetPerFrame[12, 6, 0, 6]
		let farmerColors = [
			// See StardewValley.FarmerRenderer.ApplySkinColor()
			util.namedColors.Transparent, // 260
			util.namedColors.Transparent, // 261
			util.namedColors.Transparent, // 262
			
			// See StardewValley.FarmerRenderer.ApplyShoeColor()
			null, // 268
			null, // 269
			null, // 270
			null, // 271
			
			// See StardewValley.FarmerRenderer.ApplySleeveColor()
			null, // 256
			null, // 257
			null, // 258
		];
		
		if (feature.details.boots?.Boots != null && feature.details.boots['Boots@xsi:nil'] !== 'true') {
			let boots = feature.details.boots.Boots;
			
			if (boots.indexInColorSheet != null) {
				let index = +boots.indexInColorSheet * 4;
				farmerColors[3] = {ref: 'shoeColors', index: index};
				farmerColors[4] = {ref: 'shoeColors', index: index + 1};
				farmerColors[5] = {ref: 'shoeColors', index: index + 2};
				farmerColors[6] = {ref: 'shoeColors', index: index + 3};
			}
		}
		
		let shirtIndex = null;
		let hasSleeves = false;
		
		if (feature.details.shirt?.Clothing != null && feature.details.shirt['Clothing@xsi:nil'] !== 'true') {
			let clothing = feature.details.shirt.Clothing;
			let item = core.items.get('S', clothing.itemId);
			shirtIndex = (!male && clothing['indexInTileSheetFemale@xsi:nil'] !== 'true') ?
				clothing.indexInTileSheetFemale :
				null;
			shirtIndex ??= clothing.indexInTileSheet;
			let refImage = Feature.paintTypeDefs[Feature.PAINT_TYPE_FARMER_BASE].refImages.find(function (refImage) {
				return (refImage[1] === item.texture);
			});
			
			if (item.data.HasSleeves && refImage != null) {
				let textureSize = util.textureSizes[item.texture];
				let pixelIndex =
					Math.floor(shirtIndex * 8 / 128) * 32 * textureSize.width +
					shirtIndex * 8 % 128 +
					textureSize.width * 4;
				let dyePixelIndex = pixelIndex + 128;
				let color = util.namedColors.White;
				
				if (clothing.clothesColor != null) {
					color = [+clothing.clothesColor.R, +clothing.clothesColor.G, +clothing.clothesColor.B, 255];
				}
				
				farmerColors[7] = {ref: refImage[0], index: pixelIndex, tintIndex: dyePixelIndex, tintColor: color};
				farmerColors[8] = {ref: refImage[0], index: pixelIndex - textureSize.width, tintIndex: dyePixelIndex - textureSize.width, tintColor: color};
				farmerColors[9] = {ref: refImage[0], index: pixelIndex - textureSize.width * 2, tintIndex: dyePixelIndex - textureSize.width * 2, tintColor: color};
				hasSleeves = true;
			}
		}
		
		if (!hasSleeves) {
			let textureSize = util.textureSizes[data.FarmerTexture];
			farmerColors[7] = {ref: 'texture', index: 260 + textureSize.width * 2};
			farmerColors[8] = {ref: 'texture', index: 261 + textureSize.width * 2};
			farmerColors[9] = {ref: 'texture', index: 262 + textureSize.width * 2};
		}
		
		// See StardewValley.FarmerRenderer:draw()
		
		let sourceOffset = [64, 32, 0, 32][facing];
		feature.drawSprite(data.FarmerTexture, position, new util.Rect(0, sourceOffset, 16, 32), null, 0, origin, 4, flip ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, drawLayer + farmerSpriteLayers.indexOf('Base') * 1e-6, {
			paint: {
				type: Feature.PAINT_TYPE_FARMER_BASE,
				mask: data.FarmerTexture,
				colors: farmerColors,
			},
		});
		
		if (feature.details.pants?.Clothing != null && feature.details.pants['Clothing@xsi:nil'] !== 'true') {
			let clothing = feature.details.pants.Clothing;
			let item = core.items.get('P', clothing.itemId);
			let pantsIndex = (!male && clothing['indexInTileSheetFemale@xsi:nil'] !== 'true') ?
				clothing.indexInTileSheetFemale :
				null;
			pantsIndex ??= clothing.indexInTileSheet;
			
			let sourceOffset = [64, 32, 0, 32][facing];
			let pantsRect = new util.Rect(pantsIndex % 10 * 192 + (male ? 0 : 96), Math.floor(pantsIndex / 10) * 688 + sourceOffset, 16, 32);
			feature.drawSprite(item.texture, position, pantsRect, [+clothing.clothesColor.R, +clothing.clothesColor.G, +clothing.clothesColor.B, 255], 0, origin, 4, flip ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, drawLayer + farmerSpriteLayers.indexOf('Pants') * 1e-6);
		}
		
		// See StardewValley.FarmerRenderer:drawHairAndAccesories()
		
		if (shirtIndex !== null) {
			let clothing = feature.details.shirt.Clothing;
			let item = core.items.get('S', clothing.itemId);
			
			let sourceOffset = [24, 8, 0, 16][facing];
			let shirtRect = new util.Rect(shirtIndex * 8 % 128, Math.floor(shirtIndex * 8 / 128) * 32 + sourceOffset, 8, 8);
			let dyedRect = new util.Rect(shirtRect.x + 128, shirtRect.y, shirtRect.width, shirtRect.height);
			feature.drawSprite(item.texture, [position[0] + 16, position[1] + 56 + frameYOffset * 4 + heightOffset], shirtRect, null, 0, origin, 4, Sprite.EF_NONE, drawLayer + farmerSpriteLayers.indexOf('Shirt') * 1e-6);
			feature.drawSprite(item.texture, [position[0] + 16, position[1] + 56 + frameYOffset * 4 + heightOffset], dyedRect, [+clothing.clothesColor.R, +clothing.clothesColor.G, +clothing.clothesColor.B, 255], 0, origin, 4, Sprite.EF_NONE, drawLayer + 1e-7 + farmerSpriteLayers.indexOf('Shirt') * 1e-6);
		}
		
		if (feature.details.hat?.Hat != null && feature.details.hat['Hat@xsi:nil'] !== 'true') {
			let hat = feature.details.hat.Hat;
			let item = core.items.get('H', hat.itemId);
			let hatPosition = [position[0] - 8, position[1] - 16 + frameYOffset * 4 + 4 + heightOffset];
			let textureSize = util.textureSizes[item.texture];
			
			let sourceOffset = [60, 20, 0, 40][facing];
			let hatRect = new util.Rect(20 * item.spriteIndex % textureSize.width, Math.floor(20 * item.spriteIndex / textureSize.width) * 20 * 4 + sourceOffset, 20, 20);
			
			if (item.isError) {
				hatRect = item.spriteRect;
			}
			
			feature.drawSprite(item.texture, hatPosition, hatRect, null, 0, origin, 4, Sprite.EF_NONE, drawLayer + farmerSpriteLayers.indexOf('Hat') * 1e-6);
		}
		
		feature.drawSprite(data.FarmerTexture, [position[0], position[1]], new util.Rect(96, sourceOffset, 16, 32), null, 0, origin, 4, flip ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, drawLayer + .0001 + farmerSpriteLayers.indexOf(facing === 0 ? 'ArmsUp' : 'Arms') * 1e-6, {
			paint: {
				type: Feature.PAINT_TYPE_FARMER_BASE,
				mask: data.FarmerTexture,
				colors: farmerColors,
			},
		});
		
		return;
	}
	case 'Torch': {
		if (details.bigCraftable !== 'true') {
			let zBoundsCenter = (zTileY + zTileY + 1) * 32;
			feature.drawSprite(item.texture, [tileX * 64, tileY * 64], item.spriteRect, null, 0, null, 4, Sprite.EF_NONE, (zBoundsCenter - 16) / 10000);
			let color = [...util.namedColors.PaleGoldenrod];
			color[3] *= (location.details.isOutdoors === 'true') ? .35 : .43;
			feature.drawSprite(util.tx.mouseCursors, [tileX * 64 + 32 + 2, tileY * 64 + 16], new util.Rect(88, 1779, 30, 30), color, 0, [15, 15], 4, Sprite.EF_NONE, (zBoundsCenter - 15) / 10000, {isLight: true});
			return;
		}
		
		drawBaseObject(feature, location, core, item, details, tileX, tileY);
		let drawLayer = Math.max(0, ((zTileY + 1) * 64 - 24) / 10000) + zTileX * 1e-5;
		
		if (details.isOn !== 'true') {
			return;
		}
		
		if (util.hasContextTag(item, 'campfire_item')) {
			feature.drawSprite(util.tx.mouseCursors, [tileX * 64 + 16 - 4, tileY * 64 - 8], new util.Rect(276 + Math.floor((tileX * 3047 + tileY * 88) % 400 / 100) * 12, 1985, 12, 11), null, 0, null, 3, Sprite.EF_NONE, drawLayer + .0008);
			feature.drawSprite(util.tx.mouseCursors, [tileX * 64 + 32 - 12, tileY * 64], new util.Rect(276 + Math.floor((tileX * 2047 + tileY * 98) % 400 / 100) * 12, 1985, 12, 11), null, 0, null, 3, Sprite.EF_NONE, drawLayer + .0009);
			feature.drawSprite(util.tx.mouseCursors, [tileX * 64 + 32 - 20, tileY * 64 + 12], new util.Rect(276 + Math.floor((tileX * 2077 + tileY * 98) % 400 / 100) * 12, 1985, 12, 11), null, 0, null, 3, Sprite.EF_NONE, drawLayer + .001);
			
			if (item.qualifiedItemId === '(BC)278') {
				let r = util.getItemRect(item, 1, details.parentSheetIndex);
				r.height -= 16;
				feature.drawSprite(item.texture, [tileX * 64, tileY * 64 - 64 + 12], r, null, 0, null, 4, Sprite.EF_NONE, drawLayer + .0028);
			}
		}
		else {
			feature.drawSprite(util.tx.mouseCursors, [tileX * 64 + 16 - 8, tileY * 64 - 64 + 8], new util.Rect(276 + Math.floor((tileX * 3047 + tileY * 88) % 400 / 100) * 12, 1985, 12, 11), null, 0, null, 4, Sprite.EF_NONE, drawLayer + .0008);
		}
		
		return;
	}
	default:
		drawBaseObject(feature, location, core, item, details, tileX, tileY);
	}
};

export let drawBaseObject = function (feature, location, core, item, details, tileX, tileY) {
	// See StardewValley.Object:draw()
	
	let save = core.save;
	let lib = core.extensions.maps.lib;
	
	let zTileX = tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = tileY + ((feature.index >= 0) ? 0 : 20);
	
	let flipped = (details.flipped === 'true');
	let isTapper = util.hasContextTag(item, 'tapper_item');
	let heldObject = util.rootDetails(details, 'heldObject');
	let heldItem = getObjectItem(core, heldObject);
	
	if (details.bigCraftable === 'true') {
		let position = [tileX * 64, tileY * 64 - 64];
		let drawLayer = Math.max(0, ((zTileY + 1) * 64 - 24) / 10000) + zTileX * 1e-5;
		let offset = 0;
		
		if (details.showNextIndex === 'true') {
			offset = 1;
		}
		
		if (heldObject != null) {
			let machineData = core.content.Data.Machines[item.qualifiedItemId];
			
			if (machineData != null && machineData.IsIncubator) {
				offset = 1;
				
				for (let farmAnimal of core.content.Data.FarmAnimals) {
					if (farmAnimal.EggItemIds != null && farmAnimal.EggItemIds.includes(heldObject.itemId)) {
						offset = farmAnimal.IncubatorParentSheetOffset ?? 1;
						break;
					}
				}
			}
		}
		
		if (feature.meta.type === 'Mannequin') {
			offset = +(feature.details.facing?.int ?? 0);
		}
		
		if (isTapper) {
			drawLayer = Math.max(0, ((zTileY + 1) * 64 + 2) / 10000) + zTileX / 1000000;
		}
		
		if (item.qualifiedItemId === '(BC)272') {
			feature.drawSprite(item.texture, position, util.getItemRect(item, 1, details.parentSheetIndex), null, 0, null, 4, Sprite.EF_NONE, drawLayer);
			feature.drawSprite(item.texture, [position[0] + 8.5 * 4, position[1] + 12 * 4], util.getItemRect(item, 2, details.parentSheetIndex), null, 0, [7.5, 15.5], 4, Sprite.EF_NONE, drawLayer + 1e-5);
			return;
		}
		
		feature.drawSprite(item.texture, position, util.getItemRect(item, offset, details.parentSheetIndex), null, 0, null, 4, Sprite.EF_NONE, drawLayer);
		
		if (item.qualifiedItemId === '(BC)17' && +(details.minutesUntilReady ?? 0) > 0) {
			feature.drawSprite(util.tx.objectSpriteSheet, [tileX * 64 + 32, tileY * 64], util.getStandardTextureRect(util.textureSizes[util.tx.objectSpriteSheet], 435, 16, 16), null, 0, [8, 8], 4, Sprite.EF_NONE, Math.max(0, ((zTileY + 1) * 64) / 10000 + .0001 + zTileX * 1e-5));
		}
		
		if (item.qualifiedItemId === '(BC)126') {
			let hatId = ((+details.quality !== 0) ? ((+details.quality - 1) + '') : details.preservedParentSheetIndex);
			
			if (hatId != null) {
				let hatItem = core.items.get('H', hatId);
				feature.drawSprite(hatItem.texture, [position[0] - 3 * 4, position[1] - 6 * 4], hatItem.spriteRect, null, 0, null, 4, Sprite.EF_NONE, Math.max(0, ((zTileY + 1) * 64 - 20) / 10000) + zTileX * 1e-5);
			}
		}
	}
	else {
		let passable = lib.itemIsPassable(item);
		let zBoundsTop = zTileY * 64;
		let zBoundsBottom = zBoundsTop + 64;
		
		if (details['@xsi:type'] === 'Torch' || item.qualifiedItemId === '(O)590') {
			zBoundsTop += 24;
		}
		
		if (item.qualifiedItemId === '(O)590') {
			feature.drawSprite(util.tx.mouseCursors, [tileX * 64 + 32, tileY * 64 + 32], new util.Rect(368, 32, 16, 16), null, 0, [8, 8], 4, flipped ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, (passable ? zBoundsTop : zBoundsBottom) / 10000);
			return;
		}
		
		if (item.qualifiedItemId === '(O)SeedSpot') {
			feature.drawSprite(util.tx.mouseCursors_1_6, [tileX * 64 + 32, tileY * 64 + 32], new util.Rect(160, 0, 17, 16), null, 0, [8, 8], 4, flipped ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, (passable ? zBoundsTop : zBoundsBottom) / 10000);
			return;
		}
		
		if (+details.fragility !== 2) {
			feature.drawBasicShadow([tileX * 64 + 32, tileY * 64 + 51 + 4], zBoundsBottom / 15000);
		}
		
		feature.drawSprite(item.texture, [tileX * 64 + 32, tileY * 64 + 32], item.spriteRect, null, 0, [8, 8], 4, flipped ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, (passable ? zBoundsTop : (zBoundsTop + zBoundsBottom) / 2) / 10000);
		
		if (['(O)599', '(O)621', '(O)645'].includes(item.qualifiedItemId)) {
			if (heldItem != null) {
				let offsetY = (heldItem.qualifiedItemId === '(O)913') ? -20 : 0;
				feature.beginAccessory('sprinklerUpgrade');
				
				try {
					feature.drawSprite(heldItem.texture, [tileX * 64 + 32, tileY * 64 + 32 + offsetY], util.getItemRect(heldItem, 1), null, 0, [8, 8], 4, flipped ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, (passable ? zBoundsTop : zBoundsBottom) / 10000 + 1e-5);
				}
				finally {
					feature.endAccessory();
				}
			}
			
			if (+details.SpecialVariable === 999999) {
				// Torch on sprinkler.
				
				let x = tileX * 64 - 2;
				let y;
				let layerDepth;
				
				if (heldItem != null && heldItem.qualifiedItemId === '(O)913') {
					y = tileY * 64 - 32;
					layerDepth = zBoundsBottom / 10000 + 1e-6;
				}
				else {
					y = tileY * 64 - 32 + 12;
					layerDepth = (zBoundsBottom + 2) / 10000;
				}
				
				// See StardewValley.Torch:drawBasicTorch()
				
				let sourceRect = new util.Rect(336, 48, 16, 16);
				feature.beginAccessory('sprinklerTorch');
				
				try {
					feature.drawSprite(util.tx.objectSpriteSheet, [x, y], sourceRect, null, 0, null, 4, Sprite.EF_NONE, layerDepth);
					let color = [...util.namedColors.PaleGoldenrod];
					color[3] *= (location.details.isOutdoors === 'true') ? .35 : .43;
					feature.drawSprite(util.tx.mouseCursors, [x + 32 + 2, y + 16], new util.Rect(88, 1779, 30, 30), color, 0, [15, 15], 4, Sprite.EF_NONE, 1, {isLight: true});
				}
				finally {
					feature.endAccessory();
				}
			}
		}
	}
	
	if (details.readyForHarvest !== 'true') {
		return;
	}
	
	let baseSort = ((zTileY + 1) * 64) / 10000 + zTileX / 50000;
	
	if (isTapper || item.qualifiedItemId === '(BC)MushroomLog') {
		baseSort += .02;
	}
	
	feature.beginAccessory('readyForHarvest');
	
	try {
		feature.drawSprite(util.tx.mouseCursors, [tileX * 64 - 8, tileY * 64 - 96 - 16], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, baseSort + 1e-6);
		
		if (heldItem != null) {
			if (heldObject['@xsi:type'] === 'ColoredObject') {
				drawColoredObjectInMenu(feature, location, core, heldItem, heldObject, [feature.tileX * 64, feature.tileY * 64 - 100], 1, .75, baseSort + 1.1e-5, null, false);
			}
			else {
				feature.drawSprite(heldItem.texture, [tileX * 64 + 32, tileY * 64 - 64 - 8], heldItem.spriteRect, [255, 255, 255, 255 * .75], 0, [8, 8], 4, Sprite.EF_NONE, baseSort + 1e-5);
				drawMenuIcons(feature, +(heldObject.stack ?? 1), +(heldObject.quality ?? 0), [tileX * 64, tileY * 64 - 64 - 32 - 4], 1, 1, baseSort + 1.2e-5);
			}
		}
	}
	finally {
		feature.endAccessory();
	}
};

export let drawColoredObjectInMenu = function (feature, location, core, item, details, position, scaleSize, transparency, layerDepth, color = null, drawShadow = true) {
	// See StardewValley.Objects.ColoredObject:drawInMenu()
	
	let bigCraftable = (details.bigCraftable === 'true');
	
	if (details.isRecipe === 'true') {
		scaleSize *= .75;
		transparency = .5;
	}
	
	if (drawShadow && !bigCraftable && !['(O)590', '(O)SeedSpot'].includes(item.itemId)) {
		feature.drawSprite(util.tx.shadowTexture, [position[0] + 32, position[1] + 48], new util.Rect(0, 0, 12, 7), [255, 255, 255, 255 * .5], 0, [6, 3.5], 3, Sprite.EF_NONE, layerDepth - .0001, {isShadow: true});
	}
	
	let origin = bigCraftable ? [32, 64] : [8, 8];
	let scale = bigCraftable ? ((scaleSize < .2) ? scaleSize : (scaleSize / 2)) : (4 * scaleSize);
	
	if (item.itemId === 'SmokedFish') {
		// See StardewValley.Objects.ColoredObject:drawSmokedFish()
		
		feature.drawSprite(item.texture, [position[0] + 32 * scaleSize, position[1] + 32 * scaleSize], util.getItemRect(item, 0, +details.preservedParentSheetIndex), [255, 255, 255, 255 * transparency], 0, [origin[0] * scaleSize, origin[1] * scaleSize], scale, Sprite.EF_NONE, Math.min(1, layerDepth + 1e-5));
		feature.drawSprite(item.texture, [position[0] + 32 * scaleSize, position[1] + 32 * scaleSize], util.getItemRect(item, 0, +details.preservedParentSheetIndex), [80, 30, 10, 255 * .6 * transparency], 0, [origin[0] * scaleSize, origin[1] * scaleSize], scale, Sprite.EF_NONE, Math.min(1, layerDepth + 1.5e-5));
	}
	else if (details.colorSameIndexAsParentSheetIndex !== 'true') {
		let coloredSourceRect = util.getItemRect(item, 1, +details.parentSheetIndex);
		let color = details.color;
		feature.drawSprite(item.texture, [position[0] + 32 * scaleSize, position[1] + 32 * scaleSize], util.getItemRect(item, 0, +details.parentSheetIndex), [255, 255, 255, 255 * transparency], 0, [origin[0] * scaleSize, origin[1] * scaleSize], scale, Sprite.EF_NONE, layerDepth);
		feature.drawSprite(item.texture, [position[0] + 32 * scaleSize, position[1] + 32 * scaleSize], coloredSourceRect, [+color.R, +color.G, +color.B, +color.A * transparency], 0, [origin[0] * scaleSize, origin[1] * scaleSize], scale, Sprite.EF_NONE, Math.min(1, layerDepth + 2e-5));
	}
	else {
		let color = details.color;
		feature.drawSprite(item.texture, [position[0] + 32 * scaleSize, position[1] + 32 * scaleSize], util.getItemRect(item, 0, +details.parentSheetIndex), [+color.R, +color.G, +color.B, +color.A * transparency], 0, [origin[0] * scaleSize, origin[1] * scaleSize], scale, Sprite.EF_NONE, Math.min(1, layerDepth + 2e-5));
	}
	
	drawMenuIcons(feature, +(details.stack ?? 1), +(details.quality ?? 0), position, scaleSize, transparency, layerDepth + 3e-5);
};

export let drawMenuIcons = function (feature, stack, quality, position, scaleSize, transparency, layerDepth) {
	// See StardewValley.Item.DrawMenuIcons()
	
	let scale = scaleSize * 4; // 4 instead of 3, for readability.
	
	if (stack > 1) {
		let x = position[0] + 64 - getWidthOfTinyDigitString(stack, scale) + scale;
		let y = position[1] + 64 - 6 * scale + 1;
		feature.drawTinyDigits(stack, [x, y], scale, Math.min(1, layerDepth + 1e-6), null);
	}
	
	if (quality > 0) {
		let rect = (quality < 4) ? new util.Rect(338 + (quality - 1) * 8, 400, 8, 8) : new util.Rect(346, 392, 8, 8);
		feature.drawSprite(util.tx.mouseCursors, [position[0] + 12, position[1] + 52], rect, [255, 255, 255, 255 * transparency], 0, [4, 4], scale, Sprite.EF_NONE, layerDepth);
	}
	
	// TODO: Book, bar, recipe.
};

export let drawObjectNonTile = function (feature, location, core, item, details, xNonTile, yNonTile, layerDepth) {
	let save = core.save;
	let lib = core.extensions.maps.lib;
	
	switch (details['@xsi:type']) {
	case 'Torch':
		feature.drawSprite(item.texture, [xNonTile, yNonTile], item.spriteRect, null, 0, null, 4, Sprite.EF_NONE, layerDepth);
		let color = [...util.namedColors.PaleGoldenrod];
		color[3] *= (location.details.isOutdoors === 'true') ? .35 : .43;
		feature.drawSprite(util.tx.mouseCursors, [xNonTile + 32 + 4, yNonTile + 16 + 4], new util.Rect(88, 1779, 30, 30), color, 0, [15, 15], 8, Sprite.EF_NONE, 1, {isLight: true});
		break;
	
	default:
		drawBaseObjectNonTile(feature, location, core, item, details, xNonTile, yNonTile, layerDepth);
	}
};

export let drawBaseObjectNonTile = function (feature, location, core, item, details, xNonTile, yNonTile, layerDepth) {
	let save = core.save;
	let lib = core.extensions.maps.lib;
	
	feature.drawSprite(item.texture, [xNonTile, yNonTile], item.spriteRect, null, 0, null, 4, Sprite.EF_NONE, layerDepth);
};

export let getObjectItem = function (core, details) {
	if (details == null) {
		return null;
	}
	
	return core.items.resolve(details.itemId, details);
};
