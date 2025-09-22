import Feature from '../classes/Feature.js';
import Location from '../classes/Location.js';
import Sprite from '../classes/Sprite.js';
import Warp from '../classes/Warp.js';

import * as util from '../../../util.js';

import * as fBuildings from './buildings.js';
import * as fFurniture from './furniture.js';
import * as fLargeTerrainFeatures from './largeTerrainFeatures.js';
import * as fMuseumPieces from './museumPieces.js';
import * as fObjects from './objects.js';
import * as fResourceClumps from './resourceClumps.js';
import * as fTerrainFeatures from './terrainFeatures.js';

export let loadXML = function (locationElement, context) {
	let save = context.core.save;
	let common = context.core.common;
	let ext = context.core.extVars.maps;
	let baseUtil = context.core.baseUtil;
	let lib = context.core.extensions.maps.lib;
	
	$(locationElement).find('> buildings > Building').each(function () {
		let feature = new Feature(
			'buildings',
			+$(this).find('> tileX').first().text(),
			+$(this).find('> tileY').first().text(),
			util.getElementDetails(this, {
				excludeChildren: [
					'indoors',
				],
			})
		);
		context.features.push(feature);
		
		let indoorsDetails = null;
		
		$(this).find('> indoors').first().each(function () {
			indoorsDetails = util.getElementDetails(this, {
				excludeChildren: [
					'buildings',
					'furniture',
					'largeTerrainFeatures',
					'museumPieces',
					'objects',
					'resourceClumps',
					'terrainFeatures',
				],
			});
			
			util.addDetail(feature.details, indoorsDetails);
			
			switch (indoorsDetails['@xsi:type']) {
			case 'Cabin': {
				let owner = common.farmersById[indoorsDetails.farmhandReference] ?? common.player;
				feature.details['sp:upgradeLevelToShow'] = Math.min(owner.houseUpgradeLevel ?? 0, 2) + '';
				break;
			}}
		});
		
		updateFeature(feature, context.location, context.core);
		
		$(this).find('> indoors').first().each(function () {
			let buildingData = context.core.content.Data.Buildings[feature.details.buildingType];
			
			let data = {
				...context.core.content.Data.Locations.Default,
				DisplayName: buildingData.Name,
				DefaultArrivalTile: {
					// The arrival tile is the first warp tile defined in the interior's map.
					X: null,
					Y: null,
				},
				ExcludeFromNpcPathfinding: true,
				CreateOnLoad: {
					MapPath: `Maps\\${buildingData.IndoorMap}`,
					Type: buildingData.IndoorMapType,
					AlwaysActive: true,
				},
				ArtifactSpots: [],
				FishAreas: {},
				Fish: [],
				Forage: [],
			};
			
			switch (indoorsDetails['@xsi:type']) {
			case 'Cabin': {
				let owner = common.farmersById[indoorsDetails.farmhandReference] ?? common.player;
				
				if (owner.name) {
					data.DisplayName = `${owner.name}'s Cabin`;
				}
				
				break;
			}}
			
			data.DisplayName += ` at (${feature.tileX}, ${feature.tileY})`;
			
			let location = new Location(context.core, feature.details.indoors.uniqueName, indoorsDetails, context.location, data);
			ext.locations[location.id] = location;
			ext.locationIds.push(location.id);
			
			let loadContext = {
				core: context.core,
				location: location,
				features: location.saveFeatures,
			};
			
			fBuildings.loadXML(this, loadContext);
			fFurniture.loadXML(this, loadContext);
			fLargeTerrainFeatures.loadXML(this, loadContext);
			fMuseumPieces.loadXML(this, loadContext);
			fObjects.loadXML(this, loadContext);
			fResourceClumps.loadXML(this, loadContext);
			fTerrainFeatures.loadXML(this, loadContext);
		});
	});
};

export let syncDetails = function (feature, location, core) {
	feature.details.tileX = feature.tileX + '';
	feature.details.tileY = feature.tileY + '';
};

export let updateFeature = function (feature, location, core) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.maps;
	let lib = core.extensions.maps.lib;
	
	let buildingType = feature.details.buildingType;
	let buildingData = core.content.Data.Buildings[buildingType];
	let daysOfConstructionLeft = +feature.details.daysOfConstructionLeft;
	let nonInstancedIndoorsName = feature.details.nonInstancedIndoorsName?.string || null;
	
	feature.meta.name = core.localizer.parseText(buildingData.Name);
	feature.meta.width = +feature.details.tilesWide;
	feature.meta.height = +feature.details.tilesHigh;
	feature.meta.type = feature.details['@xsi:type'] ?? null;
	feature.meta.buildingType = buildingType;
	feature.meta.additionalTilePropertyRadius = buildingData.AdditionalTilePropertyRadius ?? 0;
	feature.meta.tileProperties = [];
	
	if (buildingData.CollisionMap != null) {
		// See StardewValley.GameData.Buildings.BuildingData:IsTilePassable()
		
		feature.meta.collisionMap = [];
		
		for (let line of buildingData.CollisionMap.trim().split('\n')) {
			line = line.trim();
			let row = new Array(line.length);
			feature.meta.collisionMap.push(row);
			
			for (let i = 0; i < line.length; ++i) {
				row[i] = (line.charAt(i) === 'X');
			}
		}
	}
	
	if (daysOfConstructionLeft > 0) {
		// Building is under construction.
		
		feature.addNote(`days left: ${daysOfConstructionLeft}`, Feature.NOTE_PARENS);
		feature.meta.tileProperties.push({
			layer: 'Back',
			x: feature.tileX,
			y: feature.tileY,
			width: feature.meta.width,
			height: feature.meta.height,
			name: 'NoSpawn',
			value: 'All',
		});
		
		return;
	}
	
	let humanDoorX = +(feature.details.humanDoor?.X ?? buildingData.HumanDoor?.X ?? -1);
	let humanDoorY = +(feature.details.humanDoor?.Y ?? buildingData.HumanDoor?.Y ?? -1);
	
	switch (feature.meta.type) {
	case 'FishPond': {
		let fishDetails = util.nilOrRootDetails(feature.details.fishType, 'int');
		
		if (fishDetails != null) {
			let fish = core.items.resolve(fishDetails.$);
			feature.meta.name = `${fish.displayName} Pond`;
			
			if (+feature.details.maxOccupants > 0) {
				feature.addNote(`${feature.details.currentOccupants ?? 0}/${feature.details.maxOccupants}`, Feature.NOTE_PARENS);
			}
		}
		
		let neededItemDetails = util.nilOrRootDetails(feature.details.neededItem, 'Item');
		
		if (neededItemDetails != null && feature.details.hasCompletedRequest?.boolean !== 'true') {
			let item = core.items.resolve(neededItemDetails.itemId, neededItemDetails);
			let needs = util.getItemText(item, +(feature.details.neededItemCount?.int ?? 1))
			feature.addNote(`needs ${needs}`, Feature.NOTE_COMMA);
		}
		
		let outputDetails = util.nilOrRootDetails(feature.details.output, 'Item');
		
		if (outputDetails != null) {
			let item = core.items.resolve(outputDetails.itemId, outputDetails);
			let holding = util.getItemText(item, +outputDetails.stack, +outputDetails.quality, outputDetails.name);
			feature.addNote(`holding ${holding}`, Feature.NOTE_COMMA);
		}
	}
	case 'GreenhouseBuilding': {
		// See StardewValley.Buildings.GreenhouseBuilding:doesTileHaveProperty()
		
		for (let [name, value] of Object.entries({Type: 'Stone', NoSpawn: 'All', Buildable: null})) {
			feature.meta.tileProperties.push({
				layer: 'Back',
				x: humanDoorX - 1,
				y: humanDoorY + 1,
				width: 3,
				height: feature.meta.height - humanDoorY + 1,
				name: name,
				value: value,
			});
		}
		
		for (let [name, value] of Object.entries({Buildable: 'T', NoSpawn: 'Tree', Diggable: null})) {
			feature.meta.tileProperties.push({
				layer: 'Back',
				x: -1,
				y: 0,
				width: feature.meta.width + 1,
				height: feature.meta.height + 1,
				name: name,
				value: value,
			}, {
				layer: 'Back',
				x: 1,
				y: feature.meta.height + 1,
				width: feature.meta.width - 2,
				height: 1,
				name: name,
				value: value,
			});
		}
		
		break;
	}
	case 'JunimoHut': {
		feature.meta.domainType = 'junimoHut';
		feature.meta.domainSize = 8;
		feature.meta.domainOffsetX = 1;
		feature.meta.domainOffsetY = 1;
		break;
	}}
	
	switch (feature.meta.buildingType) {
	case 'Cabin': {
		let owner = common.farmersById[feature.details.indoors?.farmhandReference] ?? common.player;
		
		if (owner.name) {
			feature.meta.name = `${owner.name}'s Cabin`;
		}
		
		break;
	}
	case 'Farmhouse': {
		feature.meta.noErase = (nonInstancedIndoorsName === 'FarmHouse');
		break;
	}
	case 'Greenhouse': {
		feature.meta.noErase = (nonInstancedIndoorsName === 'Greenhouse');
		break;
	}
	case 'Silo': {
		let hayCapacity = 0;
		
		for (let otherFeature of location.saveFeatures) {
			if (otherFeature.kind === 'buildings' && +otherFeature.details.hayCapacity > 0) {
				hayCapacity += +otherFeature.details.hayCapacity;
			}
		}
		
		feature.addNote(`hay: ${location.details.piecesOfHay ?? 0} / ${hayCapacity}`, Feature.NOTE_PARENS);
		feature.meta.noteStyle = Feature.NOTE_PARENS;
		break;
	}}
	
	for (let tileProperty of buildingData.TileProperties ?? []) {
		feature.meta.tileProperties.push({
			layer: tileProperty.Layer,
			x: tileProperty.TileArea.X,
			y: tileProperty.TileArea.Y,
			width: tileProperty.TileArea.Width,
			height: tileProperty.TileArea.Height,
			name: tileProperty.Name,
			value: tileProperty.Value,
		});
	}
	
	let indoorsLocationId = feature.details.nonInstancedIndoorsName?.string || null;
	
	if (feature.details.indoors != null && feature.details.indoors.uniqueName != null) {
		indoorsLocationId = feature.details.indoors.uniqueName;
	}
	
	if (indoorsLocationId !== null) {
		if (humanDoorX >= 0 && humanDoorY >= 0) {
			feature.meta.warp = new Warp(humanDoorX, humanDoorY, indoorsLocationId);
		}
	}
	
	// See StardewValley.Buildings.Building:CanBePainted()
	
	let isBrokenGreenhouse = (feature.meta.type === 'GreenhouseBuilding' && !lib.gameState.greenhouseUnlocked);
	let isSmallHouse = ((feature.meta.buildingType === 'Cabin' || (indoorsLocationId ?? '').toLowerCase() === 'farmhouse') && ext.locations[indoorsLocationId]?.type === 'FarmHouse' && +(feature.details['sp:upgradeLevelToShow'] ?? lib.gameState.houseUpgradeLevel) < 2);
	
	if (!isBrokenGreenhouse && !isSmallHouse) {
		let paintDataKey;
		
		switch (feature.meta.buildingType) {
		case 'Farmhouse': paintDataKey = 'House'; break;
		case 'Cabin': paintDataKey = 'Stone Cabin'; break;
		default: paintDataKey = feature.meta.buildingType;
		}
		
		if (Object.hasOwn(core.content.Data.PaintData, paintDataKey)) {
			let paintData = core.content.Data.PaintData[paintDataKey].split('/');
			feature.meta.paintRegions = [];
			
			for (let i = 0, j = 0; j < paintData.length; ++i, j += 2) {
				let region = {
					name: paintData[j],
					brightnessRange: [],
				};
				feature.meta.paintRegions.push(region);
				
				for (let value of paintData[j + 1].split(/ +/)) {
					if (value !== '') {
						region.brightnessRange.push(+value);
					}
				}
			}
		}
	}
};

export let drawFeature = function (feature, location, core) {
	let save = core.save;
	let common = core.common;
	let lib = core.extensions.maps.lib;
	
	let zTileX = feature.tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = feature.tileY + ((feature.index >= 0) ? 0 : 20);
	
	let buildingType = feature.details.buildingType;
	let buildingData = core.content.Data.Buildings[buildingType];
	let daysOfConstructionLeft = +feature.details.daysOfConstructionLeft;
	let nonInstancedIndoorsName = feature.details.nonInstancedIndoorsName?.string || null;
	
	if (daysOfConstructionLeft > 0) {
		// See StardewValley.Buildings.Building:drawInConstruction()
		
		let drawFloor = (daysOfConstructionLeft === 1);
		
		for (let y = 0; y < feature.meta.height; ++y) {
			for (let x = 0; x < feature.meta.width; ++x) {
				let floorSheetX = 367;
				let floorSheetY = 261;
				let floorOffsetY = 16;
				let sheetX;
				let sheetY;
				let depth = y * 64;
				
				if (x === Math.floor(feature.meta.width / 2) && y === feature.meta.height - 1) {
					floorSheetY = 277;
					floorOffsetY -= 4;
					sheetX = 367;
					sheetY = 309;
					depth += 63;
				}
				else if (x === 0 && y === 0) {
					floorSheetX = 351;
					sheetX = 351;
					sheetY = 293;
					depth += 63;
				}
				else if (x === feature.meta.width - 1 && y === 0) {
					floorSheetX = 383;
					sheetX = 383;
					sheetY = 293;
					depth += 63;
				}
				else if (x === feature.meta.width - 1 && y === feature.meta.height - 1) {
					floorSheetX = 383;
					floorSheetY = 277;
					sheetX = 383;
					sheetY = 325;
				}
				else if (x === 0 && y === feature.meta.height - 1) {
					floorSheetX = 351;
					floorSheetY = 277;
					sheetX = 351;
					sheetY = 325;
				}
				else if (x === feature.meta.width - 1) {
					floorSheetX = 383;
					sheetX = 383;
					sheetY = 309;
				}
				else if (y === feature.meta.height - 1) {
					floorSheetY = 277;
					sheetX = 367;
					sheetY = 325;
				}
				else if (x === 0) {
					floorSheetX = 351;
					sheetX = 351;
					sheetY = 309;
				}
				else if (y === 0) {
					sheetX = 367;
					sheetY = 293;
					depth += 63;
				}
				
				if (drawFloor) {
					feature.drawSprite(util.tx.mouseCursors, [(feature.tileX + x) * 64, (feature.tileY + y) * 64 + floorOffsetY], new util.Rect(floorSheetX, floorSheetY, 16, 16), null, 0, null, 4, Sprite.EF_NONE, 1e-5);
				}
				
				if (sheetX != null) {
					feature.drawSprite(util.tx.mouseCursors, [(feature.tileX + x) * 64, (feature.tileY + y) * 64], new util.Rect(sheetX, sheetY, 16, 16), null, 0, null, 4, Sprite.EF_NONE, depth / 10000);
				}
			}
		}
		
		return;
	}
	
	let shadowProperties = {isShadow: true};
	let humanDoorX = +(feature.details.humanDoor?.X ?? buildingData.HumanDoor?.X ?? -1);
	let humanDoorY = +(feature.details.humanDoor?.Y ?? buildingData.HumanDoor?.Y ?? -1);
	let skinId = feature.details.skinId?.string || null;
	let texture = null;
	
	if (skinId !== null) {
		for (let skin of buildingData.Skins ?? []) {
			if (skin.Id === skinId) {
				texture = util.normalizeTexture(skin.Texture);
				break;
			}
		}
	}
	
	texture ??= util.normalizeTexture(buildingData.Texture);
	let paintProperties = {};
	
	if (feature.meta.paintRegions != null) {
		paintProperties.paint = {
			type: Feature.PAINT_TYPE_BUILDINGS,
			mask: texture + '_PaintMask',
			useRegions: true,
		};
	}
	
	switch (feature.meta.type) {
	case 'GreenhouseBuilding': {
		let entranceTileset = `Maps/${location.getSeasonName()}_outdoorsTileSheet`;
		let x = feature.tileX + humanDoorX - 1;
		let y = feature.tileY + humanDoorY + 1;
		
		for (let i = 0; i < 6; ++i) {
			feature.drawSprite(entranceTileset, [(x + (i >> 1)) * 64, (y + (i & 1)) * 64], new util.Rect(192 + (i & 1) * 16, 512 + (i & 1) * 16, 16, 16), null, 0, null, 4, Sprite.EF_NONE, 0);
		}
		
		// Draw the shadow. Normally, this would be in the background layer,
		// but we'll approximate the effect by shifting it into the negative
		// range of z values.
		
		feature.drawSprite(texture, [(feature.tileX - 1) * 64, feature.tileY * 64], new util.Rect(112, 144, 128, 144), null, 0, null, 4, Sprite.EF_NONE, -1, shadowProperties);
		break;
	}}
	
	if (buildingData.DrawShadow) {
		// See StardewValley.Buildings.Building:drawShadow()
		
		let position = [feature.tileX * 64, (feature.tileY + feature.meta.height) * 64];
		let middleShadow = new util.Rect(672, 394, 16, 16);
		
		feature.drawSprite(util.tx.mouseCursors, position, new util.Rect(656, 394, 16, 16), null, 0, null, 4, Sprite.EF_NONE, 1e-5, shadowProperties);
		position[0] += 64;
		
		for (let i = 2; i < feature.meta.width; ++i) {
			feature.drawSprite(util.tx.mouseCursors, position, middleShadow, null, 0, null, 4, Sprite.EF_NONE, 1e-5, shadowProperties);
			position[0] += 64;
		}
		
		feature.drawSprite(util.tx.mouseCursors, position, new util.Rect(688, 394, 16, 16), null, 0, null, 4, Sprite.EF_NONE, 1e-5, shadowProperties);
	}
	
	let baseSortY = (zTileY + feature.meta.height) * 64;
	let sortY = (baseSortY - buildingData.SortTileOffset * 64) / 10000;
	let drawPosition = [feature.tileX * 64, feature.tileY * 64 + feature.meta.height * 64];
	let drawOffset = buildingData.DrawOffset.split(/\s*,\s*/);
	drawOffset[0] = +drawOffset[0] * 4;
	drawOffset[1] = +drawOffset[1] * 4;
	
	// See StardewValley.Buildings.Building:getSourceRect()
	
	let mainSourceRect;
	
	switch (feature.meta.type) {
	case 'JunimoHut':
		mainSourceRect = new util.Rect(location.getSeasonNumber() * 48, 0, 48, 64);
		break;
	
	default:
		mainSourceRect = util.Rect.from(buildingData.SourceRect);
		
		if (mainSourceRect.width === 0 && mainSourceRect.height === 0 && Object.hasOwn(util.textureSizes, texture)) {
			let textureSize = util.textureSizes[texture];
			mainSourceRect.width = textureSize.width;
			mainSourceRect.height = textureSize.height;
		}
		else {
			if (buildingData.IndoorMapType === 'StardewValley.Locations.Cabin') {
				mainSourceRect.x += mainSourceRect.width * Math.min(+(feature.details['sp:upgradeLevelToShow'] ?? lib.gameState.houseUpgradeLevel), 2);
			}
			else if (nonInstancedIndoorsName === 'FarmHouse') {
				mainSourceRect.y += mainSourceRect.height * Math.min(+(feature.details['sp:upgradeLevelToShow'] ?? lib.gameState.houseUpgradeLevel), 2);
				
				// Stardew handles the farm house's offset via the DrawOffset
				// setting, but this leaves a fully transparent column of tiles,
				// which feels strange with our fading behavior. Let's just trim
				// off the transparent column instead.
				
				drawOffset[0] = 0;
				mainSourceRect.x += 16;
				mainSourceRect.width -= 16;
			}
			
			mainSourceRect.x += buildingData.SeasonOffset.X * lib.gameState.seasonNumber;
			mainSourceRect.y += buildingData.SeasonOffset.Y * lib.gameState.seasonNumber;
			
			if (buildingType === 'Greenhouse' && !lib.gameState.greenhouseUnlocked) {
				mainSourceRect.y -= mainSourceRect.height;
			}
		}
	}
	
	let drawOrigin = [0, mainSourceRect.height];
	
	switch (feature.meta.type) {
	case 'FishPond': {
		let overrideColor = {r: 255, g: 255, b: 255, a: 255};
		let coloredWater = true;
		let detailColor = feature.details.overrideWaterColor?.Color;
		
		if (detailColor) {
			overrideColor.r = +detailColor.R;
			overrideColor.g = +detailColor.G;
			overrideColor.b = +detailColor.B;
			overrideColor.a = +detailColor.A;
		}
		
		if (overrideColor.r === 255 && overrideColor.g === 255 && overrideColor.b === 255 && overrideColor.a === 255) {
			overrideColor = {r: 60, g: 126, b: 150, a: 255};
			coloredWater = false;
		}
		
		feature.drawSprite(texture, drawPosition, new util.Rect(0, 80, 80, 80), [overrideColor.r, overrideColor.g, overrideColor.b, overrideColor.a], 0, [0, 80], 4, Sprite.EF_NONE, ((feature.tileY + .5) * 64 - 3) / 10000);
		
		let waveColor;
		
		if (coloredWater) {
			waveColor = {r: overrideColor.r, g: overrideColor.g, b: overrideColor.b, a: overrideColor.a * .5};
		}
		else if (location.details.waterColor != null) {
			waveColor = {r: +location.details.waterColor.R, g: +location.details.waterColor.G, b: +location.details.waterColor.B, a: +location.details.waterColor.A};
		}
		else {
			waveColor = lib.seasonWaterColors[location.getSeasonNumber()];
		}
		
		for (let y = 0; y < 4; ++y) {
			for (let x = 0; x < 4; ++x) {
				// Why do the waves seem to require linear multiplication while other
				// tinted things look more correct with sRGB multiplication? The same is
				// true with the map's water tiles.
				
				feature.drawSprite(util.tx.mouseCursors, [(feature.tileX + x) * 64 + 32, (feature.tileY + y) * 64 + 32], new util.Rect(0, 2064 + (((feature.tileX + x + feature.tileY + y) % 2 != 0) ? 128 : 0), 64, 64), [waveColor.r, waveColor.g, waveColor.b, waveColor.a], 0, null, 1, Sprite.EF_NONE, ((feature.tileY + .5) * 64 - 2) / 10000, {linearTint: true});
			}
		}
		
		if (!coloredWater) {
			feature.drawSprite(texture, [feature.tileX * 64 + 64, feature.tileY * 64 + 48], new util.Rect(16, 160, 48, 7), null, 0, null, 4, Sprite.EF_NONE, ((zTileY + .5) * 64 + 1) / 10000);
		}
		
		feature.drawSprite(texture, drawPosition, new util.Rect(0, 0, 80, 80), null, 0, [0, 80], 4, Sprite.EF_NONE, (zTileY + .5) * 64 / 10000);
		
		// Netting.
		
		let nettingStyle = +(feature.details.nettingStyle?.int ?? 0);
		
		if (nettingStyle < 3) {
			feature.drawSprite(texture, [drawPosition[0], drawPosition[1] - 128], new util.Rect(80, nettingStyle * 48, 80, 48), null, 0, [0, 80], 4, Sprite.EF_NONE, ((zTileY + .5) * 64 + 2) / 10000);
		}
		
		// Sign.
		
		let signDetails = util.nilOrRootDetails(feature.details.sign, 'Object');
		
		if (signDetails != null) {
			feature.beginAccessory('FishPond.sign');
			
			try {
				let sign = core.items.resolve(signDetails.itemId, signDetails);
				
				feature.drawSprite(sign.texture, [feature.tileX * 64 + 8, feature.tileY * 64 + feature.meta.height * 64 - 128 - 32], sign.spriteRect, null, 0, null, 4, Sprite.EF_NONE, ((zTileY + .5) * 64 + 2) / 10000);
				
				let fishDetails = util.nilOrRootDetails(feature.details.fishType, 'int');
				
				if (fishDetails != null) {
					let fish = core.items.resolve(fishDetails.$);
					let yOffset = (+feature.details.maxOccupants === 1) ? 6 : 0;
					let color = [...util.namedColors.Black];
					
					feature.drawSprite(fish.texture, [feature.tileX * 64 + 8 + 8 - 4, feature.tileY * 64 + feature.meta.height * 64 - 128 - 8 + 4 + yOffset], fish.spriteRect, [color[0], color[1], color[2], color[3] * .4], 0, null, 3, Sprite.EF_NONE, ((zTileY + .5) * 64 + 3) / 10000);
					feature.drawSprite(fish.texture, [feature.tileX * 64 + 8 + 8 - 1, feature.tileY * 64 + feature.meta.height * 64 - 128 - 8 + 1 + yOffset], fish.spriteRect, null, 0, null, 3, Sprite.EF_NONE, ((zTileY + .5) * 64 + 4) / 10000);
					
					if (+feature.details.maxOccupants > 1) {
						let stack = +(feature.details.currentOccupants ?? 0);
						feature.drawTinyDigits(stack, [feature.tileX * 64 + 32 + 8 + ((stack < 10) ? 8 : 0), feature.tileY * 64 + feature.meta.height * 64 - 96], 4, ((zTileY + .5) * 64 + 5) / 10000, util.namedColors.LightYellow);
					}
				}
			}
			finally {
				feature.endAccessory();
			}
		}
		
		// Needs.
		
		let neededItemDetails = util.nilOrRootDetails(feature.details.neededItem, 'Item');
		
		if (neededItemDetails != null && feature.details.hasCompletedRequest?.boolean !== 'true') {
			feature.beginAccessory('FishPond.neededItem');
			
			try {
				let item = core.items.resolve(neededItemDetails.itemId, neededItemDetails);
				let drawnPosition = [
					(feature.tileX + 2) * 64 + 32,
					(feature.tileY + 2) * 64,
				];
				let layerDepth = ((zTileY + 2) * 64 + 192) / 10000 + 1e-6;
				feature.drawSprite(util.tx.mouseCursors, drawnPosition, new util.Rect(403, 496, 5, 14), [255, 255, 255, 255 * .75], 0, [2, 14], 4, Sprite.EF_NONE, layerDepth);
			}
			finally {
				feature.endAccessory();
			}
		}
		
		// Golden animal cracker.
		
		if (feature.details.goldenAnimalCracker?.boolean === 'true') {
			feature.beginAccessory('FishPond.goldenAnimalCracker');
			
			try {
				feature.drawSprite(texture, [feature.tileX * 64 + 260, feature.tileY * 64 + 236], new util.Rect(130, 160, 15, 16), null, 0, null, 4, Sprite.EF_NONE, ((zTileY + .5) * 64 + 2) / 10000);
			}
			finally {
				feature.endAccessory();
			}
		}
		
		// Output.
		
		let outputDetails = util.nilOrRootDetails(feature.details.output, 'Item');
		
		if (outputDetails != null) {
			feature.beginAccessory('FishPond.output');
			
			try {
				feature.drawSprite(texture, [feature.tileX * 64 + 260, feature.tileY * 64 + 236], new util.Rect(0, 160, 15, 16), null, 0, null, 4, Sprite.EF_NONE, ((zTileY + .5) * 64 + 1) / 10000);
				
				if (feature.details.goldenAnimalCracker?.boolean === 'true') {
					feature.drawSprite(texture, [feature.tileX * 64 + 260, feature.tileY * 64 + 236], new util.Rect(145, 160, 15, 16), null, 0, null, 4, Sprite.EF_NONE, ((zTileY + .5) * 64 + 3) / 10000);
				}
				
				let item = core.items.resolve(outputDetails.itemId ?? outputDetails.parentSheetIndex, outputDetails);
				let position = [(feature.tileX + 4) * 64, (feature.tileY + 4) * 64];
				let itemPosition = [position[0] + 40, position[1] - 128 + 36];
				let itemLayerDepth = (zTileY + 5) * 64 / 10000 + 1e-5;
				
				feature.drawSprite(util.tx.mouseCursors, [position[0], position[1] - 128], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, (zTileY + 5) * 64 / 10000 + 1e-6);
				feature.drawSprite(item.texture, itemPosition, item.spriteRect, [255, 255, 255, 255 * .75], 0, [8, 8], 4, Sprite.EF_NONE, itemLayerDepth);
				
				if (outputDetails['@xsi:type'] === 'ColoredObject') {
					let color = outputDetails.color;
					feature.drawSprite(item.texture, itemPosition, util.getItemRect(item, 1), [+color.R, +color.G, +color.B, +color.A * .75], 0, [8, 8], 4, Sprite.EF_NONE, itemLayerDepth + 1e-5);
				}
				
				if (+outputDetails.stack > 1) {
					feature.drawTinyDigits(+outputDetails.stack, [itemPosition[0] + 16, itemPosition[1] + 12], 4, itemLayerDepth + 2e-5, util.namedColors.LightYellow);
				}
			}
			finally {
				feature.endAccessory();
			}
		}
		
		break;
	}
	case 'JunimoHut': {
		feature.drawSprite(texture, [feature.tileX * 64, feature.tileY * 64 + feature.meta.height * 64], mainSourceRect, null, 0, [0, util.textureSizes[texture].height], 4, Sprite.EF_NONE, ((zTileY + feature.meta.height - 1) * 64 - 1) / 10000);
		
		if (+(feature.details.raisinDays?.int ?? 0) > 0 && location.gameState.seasonNumber !== 3) {
			feature.drawSprite(texture, [feature.tileX * 64 + 12, feature.tileY * 64 + feature.meta.height * 64 + 20], new util.Rect(246, 46, 10, 18), null, 0, [0, 18], 4, Sprite.EF_NONE, ((zTileY + feature.meta.height - 1) * 64 + 2) / 10000);
		}
		
		let hasOutput = false;
		
		if (feature.details.buildingChests?.Chest?.items != null) {
			for (let itemDetails of util.getDetailsMultiple(feature.details.buildingChests.Chest.items, 'Item')) {
				if (itemDetails['@xsi:nil'] !== 'true' && !['-12', '-2'].includes(itemDetails.category)) {
					hasOutput = true;
				}
			}
		}
		
		if (hasOutput) {
			feature.drawSprite(texture, [feature.tileX * 64 + 128 + 12, feature.tileY * 64 + feature.meta.height * 64 - 32], new util.Rect(208, 51, 15, 13), null, 0, null, 4, Sprite.EF_NONE, ((zTileY + feature.meta.height - 1) * 64 + 1) / 10000);
		}
		
		if (lib.timeOfDay >= 2000 && lib.timeOfDay < 2400 && location.getSeasonNumber() !== 3) {
			feature.drawSprite(texture, [feature.tileX * 64 + 64, feature.tileY * 64 + feature.meta.height * 64 - 64], new util.Rect(195, 0, 18, 17), null, 0, null, 4, Sprite.EF_NONE, ((zTileY + feature.meta.height - 1) * 64 + 1) / 10000);
		}
		
		break;
	}
	case 'PetBowl': {
		feature.drawSprite(texture, [drawPosition[0] + drawOffset[0], drawPosition[1] + drawOffset[1]], mainSourceRect, null, 0, drawOrigin, 4, Sprite.EF_NONE, sortY);
		
		if (feature.details.watered === 'true') {
			let sourceRect = util.Rect.from(mainSourceRect);
			sourceRect.x += sourceRect.width;
			feature.drawSprite(texture, [drawPosition[0] + drawOffset[0], drawPosition[1] + drawOffset[1]], sourceRect, null, 0, drawOrigin, 4, Sprite.EF_NONE, (baseSortY - buildingData.SortTileOffset * 64 + 1.5) / 10000);
		}
		
		break;
	}
	case 'ShippingBin': {
		feature.drawSprite(texture, [drawPosition[0] + drawOffset[0], drawPosition[1] + drawOffset[1]], mainSourceRect, null, 0, drawOrigin, 4, Sprite.EF_NONE, sortY);
		
		// Lid.
		
		feature.drawSprite(util.tx.mouseCursors, [feature.tileX * 64 + 4, (feature.tileY - 1) * 64 - 28], new util.Rect(134, 226, 30, 25), null, 0, null, 4, Sprite.EF_NONE, ((zTileY + 1) * 64) / 10000 + .0001);
		break;
	}
	default: {
		feature.drawSprite(texture, [drawPosition[0] + drawOffset[0], drawPosition[1] + drawOffset[1]], mainSourceRect, null, 0, drawOrigin, 4, Sprite.EF_NONE, sortY, paintProperties);
	}}
	
	switch (feature.meta.buildingType) {
	case 'Farmhouse':
		if (location.gameState.mailboxHasEntries) {
			let mailboxX = feature.tileX + 9;
			let mailboxY = feature.tileY + 4;
			let drawLayer = (mailboxX + 1) * 64 / 10000 + mailboxY * 64 / 10000;
			feature.drawSprite(util.tx.mouseCursors, [mailboxX * 64, mailboxY * 64 - 96 - 48], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, drawLayer + 1e-6);
			feature.drawSprite(util.tx.mouseCursors, [mailboxX * 64 + 32 + 4, mailboxY * 64 - 64 - 24 - 8], new util.Rect(189, 423, 15, 13), null, 0, [7, 6], 4, Sprite.EF_NONE, drawLayer + 1e-5);
		}
		
		break;
	
	case 'Gold Clock':
		if (location.gameState.goldenClocksTurnedOff) {
			feature.drawSprite(util.tx.mouseCursors_1_6, [feature.tileX * 64 + 68, feature.tileY * 64 - 56], new util.Rect(498, 368, 13, 9), null, 0, null, 4, Sprite.EF_NONE, (zTileY + feature.meta.height) * 64 / 10000 + .0001);
		}
		else {
			feature.drawSprite(util.tx.mouseCursors, [feature.tileX * 64 + 92, feature.tileY * 64 - 40], new util.Rect(369, 399, 5, 9), null, Math.PI * 2 * ((lib.timeOfDay % 1200) / 1200), [2.5, 8], 3, Sprite.EF_NONE, (zTileY + feature.meta.height) * 64 / 10000 + .0001);
			feature.drawSprite(util.tx.mouseCursors, [feature.tileX * 64 + 92, feature.tileY * 64 - 40], new util.Rect(363, 395, 5, 13), null, Math.PI * 2 * ((lib.timeOfDay % 1000 % 100 % 60) / 60), [2.5, 12], 3, Sprite.EF_NONE, (zTileY + feature.meta.height) * 64 / 10000 + .00011);
			feature.drawSprite(util.tx.mouseCursors, [feature.tileX * 64 + 92, feature.tileY * 64 - 40], new util.Rect(375, 404, 4, 4), null, 0, [2, 2], 4, Sprite.EF_NONE, (zTileY + feature.meta.height) * 64 / 10000 + .00012);
		}
		
		break;
	}
	
	if (buildingData.DrawLayers != null) {
		for (let drawLayer of buildingData.DrawLayers) {
			if (drawLayer.OnlyDrawIfChestHasContents != null) {
				let hasContents = false;
				
				for (let chest of util.getDetailsMultiple(feature.details.buildingChests, 'Chest')) {
					if (chest.name === drawLayer.OnlyDrawIfChestHasContents) {
						if (chest.items?.Item != null) {
							hasContents = true;
						}
						
						break;
					}
				}
				
				if (hasContents) {
					continue;
				}
			}
			
			let sortY = (baseSortY - drawLayer.SortTileOffset * 64 + 1) / 10000;
			let sourceRect = util.Rect.from(drawLayer.SourceRect);
			let drawOffset = [0, 0];
			
			if ((drawLayer.AnimalDoorOffset?.X ?? 0) !== 0 || (drawLayer.AnimalDoorOffset?.Y ?? 0) !== 0) {
				drawOffset[0] = (drawLayer.AnimalDoorOffset.X ?? 0) * +(feature.details.animalDoorOpenAmount ?? 0);
				drawOffset[1] = (drawLayer.AnimalDoorOffset.Y ?? 0) * +(feature.details.animalDoorOpenAmount ?? 0);
			}
			
			let layerTexture = drawLayer.Texture ?? texture;
			let layerPosition = drawLayer.DrawPosition.split(/\s*,\s*/);
			
			if (drawLayer.DrawInBackground) {
				// The game draws this in the background layer, but our simplified
				// layering system doesn't support that. We'll approximate the
				// effect by shifting it into the negative range of z values.
				
				--sortY;
			}
			
			let position = [
				drawPosition[0] + (drawOffset[0] - drawOrigin[0] + +layerPosition[0]) * 4,
				drawPosition[1] + (drawOffset[1] - drawOrigin[1] + +layerPosition[1]) * 4,
			];
			feature.drawSprite(layerTexture, position, sourceRect, null, 0, null, 4, Sprite.EF_NONE, sortY);
		}
	}
};
