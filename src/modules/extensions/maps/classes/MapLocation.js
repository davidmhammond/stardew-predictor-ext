import Feature from './Feature.js';
import Sprite from './Sprite.js';
import TileSheet from './TileSheet.js';
import Warp from './Warp.js';

import * as catalogue from '../catalogue.js';
import * as mapsUtil from '../mapsUtil.js';
import * as util from '../../../util.js';

export default class MapLocation {
	core;
	map;
	locationPlan;
	gameState;
	
	aboveBuildingsFeatures = [];
	aboveAlwaysFrontFeatures = [];
	
	floorTiles = new Map();
	floorIds = [];
	wallpaperTiles = new Map();
	wallpaperIds = [];
	
	cropSpawnRects = [];
	
	waterCacheLevel = 0;
	waterCache = null;
	
	featureContext;
	
	static COL_NONE = 0x00;
	static COL_BUILDINGS = 0x01;
	static COL_CHARACTERS = 0x02;
	static COL_FARMERS = 0x04;
	static COL_FLOORING = 0x08;
	static COL_FURNITURE = 0x10;
	static COL_OBJECTS = 0x20;
	static COL_TERRAIN_FEATURES = 0x40;
	static COL_LOCATION_SPECIFIC = 0x80;
	static COL_ALL = 0xff;
	
	// Predictor extensions.
	//
	// Important: Using ~(excluded constants) as an initial value activates
	// these extra flags. To avoid this, you should & the result against
	// COL_ALL. Also, When further restricting an existing mask, you should
	// not & it against COL_ALL, unless you want to deactivate these flags.
	
	static COL_IGNORE_ERASABLE = 0x01000000;
	
	constructor (core, map, locationPlan, gameState) {
		this.core = core;
		this.map = map;
		this.locationPlan = locationPlan;
		this.gameState = gameState;
		this.featureContext = {
			core: core,
			location: locationPlan.location,
			features: locationPlan.features,
		};
		
		// See StardewValley.GameLocation:DayUpdate()
		
		switch (locationPlan.location.type) {
		case 'Forest':
			this.cropSpawnRects = [
				new util.Rect(70, 68, map.width - 10 - 70, map.height - 15 - 68),
			];
			break;
		
		case 'IslandNorth':
			this.cropSpawnRects = [
				new util.Rect(10, 51, 1, 8),
				new util.Rect(15, 59, 1, 4),
				new util.Rect(18, 34, 1, 1),
				new util.Rect(40, 48, 6, 6),
			];
			break;
		
		case 'IslandWest':
			this.cropSpawnRects = [
				new util.Rect(31, 43, 7, 6),
				new util.Rect(37, 62, 6, 5),
				new util.Rect(48, 42, 5, 4),
				new util.Rect(71, 12, 5, 4),
				new util.Rect(50, 59, 1, 1),
				new util.Rect(47, 64, 1, 1),
				new util.Rect(36, 58, 1, 1),
				new util.Rect(56, 48, 1, 1),
				new util.Rect(29, 46, 1, 1),
			];
			break;
		}
	}
	
	getBackgroundStyles (timeOfDay) {
		let location = this.locationPlan.location;
		
		switch (location.type) {
		case 'IslandNorth': {
			// See StardewValley.Locations.IslandLocation:DrawParallaxHorizon()
			
			let dayURL = util.contentURI('LooseSprites/Cloudy_Ocean_BG.png');
			let nightURL = util.contentURI('LooseSprites/Cloudy_Ocean_BG_Night.png');
			
			let startingToGetDarkTime = location.getStartingToGetDarkTime();
			let dayNightTransition = util.convertTimeToMinutes(timeOfDay - startingToGetDarkTime) / util.convertTimeToMinutes(location.getTrulyDarkTime() - startingToGetDarkTime);
			dayNightTransition = Math.max(0, Math.min(1, dayNightTransition));
			
			return [
				`background: url("${dayURL}") fixed 0 -173px / 100% auto no-repeat #017ad9;`,
				`background: url("${nightURL}") fixed 0 -173px / 100% auto no-repeat #00073f; opacity: ${dayNightTransition.toFixed(4)};`,
			];
		}}
		
		return [];
	}
	
	makeMapModifications (timeOfDay) {
		let location = this.locationPlan.location;
		
		// See StardewValley.GameLocation:MakeMapModifications()
		
		switch (location.name) {
		case 'AbandonedJojaMart': {
			if (!this.gameState.ccMovieTheater) {
				this.map.setTile(8, 8, 1741, 'Buildings', 'indoor');
			}
			
			break;
		}
		case 'Backwoods': {
			if (this.gameState.golemGrave) {
				this.map.applyMapOverride('Backwoods_GraveSite');
			}
			
			if (this.gameState.communityUpgradeShortcuts) {
				this.map.applyMapOverride('Backwoods_Staircase');
			}
			
			break;
		}
		case 'HaleyHouse': {
			if (this.gameState.seen463391 && this.gameState.spouse !== 'Emily') {
				this.map.setTile(14, 4, 2173, 'Buildings', '1');
				this.map.setTile(14, 3, 2141, 'Buildings', '1');
				this.map.setTile(14, 3, 219, 'Back', '1');
			}
			
			break;
		}
		case 'Saloon': {
			if (this.gameState.saloonSportsRoom) {
				this.map.applyMapOverride('RefurbishedSaloonRoom', null, new util.Rect(32, 1, 6, 8));
			}
			
			break;
		}
		case 'SkullCave': {
			if (this.gameState.skullShrineActivated) {
				this.map.applyMapOverride('SkullCaveAltar', new util.Rect(0, 0, 5, 4), new util.Rect(10, 1, 5, 4));
			}
			
			break;
		}
		case 'WitchHut': {
			if (this.gameState.hasPickedUpMagicInk) {
				let tileIndex = this.map.getTileIndex(4, 11, 'Buildings');
				this.map.setTile(4, 11, 113, 'Buildings', 'untitled tile sheet');
				delete this.map.getTileAttributesForModification(this.map.layers.Buildings, tileIndex).properties.Action;
			}
			
			break;
		}
		case 'WitchSwamp': {
			if (!this.gameState.henchmanGone) {
				this.map.setTile(20, 29, 10, 'Buildings', 'wt');
			}
			
			break;
		}}
		
		switch (location.type) {
		case 'Beach':
		case 'BeachNightMarket': {
			if (this.gameState.beachBridgeFixed) {
				this.map.setTile(58, 13, 301, 'Buildings', 'untitled tile sheet');
				this.map.setTile(59, 13, 301, 'Buildings', 'untitled tile sheet');
				this.map.setTile(60, 13, 301, 'Buildings', 'untitled tile sheet');
				this.map.setTile(61, 13, 301, 'Buildings', 'untitled tile sheet');
				this.map.removeTileProperty(58, 13, 'Buildings', 'Action');
				this.map.setTile(58, 14, 336, 'Back', 'untitled tile sheet');
				this.map.setTile(59, 14, 336, 'Back', 'untitled tile sheet');
				this.map.setTile(60, 14, 336, 'Back', 'untitled tile sheet');
				this.map.setTile(61, 14, 336, 'Back', 'untitled tile sheet');
			}
			
			if (this.gameState.communityUpgradeShortcuts) {
				this.map.addWarp(new Warp(-1, 4, 'Forest', 119, 35));
				this.map.addWarp(new Warp(-1, 5, 'Forest', 119, 35));
				this.map.addWarp(new Warp(-1, 6, 'Forest', 119, 36));
				this.map.addWarp(new Warp(-1, 7, 'Forest', 119, 36));
				
				for (let y = 4; y < 7; ++y) {
					for (let x = 0; x < 5; ++x) {
						this.map.removeTile(x, y, 'Buildings');
					}
				}
				
				this.map.removeTile(7, 6, 'Buildings');
				this.map.removeTile(5, 6, 'Buildings');
				this.map.removeTile(6, 6, 'Buildings');
				this.map.setTile(3, 7, 107, 'Back', 'untitled tile sheet');
				this.map.removeTile(67, 5, 'Buildings');
				this.map.removeTile(67, 4, 'Buildings');
				this.map.removeTile(67, 3, 'Buildings');
				this.map.removeTile(67, 2, 'Buildings');
				this.map.removeTile(67, 1, 'Buildings');
				this.map.removeTile(67, 0, 'Buildings');
				this.map.removeTile(66, 3, 'Buildings');
				this.map.removeTile(68, 3, 'Buildings');
			}
			
			if (location.type === 'Beach') {
				if (this.gameState.seasonNumber === 3 && this.gameState.dayOfMonth >= 9 && this.gameState.dayOfMonth <= 11) {
					this.map.applyMapOverrideCustom('Forest_FishingDerbySign', 'Forest_FishingDerbySign', null, new util.Rect(15, 5, 2, 3), this.cleanUpTileForMapOverride);
				}
				
				if (this.gameState.seasonNumber === 3 && this.gameState.dayOfMonth >= 12 && this.gameState.dayOfMonth <= 13) {
					this.map.applyMapOverrideCustom('Beach_SquidFest', 'Beach_SquidFest', null, new util.Rect(11, 3, 16, 5), this.cleanUpTileForMapOverride);
					
					if (this.gameState.dayOfMonth === 13) {
						let tileSheetName = this.map.getAddedMapOverrideTilesheetId('Beach_SquidFest', '16');
						this.map.setTile(13, 6, 51, 'Front', tileSheetName);
						this.map.setTile(13, 5, 43, 'AlwaysFront', tileSheetName);
					}
				}
			}
			
			break;
		}
		case 'CommunityCenter': {
			if (!this.gameState.jojaMember) {
				let addFishTank = false;
				
				if (mapsUtil.allCCAreasComplete(this.gameState)) {
					addFishTank = true;
				}
				else {
					let emptyRect = new util.Rect();
					let areas = [
						new util.Rect(0, 0, 22, 11), // Pantry
						new util.Rect(0, 12, 21, 17), // Crafts room
						new util.Rect(35, 4, 9, 9), // Fish tank
						new util.Rect(52, 9, 16, 12), // Boiler room
						new util.Rect(45, 0, 15, 9), // Vault
						new util.Rect(22, 13, 28, 9), // Bulletin board 1
						emptyRect, // Abandoned Joja Mart
						new util.Rect(44, 10, 6, 3), // Bulletin board 2
						new util.Rect(22, 4, 13, 9), // Junimo hut
					];
					
					for (let [area, key] of mapsUtil.ccAreaGameStateKeys.entries()) {
						if (this.gameState[key]) {
							let rect = areas[area] ?? emptyRect;
							this.map.applyMapOverrideCustom('CommunityCenter_Refurbished', `CommunityCenter_Refurbished${area}`, rect, rect);
							
							if (area === 2) {
								addFishTank = true;
							}
							else if (area === 5) {
								rect = areas[7] ?? emptyRect;
								this.map.applyMapOverrideCustom('CommunityCenter_Refurbished', 'CommunityCenter_Refurbished7', rect, rect);
							}
						}
						else {
							// TODO: Junimo notes.
						}
					}
				}
				
				for (let feature of this.getFeaturesAt(38, 9, 'furniture')) {
					if (feature.meta.item.qualifiedItemId === '(F)CCFishTank') {
						if (addFishTank) {
							// The fish tank to be added is already present.
							
							addFishTank = false;
							break;
						}
						else if (feature.meta.noErase) {
							// Found an automatically added fish tank that no longer belongs here.
							
							this.locationPlan.features[feature.index] = null;
							break;
						}
					}
				}
				
				if (addFishTank) {
					let feature = this.addFeatureByInfo(38, 9, {
						qualifiedItemId: '(F)CCFishTank',
						heldItems: ['(O)143', '(O)145', '(O)721'],
						details: {fragility: '2'},
					});
					feature.meta.noErase = true;
					feature.meta.noMove = true;
				}
			}
			
			break;
		}
		case 'Farm': {
			// See StardewValley.Farm:ClearGreenhouseGrassTiles()
			
			if (this.gameState.greenhouseMoved) {
				let greenhouseStartPosition = this.getGreenhouseStartLocation();
				
				switch (this.gameState.farmType) {
				case '0':
				case '3':
				case '4':
					this.map.applyMapOverride('Farm_Greenhouse_Dirt', null, new util.Rect(greenhouseStartPosition[0], greenhouseStartPosition[1], 9, 6));
					break;
				
				case '5':
					this.map.applyMapOverride('Farm_Greenhouse_Dirt_FourCorners', null, new util.Rect(greenhouseStartPosition[0], greenhouseStartPosition[1], 9, 6));
					break;
				}
			}
			
			// See StardewValley.Farm:UpdatePatio()
			
			if (this.gameState.spouse != null) {
				let position = this.map.properties.SpouseAreaLocation?.split(/ +/) ?? [69, 6];
				let characterData = this.core.content.Data.Characters[this.gameState.spouse];
				
				if (characterData?.SpousePatio != null) {
					let sourceArea = util.Rect.from(characterData.SpousePatio.MapSourceRect);
					sourceArea.width = Math.min(sourceArea.width, 4);
					sourceArea.height = Math.min(sourceArea.height, 4);
					this.map.applyMapOverrideCustom(characterData.SpousePatio.MapAsset ?? 'spousePatios', 'spouse_patio', sourceArea, new util.Rect(+position[0], +position[1], sourceArea.width, sourceArea.height));
				}
			}
			
			break;
		}
		case 'FarmHouse': {
			// See StardewValley.Locations.FarmHouse:UpdateChildRoom()
			
			if (this.gameState.houseUpgradeLevel >= 2) {
				this.map.applyMapOverrideCustom(`FarmHouse_Crib_${this.gameState.farmHouseCribStyle}`, 'crib', null, new util.Rect(30, 12, 3, 4));
			}
			
			// See StardewValley.Locations.FarmHouse:updateFarmLayout()
			// See StardewValley.Locations.FarmHouse:setMapForUpgradeLevel()
			
			let displayingSpouseRoom = (this.gameState.spouse != null);
			let spouseRoomCorner = this.getSpouseRoomCorner();
			
			if (displayingSpouseRoom) {
				// See StardewValley.Locations.FarmHouse:loadSpouseRoom()
				
				let spouseData = this.core.content.Data.Characters[this.gameState.spouse];
				let spouseRoomSpot = [spouseRoomCorner[0] + 3, spouseRoomCorner[1] + 4];
				let assetName = spouseData.SpouseRoom?.MapAsset ?? 'spouseRooms';
				let refurbishedMap = this.map.sourceMaps[`Maps/${assetName}`];
				let sourceArea = util.Rect.from(spouseData.SpouseRoom?.MapSourceRect) ?? new util.Rect(0, 0, 6, 9);
				let areaToRefurbish = new util.Rect(spouseRoomCorner[0], spouseRoomCorner[1], sourceArea.width, sourceArea.height);
				let bottomRowTiles = new Array(areaToRefurbish.width);
				let bottomRowTileIndex = this.map.layers.Front.getTileIndex(areaToRefurbish.x, areaToRefurbish.y + areaToRefurbish.height - 1);
				
				for (let x = 0; x < bottomRowTiles.length; ++x) {
					bottomRowTiles[x] = this.map.layers.Front.tiles[bottomRowTileIndex + x];
				}
				
				this.map.applyMapOverrideCustom(refurbishedMap, 'spouse_room', new util.Rect(sourceArea.x, sourceArea.y, areaToRefurbish.width, areaToRefurbish.height), areaToRefurbish);
				
				spouseRoomSpotLoop: for (let y = 0; y < areaToRefurbish.height; ++y) {
					for (let x = 0; x < areaToRefurbish.width; ++x) {
						if (this.map.getTile(areaToRefurbish.x + x, areaToRefurbish.y + y, 'Paths') === 7) {
							this.map.setTileProperty(areaToRefurbish.x + x, areaToRefurbish.y + y, 'Back', 'NoFurniture', 'T');
							break spouseRoomSpotLoop;
						}
					}
				}
				
				for (let [x, tile] of bottomRowTiles.entries()) {
					if (tile >= 0) {
						this.map.layers.Front.tiles[bottomRowTileIndex + x] = tile;
					}
				}
			}
			
			if (this.gameState.houseUpgradeLevel === 3) {
				this.map.applyMapOverrideCustom('FarmHouse_Cellar', 'cellar');
			}
			
			// See StardewValley.Locations.FarmHouse:_ApplyRenovations()
			
			if (this.gameState.houseUpgradeLevel >= 2) {
				if (this.gameState.renovationBedroomOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_Bedroom_Open', 'bedroom_open');
				}
				
				if (this.gameState.renovationSouthernOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_SouthernRoom_Add', 'southernroom_open');
				}
				
				if (this.gameState.renovationCornerOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_CornerRoom_Add', 'cornerroom_open');
					
					if (displayingSpouseRoom) {
						this.map.setTile(49, 19, 229, 'Front', 'untitled tile sheet');
					}
				}
				
				if (this.gameState.renovationDiningOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_DiningRoom_Add', 'diningroom_open');
				}
				
				if (this.gameState.renovationCubbyOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_Cubby_Add', 'cubby_open');
				}
				
				if (this.gameState.renovationFarUpperRoomOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_FarUpperRoom_Add', 'farupperroom_open');
				}
				
				if (this.gameState.renovationExtendedCornerOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_ExtendedCornerRoom_Add', 'extendedcorner_open');
				}
				else if (this.gameState.renovationCornerOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_ExtendedCornerRoom_Remove', 'extendedcorner_open');
				}
				
				if (this.gameState.renovationDiningRoomWallOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_DiningRoomWall_Add', 'diningroomwall_open');
				}
				else if (this.gameState.renovationDiningOpen) {
					this.map.applyMapOverrideCustom('FarmHouse_DiningRoomWall_Remove', 'diningroomwall_open');
				}
			}
			
			if (displayingSpouseRoom && this.gameState.spouse === 'Sebastian' && this.gameState.sebastianFrog) {
				let frogX = spouseRoomCorner[0] + 1;
				let frogY = spouseRoomCorner[1] + 6;
				this.map.removeTile(frogX, frogY - 1, 'Front');
				this.map.removeTile(frogX + 1, frogY - 1, 'Front');
				this.map.removeTile(frogX + 2, frogY - 1, 'Front');
			}
			
			break;
		}
		case 'Forest': {
			if (this.gameState.forestStumpFixed || this.gameState.raccoonTreeFallen) {
				// See StardewValley.Locations.Forest:fixStump() and :MakeMapModifications()
				
				for (let x = 52; x < 60; ++x) {
					for (let y = 0; y < 2; ++y) {
						this.map.removeTile(x, y, 'AlwaysFront');
					}
				}
				
				this.map.applyMapOverride(this.gameState.forestStumpFixed ? 'Forest_RaccoonHouse' : 'Forest_RaccoonStump', null, new util.Rect(53, 2, 7, 6));
			}
			
			if (this.gameState.trashBearDone) {
				// See StardewValley.Locations.Forest:removeSewerTrash()
				
				this.map.applyMapOverride('Forest-SewerClean', null, new util.Rect(83, 97, 24, 12));
				this.map.removeTile(43, 106, 'Buildings');
				this.map.removeTile(17, 106, 'Buildings');
				this.map.removeTile(13, 105, 'Buildings');
				this.map.removeTile(4, 85, 'Buildings');
				this.map.removeTile(2, 85, 'Buildings');
			}
			
			if (this.gameState.communityUpgradeShortcuts) {
				// See StardewValley.Locations.Forest:showCommunityUpgradeShortcuts()
				
				this.map.removeTile(119, 36, 'Buildings');
				this.map.addWarp(new Warp(120, 35, 'Beach', 0, 6));
				this.map.addWarp(new Warp(120, 36, 'Beach', 0, 6));
			}
			
			if (this.gameState.seasonNumber === 1 && this.gameState.dayOfMonth >= 17 && this.gameState.dayOfMonth <= 19) {
				this.map.applyMapOverrideCustom('Forest_FishingDerbySign', 'Forest_FishingDerbySign', null, new util.Rect(69, 44, 2, 3), this.cleanUpTileForMapOverride);
			}
			
			if (this.gameState.seasonNumber === 1 && this.gameState.dayOfMonth >= 20 && this.gameState.dayOfMonth <= 21) {
				this.map.applyMapOverrideCustom('Forest_FishingDerby', 'Forest_FishingDerby', null, new util.Rect(63, 43, 11, 5), this.cleanUpTileForMapOverride);
			}
			
			break;
		}
		case 'IslandNorth': {
			this.map.applyMapOverride(this.gameState.islandNorthBridgeFixed ? 'Island_Bridge_Repaired' : 'Island_Bridge_Broken', null, new util.Rect(31, 52, 4, 3));
			
			if (this.gameState.islandNorthTraderActivated) {
				// See StardewValley.Locations.IslandNorth:ApplyIslandTraderHut()
				
				this.map.applyMapOverride('Island_N_Trader', null, new util.Rect(32, 64, 9, 10));
			}
			
			break;
		}
		case 'IslandShrine': {
			if (this.gameState.islandShrinePuzzleFinished) {
				// See StardewValley.Locations.IslandShrine:ApplyFinishedTiles()
				
				this.map.setTile(23, 19, 142, 'AlwaysFront', 'untitled tile sheet3');
				this.map.setTile(24, 19, 143, 'AlwaysFront', 'untitled tile sheet3');
				this.map.setTile(25, 19, 144, 'AlwaysFront', 'untitled tile sheet3');
			}
			
			break;
		}
		case 'IslandSouth': {
			if (this.gameState.islandSouthResortRestored) {
				// See StardewValley.Locations.IslandShrine:ApplyResortRestore()
				
				this.map.applyMapOverride('Island_Resort', null, new util.Rect(9, 15, 26, 16));
				this.map.removeTile(41, 28, 'Buildings');
				this.map.removeTile(42, 28, 'Buildings');
				this.map.removeTile(42, 29, 'Buildings');
				this.map.removeTile(42, 30, 'Front');
				this.map.removeTileProperty(42, 30, 'Back', 'Passable');
				
				if (this.gameState.islandSouthResortOpenToday) {
					this.map.removeTile(22, 21, 'Buildings');
					this.map.removeTile(22, 22, 'Buildings');
					this.map.removeTile(24, 21, 'Buildings');
					this.map.removeTile(24, 22, 'Buildings');
				}
				else {
					this.map.setTile(22, 21, 1405, 'Buildings', 'untitled tile sheet');
					this.map.setTile(22, 22, 1437, 'Buildings', 'untitled tile sheet');
					this.map.setTile(24, 21, 1405, 'Buildings', 'untitled tile sheet');
					this.map.setTile(24, 22, 1437, 'Buildings', 'untitled tile sheet');
				}
			}
			
			break;
		}
		case 'IslandSouthEast': {
			let isRaining = this.locationPlan.location.isRainingHere();
			
			if (isRaining) {
				this.map.setTile(16, 27, 3, 'Back', 'untitled tile sheet3', '');
				this.map.setTile(18, 27, 4, 'Back', 'untitled tile sheet3', '');
				this.map.setTile(20, 27, 5, 'Back', 'untitled tile sheet3', '');
				this.map.setTile(22, 27, 6, 'Back', 'untitled tile sheet3', '');
				this.map.setTile(24, 27, 7, 'Back', 'untitled tile sheet3', '');
				this.map.setTile(26, 27, 8, 'Back', 'untitled tile sheet3', '');
			}
			else {
				this.map.setTile(16, 27, 39, 'Back', 'untitled tile sheet', '');
				this.map.setTile(18, 27, 39, 'Back', 'untitled tile sheet', '');
				this.map.setTile(20, 27, 39, 'Back', 'untitled tile sheet', '');
				this.map.setTile(22, 27, 39, 'Back', 'untitled tile sheet', '');
				this.map.setTile(24, 27, 39, 'Back', 'untitled tile sheet', '');
				this.map.setTile(26, 27, 39, 'Back', 'untitled tile sheet', '');
			}
			
			if (!isRaining && timeOfDay >= 2000 && this.gameState.dayOfMonth % 2 === 0) {
				this.map.setTile(29, 18, 36, 'Buildings', 'untitled tile sheet3');
				this.map.setTile(29, 19, 68, 'Buildings', 'untitled tile sheet3');
				this.map.setTile(30, 18, 99, 'Buildings', 'untitled tile sheet3');
				this.map.setTile(30, 19, 131, 'Buildings', 'untitled tile sheet3');
			}
			else {
				this.map.setTile(29, 18, 35, 'Buildings', 'untitled tile sheet3');
				this.map.setTile(29, 19, 67, 'Buildings', 'untitled tile sheet3');
				this.map.setTile(30, 18, 35, 'Buildings', 'untitled tile sheet3');
				this.map.setTile(30, 19, 67, 'Buildings', 'untitled tile sheet3');
			}
			
			this.map.setTileProperty(29, 18, 'Buildings', 'Passable', 'T');
			this.map.setTileProperty(29, 19, 'Buildings', 'Passable', 'T');
			this.map.setTileProperty(30, 18, 'Buildings', 'Passable', 'T');
			this.map.setTileProperty(30, 19, 'Buildings', 'Passable', 'T');
			break;
		}
		case 'IslandSouthEastCave': {
			if (!this.locationPlan.location.isRainingHere() && timeOfDay >= 2000 && this.gameState.dayOfMonth % 2 === 0) {
				this.map.setTileProperty(19, 9, 'Buildings', 'Action', 'MessageSpeech Pirates1');
				this.map.setTileProperty(20, 9, 'Buildings', 'Action', 'MessageSpeech Pirates2');
				this.map.setTileProperty(26, 17, 'Buildings', 'Action', 'MessageSpeech Pirates3');
				this.map.setTileProperty(24, 8, 'Buildings', 'Action', 'MessageSpeech Pirates4');
				this.map.setTileProperty(27, 5, 'Buildings', 'Action', 'MessageSpeech Pirates5');
				this.map.setTileProperty(32, 6, 'Buildings', 'Action', 'MessageSpeech Pirates6');
				this.map.setTileProperty(30, 8, 'Buildings', 'Action', 'DartsGame');
				this.map.setTileProperty(33, 8, 'Buildings', 'Action', 'Bartender');
			}
			
			break;
		}
		case 'IslandWest': {
			if (this.gameState.islandWestFarmhouseRestored) {
				// See StardewValley.Locations.IslandWest:ApplyFarmHouseRestore()
				
				this.map.applyMapOverride('Island_House_Restored', null, new util.Rect(74, 33, 7, 9));
				this.map.applyMapOverride('Island_House_Bin', null, new util.Rect(+location.details.shippingBinPosition.X, +location.details.shippingBinPosition.Y - 1, 2, 2));
				this.map.applyMapOverride('Island_House_Cave', null, new util.Rect(95, 30, 3, 4));
				
				if (this.gameState.islandWestFarmhouseMailbox) {
					this.map.setTile(81, 40, 771, 'Buildings', 'untitled tile sheet', 'Mailbox');
					this.map.setTile(81, 39, 739, 'Front', 'untitled tile sheet');
				}
			}
			
			if (this.gameState.islandWestFarmObelisk) {
				// See StardewValley.Locations.IslandWest:ApplyFarmObeliskBuild()
				
				this.map.applyMapOverride('Island_W_Obelisk', null, new util.Rect(71, 29, 3, 9));
			}
			
			break;
		}
		case 'IslandWestCave1': {
			let headIndex = this.gameState.islandWestCave1Completed ? 33 : 31;
			this.map.setTile(6, 1, headIndex, 'Buildings', 'untitled tile sheet');
			break;
		}
		case 'ManorHouse': {
			this.map.setTile(4, 5, 109, 'Buildings', 'untitled tile sheet2', 'LostAndFound');
			this.map.setTile(4, 4, 77, 'Front', 'untitled tile sheet2');
			this.map.setTile(4, 3, 110, 'Front', 'untitled tile sheet2');
			this.map.setTile(4, 6, 604, 'Back', '1');
			break;
		}
		case 'Mountain': {
			if (this.gameState.ccCraftsRoom) {
				// See StardewValley.Locations.Mountain:restoreBridge()
				
				// Note: Stardew Valley copies the tiles directly instead of using
				// applyMapOverride(). I haven't checked if there are any subtle
				// differences.
				
				this.map.applyMapOverride('Mountain-BridgeFixed', null, new util.Rect(92, 24, 8, 10));
			}
			
			// See StardewValley.Locations.Mountain:ApplyTreehouseIfNecessary()
			
			if (this.gameState.leoMoved) {
				this.map.setTile(16, 6, 197, 'Buildings', 'untitled tile sheet2');
				this.map.setTile(16, 7, 213, 'Buildings', 'untitled tile sheet2');
				this.map.setTile(16, 8, 229, 'Back', 'untitled tile sheet2');
				this.map.setTileProperty(16, 7, 'Buildings', 'Action', 'LockedDoorWarp 3 8 LeoTreeHouse 600 2300');
			}
			
			if (this.gameState.communityUpgradeShortcuts) {
				this.map.applyMapOverride('Mountain_Shortcuts');
			}
			
			break;
		}
		case 'Railroad': {
			if (this.gameState.witchStatueGone) {
				this.map.removeTile(54, 35, 'Buildings');
				this.map.removeTile(54, 34, 'Front');
			}
			
			if (this.gameState.farmEternal) {
				this.map.removeTile(24, 34, 'Buildings');
				this.map.removeTile(25, 34, 'Buildings');
				this.map.removeTile(24, 35, 'Buildings');
				this.map.removeTile(25, 35, 'Buildings');
			}
			
			break;
		}
		case 'Sewer': {
			// TODO: Should check if Krobus is a roommate with any farmer (this
			// should involve a more comprehensive solution for farmhand-specific
			// game rules).
			
			if (this.gameState.spouse === 'Krobus') {
				this.map.setTile(31, 17, 84, 'Buildings', 'st');
				this.map.setTile(31, 16, 1, 'Front', 'st');
			}
			else {
				this.map.removeTile(31, 17, 'Buildings');
				this.map.removeTile(31, 16, 'Front');
			}
			
			break;
		}
		case 'Town': {
			if (this.gameState.ccIsComplete || this.gameState.jojaMember) {
				// See StardewValley.Locations.Town:refurbishCommunityCenter()
				
				let ccBounds = new util.Rect(47, 11, 11, 9);
				let layerNames = ['Back', 'Buildings', 'Front', 'AlwaysFront'];
				
				for (let layerName of layerNames) {
					let layer = this.map.layers[layerName];
					
					for (let x = ccBounds.x; x <= ccBounds.x + ccBounds.width; ++x) {
						for (let y = ccBounds.y; y <= ccBounds.y + ccBounds.height; ++y) {
							if (this.map.getTile(x, y, layerName, 'Town') > 1200) {
								layer.tiles[layer.getTileIndex(x, y)] += 12;
							}
						}
					}
				}
			}
			
			if (util.daysPlayed(this.gameState) >= 58) {
				this.map.setTile(61, 93, 2045, 'Buildings', 'Town', 'SpecialOrders');
				this.map.setTile(62, 93, 2046, 'Buildings', 'Town', 'SpecialOrders');
				this.map.setTile(63, 93, 2047, 'Buildings', 'Town', 'SpecialOrders');
				this.map.setTile(61, 92, 2013, 'Front', 'Town');
				this.map.setTile(62, 92, 2014, 'Front', 'Town');
				this.map.setTile(63, 92, 2015, 'Front', 'Town');
				this.cleanUpTileForMapOverride(60, 93);
				this.map.setTile(60, 93, 2034, 'Buildings', 'Town', 'SpecialOrdersPrizeTickets');
				this.map.setTile(60, 92, 2002, 'Front', 'Town');
			}
			
			if (this.gameState.trashBearDone) {
				if (!this.map.path.includes('Town-Fair')) {
					this.map.applyMapOverride('Town-TrashGone', null, new util.Rect(57, 68, 17, 5));
				}
				
				this.map.applyMapOverride('Town-DogHouse', null, new util.Rect(51, 65, 5, 6));
				this.map.removeTile(121, 57, 'Buildings');
				this.map.removeTile(119, 59, 'Buildings');
				this.map.removeTile(124, 56, 'Buildings');
				this.map.removeTile(126, 59, 'Buildings');
				this.map.removeTile(127, 60, 'Buildings');
				this.map.removeTile(125, 61, 'Buildings');
				this.map.removeTile(126, 62, 'Buildings');
				this.map.removeTile(119, 64, 'Buildings');
				this.map.removeTile(120, 52, 'Buildings');
			}
			
			if (this.gameState.ccMovieTheater) {
				if (this.gameState.ccMovieTheaterJoja) {
					let rect = new util.Rect(46, 11, 15, 17);
					let isHalloweenAlternate = (this.gameState.seasonNumber === 2 && this.gameState.dayOfMonth === 27 && this.gameState.year % 2 === 0 && this.map.path.includes('Halloween'));
					this.map.applyMapOverride(`Town-TheaterCC${isHalloweenAlternate ? '-Halloween2' : ''}`, rect, rect);
				}
				else {
					let rect = new util.Rect(84, 41, 27, 15);
					this.map.applyMapOverride('Town-Theater', rect, rect);
				}
			}
			else if (this.gameState.seen191393) {
				// See StardewValley.Locations.Town:showDestroyedJoja()
				
				let jojaBounds = new util.Rect(90, 42, 11, 9);
				let layerNames = ['Back', 'Buildings', 'Front', 'AlwaysFront'];
				
				for (let layerName of layerNames) {
					let layer = this.map.layers[layerName];
					
					for (let x = jojaBounds.x; x <= jojaBounds.x + jojaBounds.width; ++x) {
						for (let y = jojaBounds.y; y <= jojaBounds.y + jojaBounds.height; ++y) {
							if (x > jojaBounds.x + 6 || y < jojaBounds.y + 9) {
								if (y === 50 && (x === 93 || x === 94) && layerName === 'Front') {
									continue;
								}
								
								if (this.map.getTile(x, y, layerName, 'Town') > 1200) {
									layer.tiles[layer.getTileIndex(x, y)] += 20;
								}
							}
						}
					}
				}
				
				if (this.gameState.abandonedJojaMartAccessible) {
					// See StardewValley.Locations.Town:crackOpenAbandonedJojaMartDoor()
					
					this.map.setTile(95, 49, 2000, 'Buildings', 'Town');
					this.map.setTile(96, 49, 2001, 'Buildings', 'Town');
					this.map.setTile(95, 50, 2032, 'Buildings', 'Town');
					this.map.setTile(96, 50, 2033, 'Buildings', 'Town');
				}
			}
			
			if (this.gameState.pamHouseUpgrade) {
				// See StardewValley.Locations.Town:showImprovedPamHouse()
				
				let buildingsLayerBounds = new util.Rect(69, 66, 8, 3);
				let alwaysFrontLayerBounds = new util.Rect(69, 60, 8, 6);
				let buildingsLayer = this.map.layers.Buildings;
				let frontLayer = this.map.layers.Front;
				let alwaysFrontLayer = this.map.layers.AlwaysFront;
				
				for (let [x, y] of buildingsLayerBounds.getPoints()) {
					let tileIndex = buildingsLayer.getTileIndex(x, y);
					
					if (buildingsLayer.tiles[tileIndex] >= 0) {
						buildingsLayer.tiles[tileIndex] += 842;
						
						if (this.map.getTile(x, y, 'Buildings', 'Town') === 1568) {
							buildingsLayer.tiles[tileIndex] = 1562;
						}
					}
					
					if (y < buildingsLayerBounds.y + buildingsLayerBounds.height - 1) {
						tileIndex = frontLayer.getTileIndex(x, y);
						
						if (frontLayer.tiles[tileIndex] >= 0) {
							frontLayer.tiles[tileIndex] += 842;
						}
					}
				}
				
				for (let [x, y] of alwaysFrontLayerBounds.getPoints()) {
					let tileIndex = alwaysFrontLayer.getTileIndex(x, y);
					
					if (alwaysFrontLayer.tiles[tileIndex] < 0) {
						this.map.setTile(x, y, 1336 + (x - alwaysFrontLayerBounds.x) + (y - alwaysFrontLayerBounds.y) * 32, 'AlwaysFront', 'Town');
					}
				}
				
				this.map.removeTile(63, 68, 'Buildings');
				this.map.removeTile(62, 72, 'Buildings');
				this.map.removeTile(74, 71, 'Buildings');
			}
			
			if (this.gameState.communityUpgradeShortcuts) {
				// See StardewValley.Locations.Town:showTownCommunityUpgradeShortcuts()
				
				this.map.removeTile(90, 2, 'Buildings');
				this.map.removeTile(90, 1, 'Front');
				this.map.removeTile(90, 1, 'Buildings');
				this.map.removeTile(90, 0, 'Buildings');
				this.map.setTile(89, 1, 360, 'Front', 'Landscape');
				this.map.setTile(89, 2, 385, 'Buildings', 'Landscape');
				this.map.setTile(89, 1, 436, 'Buildings', 'Landscape');
				this.map.setTile(89, 0, 411, 'Buildings', 'Landscape');
				this.map.removeTile(98, 4, 'Buildings');
				this.map.removeTile(98, 3, 'Buildings');
				this.map.removeTile(98, 2, 'Buildings');
				this.map.removeTile(98, 1, 'Buildings');
				this.map.removeTile(98, 0, 'Buildings');
				this.map.setTile(98, 4, 12, 'Back', 'v16_landscape2');
				this.map.setTile(98, 3, 509, 'Back', 'Landscape');
				this.map.setTile(98, 2, 217, 'Back', 'Landscape');
				this.map.setTile(97, 3, 1683, 'Buildings', 'Landscape');
				this.map.setTile(97, 3, 509, 'Back', 'Landscape');
				this.map.setTile(97, 2, 1658, 'Buildings', 'Landscape');
				this.map.setTile(97, 2, 217, 'Back', 'Landscape');
				this.map.setTile(98, 2, 1659, 'AlwaysFront', 'Landscape');
				this.map.removeTile(92, 104, 'Buildings');
				this.map.removeTile(93, 104, 'Buildings');
				this.map.removeTile(94, 104, 'Buildings');
				this.map.removeTile(92, 105, 'Buildings');
				this.map.removeTile(93, 105, 'Buildings');
				this.map.removeTile(94, 105, 'Buildings');
				this.map.removeTile(93, 106, 'Buildings');
				this.map.removeTile(94, 106, 'Buildings');
				this.map.removeTile(92, 103, 'Front');
				this.map.removeTile(93, 103, 'Front');
				this.map.removeTile(94, 103, 'Front');
			}
			
			break;
		}
		case 'WizardHouse': {
			if (this.gameState.seen418172) {
				this.map.setTile(2, 12, 2143, 'Front', 'untitled tile sheet');
			}
			
			break;
		}
		case 'Woods': {
			// TODO: StardewValley.Locations.Woods:UpdateLostItemsShopTile()
			
			// See StardewValley.Locations.Woods:updateStatueEyes()
			
			let frontLayer = this.map.layers.Front;
			
			if (this.gameState.woodsHasUnlockedStatue && !this.gameState.cfStatue) {
				frontLayer.tiles[frontLayer.getTileIndex(8, 6)] = 1117;
				frontLayer.tiles[frontLayer.getTileIndex(9, 6)] = 1118;
			}
			else {
				frontLayer.tiles[frontLayer.getTileIndex(8, 6)] = 1115;
				frontLayer.tiles[frontLayer.getTileIndex(9, 6)] = 1116;
			}
			
			break;
		}}
		
		this.readWallpaperAndFloorTileData();
		this.setWallpapers();
		this.setFloors();
	}
	
	drawMapSprites (timeOfDay, festival) {
		let common = this.core.common;
		
		let location = this.locationPlan.location;
		let daysPlayed = util.daysPlayed(this.gameState);
		
		this.aboveBuildingsFeatures.splice(0);
		this.aboveAlwaysFrontFeatures.splice(0);
		
		switch (location.type) {
		case 'AdventureGuild': {
			if (!this.gameState.checkedMonsterBoard) {
				let feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors, [504, 464 + 4], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, .064801);
				feature.drawSprite(util.tx.mouseCursors, [544, 504 + 4], new util.Rect(175, 425, 12, 12), [255, 255, 255, 255 * .75], 0, [6, 6], 4, Sprite.EF_NONE, .064801);
			}
			
			break;
		}
		case 'Beach': {
			if (!this.gameState.beachBridgeFixed) {
				let feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors, [3704, 720 + 4], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, .095401);
				feature.drawSprite(util.tx.mouseCursors, [3744, 760 + 4], new util.Rect(175, 425, 12, 12), [255, 255, 255, 255 * .75], 0, [6, 6], 4, Sprite.EF_NONE, .095401);
			}
			
			break;
		}
		case 'BeachNightMarket': {
			if (timeOfDay < 1700) {
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [39 * 64 - 4, 29 * 64 - 12], new util.Rect(72, 167, 16, 17), null, 0, null, 4, Sprite.EF_NONE, .001);
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [47 * 64 + 28, 34 * 64 - 12], new util.Rect(45, 170, 26, 14), null, 0, null, 4, Sprite.EF_NONE, .001);
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [19 * 64 + 24, 31 * 64 + 40], new util.Rect(89, 164, 18, 23), null, 0, null, 4, Sprite.EF_NONE, .001);
			}
			
			let dayOfPassiveFestival = -1;
			
			if (this.gameState.seasonNumber === 3 && this.gameState.dayOfMonth >= 15 && this.gameState.dayOfMonth <= 17) {
				dayOfPassiveFestival = this.gameState.dayOfMonth - 15 + 1;
			}
			
			this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [41 * 64 + 8, 33 * 64 + 8], new util.Rect(144 + (dayOfPassiveFestival - 1 + (this.gameState.year - 1) % 3 * 3) * 28, 201, 28, 13), null, 0, null, 4, Sprite.EF_NONE, .22500001);
			break;
		}
		case 'BoatTunnel': {
			let boat = this.createAboveFront();
			let position = [52 * 4, 36 * 4];
			
			if (this.gameState.willyBoatFixed) {
				boat.drawSprite('LooseSprites/WillysBoat', position, new util.Rect(4, 0, 156, 118), null, 0, null, 4, Sprite.EF_NONE, position[1] / 10000);
				boat.drawSprite('LooseSprites/WillysBoat', [position[0] + 32, position[1]], new util.Rect(0, 160, 128, 96), null, 0, null, 4, Sprite.EF_NONE, (position[1] + 408) / 10000);
				this.createAboveFront().drawSprite('LooseSprites/WillysBoat', [6 * 64, 9 * 64], new util.Rect(128, 176, 17, 33), null, 0, null, 4, Sprite.EF_NONE, 512 / 10000);
				boat.drawSprite('LooseSprites/WillysBoat', [position[0] + 35 * 4, position[1] + 81 * 4], new util.Rect(0, 120, 32, 40), null, 0, null, 4, Sprite.EF_NONE, (position[1] + 428) / 10000);
			}
			else {
				boat.drawSprite('LooseSprites/WillysBoat', position, new util.Rect(4, 259, 156, 122), null, 0, null, 4, Sprite.EF_NONE, position[1] / 10000);
				this.createAboveFront().drawSprite('LooseSprites/WillysBoat', [6 * 64, 9 * 64], new util.Rect(128, 176, 17, 33), null, 0, null, 4, Sprite.EF_NONE, 512 / 10000);
				
				if (!this.gameState.willyBoatHull) {
					boat.drawSprite(util.tx.mouseCursors, [416, 456], new util.Rect(395, 497, 3, 8), null, 0, [1, 4], 4, Sprite.EF_NONE, 1);
				}
				
				if (!this.gameState.willyBoatTicketMachine) {
					boat.drawSprite(util.tx.mouseCursors, [288, 520], new util.Rect(395, 497, 3, 8), null, 0, [1, 4], 4, Sprite.EF_NONE, 1);
				}
				
				if (!this.gameState.willyBoatAnchor) {
					boat.drawSprite(util.tx.mouseCursors, [544, 520], new util.Rect(395, 497, 3, 8), null, 0, [1, 4], 4, Sprite.EF_NONE, 1);
				}
				
				boat.drawSprite('LooseSprites/WillysBoat', [4 * 64, 8 * 64], new util.Rect(160, 192, 16, 32), null, 0, null, 4, Sprite.EF_NONE, .0512);
			}
			
			break;
		}
		case 'BusStop': {
			this.createAboveFront().drawSprite(util.tx.mouseCursors, [21 * 64, 6 * 64], new util.Rect(288, 1247, 128, 64), null, 0, null, 4, Sprite.EF_NONE, (6 * 64 + 192) / 10000);
			break;
		}
		case 'CommunityCenter': {
			let numberOfStarsOnPlaque = (
				(this.gameState.ccAreasCompletePantry ? 1 : 0) +
				(this.gameState.ccAreasCompleteCraftsRoom ? 1 : 0) +
				(this.gameState.ccAreasCompleteFishTank ? 1 : 0) +
				(this.gameState.ccAreasCompleteBoilerRoom ? 1 : 0) +
				(this.gameState.ccAreasCompleteVault ? 1 : 0) +
				(this.gameState.ccAreasCompleteBB ? 1 : 0)
			);
			
			for (let i = 0; i < numberOfStarsOnPlaque; ++i) {
				switch (i) {
				case 0: this.createAboveFront().drawSprite(util.tx.mouseCursors, [2136, 324], new util.Rect(354, 401, 7, 7), null, 0, null, 4, Sprite.EF_NONE, .8); break;
				case 1: this.createAboveFront().drawSprite(util.tx.mouseCursors, [2136, 364], new util.Rect(354, 401, 7, 7), null, 0, null, 4, Sprite.EF_NONE, .8); break;
				case 2: this.createAboveFront().drawSprite(util.tx.mouseCursors, [2096, 384], new util.Rect(354, 401, 7, 7), null, 0, null, 4, Sprite.EF_NONE, .8); break;
				case 3: this.createAboveFront().drawSprite(util.tx.mouseCursors, [2056, 364], new util.Rect(354, 401, 7, 7), null, 0, null, 4, Sprite.EF_NONE, .8); break;
				case 4: this.createAboveFront().drawSprite(util.tx.mouseCursors, [2056, 324], new util.Rect(354, 401, 7, 7), null, 0, null, 4, Sprite.EF_NONE, .8); break;
				case 5: this.createAboveFront().drawSprite(util.tx.mouseCursors, [2096, 308], new util.Rect(354, 401, 7, 7), null, 0, null, 4, Sprite.EF_NONE, .8); break;
				}
			}
			
			break;
		}
		case 'Desert':
		case 'DesertFestival': {
			if (location.type === 'DesertFestival') {
				// TODO: StardewValley.Locations.DesertFestival:draw()
			}
			
			this.createAboveFront().drawSprite(util.tx.mouseCursors, [17 * 64, 24 * 64], new util.Rect(288, 1247, 128, 64), null, 0, null, 4, Sprite.EF_NONE, (24 * 64 + 192) / 10000);
			
			if (location.type === 'DesertFestival') {
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [536 * 4, 340 * 4], new util.Rect(208, 524, 65, 49), null, 0, null, 4, Sprite.EF_NONE, .1324);
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [536 * 4, 340 * 4], new util.Rect(273, 524, 65, 49), null, 0, null, 4, Sprite.EF_NONE, .1332);
			}
			else {
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [528 * 4, 298 * 4], new util.Rect(0, 513, 208, 101), null, 0, null, 4, Sprite.EF_NONE, .1324);
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [536 * 4, 340 * 4], new util.Rect(208, 591, 65, 49), null, 0, null, 4, Sprite.EF_NONE, .1332);
			}
			
			if (!(this.gameState.seasonNumber === 3 && this.gameState.dayOfMonth >= 15 && this.gameState.dayOfMonth <= 17)) {
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [663 * 4, 354 * 4], new util.Rect(0, 614, 20, 26), null, 0, null, 4, Sprite.EF_NONE, .1328);
			}
			
			break;
		}
		case 'Farm': {
			// TODO: addGrandpaCandles()
			
			if (!this.gameState.hasSeenGrandpaNote) {
				let position = this.map.properties.GrandpaShrineLocation?.split(/ +/) ?? [8, 7];
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [(+position[0] + 1) * 64, +position[1] * 64], new util.Rect(575, 1972, 11, 8), null, 0, null, 4, Sprite.EF_NONE, +position[1] * 64 / 10000 + 1e-6);
			}
			
			break;
		}
		case 'FarmHouse': {
			if (this.gameState.spouse === 'Sebastian' && this.gameState.sebastianFrog) {
				let spouseRoomCorner = this.getSpouseRoomCorner();
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [(spouseRoomCorner[0] + 1) * 64, (spouseRoomCorner[1] + 6) * 64 - 20], new util.Rect(641, 1534, 48, 37), null, 0, null, 4, Sprite.EF_NONE, (spouseRoomCorner[1] + 8.1) * 64 / 10000);
			}
			
			break;
		}
		case 'Forest': {
			if (this.gameState.dayOfMonth % 7 % 5 === 0) {
				let cartX = 23;
				let cartY = 10;
				let feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors, [(cartX + 1) * 64, (cartY - 2) * 64], new util.Rect(142, 1382, 109, 70), null, 0, null, 4, Sprite.EF_NONE, .0768);
				feature.drawSprite(util.tx.mouseCursors, [cartX * 64, cartY * 64 + 32], new util.Rect(112, 1424, 30, 24), null, 0, null, 4, Sprite.EF_NONE, .07681);
				feature.drawSprite(util.tx.mouseCursors, [(cartX + 1) * 64, (cartY + 1) * 64 + 32 - 8], new util.Rect(142, 1424, 16, 3), null, 0, null, 4, Sprite.EF_NONE, .07682);
				feature.drawSprite(util.tx.mouseCursors, [(cartX + 1) * 64 + 8, cartY * 64 - 32 - 8], new util.Rect(71, 1966, 18, 18), null, 0, null, 4, Sprite.EF_NONE, .07678001);
				feature.drawSprite(util.tx.mouseCursors, [cartX * 64, cartY * 64 - 32], new util.Rect(167, 1966, 18, 18), null, 0, null, 4, Sprite.EF_NONE, .07678001);
				
				if (timeOfDay >= 2000) {
					feature.drawRect(new util.Rect((cartX + 4) * 64 + 16, cartY * 64, 64, 64), util.namedColors.Black, 0, null, 4, Sprite.EF_NONE, .076840006);
				}
			}
			
			if (this.gameState.hasAchievements) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [2056, 6016], new util.Rect(600, 1957, 64, 32), null, 0, null, 4, Sprite.EF_NONE, .6016);
			}
			
			let numRaccoonBabies = this.gameState.timesFedRaccoons - 1;
			
			if (!this.gameState.forestStumpFixed && this.gameState.raccoonTreeFallen && !this.gameState.checkedRaccoonStump) {
				let feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors, [3576, 272 - 8], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, .050400995);
				feature.drawSprite(util.tx.mouseCursors, [3616, 312 - 8], new util.Rect(175, 425, 12, 12), [255, 255, 255, 255 * .75], 0, [6, 6], 4, Sprite.EF_NONE, .050409995);
			}
			else if (numRaccoonBabies > 0) {
				for (let i = 0; i < Math.min(numRaccoonBabies, 8); ++i) {
					let feature = this.createAboveFront();
					
					switch (i) {
					case 0: feature.drawSprite(util.tx.mouseCursors_1_6, [3706, 340], new util.Rect(213, 472, 10, 9), null, 0, [5.5, 9], 4, Sprite.EF_NONE, .0448); break;
					case 1: feature.drawSprite(util.tx.mouseCursors_1_6, [54 * 64 + 8, 4 * 64 - 12], new util.Rect(235, 472, 9, 12), null, 0, null, 4, Sprite.EF_FLIP_HORIZONTALLY, .0448); break;
					case 2: feature.drawSprite(util.tx.mouseCursors_1_6, [3462, 433], new util.Rect(213, 472, 10, 9), null, 0, [5.5, 9], 4, Sprite.EF_NONE, .0448); break;
					case 3: feature.drawSprite(util.tx.mouseCursors_1_6, [58 * 64 + 4, 4 * 64 - 20], new util.Rect(235, 472, 9, 12), null, 0, [5.5, 9], 4, Sprite.EF_NONE, .0448); break;
					case 4: feature.drawSprite(util.tx.mouseCursors_1_6, [3770, 408], new util.Rect(213, 472, 10, 9), null, 0, [5.5, 9], 4, Sprite.EF_NONE, .0448); break;
					case 5: feature.drawSprite(util.tx.mouseCursors_1_6, [55 * 64 + 12, 3 * 64 + 4], new util.Rect(213, 472, 10, 9), null, 0, [5.5, 9], 4, Sprite.EF_NONE, .0064); break;
					case 6: feature.drawSprite(util.tx.mouseCursors_1_6, [56 * 64 + 40, 3 * 64 - 8], new util.Rect(213, 472, 10, 9), null, 0, [5.5, 9], 4, Sprite.EF_NONE, .0064); break;
					case 7: feature.drawSprite(util.tx.mouseCursors_1_6, [58 * 64 - 20, 3 * 64 - 48], new util.Rect(235, 472, 9, 12), null, 0, null, 4, Sprite.EF_NONE, .0448); break;
					}
				}
			}
			
			if (this.gameState.seasonNumber === 0 && this.gameState.dayOfMonth === 17) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors_1_6, [52 * 64, 97 * 64], new util.Rect(257, 108, 136, 116), null, 0, null, 4, Sprite.EF_NONE, 1);
			}
			
			break;
		}
		case 'IslandEast': {
			this.drawParrotPlatform(28 - 1, 29 - 2); // Forest
			this.drawGemBirdIfPresent(21, 35);
			let feature;
			
			// See StardewValley.Locations.IslandEast:AddTorchLights()
			
			feature = this.createAboveFront();
			feature.drawSprite(util.tx.mouseCursors, [1280 + 24, 704 + 48], new util.Rect(276, 1965, 8, 8), null, 0, null, 3, Sprite.EF_NONE, (704 + 48) / 10000 + .0001);
			feature.drawSprite(util.tx.mouseCursors, [1280 + 16, 704 + 28], new util.Rect(276, 1984, 12, 12), null, 0, null, 3, Sprite.EF_NONE, (704 + 28) / 10000 + .0001);
			
			feature = this.createAboveFront();
			feature.drawSprite(util.tx.mouseCursors, [1472 + 24, 704 + 48], new util.Rect(276, 1965, 8, 8), null, 0, null, 3, Sprite.EF_NONE, (704 + 48) / 10000 + .0001);
			feature.drawSprite(util.tx.mouseCursors, [1472 + 16, 704 + 28], new util.Rect(276, 1984, 12, 12), null, 0, null, 3, Sprite.EF_NONE, (704 + 28) / 10000 + .0001);
			
			if (this.gameState.islandEastBananaShrineComplete) {
				// See StardewValley.Locations.IslandEast:AddGorillaShrineTorches()
				
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [15 * 64 + 8, 24 * 64 - 16], new util.Rect(276, 1985, 12, 11), null, 0, null, 4, Sprite.EF_NONE, .16704);
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [17 * 64 + 8, 24 * 64 - 16], new util.Rect(276, 1985, 12, 11), null, 0, null, 4, Sprite.EF_NONE, .16704);
				
				let rng = new CSRandom(this.core.baseUtil.getRandomSeed(this.core.save.gameID, daysPlayed, 1111));
				
				if (rng.NextDouble() < .1) {
					this.createAboveFront().drawSprite('TileSheets/critters', [15.5 * 64, 1497], new util.Rect(32, 352, 32, 32), null, 0, null, 4, Sprite.EF_NONE, .1216);
				}
			}
			
			break;
		}
		case 'IslandFarmCave': {
			// Gourmand is an NPC, and we don't normally draw NPCs. However,
			// since the question mark is related to him, we'll do both.
			
			let positionX = 4 * 64;
			let positionY = 4 * 64;
			let boundingBox = new util.Rect(positionX + 8, positionY + 16, 32 * 3, 32); // See StardewValley.Character:GetBoundingBox()
			this.createAboveFront().drawSprite('Characters/Gourmand', [positionX + 32 * 2, Math.floor(boundingBox.centerY())], new util.Rect(0, 0, 32, 32), null, 0, [32 / 2, 32 * 3 / 4], 4, Sprite.EF_NONE, (4 + .5) * 64 / 10000);
			
			if (this.gameState.islandFarmCaveGourmandRequestsFulfilled < 3) {
				let standingX = boundingBox.centerX();
				let standingY = boundingBox.centerY();
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [standingX, standingY - 128 - 8], new util.Rect(114, 53, 6, 10), null, 0, [1, 4], 4, Sprite.EF_NONE, 1);
			}
			
			break;
		}
		case 'IslandFieldOffice': {
			if (this.gameState.islandFieldOfficeCenterSkeletonRestored) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [3 * 64, 4 * 64 + 16], new util.Rect(210, 184, 46, 43), null, 0, null, 4, Sprite.EF_NONE, .0512);
			}
			
			if (this.gameState.islandFieldOfficeSnakeRestored) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [1 * 64, 5 * 64], new util.Rect(195, 185, 14, 42), null, 0, null, 4, Sprite.EF_NONE, .0448);
			}
			
			if (this.gameState.islandFieldOfficeBatRestored) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [2.5 * 64 + 4, 2.7 * 64 + 4], new util.Rect(212, 171, 16, 12), null, 0, null, 4, Sprite.EF_NONE, .0256);
			}
			
			if (this.gameState.islandFieldOfficeFrogRestored) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [6 * 64 + 36, 2 * 64 + 40], new util.Rect(232, 169, 14, 15), null, 0, null, 4, Sprite.EF_NONE, .0256);
			}
			
			if (this.gameState.islandFieldOfficePlantsRestoredLeft) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [1 * 64, 4 * 64 - 28], new util.Rect(194, 167, 16, 17), null, 0, null, 4, Sprite.EF_NONE, .032);
			}
			
			if (this.gameState.islandFieldOfficePlantsRestoredRight) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [7 * 64 + 32, 3 * 64 + 12], new util.Rect(224, 148, 32, 21), null, 0, null, 4, Sprite.EF_NONE, .032);
			}
			
			break;
		}
		case 'IslandNorth': {
			if (!this.gameState.islandNorthTreeNutShot) {
				// We use a negative layerDepth so that the walnut is drawn behind
				// the Buildings layer. Note that our rendering system merges Back
				// and Buildings into one layer, so this technically also puts it
				// behind the Back layer. It happens to be okay in this case, since
				// there isn't anything in the Back layer at this spot.
				
				this.createAboveBuildings().drawSprite(util.tx.objectSpriteSheet, [58.25 * 64, 10 * 64], util.getStandardTextureRect(util.textureSizes[util.tx.objectSpriteSheet], 73, 16, 16), null, 0, null, 4, Sprite.EF_NONE, .1 - 1);
			}
			
			this.drawParrotPlatform(60 - 1, 17 - 2); // Volcano
			this.drawParrotPlatform(5 - 1, 49 - 2); // Archaeology (destination depends on islandNorthBridgeFixed)
			this.drawParrotPerch(35, 52, 10, 'Island Dig Site', this.gameState.islandNorthBridgeFixed, 'Bridge', ['islandSouthWesternTurtleMoved']);
			this.drawParrotPerch(32, 72, 10, 'Island Trader', this.gameState.islandNorthTraderActivated, 'Trader', ['islandWestFarmhouseRestored']);
			
			if (!this.gameState.activatedGoldenParrot && this.gameState.goldenWalnutsFound < 130) {
				this.drawParrotPerch(14, 14, 0, 'All Remaining Golden Walnuts', false, 'GoldenParrot', []);
			}
			
			this.drawGemBirdIfPresent(56, 56);
			
			// See StardewValley.BellsAndWhistles.SuspensionBridge:Draw()
			
			let tileX = 38;
			let tileY = 39;
			let feature = this.createAboveFront();
			feature.drawSprite('LooseSprites/SuspensionBridge', [tileX * 64, tileY * 64 - 128], new util.Rect(0, 0, 96, 32), null, 0, null, 4, Sprite.EF_NONE, (tileY * 64) / 10000 + .0256);
			
			for (let i = 0; i < 6; ++i) {
				feature.drawSprite('LooseSprites/SuspensionBridge', [tileX * 64 + i * 64, tileY * 64], new util.Rect(16 * i, 32, 16, 16), null, 0, null, 4, Sprite.EF_NONE, (tileY * 64) / 10000 + .0256);
			}
			
			if (!this.gameState.islandNorthCaveOpened) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [1344, 3008], new util.Rect(155, 224, 32, 32), null, 0, null, 4, Sprite.EF_NONE, 3008 / 10000);
			}
			
			break;
		}
		case 'IslandSouth': {
			if (!this.gameState.islandFirstParrot) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [17 * 64, 0], new util.Rect(208, 94, 48, 53), null, 0, null, 4, .001);
			}
			
			if (!this.gameState.islandSouthWesternTurtleMoved) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [.5 * 64, 10 * 64], new util.Rect(152, 101, 56, 40), null, 0, null, 4, .001);
			}
			
			this.drawParrotPlatform(6 - 1, 32 - 2); // Docks
			this.drawParrotPerch(17, 22, 20, 'Island Resort', this.gameState.islandSouthResortRestored, 'Resort', ['islandWestFarmhouseRestored']);
			this.drawParrotPerch(5, 9, 10, 'Ginger Island West', this.gameState.islandSouthWesternTurtleMoved, 'Turtle', ['islandFirstParrot']);
			this.drawGemBirdIfPresent(10, 30);
			
			let boat = this.createAboveFront();
			boat.drawSprite('LooseSprites/WillysBoat', [14 * 64, 37 * 64], new util.Rect(192, 0, 96, 208), null, 0, null, 4, Sprite.EF_NONE, (37 * 64 + 320) / 10000);
			boat.drawSprite('LooseSprites/WillysBoat', [14 * 64, 37 * 64], new util.Rect(288, 0, 96, 208), null, 0, null, 4, Sprite.EF_NONE, (37 * 64 + 616) / 10000);
			
			this.createAboveFront().drawSprite('LooseSprites/WillysBoat', [1184, 2752], new util.Rect(192, 208, 32, 16), null, 0, null, 4, Sprite.EF_NONE, .272);
			break;
		}
		case 'IslandSouthEast': {
			if (location.isRainingHere()) {
				this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [32 * 64, 32 * 64 - 32], new util.Rect(304, 592, 28, 36), null, 0, null, 4, Sprite.EF_NONE, .0009);
			}
			
			break;
		}
		case 'IslandWest': {
			this.drawParrotPlatform(74 - 1, 10 - 2); // Farm
			this.drawParrotPerch(72, 37, 20, 'Farm Obelisk', this.gameState.islandWestFarmObelisk, 'Obelisk', ['islandWestFarmhouseMailbox']);
			this.drawParrotPerch(81, 40, 5, 'Farmhouse Mailbox', this.gameState.islandWestFarmhouseMailbox, 'House_Mailbox', ['islandWestFarmhouseRestored']);
			this.drawParrotPerch(81, 40, 20, 'Ginger Island Farmhouse', this.gameState.islandWestFarmhouseRestored, 'House', []);
			this.drawParrotPerch(72, 10, 10, 'Parrot Express', this.gameState.parrotPlatformsUnlocked, 'ParrotPlatforms', []);
			this.drawGemBirdIfPresent(53, 51);
			
			if (timeOfDay > 1700) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [23 * 64 - 16, 58 * 64 - 32], new util.Rect(276, 1985, 12, 11), null, 0, null, 4, Sprite.EF_NONE, .37824);
			}
			
			if (this.gameState.islandWestFarmhouseRestored) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [90 * 64 + 8, (39 - 1) * 64 - 28], new util.Rect(134, 226, 30, 25), null, 0, null, 4, Sprite.EF_NONE, ((39 + 1) * 64) / 10000 + .0001);
			}
			
			if (this.gameState.islandWestFarmhouseMailbox && this.gameState.mailboxHasEntries) {
				let drawLayer = (81 + 1) * 64 / 10000 + 40 * 64 / 10000;
				let feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors, [81 * 64 - 8, 40 * 64 - 96 - 48], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, drawLayer + 1e-6);
				feature.drawSprite(util.tx.mouseCursors, [81 * 64 + 32 + 4 - 8, 40 * 64 - 64 - 24 - 8], new util.Rect(189, 423, 15, 13), null, 0, [7, 6], 4, Sprite.EF_NONE, drawLayer + 1e-5);
			}
			
			break;
		}
		case 'IslandWestCave1': {
			let crystals = [
				[3, 4, [220, 0, 255, 255]],
				[4, 6, util.namedColors.Lime],
				[6, 7, [255, 50, 100, 255]],
				[8, 6, [0, 200, 255, 255]],
				[9, 4, [255, 180, 0, 255]],
			];
			
			for (let [tileX, tileY, color] of crystals) {
				let feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors2, [tileX * 64 + 32, tileY * 64 + 40], new util.Rect(188, 228, 52, 28), color, 0, [26, 14], 4, Sprite.EF_NONE, (tileY * 64 + 64 - 8) / 10000, {isLight: true});
				feature.drawSprite(util.tx.mouseCursors2, [tileX * 64, tileY * 64 - 52], new util.Rect(240, 227, 16, 29), color, 0, null, 4, Sprite.EF_NONE, (tileY * 64 + 64 - 4) / 10000);
			}
			
			break;
		}
		case 'LibraryMuseum': {
			for (let x = 0; x < this.map.width; ++x) {
				for (let y = 0; y < this.map.height; ++y) {
					let action = this.map.getTileAttributes(x, y, 'Buildings')?.properties?.Action?.split(' ');
					
					if (action == null || action[0] !== 'Notes') {
						continue;
					}
					
					let noteId = +action[1];
					
					if (isNaN(noteId) || noteId > common.lostBooksFound || common.player.mailReceived.has(`lb_${noteId}`)) {
						continue;
					}
					
					this.createAboveAlwaysFront().drawSprite(util.tx.mouseCursors, [x * 64, y * 64 - 96 - 16], new util.Rect(144, 447, 15, 15), null, 0, null, 4, Sprite.EF_NONE, 1);
				}
			}
			
			break;
		}
		case 'ManorHouse': {
			if (this.gameState.returnedDonations) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors2, [4 * 64 + 28, 4 * 64], new util.Rect(114, 53, 6, 10), null, 0, [1, 4], 4, Sprite.EF_NONE, 1);
			}
			
			break;
		}
		case 'MermaidHouse': {
			this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [64, 64], new util.Rect(144, 119, 57, 81), null, 0, null, 4, Sprite.EF_NONE, .001);
			this.createAboveFront().drawSprite('LooseSprites/temporary_sprites_1', [292, 64], new util.Rect(200, 119, 57, 81), null, 0, null, 4, Sprite.EF_NONE, .001);
			break;
		}
		case 'Mountain': {
			if (!this.gameState.ccFishTank) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [47 * 64 - 16, 3 * 64 - 12], new util.Rect(439, 1385, 39, 48), null, 0, null, 4, Sprite.EF_NONE, .0001);
			}
			
			if (daysPlayed < 31) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [512, 0], new util.Rect(640, 2176, 64, 80), null, 0, null, 4, Sprite.EF_NONE, .0193);
			}
			
			if (daysPlayed < 5) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [3200, 256], new util.Rect(646, 1218, 48, 80), null, 0, null, 4, Sprite.EF_NONE, .0192);
				let feature = this.createAboveFront();
				feature.drawBasicShadow([3200 + 192 - 20 + 32, 256 + 192 - 20 + 24], .0224);
				feature.drawSprite(util.tx.mouseCursors, [3200 + 192 - 20, 256 + 128], new util.Rect(288, 1349, 19, 28), null, 0, null, 4, Sprite.EF_NONE, .0256);
				feature.drawSprite(util.tx.mouseCursors, [3200 + 256 - 20, 256 + 128], new util.Rect(335, 1410, 21, 21), null, 0, null, 4, Sprite.EF_NONE, .0128);
			}
			
			break;
		}
		case 'SeedShop': {
			if (this.gameState.maxItems === 12) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [456, 1088], new util.Rect(255, 1436, 12, 14), null, 0, null, 4, Sprite.EF_NONE, .1232);
			}
			else if (this.gameState.maxItems < 36) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [456, 1088], new util.Rect(267, 1436, 12, 14), null, 0, null, 4, Sprite.EF_NONE, .1232);
			}
			else {
				this.createAboveFront().drawRect(new util.Rect(452, 1184, 112, 20), [188, 190, 230, 255], 0, null, 4, Sprite.EF_NONE, .1232);
			}
			
			break;
		}
		case 'Town': {
			if (this.gameState.jojaMember) {
				if (!this.map.appliedOverrides.has('Town-TheaterCC') && !this.map.appliedOverrides.has('Town-TheaterCC-Halloween2')) {
					this.createAboveFront().drawSprite(util.tx.mouseCursors, [3044, 1140], new util.Rect(424, 1325, 174, 51), null, 0, null, 4, Sprite.EF_NONE, .128);
					
					let alwaysFrontFeature = this.createAboveAlwaysFront();
					alwaysFrontFeature.drawSprite(util.tx.mouseCursors, [3044, 940], new util.Rect(424, 1275, 174, 50), null, 0, null, 4, Sprite.EF_NONE, .128);
					
					if (location.getSeasonNumber() === 3) {
						alwaysFrontFeature.drawSprite(util.tx.mouseCursors, [3044, 940], new util.Rect(66, 1678, 174, 25), null, 0, null, 4, Sprite.EF_NONE, .1281);
					}
				}
			}
			
			if (!this.gameState.checkedBulletinOnce) {
				let feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors, [2616, 3472], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, .98);
				feature.drawSprite(util.tx.mouseCursors, [2656, 3512], new util.Rect(175, 425, 12, 12), [255, 255, 255, 255 * .75], 0, [6, 6], 4, Sprite.EF_NONE, 1);
			}
			
			if (this.core.isExtensionEnabled('quests')) {
				let quest = this.core.extensions.quests.lib.getQuestOfTheDay(this.gameState);
				
				if (quest !== null) {
					this.createAboveFront().drawSprite(util.tx.mouseCursors, [2692, 3528], new util.Rect(395, 497, 3, 8), null, 0, [1, 4], 4, Sprite.EF_NONE, 1);
				}
			}
			
			if (daysPlayed >= 58 && !this.gameState.acceptedSpecialOrderType_) {
				this.createAboveFront().drawSprite(util.tx.mouseCursors, [3997.6, 5908.8], new util.Rect(395, 497, 3, 8), null, 0, [1, 4], 4, Sprite.EF_NONE, 1);
			}
			
			if (this.gameState.hasSpecialOrderPrizeTickets && festival === null) {
				let feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors, [3832, 5840], new util.Rect(141, 465, 20, 24), [255, 255, 255, 255 * .75], 0, null, 4, Sprite.EF_NONE, .98);
				feature.drawSprite(util.tx.mouseCursors_1_6, [3872, 5880], new util.Rect(240, 240, 16, 16), [255, 255, 255, 255 * .75], 0, [8, 8], 4, Sprite.EF_NONE, 1);
			}
			
			if (util.getBooksellerDays(this.core, this.gameState.year, this.gameState.seasonNumber).includes(this.gameState.dayOfMonth)) {
				let feature;
				
				// Sign near Pierre's.
				
				feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors_1_6, [52 * 64 + 24, 50 * 64 + 4], new util.Rect(258, 335, 26, 29), null, 0, null, 4, Sprite.EF_NONE, .32);
				
				// Bookseller.
				
				feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors_1_6, [106 * 64 + 4, 22 * 64 + 4], new util.Rect(0, 433, 110, 79), null, 0, null, 4, Sprite.EF_NONE, .1728);
				
				// Balloon.
				
				feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors, [1832 * 4, 425 * 4], new util.Rect(0, 1183, 84, 160), null, 0, [42, 160], 4, Sprite.EF_NONE, .1728);
				
				// Rope and ribbons.
				
				feature = this.createAboveFront();
				feature.drawSprite(util.tx.mouseCursors_1_6, [106 * 64 + 360, 22 * 64 + 56], new util.Rect(89, 446, 44, 7), null, 0, null, 4, Sprite.EF_NONE, .17216);
				feature.drawSprite(util.tx.mouseCursors_1_6, [106 * 64 + 428, 22 * 64 + 84], new util.Rect(110, 474, 10, 7), null, Math.PI / 2, null, 4, Sprite.EF_NONE, .1728);
				feature.drawSprite(util.tx.mouseCursors_1_6, [106 * 64 + 460, 22 * 64 + 84], new util.Rect(110 + 40, 467, 10, 7), null, Math.PI / 2, null, 4, Sprite.EF_NONE, .1728);
				feature.drawSprite(util.tx.mouseCursors_1_6, [106 * 64 + 492, 22 * 64 + 84], new util.Rect(110 + 20, 481, 10, 7), null, Math.PI / 2, null, 4, Sprite.EF_NONE, .1728);
			}
			
			break;
		}}
	}
	
	createAboveBuildings (tileX = 0, tileY = 0, width = 0, height = 0) {
		let feature = Feature.createTemporal(tileX, tileY);
		this.aboveBuildingsFeatures.push(feature);
		feature.meta.width = width;
		feature.meta.height = height;
		return feature;
	}
	
	createAboveFront (tileX = 0, tileY = 0, width = 0, height = 0) {
		let feature = Feature.createTemporal(tileX, tileY);
		this.locationPlan.features.push(feature);
		feature.meta.width = width;
		feature.meta.height = height;
		return feature;
	}
	
	createAboveAlwaysFront (tileX = 0, tileY = 0, width = 0, height = 0) {
		let feature = Feature.createTemporal(tileX, tileY);
		this.aboveAlwaysFrontFeatures.push(feature);
		feature.meta.width = width;
		feature.meta.height = height;
		return feature;
	}
	
	drawParrotPerch (tileX, tileY, walnuts, reward, isComplete, upgradeName, requiredGameStates) {
		// See StardewValley.BellsAndWhistles.ParrotUpgradePerch:Draw()
		
		let parrotPresent = !isComplete;
		let isAvailable = true;
		
		for (let key of requiredGameStates) {
			if (!this.gameState[key]) {
				isAvailable = false;
				break;
			}
		}
		
		if (isAvailable && (parrotPresent || upgradeName === 'Hut')) {
			let feature = this.createAboveFront(tileX, tileY, 1, 1);
			
			if (upgradeName === 'GoldenParrot') {
				let cost = Math.max(0, 130 - this.gameState.goldenWalnutsFound) * 10000;
				feature.meta.name = 'Golden Joja Parrot';
				feature.addNote(`${this.core.baseUtil.addCommas(cost)}g: ${reward}`, Feature.NOTE_COMMA);
			}
			else {
				feature.meta.name = 'Parrot';
				feature.addNote(`${walnuts} walnuts: ${reward}`, Feature.NOTE_COMMA);
			}
			
			feature.drawSprite('LooseSprites/parrots', [(tileX + .5) * 64, (tileY - 1) * 64], new util.Rect(0, (upgradeName === 'GoldenParrot') ? 96 : 0, 24, 24), null, 0, [12, 16], 4, Sprite.EF_NONE, ((tileY + 1) * 64 - 1) / 10000);
		}
	}
	
	drawParrotPlatform (tileX, tileY, key) {
		// See StardewValley.BellsAndWhistles.ParrotPlatform:Draw()
		
		let positionY = tileY * 64 - 128;
		let feature = this.createAboveFront();
		feature.drawSprite('LooseSprites/ParrotPlatform', [tileX * 64 - 8 + 96, positionY + 152 + 64], new util.Rect(48, 73, 48, 32), null, 0, [24, 16], 4, Sprite.EF_NONE, 0, {isShadow: true});
		feature.drawSprite('LooseSprites/ParrotPlatform', [tileX * 64, positionY], new util.Rect(0, 0, 48, 68), null, 0, null, 4, Sprite.EF_NONE, positionY / 10000);
		feature.drawSprite('LooseSprites/ParrotPlatform', [tileX * 64, positionY], new util.Rect(48, 0, 48, 68), null, 0, null, 4, Sprite.EF_NONE, (positionY + 128) / 10000);
		
		if (this.gameState.parrotPlatformsUnlocked) {
			feature.drawSprite('LooseSprites/parrots', [tileX * 64 + 15 * 4, positionY + 20 * 4 - 84], new util.Rect(0, 0, 24, 24), null, 0, [12, 19], 4, Sprite.EF_NONE, (positionY + 20 * 4 + .1 + 192) / 10000);
			feature.drawSprite('LooseSprites/parrots', [tileX * 64 + 33 * 4, positionY + 20 * 4 - 84], new util.Rect(0, 0, 24, 24), null, 0, [12, 19], 4, Sprite.EF_FLIP_HORIZONTALLY, (positionY + 20 * 4 + .1 + 192) / 10000);
		}
	}
	
	drawGemBirdIfPresent (tileX, tileY) {
		let location = this.locationPlan.location;
		
		// See StardewValley.Game1:newDayAfterFade()
		
		if (!location.isRainingHere()) {
			return;
		}
		
		let locationCycle = ['IslandSouth', 'IslandNorth', 'IslandWest', 'IslandEast'];
		let rng = new CSRandom(this.core.baseUtil.getRandomSeed(this.core.save.gameID));
		util.shuffle(rng, locationCycle);
		
		if (locationCycle[this.gameState.currentGemBirdIndex] !== location.id) {
			return;
		}
		
		// See StardewValley.IslandGemBird:GetBirdTypeForLocation()
		
		let types = [0, 1, 2, 3, 4];
		rng = new CSRandom(this.core.baseUtil.getRandomSeed(this.core.save.gameID));
		util.shuffle(rng, types);
		let type = types[['IslandNorth', 'IslandSouth', 'IslandEast', 'IslandWest'].indexOf(location.id)];
		
		let position = [(tileX + .5) * 64, (tileY + .5) * 64];
		let color = [
			[67, 255, 83, 255],
			[74, 243, 255, 255],
			[255, 38, 38, 255],
			[255, 67, 251, 255],
			[255, 156, 33, 255],
		][type] ?? util.namedColors.White;
		let item = this.core.items.get([
			'(O)60', // Emerald
			'(O)62', // Aquamarine
			'(O)64', // Ruby
			'(O)66', // Amethyst
			'(O)68', // Topaz
		][type] ?? '(O)0');
		
		// See StardewValley.IslandGemBird:Draw()
		
		let feature = this.createAboveFront(tileX, tileY, 1, 1);
		feature.meta.name = 'Gem Bird';
		feature.addNote(util.getItemText(item), Feature.NOTE_PARENS);
		feature.drawSprite('LooseSprites/GemBird', position, new util.Rect(0, 0, 32, 32), null, 0, [16, 32], 4, Sprite.EF_NONE, (position[1] - 1) / 10000);
		feature.drawSprite('LooseSprites/GemBird', position, new util.Rect(0, 32, 32, 32), color, 0, [16, 32], 4, Sprite.EF_NONE, position[1] / 10000);
		feature.drawBasicShadow(position, (position[1] - 2) / 10000, 3);
	}
	
	addInitialFeatures (requiredOnly) {
		let location = this.locationPlan.location;
		
		switch (location.type) {
		case 'Farm':
			// See StardewValley.Farm:AddDefaultBuildings()
			
			let position;
			position = this.map.properties.FarmHouseEntry?.split(/ +/) ?? [64, 15];
			this.addInitialFeature(requiredOnly, +position[0] - 5, +position[1] - 3, {buildingId: 'Farmhouse'});
			
			position = this.getGreenhouseStartLocation();
			this.addInitialFeature(requiredOnly, +position[0], +position[1], {buildingId: 'Greenhouse'});
			
			position = this.map.properties.ShippingBinLocation?.split(/ +/) ?? [71, 14];
			this.addInitialFeature(requiredOnly, +position[0], +position[1], {buildingId: 'Shipping Bin'});
			
			position = this.map.properties.PetBowlLocation?.split(/ +/) ?? [53, 7];
			this.addInitialFeature(requiredOnly, +position[0], +position[1], {buildingId: 'Pet Bowl'});
			break;
		
		case 'FarmHouse': {
			// See StardewValley.Locations.FarmHouse:AddStarterFurniture()
			
			this.addInitialFeature(requiredOnly, 9, 8, '(F)2048');
			
			// The FarmHouseFurniture map property comes from the Farm map file,
			// not the FarmHouse map file that's now loaded. So, we'll have to
			// hardcode the values from the map files.
			
			let farmHouseFurniture = null;
			
			switch (this.gameState.farmType) {
			case 'MeadowlandsFarm':
				farmHouseFurniture = '1792 8 4 0 312 8 6 2 1680 1 4 0 2802 7 4 0 704 4 4 0 1120 1 6 0 192 1 8 2 1443 8 10 0 1383 1 10 0 1382 3 4 0 1369 1 6 0 1814 2 1 0 1814 4 1 0 1814 6 1 0 1616 3 1 0 1616 5 1 0 2632 7 1 0';
				break;
			}
			
			if (farmHouseFurniture != null) {
				let fields = farmHouseFurniture.trim();
				
				if (fields != '') {
					fields = fields.split(/ +/g);
					
					for (let i = 0; i < fields.length; i += 4) {
						let tileX = +fields[i + 1];
						let tileY = +fields[i + 2];
						let info = {
							qualifiedItemId: `(F)${fields[i]}`,
							details: {currentRotation: +fields[i + 3]},
						};
						
						for (let furniture of this.locationPlan.features) {
							if (furniture.tileX === tileX && furniture.tileY === tileY) {
								let heldObject = catalogue.createFeature(this.featureContext, info);
								heldObject.details['@@'] = 'heldObject';
								util.addDetail(furniture.details, heldObject.details);
								info = null;
							}
						}
						
						if (info !== null) {
							this.addInitialFeature(requiredOnly, tileX, tileY, info);
						}
					}
					
					break;
				}
			}
			
			switch (this.gameState.farmType) {
			case '0':
				this.addInitialFeature(requiredOnly, 5, 4, {
					qualifiedItemId: '(F)1120',
					heldObject: '(F)1364',
				});
				this.addInitialFeature(requiredOnly, 1, 10, '(F)1376');
				this.addInitialFeature(requiredOnly, 4, 4, '(F)0');
				this.addInitialFeature(requiredOnly, 1, 4, '(F)1466');
				this.addInitialFeature(requiredOnly, 3, 1, '(F)1614');
				this.addInitialFeature(requiredOnly, 6, 8, '(F)1618');
				this.addInitialFeature(requiredOnly, 5, 1, '(F)1602');
				this.addInitialFeature(requiredOnly, 8, 4, '(F)1792');
				break;
			
			case '1':
				this.addInitialFeature(requiredOnly, {
					qualifiedItemId: '(F)1122',
					heldObject: '(F)1367',
				}, 1, 6);
				this.addInitialFeature(requiredOnly, 1, 5, '(F)3');
				this.addInitialFeature(requiredOnly, 5, 4, '(F)1680');
				this.addInitialFeature(requiredOnly, 1, 1, '(F)1673');
				this.addInitialFeature(requiredOnly, 3, 1, '(F)1673');
				this.addInitialFeature(requiredOnly, 5, 1, '(F)1676');
				this.addInitialFeature(requiredOnly, 6, 8, '(F)1737');
				this.addInitialFeature(requiredOnly, 5, 5, '(F)1742');
				this.addInitialFeature(requiredOnly, 10, 1, '(F)1675');
				this.addInitialFeature(requiredOnly, 8, 4, '(F)1792');
				this.addInitialFeature(requiredOnly, 4, 4, '(BC)FishSmoker');
				break;
			
			case '2':
				this.addInitialFeature(requiredOnly, {
					qualifiedItemId: '(F)1134',
					heldObject: '(F)1748',
				}, 1, 7);
				this.addInitialFeature(requiredOnly, 1, 6, '(F)3');
				this.addInitialFeature(requiredOnly, 6, 4, '(F)1680');
				this.addInitialFeature(requiredOnly, 1, 4, '(F)1296');
				this.addInitialFeature(requiredOnly, 3, 1, '(F)1682');
				this.addInitialFeature(requiredOnly, 6, 5, '(F)1777');
				this.addInitialFeature(requiredOnly, 6, 1, '(F)1745');
				this.addInitialFeature(requiredOnly, 5, 4, '(F)1747');
				this.addInitialFeature(requiredOnly, 10, 4, '(F)1296');
				this.addInitialFeature(requiredOnly, 8, 4, '(F)1792');
				break;
			
			case '3':
				this.addInitialFeature(requiredOnly, 1, 6, {
					qualifiedItemId: '(F)1218',
					heldObject: '(F)1368',
				});
				this.addInitialFeature(requiredOnly, 1, 5, '(F)1755');
				this.addInitialFeature(requiredOnly, 3, 6, {
					qualifiedItemId: '(F)1755',
					details: {currentRotation: 1},
				});
				this.addInitialFeature(requiredOnly, 5, 4, '(F)1680');
				this.addInitialFeature(requiredOnly, 5, 10, '(F)1751');
				this.addInitialFeature(requiredOnly, 3, 1, '(F)1749');
				this.addInitialFeature(requiredOnly, 5, 1, '(F)1753');
				this.addInitialFeature(requiredOnly, 5, 5, '(F)1742');
				this.addInitialFeature(requiredOnly, 8, 4, '(F)1794');
				break;
			
			case '4':
				this.addInitialFeature(requiredOnly, 1, 4, '(F)1680');
				this.addInitialFeature(requiredOnly, 1, 5, '(F)1628');
				this.addInitialFeature(requiredOnly, 3, 4, {
					qualifiedItemId: '(F)1393',
					heldObject: '(F)1369',
				});
				this.addInitialFeature(requiredOnly, 10, 1, '(F)1678');
				this.addInitialFeature(requiredOnly, 3, 1, '(F)1812');
				this.addInitialFeature(requiredOnly, 1, 1, '(F)1630');
				this.addInitialFeature(requiredOnly, 6, 1, '(F)1811');
				this.addInitialFeature(requiredOnly, 10, 4, '(F)1389');
				this.addInitialFeature(requiredOnly, 1, 10, '(F)1758');
				this.addInitialFeature(requiredOnly, 8, 4, '(F)1794');
				break;
			
			case '5':
				this.addInitialFeature(requiredOnly, 1, 4, '(F)1466');
				this.addInitialFeature(requiredOnly, 3, 1, '(F)1614');
				this.addInitialFeature(requiredOnly, 6, 1, '(F)1614');
				this.addInitialFeature(requiredOnly, 10, 1, '(F)1601');
				this.addInitialFeature(requiredOnly, 3, 4, {
					qualifiedItemId: '(F)2025',
					details: {currentRotation: 1},
				});
				this.addInitialFeature(requiredOnly, 4, 4, {
					qualifiedItemId: '(F)1124',
					heldObject: '(F)1379',
					details: {currentRotation: 1},
				});
				this.addInitialFeature(requiredOnly, 6, 4, {
					qualifiedItemId: '(F)202',
					details: {currentRotation: 3},
				});
				this.addInitialFeature(requiredOnly, 10, 4, '(F)1378');
				this.addInitialFeature(requiredOnly, 1, 9, '(F)1377');
				this.addInitialFeature(requiredOnly, 1, 10, '(F)1445');
				this.addInitialFeature(requiredOnly, 2, 9, '(F)1618');
				this.addInitialFeature(requiredOnly, 8, 4, '(F)1792');
				break;
			
			case '6':
				this.addInitialFeature(requiredOnly, 4, 4, '(F)1680');
				this.addInitialFeature(requiredOnly, 7, 1, '(F)1614');
				this.addInitialFeature(requiredOnly, 3, 4, '(F)1294');
				this.addInitialFeature(requiredOnly, 1, 4, '(F)1283');
				this.addInitialFeature(requiredOnly, 8, 1, '(F)1614');
				this.addInitialFeature(requiredOnly, 7, 4, '(F)202');
				this.addInitialFeature(requiredOnly, 10, 4, '(F)1294');
				this.addInitialFeature(requiredOnly, 2, 6, {
					qualifiedItemId: '(F)6',
					details: {currentRotation: 1},
				});
				this.addInitialFeature(requiredOnly, 5, 7, {
					qualifiedItemId: '(F)6',
					details: {currentRotation: 3},
				});
				this.addInitialFeature(requiredOnly, 3, 6, {
					qualifiedItemId: '(F)1124',
					heldObject: '(F)1362',
				});
				this.addInitialFeature(requiredOnly, 2, 9, '(F)1228');
				break;
			}
			
			break;
		}}
		
		// See StardewValley.GameLocation:loadObjects()
		
		let tiles = this.map.layers.Paths?.tiles;
		
		if (
			(
				location.details.isOutdoors === 'true' ||
				location.id === 'BathHouse_Entry' ||
				location.details.treatAsOutdoors === 'true' ||
				this.map.properties.forceLoadObjects != null
			) && tiles != null
		) {
			// Load default features, based on the Paths layer. If this is an
			// empty plan, we'll then erase all features that are determined
			// to be erasable.
			
			for (let y = 0, tileIndex = 0; y < this.map.height; ++y) {
				for (let x = 0; x < this.map.width; ++x, ++tileIndex) {
					let info = this.createPathsLayerFeatureInfo(tiles[tileIndex]);
					
					if (info !== null) {
						this.addInitialFeature(requiredOnly, x, y, info);
					}
				}
			}
		}
	}
	
	createPathsLayerFeatureInfo (pathsTile) {
		// See StardewValley.GameLocation:loadPathsLayerObjectsInArea()
		
		switch (pathsTile) {
		case 9: return {wildTreeId: '1'};
		case 10: return {wildTreeId: '2'};
		case 11: return {wildTreeId: '3'};
		case 12: return {wildTreeId: '6'};
		
		case 13: case 14: case 15:
			return [
				['(O)674', '(O)676', '(O)678', null],
				['(O)675', '(O)677', '(O)679', null],
				['(O)784', '(O)785', '(O)786', null]
			][Math.floor(Math.random() * 3)][this.locationPlan.location.getSeasonNumber()];
		
		case 16: case 17:
			return ['(O)343', '(O)450'][Math.floor(Math.random() * 2)];
		
		case 18:
			return ['(O)294', '(O)295'][Math.floor(Math.random() * 2)];
		
		case 19: return {resourceClumpId: '602'};
		case 20: return {resourceClumpId: '672'};
		case 21: return {resourceClumpId: '600'};
		case 22:
			return {
				kind: 'terrainFeatures',
				type: 'Grass',
				details: {
					grassType: '1',
					numberOfWeeds: '4',
					grassSourceOffset: '20',
				},
			};
		
		case 23:
			return {
				wildTreeId: ['1', '2', '3'][Math.floor(Math.random() * 3)],
				details: {
					growthStage: ['2', '3'][Math.floor(Math.random() * 2)],
				},
			};
		
		case 24:
			return {
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '2',
					datePlanted: '-20',
				},
			};
		
		case 25:
			return {
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '1',
					datePlanted: '-20',
				},
			};
		
		case 26:
			return {
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '0',
					datePlanted: '-20',
				},
			};
		
		//case 31: return {wildTreeId: '9'};
		//case 32: return {wildTreeId: '8'};
		case 33:
			return {
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '4',
					datePlanted: '-20',
				},
			};
		
		case 36:
			return {
				kind: 'terrainFeatures',
				type: 'Grass',
				details: {
					grassType: '7',
					numberOfWeeds: '4',
					grassSourceOffset: '20',
				},
			};
		}
		
		return null;
	}
	
	tryGetTreeIdForTile (pathsTile) {
		// See StardewValley.GameLocation:TryGetTreeIdForTile()
		
		switch (pathsTile) {
		case 9: return (this.locationPlan.location.getSeasonNumber() === 3) ? '4' : '1';
		case 10: return (this.locationPlan.location.getSeasonNumber() === 3) ? '5' : '2';
		case 11: return '3';
		case 12: return '6';
		case 31: return '9';
		case 32: return '8';
		}
		
		return null;
	}
	
	addInitialFeature (requiredOnly, tileX, tileY, featureInfo) {
		let lib = this.core.extensions.maps.lib;
		
		let feature = this.addFeatureByInfo(tileX, tileY, featureInfo);
		
		if (requiredOnly && lib.canEraseFeature(feature, this.locationPlan.features)) {
			this.locationPlan.features.pop();
			return;
		}
		
		lib.initRandomVariation(feature);
		lib.drawFeature(feature);
	}
	
	addFeatureByInfo (tileX, tileY, featureInfo) {
		let lib = this.core.extensions.maps.lib;
		
		let feature = catalogue.createFeature(this.featureContext, featureInfo);
		feature.tileX = tileX;
		feature.tileY = tileY;
		this.locationPlan.features.push(feature);
		
		switch (feature.kind) {
		case 'largeTerrainFeatures':
			switch (feature.details['@xsi:type']) {
			case 'Bush': {
				feature.details.size ??= '0';
				let size = +feature.details.size;
				
				feature.details.townBush ??= (
					this.locationPlan.location.locationType === 'Town' &&
					[0, 1, 2].includes(size) &&
					feature.tileX % 5 !== 0
				) ? 'true' : 'false';
				
				feature.details.drawShadow ??= (
					size !== 3 &&
					!this.map.hasTile(feature.tileX, feature.tileY, 'Front')
				) ? 'true' : 'false';
				
				feature.details.tileSheetOffset ??= (size === 4) ? '1' : '0';
				break;
			}}
			
			break;
		}
		
		lib.updateFeature(feature);
		return feature;
	}
	
	getGreenhouseStartLocation () {
		return this.map.properties.GreenhouseLocation?.split(/ +/) ?? {
			5: [36, 29],
			6: [14, 14],
		}[this.gameState.farmType] ?? [25, 10];
	}
	
	getSpouseRoomCorner () {
		return (this.gameState.houseUpgradeLevel === 1) ? [29, 1] : [50, 20];
	}
	
	//== Wallpaper and Flooring ==//
	
	cleanUpTileForMapOverride (tileX, tileY) {
		// See StardewValley.GameLocation:cleanUpTileForMapOverride()
		
		// This is where the game would destroy features on a tile that the
		// map override affects. In the context of the planner, maybe we
		// should just leave them as they are.
	}
	
	readWallpaperAndFloorTileData () {
		this.readWallpaperOrFloorTileData(false);
		this.readWallpaperOrFloorTileData(true);
	}
	
	readWallpaperOrFloorTileData (isFloor) {
		// See StardewValley.Locations.DecoratableLocation:ReadWallpaperAndFloorTileData()
		
		let tiles;
		let ids;
		let applied;
		
		if (isFloor) {
			tiles = this.floorTiles;
			ids = this.floorIds;
			applied = this.locationPlan.appliedFloor;
		}
		else {
			tiles = this.wallpaperTiles;
			ids = this.wallpaperIds;
			applied = this.locationPlan.appliedWallpaper;
		}
		
		tiles.clear();
		ids.length = 0;
		let defaultValue = '0';
		
		if (location.type === 'FarmHouse' && this.gameState.houseUpgradeLevel < 3) {
			if (isFloor) {
				defaultValue = this.map.properties.FarmHouseFlooring ?? {
					1: '1',
					2: '34',
					3: '18',
					4: '4',
					5: '5',
					6: '35',
				}[this.gameState.farmType] ?? '0';
			}
			else {
				defaultValue = this.map.properties.FarmHouseWallpaper ?? {
					1: '11',
					2: '92',
					3: '12',
					4: '95',
					5: '65',
					6: '106',
				}[this.gameState.farmType] ?? '0';
			}
		}
		
		let initialValues = new Map();
		let propertyValue = this.map.properties[isFloor ? 'FloorIDs' : 'WallIDs'];
		
		if (propertyValue != null) {
			for (let value of propertyValue.split(',')) {
				value = value.trim().split(/ +/g);
				
				if (value.length >= 1) {
					ids.push(value[0]);
				}
				
				if (value.length >= 2) {
					initialValues.set(value[0], value[1]);
				}
			}
		}
		
		if (ids.length === 0) {
			for (let [i, rect] of (isFloor ? this.locationPlan.location.getFloors() : this.locationPlan.location.getWalls())) {
				let id = isFloor ? `Floor_${i}` : `Wall_${i}`;
				ids.push(id);
				let areas = tiles.get(id);
				
				// Is this a bug in Stardew Valley? It seems like it's initializing
				// the array based on the existence of the wrong key. This happens
				// for both wallpapers and floors.
				
				if (!tiles.has(i + '')) {
					areas = [];
					tiles.set(id, areas);
				}
				
				for (let y = 0; y < rect.height; ++y) {
					for (let x = 0; x < rect.width; ++x) {
						areas.push([rect.x + x, rect.y + y, y]);
					}
				}
			}
		}
		else {
			for (let x = 0; x < this.map.width; ++x) {
				for (let y = 0; y < this.map.height; ++y) {
					let tileProperty = this.doesTileHaveProperty(x, y, isFloor ? 'FloorID' : 'WallID', 'Back');
					
					if (tileProperty == null) {
						continue;
					}
					
					if (!ids.includes(tileProperty)) {
						ids.push(tileProperty);
					}
					
					if (!Object.hasOwn(applied, tileProperty)) {
						applied[tileProperty] = defaultValue;
						let initialValue = initialValues.get(tileProperty);
						
						if (initialValue != null) {
							if (Object.hasOwn(applied, initialValue)) {
								applied[tileProperty] = applied[initialValue];
							}
							else if (this.getWallpaperOrFloorSource(initialValue, isFloor)[1] >= 0) {
								applied[tileProperty] = initialValue;
							}
						}
					}
					
					let areas = tiles.get(tileProperty);
					
					if (areas == null) {
						areas = [];
						tiles.set(tileProperty, areas);
					}
					
					areas.push([x, y, 0]);
					
					if (!isFloor) {
						if (this.isFloorableOrWallpaperableTile(x, y + 1, 'Back')) {
							areas.push([x, y + 1, 1]);
						}
						
						if (this.isFloorableOrWallpaperableTile(x, y + 2, 'Buildings')) {
							areas.push([x, y + 2, 2]);
						}
						else if (this.isFloorableOrWallpaperableTile(x, y + 2, 'Back') && !this.isFloorableTile(x, y + 2, 'Back')) {
							areas.push([x, y + 2, 2]);
						}
					}
				}
			}
		}
	}
	
	setWallpapers () {
		// See StardewValley.Locations.DecoratableLocation:setWallpapers()
		
		for (let wallpaperId of Object.keys(this.locationPlan.appliedWallpaper)) {
			this.updateWallpaper(wallpaperId);
		}
	}
	
	updateWallpaper (wallpaperId) {
		// See StardewValley.Locations.DecoratableLocation:UpdateWallpaper()
		
		let patternId = this.locationPlan.appliedWallpaper[wallpaperId];
		let areas = this.wallpaperTiles.get(wallpaperId);
		
		if (areas == null) {
			return;
		}
		
		for (let [x, y, type] of areas) {
			let [tileSheetName, spriteIndex] = this.getWallpaperOrFloorSource(patternId, false);
			
			if (spriteIndex < 0) {
				continue;
			}
			
			let tileSheet = this.map.getTileSheetByName(tileSheetName);
			let layerName = (type === 2 && this.isFloorableOrWallpaperableTile(x, y, 'Buildings')) ? 'Buildings' : 'Back';
			
			if (this.isFloorableOrWallpaperableTile(x, y, layerName)) {
				this.map.setTile(x, y, Math.floor(spriteIndex / tileSheet.columns) * tileSheet.columns * 3 + spriteIndex % tileSheet.columns + type * tileSheet.columns, layerName, tileSheet.name);
			}
		}
	}
	
	setFloors () {
		// See StardewValley.Locations.DecoratableLocation:setFloors()
		
		for (let floorId of Object.keys(this.locationPlan.appliedFloor)) {
			this.updateFloor(floorId);
		}
	}
	
	updateFloor (floorId) {
		// See StardewValley.Locations.DecoratableLocation:UpdateFloor()
		
		let patternId = this.locationPlan.appliedFloor[floorId];
		let areas = this.floorTiles.get(floorId);
		
		if (areas == null) {
			return;
		}
		
		for (let [x, y, type] of areas) {
			let [tileSheetName, spriteIndex] = this.getWallpaperOrFloorSource(patternId, true);
			
			if (spriteIndex < 0) {
				continue;
			}
			
			let tileSheet = this.map.getTileSheetByName(tileSheetName);
			spriteIndex = spriteIndex * 2 + Math.floor(spriteIndex / Math.floor(tileSheet.columns / 2)) * tileSheet.columns;
			
			if (tileSheet.name === 'walls_and_floors') {
				spriteIndex += 336;
			}
			
			if (this.isFloorableOrWallpaperableTile(x, y, 'Back')) {
				if (this.map.getTile(x, y, 'Back') < 0) {
					spriteIndex = 0;
				}
				else {
					let tilesWide = this.map.getTileSheetAt(x, y, 'Back')?.columns ?? 16;
					spriteIndex += x % 2 + tileSheet.columns * (y % 2);
				}
				
				this.map.setTile(x, y, spriteIndex, 'Back', tileSheet.name);
			}
		}
	}
	
	getWallpaperOrFloorSource (patternId, isFloor) {
		// See StardewValley.Locations.DecoratableLocation:GetWallpaperSource()
		// See StardewValley.Locations.DecoratableLocation:GetFloorSource()
		
		let item = this.core.items.get(isFloor ? 'FL' : 'WP', patternId);
		
		if (item.isError) {
			return [null, -1];
		}
		
		for (let tileSheet of this.map.tileSheets) {
			if (tileSheet.texture === item.texture) {
				return [tileSheet.name, item.spriteIndex];
			}
		}
		
		let patternSplit = (patternId + '').split(':');
		let tileSheet = new TileSheet(`x_WallsAndFloors_${patternSplit[0]}`, item.texture);
		let textureSize = util.textureSizes[item.texture];
		tileSheet.setSize(textureSize.width, textureSize.height);
		this.map.addTileSheet(tileSheet);
		return [tileSheet.name, item.spriteIndex];
	}
	
	//== Assessment ==//
	
	* getFeaturesAt (tileX, tileY, kind = null) {
		for (let feature of this.locationPlan.features) {
			if (feature == null) {
				continue;
			}
			
			if (kind === null || feature.kind === kind) {
				if (this.featureOccupiesTile(feature, tileX, tileY)) {
					yield feature;
				}
			}
		}
	}
	
	hasFeatureAt (tileX, tileY, kind = null) {
		for (let feature of this.getFeaturesAt(tileX, tileY, kind)) {
			return true;
		}
		
		return false;
	}
	
	getBuildingAtTile (tileX, tileY) {
		for (let feature of this.locationPlan.features) {
			if (feature != null && feature.kind === 'buildings') {
				if (this.featureOccupiesTile(feature, tileX, tileY) || !this.buildingIsTilePassable(feature, tileX, tileY)) {
					return feature;
				}
			}
		}
		
		return null;
	}
	
	getObjectAtTile (tileX, tileY, ignorePassables = false) {
		let object = null;
		
		for (let feature of this.locationPlan.features) {
			if (feature != null && this.featureOccupiesTile(feature, tileX, tileY) && (!ignorePassables || !feature.meta.passable)) {
				if (feature.kind === 'furniture') {
					return feature;
				}
				else if (feature.kind === 'objects') {
					object = feature;
				}
			}
		}
		
		return object;
	}
	
	featureOccupiesTile (feature, tileX, tileY, applyTilePropertyRadius = false) {
		// See StardewValley.Buildings.Building:occupiesTile() and similar
		
		let additionalRadius = applyTilePropertyRadius ? (feature.meta.additionalTilePropertyRadius) : 0;
		return (
			tileX >= feature.tileX - additionalRadius &&
			tileY >= feature.tileY - additionalRadius &&
			tileX < feature.tileX + feature.meta.width + additionalRadius &&
			tileY < feature.tileY + feature.meta.height + additionalRadius
		);
	}
	
	getFeatureTileProperty (feature, tileX, tileY, propertyName, layerName) {
		// See StardewValley.Buildings.Building:doesTileHaveProperty()
		// See StardewValley.Objects.Furniture:DoesTileHaveProperty()
		
		tileX -= feature.tileX;
		tileY -= feature.tileY;
		
		if (feature.meta.tileProperties != null) {
			for (let tileProperty of feature.meta.tileProperties) {
				if (
					tileProperty.layer === layerName &&
					tileProperty.name === propertyName &&
					tileX >= tileProperty.x &&
					tileY >= tileProperty.y &&
					tileX < tileProperty.x + tileProperty.width &&
					tileY < tileProperty.y + tileProperty.height
				) {
					// The first match takes priority.
					
					return tileProperty.value;
				}
			}
		}
		
		// Property values can be null, so we use undefined for non-matches.
		
		return undefined;
	}
	
	doesTileHaveProperty (tileX, tileY, propertyName, layerName, ignoreTileSheetProperties = false) {
		// See StardewValley.GameLocation:doesTileHaveProperty()
		
		let buildingOnTile = false;
		let furnitureValue = undefined;
		
		for (let feature of this.locationPlan.features) {
			if (feature != null) {
				switch (feature.kind) {
				case 'buildings':
					if (this.featureOccupiesTile(feature, tileX, tileY, true)) {
						let tileProperty = this.getFeatureTileProperty(feature, tileX, tileY, propertyName, layerName);
						
						if (tileProperty !== undefined) {
							return tileProperty;
						}
						
						buildingOnTile ||= this.featureOccupiesTile(feature, tileX, tileY);
					}
					
					break;
				
				case 'furniture':
					if (furnitureValue === undefined && this.featureOccupiesTile(feature, tileX, tileY, true)) {
						furnitureValue = this.getFeatureTileProperty(feature, tileX, tileY, propertyName, layerName);
					}
					
					break;
				}
			}
		}
		
		if (furnitureValue !== undefined) {
			return furnitureValue;
		}
		
		if (!buildingOnTile) {
			let attrs = this.map.getTileAttributes(tileX, tileY, layerName);
			
			if (attrs !== null) {
				if (Object.hasOwn(attrs.properties, propertyName)) {
					return attrs.properties[propertyName] + '';
				}
				
				if (!ignoreTileSheetProperties) {
					let tile = this.map.getTile(tileX, tileY, layerName);
					
					if (tile >= 0) {
						let properties = this.map.tileSheets[attrs.tileSheetIndex]?.tileProperties?.[tile];
						
						if (properties != null && Object.hasOwn(properties, propertyName)) {
							return properties[propertyName] + '';
						}
					}
				}
			}
		}
		
		return null;
	}
	
	doesEitherTileOrTileIndexPropertyEqual (tileX, tileY, propertyName, layerName, propertyValue) {
		// See StardewValley.GameLocation:doesEitherTileOrTileIndexPropertyEqual()
		
		let attrs = this.map.getTileAttributes(tileX, tileY, layerName);
		
		if (attrs !== null) {
			let tile = this.map.getTile(tileX, tileY, layerName);
			
			if (tile >= 0) {
				let properties = this.map.tileSheets[attrs.tileSheetIndex]?.tileProperties?.[tile];
				
				if (properties != null && Object.hasOwn(properties, propertyName) && (properties[propertyName] + '') === propertyValue) {
					return true;
				}
				
				if (Object.hasOwn(attrs.properties, propertyName) && (attrs.properties[propertyName] + '') === propertyValue) {
					return true;
				}
			}
		}
		
		return propertyValue === null;
	}
	
	* getAllPlacementTiles (feature, skipOnlyNeedsToBePassable = false) {
		// Note: Each iteration yields the same object, with modified values.
		// If you need to keep the values beyond the iteration you're on, you
		// should copy the values out of the result object first.
		
		let result = {
			onlyNeedsToBePassable: false,
		};
		
		for (let tileY = 0; tileY < feature.meta.height; ++tileY) {
			for (let tileX = 0; tileX < feature.meta.width; ++tileX) {
				result.tileX = tileX;
				result.tileY = tileY;
				yield result;
			}
		}
		
		switch (feature.kind) {
		case 'buildings':
			for (let area of this.core.content.Data.Buildings[feature.meta.buildingType]?.AdditionalPlacementTiles ?? []) {
				if (skipOnlyNeedsToBePassable && area.OnlyNeedsToBePassable) {
					continue;
				}
				
				result.onlyNeedsToBePassable = area.OnlyNeedsToBePassable ?? false;
				
				for (let tileY = 0; tileY < area.TileArea.Height; ++tileY) {
					for (let tileX = 0; tileX < area.TileArea.Width; ++tileX) {
						result.tileX = area.TileArea.X + tileX;
						result.tileY = area.TileArea.Y + tileY;
						yield result;
					}
				}
			}
			
			break;
		}
	}
	
	isNoSpawnTile (tileX, tileY, type = 'All', ignoreTileSheetProperties = false) {
		let noSpawn = this.doesTileHaveProperty(tileX, tileY, 'NoSpawn', 'Back', ignoreTileSheetProperties);
		
		if (noSpawn === 'Grass' || noSpawn === 'Tree') {
			if (type === noSpawn) {
				return true;
			}
		}
		else if (noSpawn !== null && noSpawn.trim().toLowerCase() !== 'false') {
			return true;
		}
		
		return this.getBuildingAtTile(tileX, tileY) !== null;
	}
	
	isWaterTile (tileX, tileY) {
		if (this.waterCacheLevel > 0) {
			if (this.waterCache === null) {
				this.waterCache = new Uint8Array(this.map.width * this.map.height);
			}
			
			let tileIndex = this.map.getTileIndex(tileX, tileY);
			let result = this.waterCache[tileIndex];
			
			if (result === 0) {
				result = (this.doesTileHaveProperty(tileX, tileY, 'Water', 'Back') != null) ? 1 : 2;
				this.waterCache[tileIndex] = result;
			}
			
			return result === 1;
		}
		
		return this.doesTileHaveProperty(tileX, tileY, 'Water', 'Back') != null;
	}
	
	// The water cache allows expensive isWaterTile() checks to work more
	// efficiently, especially for things like map-wide fishing depth and
	// paddy land surveying. However, while the cache is enabled, it's
	// important to not change anything that would affect the isWaterTile()
	// results.
	
	enableWaterCache () {
		++this.waterCacheLevel;
	}
	
	disableWaterCache () {
		if (this.waterCacheLevel <= 0) {
			throw new Error('Attempted to disable water cache that wasn\'t enabled');
		}
		
		--this.waterCacheLevel;
		
		if (this.waterCacheLevel <= 0) {
			this.waterCache = null;
		}
	}
	
	isOpenWater (tileX, tileY) {
		if (!this.isWaterTile(tileX, tileY)) {
			return false;
		}
		
		let buildingsLayer = this.map.layers.Buildings;
		let buildingsTileIndex = buildingsLayer.getTileIndex(tileX, tileY);
		let tile = buildingsLayer.tiles[buildingsTileIndex];
		
		if (tile !== -1) {
			if (
				this.map.tileSheets[buildingsLayer.tileAttributes[buildingsTileIndex].tileSheetIndex]?.name === 'outdoors' &&
				[759, 628, 629, 734].includes(tile)
			) {
				return false;
			}
		}
		
		return this.locationPlan.featureLookup.objects[this.map.getTileIndex(tileX, tileY)] == null;
	}
	
	nearWaterForPaddy (tileX, tileY) {
		if (this.locationPlan.featureLookup['objects'][this.map.getTileIndex(tileX, tileY)]?.meta?.type === 'IndoorPot') {
			return false;
		}
		
		for (let y = -3; y <= 3; ++y) {
			for (let x = -3; x <= 3; ++x) {
				if (this.isWaterTile(tileX + x, tileY + y)) {
					return true;
				}
			}
		}
		
		return false;
	}
	
	isTilePassable (tileX, tileY) {
		// See StardewValley.GameLocation:isTilePassable()
		
		if (this.map.getTile(tileX, tileY, 'Back') !== -1) {
			let layer = this.map.layers.Back;
			let tileIndex = layer.getTileIndex(tileX, tileY);
			let properties = this.map.tileSheets[layer.tileAttributes[tileIndex].tileSheetIndex]?.tileProperties;
			
			if (Object.hasOwn(properties, 'Passable')) {
				return false;
			}
		}
		
		if (this.map.getTile(tileX, tileY, 'Buildings') !== -1) {
			let layer = this.map.layers.Buildings;
			let tileIndex = layer.getTileIndex(tileX, tileY);
			let properties = this.map.tileSheets[layer.tileAttributes[tileIndex].tileSheetIndex]?.tileProperties;
			
			if (!Object.hasOwn(properties, 'Shadow') && !Object.hasOwn(properties, 'Passable')) {
				return false;
			}
		}
		
		return true;
	}
	
	buildingIsTilePassable (feature, tileX, tileY) {
		// See StardewValley.Buildings.Building:isTilePassable()
		
		let occupied = this.featureOccupiesTile(feature, tileX, tileY);
		
		if (occupied && +feature.details.daysOfConstructionLeft > 0) {
			return false;
		}
		
		if (feature.meta.collisionMap != null && this.featureOccupiesTile(feature, tileX, tileY, true)) {
			return !feature.meta.collisionMap[tileY - feature.tileY]?.[tileX - feature.tileX];
		}
		
		return !occupied;
	}
	
	isTileReachable (tileX, tileY) {
		// Check whether a player can stand next to the tile. This only checks
		// map terrain, not movement-obstructing features.
		
		for (let y = -1; y <= 1; ++y) {
			for (let x = -1; x <= 1; ++x) {
				if (y !== 0 || x !== 0) {
					let checkX = tileX + x;
					let checkY = tileY + y;
					
					if (this.map.isTileOnMap(checkX, checkY) && !this.isWaterTile(checkX, checkY) && this.isTilePassable(checkX, checkY)) {
						return true;
					}
				}
			}
		}
		
		return false;
	}
	
	canBePlacedHere (tileX, tileY, feature, collisionMask = MapLocation.COL_ALL, isSingle = true) {
		let lib = this.core.extensions.maps.lib;
		
		if (lib.festival !== null) {
			return false;
		}
		
		if (lib.options.allowPlacingAnywhere) {
			return true;
		}
		
		if (isSingle && feature.meta.item != null) {
			let tileIndex = this.map.getTileIndex(tileX, tileY);
			
			if (Object.hasOwn(lib.tileFeatures, tileIndex) && this.performObjectDropInAction(lib.tileFeatures[tileIndex], feature, true)) {
				return true;
			}
		}
		
		switch (feature.kind) {
		case 'furniture':
			return this.canBePlacedHereFurniture(tileX, tileY, feature, collisionMask);
		
		case 'museumPieces':
			return this.canBePlacedHereMuseumPieces(tileX, tileY, feature, collisionMask);
		
		case 'objects':
			switch (feature.meta.item.qualifiedItemId) {
			case '(O)913': // Enricher
			case '(O)915': // Pressure Nozzle
				return false;
			}
			
			if (feature.meta.type === 'Wallpaper' || this.canBePlacedHereObject(tileX, tileY, feature, collisionMask)) {
				let result = this.placementAction(tileX, tileY, feature, true);
				
				if (result === null || (result && isSingle)) {
					return true;
				}
			}
			
			return false;
		
		case 'resourceClumps':
			return this.canBePlacedHereResourceClump(tileX, tileY, feature, collisionMask);
		
		case 'terrainFeatures':
			return this.canBePlacedHereTerrainFeature(tileX, tileY, feature, collisionMask);
		}
		
		return this.isBuildable(tileX, tileY);
	}
	
	canBePlacedHereFurniture (tileX, tileY, feature, collisionMask = MapLocation.COL_ALL) {
		let item = feature.meta.item;
		
		if (!item) {
			return false;
		}
		
		// See StardewValley.GameLocation:CanPlaceThisFurnitureHere()
		
		let isDecoratableLocation = this.locationPlan.location.isDecoratable();
		let isIndoor = (isDecoratableLocation || this.locationPlan.location.details.isOutdoors !== 'true');
		
		if (feature.meta.furnitureType === 15) {
			let allowBedsHere = (['FarmHouse', 'IslandFarmHouse'].includes(this.locationPlan.location.type) || (isIndoor && this.locationPlan.location.parent != null));
			
			if (!allowBedsHere) {
				return false;
			}
		}
		
		// See StardewValley.Objects.Furniture:placementRestriction
		
		let placementRestriction;
		
		if (item.data.length > 6 && +item.data[6] >= 0) {
			placementRestriction = +item.data[6];
		}
		else if (item.name.indexOf('TV') !== -1) {
			placementRestriction = 0;
		}
		else if ([11, 5, 0, 8, 16].includes(mapsUtil.getFurnitureType(item))) {
			placementRestriction = 2;
		}
		else {
			placementRestriction = 0;
		}
		
		if (placementRestriction !== 2 && ([true, false][placementRestriction] ?? null) !== isIndoor) {
			return false;
		}
		
		// See StardewValley.Objects.Furniture:canBePlacedHere()
		
		let isGroundFurniture = ![6, 17, 13].includes(feature.meta.furnitureType);
		let ignorePassables = MapLocation.COL_BUILDINGS | MapLocation.COL_FLOORING | MapLocation.COL_TERRAIN_FEATURES;
		
		if (feature.meta.passable) {
			ignorePassables |= MapLocation.COL_CHARACTERS | MapLocation.COL_FARMERS;
		}
		
		collisionMask &= ~(MapLocation.COL_FURNITURE | MapLocation.COL_OBJECTS);
		
		for (let x = 0; x < feature.meta.width; ++x) {
			for (let y = 0; y < feature.meta.height; ++y) {
				let checkX = tileX + x;
				let checkY = tileY + y;
				let checkTileIndex = this.map.getTileIndex(checkX, checkY);
				
				if (!this.map.isTileOnMap(checkX, checkY)) {
					return false;
				}
				
				if (!this.isTilePlaceable(checkX, checkY, feature.meta.passable)) {
					return false;
				}
				
				for (let other of this.locationPlan.features) {
					if (other != null && other.kind === 'furniture') {
						if (
							other.meta.furnitureType === 11 &&
							checkX >= other.tileX &&
							checkY >= other.tileY &&
							checkX < other.tileX + other.meta.width &&
							checkY < other.tileY + other.meta.height &&
							feature.meta.width === 1 &&
							feature.meta.height === 1 &&
							// The logic in StardewValley.Objects.Furniture:placementAction()
							// effectively prevents placing wall furniture onto tables.
							isGroundFurniture
						) {
							// Small furniture being placed on a table.
							return true;
						}
						
						if (
							(other.meta.furnitureType !== 12 || feature.meta.furnitureType === 12) &&
							checkX >= other.tileX &&
							checkY >= other.tileY &&
							checkX < other.tileX + other.meta.width &&
							checkY < other.tileY + other.meta.height
						) {
							// See StardewValley.Objects.Furniture:AllowPlacementOnThisTile()
							
							let allow = false;
							
							switch (other.meta.type) {
							case 'BedFurniture':
								if (other.details.bedType === 'Child' && checkY === other.tileY + 1) {
									allow = true;
								}
								
								break;
							}
							
							if (!allow) {
								return false;
							}
						}
					}
				}
				
				let object = this.locationPlan.featureLookup.objects[checkTileIndex];
				
				if (object != null && (!object.meta.passable || !feature.meta.passable)) {
					return false;
				}
				
				if (!isGroundFurniture || (feature.meta.furnitureType === 15 && y === 0)) {
					if (this.isTileOccupiedBy(checkX, checkY, collisionMask, ignorePassables)) {
						return false;
					}
					
					continue;
				}
				
				if (this.isTileBlockedBy(checkX, checkY, collisionMask, ignorePassables)) {
					return false;
				}
				
				let terrainFeature = this.locationPlan.featureLookup.objects[checkTileIndex];
				
				if (terrainFeature != null && terrainFeature.meta.type === 'HoeDirt' && terrainFeature.details.crop != null) {
					return false;
				}
			}
		}
		
		// See StardewValley.Objects.Furniture:GetAdditionalFurniturePlacementStatus()
		
		let paintingAtRightPlace = false;
		
		if (!isGroundFurniture || item.qualifiedItemId === '(F)1293') {
			let offset = (item.qualifiedItemId === '(F)1293') ? 3 : 0;
			let foundWall = false;
			
			if (isDecoratableLocation) {
				if (this.isTileOnWall(tileX, tileY - offset) && this.getWallTopY(tileX, tileY - offset) + offset === tileY) {
					foundWall = true;
				}
				
				// The game also allows wall furniture to be placed one tile below
				// where it will end up being mounted, but our planner requires it
				// to be placed in the final mounted position only.
				
				/*
				else if (!isGroundFurniture && this.isTileOnWall(tileX, tileY - 1) && this.getWallTopY(tileX, tileY) + 1 === tileY) {
					foundWall = true;
				}
				*/
			}
			
			if (!foundWall) {
				return false;
			}
			
			paintingAtRightPlace = true;
		}
		
		let tilesHighToCheck = feature.meta.height;
		
		if (feature.meta.furnitureType === 6 && tilesHighToCheck > 2) {
			tilesHighToCheck = 2;
		}
		
		for (let x = 0; x < feature.meta.width; ++x) {
			for (let y = 0; y < tilesHighToCheck; ++y) {
				let checkX = tileX + x;
				let checkY = tileY + y;
				
				if (this.doesTileHaveProperty(checkX, checkY, 'NoFurniture', 'Back') != null) {
					return false;
				}
				
				if (!paintingAtRightPlace && isDecoratableLocation && this.isTileOnWall(checkX, checkY)) {
					if (feature.meta.type !== 'BedFurniture' || y !== 0) {
						return false;
					}
					
					continue;
				}
				
				let buildingsIndex = this.map.getTile(checkX, checkY, 'Buildings');
				
				if (buildingsIndex !== -1) {
					if (this.locationPlan.location.type !== 'IslandFarmHouse') {
						return false;
					}
					
					if (buildingsIndex < 192 || buildingsIndex > 194) {
						return false;
					}
					
					let attrs = this.map.layers.Buildings.tileAttributes[this.map.layers.Buildings.getTileIndex(checkX, checkY)];
					
					if (attrs == null || attrs.tileSheetIndex == null || this.map.tileSheets[attrs.tileSheetIndex].name !== 'untitled tile sheet') {
						return false;
					}
				}
			}
		}
		
		return true;
	}
	
	canBePlacedHereMuseumPieces (tileX, tileY, feature, collisionMask = MapLocation.COL_ALL) {
		let tileIndex = this.map.getTileIndex(tileX, tileY);
		
		if (this.locationPlan.featureLookup.museumPieces[tileIndex] == null && this.map.layers.Buildings != null) {
			let layer = this.map.layers.Buildings;
			let layerTileIndex = layer.getTileIndex(tileX, tileY);
			let attrs = layer.tileAttributes[layerTileIndex];
			
			if (attrs != null && this.map.tileSheets[attrs.tileSheetIndex].name === 'untitled tile sheet') {
				let tile = layer.tiles[layerTileIndex];
				
				if ((tile >= 1071 && tile <= 1074) || (tile >= 1237 && tile <= 1238)) {
					// This is a valid location. Now check if the item is a duplicate.
					
					for (let checkFeature of Object.values(this.locationPlan.featureLookup.museumPieces)) {
						if (checkFeature.meta.item.qualifiedItemId === feature.meta.item.qualifiedItemId) {
							return false;
						}
					}
					
					return true;
				}
			}
		}
		
		return false;
	}
	
	canBePlacedHereObject (tileX, tileY, feature, collisionMask = MapLocation.COL_ALL) {
		let lib = this.core.extensions.maps.lib;
		
		// See StardewValley.Object:canBePlacedHere()
		
		let tileIndex = this.map.getTileIndex(tileX, tileY);
		let item = feature.meta.item;
		
		if (item.isError) {
			return false;
		}
		
		if (item.qualifiedItemId === '(O)710') { // Crab pot.
			// See StardewValley.Objects.CrabPot:IsValidCrabPotLocationTile()
			
			if (['Caldera', 'VolcanoDungeon', 'MineShaft'].includes(this.locationPlan.location.type)) {
				return false;
			}
			
			let neighborCheck = (
				this.isWaterTile(tileX + 1, tileY) &&
				this.isWaterTile(tileX - 1, tileY)
			) || (
				this.isWaterTile(tileX, tileY + 1) &&
				this.isWaterTile(tileX, tileY - 1)
			);
			
			if (this.locationPlan.featureLookup.objects[tileIndex] != null || !neighborCheck || !this.isWaterTile(tileX, tileY) || this.doesTileHaveProperty(tileX, tileY, 'Passable', 'Buildings') != null) {
				return false;
			}
			
			// Planner: Check that the tile is reachable.
			
			if (!this.isTileReachable(tileX, tileY)) {
				return false;
			}
			
			return true;
		}
		
		let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
		
		if (item.data.ContextTags && item.data.ContextTags.includes('tapper_item')) {
			if (terrainFeature != null && terrainFeature.meta.type === 'Tree' && this.locationPlan.featureLookup.objects[tileIndex] == null && terrainFeature.meta.treeType != null) {
				let treeData = this.core.content.Data.WildTrees[terrainFeature.meta.treeType];
				
				if (treeData && treeData.TapItems && treeData.TapItems.length > 0) {
					return true;
				}
			}
		}
		
		if (item.qualifiedItemId === '(O)805') { // Tree fertilizer
			if (terrainFeature != null && terrainFeature.meta.type === 'Tree') {
				return true;
			}
		}
		else if (item.qualifiedItemId === '(O)419') { // Vinegar
			if (terrainFeature != null && terrainFeature.meta.type === 'Tree') {
				return terrainFeature.details.stopGrowingMoss !== 'true';
			}
			
			return false;
		}
		
		if (lib.wildTreeSeeds.includes(item.qualifiedItemId)) {
			// Wild tree seeds. Not supported in the planner. Trees are planted
			// as terrainFeatures instead.
			
			return false;
		}
		
		if (item.category === -74) {
			// Crop seeds. Not supported in the planner. Crops are planted as
			// terrainFeatures (tilled soil) instead.
			
			return false;
		}
		
		if (item.category === -19) {
			// Fertilizer. Not supported in the planner. If we eventually add it,
			// it'll be handled via performObjectDropInAction() instead.
			
			return false;
		}
		
		// Skipped the handling of furniture type 11 (tables), since it's
		// better covered by the performObjectDropInAction() logic.
		
		if (Object.hasOwn(lib.floorPathItemLookup, item.itemId)) {
			collisionMask &= ~MapLocation.COL_BUILDINGS;
		}
		
		if (!this.canItemBePlacedHere(tileX, tileY, feature.meta.passable, collisionMask)) {
			return false;
		}
		
		return true;
	}
	
	canBePlacedHereResourceClump (tileX, tileY, feature, collisionMask = MapLocation.COL_ALL) {
		if (this.hasFeatureAt(tileX, tileY, 'buildings')) {
			return false;
		}
		
		switch (feature.meta.type) {
		case 'GiantCrop': {
			if (!this.canTillHere(tileX, tileY)) {
				let tileIndex = this.map.getTileIndex(tileX, tileY);
				let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
				
				if (
					terrainFeature != null &&
					terrainFeature.meta.type === 'HoeDirt' &&
					(terrainFeature.details.crop == null || terrainFeature.details.crop.seedIndex === feature.meta.seedId)
				) {
					// We can replace this HoeDirt.
				}
				else {
					return false;
				}
			}
			
			if (!this.canPlantSeedsHere(tileX, tileY, `(O)${feature.meta.seedId}`)) {
				return false;
			}
			
			break;
		}
		default: {
			if (!this.canItemBePlacedHere(tileX, tileY)) {
				let object = this.getObjectAtTile(tileX, tileY);
				
				if (!object || object.meta.item.qualifiedItemId !== '(O)590') {
					return false;
				}
			}
		}}
		
		return true;
	}
	
	canBePlacedHereTerrainFeature (tileX, tileY, feature, collisionMask = MapLocation.COL_ALL) {
		let tileIndex = this.map.getTileIndex(tileX, tileY);
		
		switch (feature.meta.type) {
		case 'Flooring':
			/*
			{
				let oldPath = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
				
				if (oldPath != null && oldPath.details.whichFloor === feature.details.whichFloor) {
					return false;
				}
			}
			*/
			
			return this.isBuildable(tileX, tileY);
		
		case 'FruitTree': {
			// See StardewValley.Object:canBePlacedHere(), category -74, fruit tree sapling logic.
			
			let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
			
			if (terrainFeature != null) {
				return false;
			}
			
			let object = this.locationPlan.featureLookup.objects[tileIndex];
			
			if (object != null) {
				return false;
			}
			
			// See StardewValley.TerrainFeatures.FruitTree:IsTooCloseToAnotherTree()
			
			for (let y = -2; y <= 2; ++y) {
				for (let x = -2; x <= 2; ++x) {
					let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[this.map.getTileIndex(tileX + x, tileY + y)];
					
					if (terrainFeature != null && ['FruitTree', 'Tree'].includes(terrainFeature.meta.type)) {
						return false;
					}
				}
			}
			
			// See StardewValley.TerrainFeatures.FruitTree:IsGrowthBlocked()
			
			for (let y = -1; y <= 1; ++y) {
				for (let x = -1; x <= 1; ++x) {
					if (x !== 0 || y !== 0) {
						let checkX = tileX + x;
						let checkY = tileY + y;
						let checkTileIndex = this.map.getTileIndex(checkX, checkY);
						
						if (this.isTileOccupiedBy(checkX, checkY, MapLocation.COL_OBJECTS)) {
							let object = this.locationPlan.featureLookup.objects[checkTileIndex];
							
							if (object != null && !['(O)590', '(O)SeedSpot'].includes(object.meta.item.qualifiedItemId)) {
								return false;
							}
						}
						
						if (this.isTileOccupiedBy(checkX, checkY, MapLocation.COL_TERRAIN_FEATURES)) {
							let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[checkTileIndex];
							
							if (terrainFeature != null && terrainFeature.meta.type !== 'Grass' && (terrainFeature.meta.type !== 'HoeDirt' || terrainFeature.details.crop != null)) {
								return false;
							}
						}
						
						if (this.isTileOccupiedBy(checkX, checkY, MapLocation.COL_BUILDINGS | MapLocation.COL_FLOORING | MapLocation.COL_FURNITURE | MapLocation.COL_LOCATION_SPECIFIC)) {
							return false;
						}
					}
				}
			}
			
			if (!this.canItemBePlacedHere(tileX, tileY, true, collisionMask)) {
				return false;
			}
			
			// See StardewValley.GameLocation:CanPlantTreesHere()
			
			if (this.locationPlan.location.details.IsGreenhouse === 'true' || this.locationPlan.location.details.isFarm === 'true' || this.locationPlan.location.data.CanPlantHere || Object.hasOwn(this.map.properties, 'ForceAllowTreePlanting')) {
				return true;
			}
			
			return false;
		}
		case 'HoeDirt': {
			if (!this.canTillHere(tileX, tileY)) {
				let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
				
				if (
					feature.details.crop != null &&
					terrainFeature != null &&
					terrainFeature.meta.type === 'HoeDirt' &&
					terrainFeature.details.crop == null
				) {
					// There's an existing empty HoeDirt that we can try planting the crop into.
				}
				else {
					return false;
				}
			}
			
			if (
				feature.details.crop != null &&
				feature.details.crop?.forageCrop !== 'true' &&
				!this.canPlantSeedsHere(tileX, tileY, `(O)${feature.details.crop.seedIndex}`)
			) {
				return false;
			}
			
			return true;
		}
		case 'Tree':
			if (!this.canItemBePlacedHere(tileX, tileY, true, collisionMask)) {
				return false;
			}
			
			if (this.canPlaceWildTreeSeed(tileX, tileY, this.core.content.Data.WildTrees[feature.meta.treeType].SeedItemId)) {
				return true;
			}
			
			if (this.locationPlan.location.type !== 'Farm') {
				// See if this is a default tree.
				
				let pathsTile = this.map.layers.Paths?.tiles?.[tileIndex];
				
				if (
					pathsTile != null &&
					this.locationPlan.featureLookup.terrainFeatures[tileIndex] == null &&
					this.locationPlan.featureLookup.objects[tileIndex] == null &&
					!this.hasFeatureAt(tileX, tileY, 'furniture') &&
					this.getBuildingAtTile(tileX, tileY) == null
				) {
					if (this.tryGetTreeIdForTile(pathsTile) === feature.meta.treeType) {
						return true;
					}
				}
			}
			
			return false;
		
		default:
			return this.isBuildable(tileX, tileY);
		}
	}
	
	canTillHere (tileX, tileY) {
		// See StardewValley.Tools.Hoe:DoFunction()
		
		let tileIndex = this.map.getTileIndex(tileX, tileY);
		
		if (
			this.locationPlan.featureLookup.terrainFeatures[tileIndex] != null ||
			this.doesTileHaveProperty(tileX, tileY, 'Diggable', 'Back') == null ||
			this.isTileOccupiedBy(tileX, tileY, ~(MapLocation.COL_CHARACTERS | MapLocation.COL_FARMERS) & MapLocation.COL_ALL) ||
			!this.isTilePassable(tileX, tileY)
		) {
			return false;
		}
		
		return true;
	}
	
	canPlantSeedsHere (tileX, tileY, qualifiedItemId = null, isGardenPot = false) {
		// See StardewValley.GameLocation:CanPlantSeedsHere()
		
		// This function doesn't check whether the tile can be tilled. You'll
		// usually want to check canTillHere() first.
		
		let location = this.locationPlan.location;
		
		switch (location.type) {
		case 'IslandWest':
			if (this.map.getTileSheetAt(tileX, tileY, 'Back')?.name !== 'untitled tile sheet2') {
				return false;
			}
			
			break;
		}
		
		if (qualifiedItemId != null) {
			let result = this.checkItemPlantRules(qualifiedItemId, isGardenPot);
			
			if (result !== null) {
				return result;
			}
		}
		
		if (location.data && (location.data?.CanPlantHere ?? (location.details.isFarm === 'true'))) {
			return true;
		}
		
		return false;
	}
	
	canPlaceWildTreeSeed (tileX, tileY, qualifiedItemId = null) {
		// See StardewValley.Object:canPlaceWildTreeSeed()
		
		if (this.isNoSpawnTile(tileX, tileY, 'All', true)) {
			return false;
		}
		
		if (this.isNoSpawnTile(tileX, tileY) && !this.doesEitherTileOrTileIndexPropertyEqual(tileX, tileY, 'CanPlantTrees', 'Back', 'T')) {
			return false;
		}
		
		let tileIndex = this.map.getTileIndex(tileX, tileY);
		
		if (this.locationPlan.featureLookup.objects[tileIndex] != null) {
			return false;
		}
		
		let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
		
		if (terrainFeature != null && terrainFeature.meta.type !== 'HoeDirt') {
			return false;
		}
		
		if (!this.canPlantTreesHere(tileX, tileY, qualifiedItemId)) {
			return false;
		}
		
		if (qualifiedItemId != null) {
			let result = this.checkItemPlantRules(qualifiedItemId, false);
			
			if (result !== null) {
				return result;
			}
		}
		
		if (
			this.locationPlan.location.type === 'Farm' ||
			this.doesTileHaveProperty(tileX, tileY, 'Diggable', 'Back') !== null ||
			this.doesEitherTileOrTileIndexPropertyEqual(tileX, tileY, 'CanPlantTrees', 'Back', 'T')
		) {
			return true;
		}
		
		return false;
	}
	
	canPlantTreesHere (tileX, tileY, qualifiedItemId = null) {
		// See StardewValley.GameLocation:CanPlantTreesHere()
		
		let lib = this.core.extensions.maps.lib;
		
		let location = this.locationPlan.location;
		let isWildSeed = (qualifiedItemId !== null && lib.wildTreeSeeds.includes(qualifiedItemId));
		
		switch (location.type) {
		case 'IslandWest':
			if (qualifiedItemId === null || this.map.getTileSheetAt(tileX, tileY, 'Back')?.name === 'untitled tile sheet2' || isWildSeed) {
				switch (this.doesTileHaveProperty(tileX, tileY, 'Type', 'Back')) {
				case 'Dirt':
				case 'Grass':
				case '':
					if (qualifiedItemId != null) {
						return this.checkItemPlantRules(qualifiedItemId, false) ?? true;
					}
					
					return true;
				}
			}
			
			break;
		}
		
		if (qualifiedItemId != null) {
			let result = this.checkItemPlantRules(qualifiedItemId, false);
			
			if (result !== null) {
				return result;
			}
		}
		
		if (
			location.details.IsGreenhouse === 'true' ||
			location.details.IsFarm === 'true' ||
			location.data?.CanPlantHere ||
			(
				(qualifiedItemId === null || isWildSeed) &&
				location.details.isOutdoors === 'true' &&
				this.doesTileHaveProperty(tileX, tileY, 'Type', 'Back') === 'Dirt'
			) ||
			Object.hasOwn(this.map.properties, 'ForceAllowTreePlanting')
		) {
			return true;
		}
		
		return false;
	}
	
	checkItemPlantRules (qualifiedItemId, isGardenPot) {
		// See StardewValley.GameLocation:CheckItemPlantRules()
		
		// There are so few rules that are actually present in the data files,
		// that it's easier to just hardcode them here.
		
		// See "PlantableLocationRules" in content/Data/Crops.json,
		// content/Data/WildTrees.json, and content/data/FruitTrees.json
		
		let location = this.locationPlan.location;
		
		switch (qualifiedItemId) {
		case '(O)802':
			if (location.details.isOutdoors === 'true' && location.getLocationContext() !== 'Island') {
				return false;
			}
			
			break;
		}
		
		return null;
	}
	
	performObjectDropInAction (base, feature, probe) {
		let item = feature.meta.item;
		
		if (item == null) {
			return false;
		}
		
		switch (base.kind) {
		case 'buildings':
			switch (base.meta.type) {
			case 'FishPond':
				// See StardewValley.FishPond:performActiveObjectDropInAction()
				
				if (util.hasContextTag(item, 'sign_item') || item.qualifiedItemId === '(BC)34') {
					if (probe) {
						return true;
					}
					
					base.details.sign = {};
					let object = catalogue.createDetails(this.featureContext, 'objects', {qualifiedItemId: item.qualifiedItemId});
					util.addDetail(base.details.sign, object);
					return true;
				}
				
				break;
			}
			
			break;
		
		case 'furniture':
			// See StardewValley.Objects.Furniture:performObjectDropInAction()
			
			if (
				!['BC', 'FL', 'WP'].includes(feature.meta.item.itemType) &&
				[5, 11].includes(base.meta.furnitureType) &&
				(feature.kind === 'objects' || (
					feature.kind === 'furniture' &&
					feature.meta.width === 1 &&
					feature.meta.height === 1 &&
					// The logic in StardewValley.Objects.Furniture:placementAction()
					// effectively prevents placing wall furniture onto tables.
					![6, 17, 13].includes(feature.meta.furnitureType)
				))
			) {
				if (probe) {
					return true;
				}
				
				let heldObject = window.structuredClone(feature.details);
				heldObject['@@'] = 'heldObject';
				
				if (feature.kind === 'furniture') {
					heldObject['@xsi:type'] ??= 'Furniture';
				}
				
				util.deleteDetail(base.details, 'heldObject');
				util.addDetail(base.details, heldObject);
				return true;
			}
			
			break;
		
		case 'objects':
			// See StardewValley.Object:performObjectDropInAction()
			
			switch (base.meta.type) {
			case 'Fence':
				if (item.qualifiedItemId === '(O)93' && base.details.heldObject == null && base.details.isGate !== 'true') {
					if (probe) {
						return true;
					}
					
					let heldObject = catalogue.createDetails(this.featureContext, 'objects', {qualifiedItemId: '(O)93'}); // Torch
					heldObject['@@'] = 'heldObject';
					util.deleteDetail(base.details, 'heldObject');
					util.addDetail(base.details, heldObject);
					return true;
				}
				
				break;
			
			case 'IndoorPot':
				if (feature.kind === 'terrainFeatures' && feature.meta.type === 'HoeDirt' && feature.details.crop != null) {
					if (feature.details.crop.seedIndex === '499') {
						// Can't plan ancient seeds in garden pots.
						
						return false;
					}
					
					if (probe) {
						return true;
					}
					
					let crop = window.structuredClone(util.rootDetails(feature.details, 'crop'));
					
					base.details.hoeDirt ??= {
						state: '0',
						fertilizer: '0',
					};
					
					util.deleteDetail(base.details.hoeDirt, 'crop');
					util.deleteDetail(base.details, 'heldObject');
					util.deleteDetail(base.details, 'bush');
					util.addDetail(base.details.hoeDirt, crop);
					return true;
				}
				else if (feature.kind === 'objects') {
					if (![
						'(O)16', '(O)18', '(O)20', '(O)22', // Spring seed produce
						'(O)396', '(O)398', '(O)402', // Summer seed produce
						'(O)404', '(O)406', '(O)408', '(O)410', // Fall seed produce
						'(O)412', '(O)414', '(O)416', '(O)418', // Winter seed produce
					].includes(item.qualifiedItemId)) {
						// Not an object that can be grown in a garden pot.
						
						return false;
					}
					
					if (probe) {
						return true;
					}
					
					let heldObject = window.structuredClone(feature.details);
					heldObject['@@'] = 'heldObject';
					
					util.deleteDetail(base.details.hoeDirt, 'crop');
					util.deleteDetail(base.details, 'heldObject');
					util.deleteDetail(base.details, 'bush');
					util.addDetail(base.details, heldObject);
					return true;
				}
				else if (feature.kind === 'largeTerrainFeatures' && feature.meta.type === 'Bush' && item.qualifiedItemId === '(O)251') {
					if (probe) {
						return true;
					}
					
					let bush = window.structuredClone(feature.details);
					bush['@@'] = 'bush';
					delete bush['@xsi:type'];
					
					util.deleteDetail(base.details.hoeDirt, 'crop');
					util.deleteDetail(base.details, 'heldObject');
					util.deleteDetail(base.details, 'bush');
					util.addDetail(base.details, bush);
					return true;
				}
				
				break;
			
			default:
				if (base.meta.domainType === 'sprinkler') {
					if (['(O)913', '(O)915'].includes(item.qualifiedItemId)) {
						if (this.locationPlan.location.type === 'MineShaft' || (this.locationPlan.location.type === 'VolcanoDungeon' && item.qualifiedItemId === '(O)913')) {
							return false;
						}
						
						if (probe) {
							return true;
						}
						
						// TODO: An enricher also holds a chest for the fertilizer. Might want to support this.
						
						let heldObject = catalogue.createDetails(this.featureContext, 'objects', {qualifiedItemId: item.qualifiedItemId});
						heldObject['@@'] = 'heldObject';
						util.deleteDetail(base.details, 'heldObject');
						util.addDetail(base.details, heldObject);
						return true;
					}
					
					if (item.qualifiedItemId === '(O)93' && base.details.SpecialVariable !== 999999) {
						if (probe) {
							return true;
						}
						
						base.details.SpecialVariable = 999999;
						return true;
					}
				}
			}
			
			break;
		}
		
		return false;
	}
	
	isBuildable (tileX, tileY, onlyNeedsToBePassable = false) {
		// See StardewValley.GameLocation:isBuildable()
		
		if (onlyNeedsToBePassable) {
			if (this.isTilePassable(tileX, tileY)) {
				return !this.isTileOccupiedBy(tileX, tileY, MapLocation.COL_ALL, MapLocation.COL_ALL);
			}
			
			return false;
		}
		
		if (this.hasFeatureAt(tileX, tileY, 'buildings')) {
			return false;
		}
		
		if (!this.canItemBePlacedHere(tileX, tileY)) {
			let object = this.getObjectAtTile(tileX, tileY);
			
			if (!object || object.meta.item.qualifiedItemId !== '(O)590') {
				return false;
			}
		}
		
		let buildable = (this.doesTileHaveProperty(tileX, tileY, 'Buildable', 'Back') ?? '').toLowerCase();
		
		if (buildable === 't' || buildable === 'true') {
			return true;
		}
		
		if (this.doesTileHaveProperty(tileX, tileY, 'Diggable', 'Back') != null && buildable !== 'f') {
			return true;
		}
		
		return false;
	}
	
	canItemBePlacedHere (tileX, tileY, itemIsPassable = false, collisionMask = MapLocation.COL_ALL, ignorePassables = ~MapLocation.COL_OBJECTS & MapLocation.COL_ALL, ignorePassablesExactly = false) {
		// See StardewValley.GameLocation:CanItemBePlacedHere()
		
		if (!ignorePassablesExactly) {
			ignorePassables &= ~MapLocation.COL_OBJECTS;
			
			if (!itemIsPassable) {
				ignorePassables &= ~(MapLocation.COL_CHARACTERS | MapLocation.COL_FARMERS);
			}
		}
		
		if (!this.map.isTileOnMap(tileX, tileY)) {
			return false;
		}
		
		if (!this.isTilePlaceable(tileX, tileY, itemIsPassable)) {
			return false;
		}
		
		let hoeDirt = this.getHoeDirtAtTile(tileX, tileY);
		
		if (hoeDirt !== null && hoeDirt.crop != null && !(collisionMask & MapLocation.COL_IGNORE_ERASABLE)) { // We'll assume the hoeDirt is erasable.
			return false;
		}
		
		if (this.isTileBlockedBy(tileX, tileY, collisionMask, ignorePassables)) {
			return false;
		}
		
		if (itemIsPassable) {
			for (let feature of this.locationPlan.features) {
				if (
					feature != null &&
					feature.kind === 'buildings' &&
					this.featureOccupiesTile(feature, tileX, tileY) &&
					!this.core.content.Data.Buildings[feature.meta.buildingType]?.AllowsFlooringUnderneath &&
					(!(collisionMask & MapLocation.COL_IGNORE_ERASABLE) || feature.meta.noErase)
				) {
					return false;
				}
			}
		}
		
		return true;
	}
	
	getHoeDirtAtTile (tileX, tileY) {
		// See StardewValley.GameLocation:GetHoeDirtAtTile()
		
		let tileIndex = this.map.getTileIndex(tileX, tileY);
		let object = this.locationPlan.featureLookup.objects[tileIndex];
		
		if (object != null && object.meta.type === 'IndoorPot') {
			return util.rootDetails(object.details, 'hoeDirt');
		}
		
		let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
		
		if (terrainFeature != null && terrainFeature.meta.type === 'HoeDirt') {
			return terrainFeature.details;
		}
		
		return null;
	}
	
	isTileBlockedBy (tileX, tileY, collisionMask = MapLocation.COL_ALL, ignorePassables = MapLocation.COL_NONE) {
		// See StardewValley.GameLocation:IsTileBlockedBy()
		
		if (this.isTileOccupiedBy(tileX, tileY, collisionMask, ignorePassables)) {
			return true;
		}
		
		return !this.isTilePassable(tileX, tileY);
	}
	
	isTilePlaceable (tileX, tileY, passable) {
		// See StardewValley.GameLocation:isTilePlaceable()
		
		// See StardewValley.GameLocation:IsLocationSpecificPlacementRestriction()
		
		switch (this.locationPlan.location.type) {
		case 'IslandNorth':
			// Suspension bridge: (38,39)
			
			if (tileY === 39 && (tileX === 38 - 1 || tileX === 38 + 6)) {
				return false;
			}
			
			break;
		}
		
		if (this.map.getTile(tileX, tileY, 'Back') === -1) {
			return false;
		}
		
		if (this.isWaterTile(tileX, tileY)) {
			return false;
		}
		
		let noFurniture = this.doesTileHaveProperty(tileX, tileY, 'NoFurniture', 'Back');
		
		if (noFurniture != null) {
			if (noFurniture === 'total') {
				return false;
			}
			
			if (!passable || this.locationPlan.location.details.isOutdoors !== 'true') {
				return false;
			}
		}
		
		return true;
	}
	
	placementAction (tileX, tileY, feature, probe = false) {
		// This function differs from Stardew Valley's equivalent in a few
		// ways:
		//
		// - Instead of just returning true or false, this can also return
		//   null. This is the same as returning true, except it indicates
		//   that the caller should perform the standard placement behavior.
		//   True is only used when this function is intercepting the
		//   standard placement behavior.
		//
		// - This function has a probe attribute, to get the result without
		//   actually performing the action.
		
		// See StardewValley.Object:placementAction()
		
		let lib = this.core.extensions.maps.lib;
		
		let tileIndex = this.map.getTileIndex(tileX, tileY);
		let item = feature.meta.item;
		
		if (item.isError) {
			return false;
		}
		
		switch (feature.meta.type) {
		case 'Wallpaper':
			if (this.locationPlan.location.isDecoratable) {
				if (feature.details.isFloor === 'true') {
					for (let [id, areas] of this.floorTiles) {
						for (let [x, y] of areas) {
							if (x === tileX && y === tileY) {
								if (!probe) {
									lib.setHasUnsavedChanges(true, true);
									lib.actions.push({
										type: lib.UNDO_WALLPAPER,
										isFloor: true,
										areaId: id,
										itemId: this.locationPlan.appliedFloor[id],
									});
									this.locationPlan.appliedFloor[id] = item.itemId;
									this.updateFloor(id);
									lib.drawLayers(document.getElementById('maps-canvas-back'), ['Back', 'Buildings'], []);
								}
								
								return true;
							}
						}
					}
				}
				else {
					for (let [id, areas] of this.wallpaperTiles) {
						for (let [x, y] of areas) {
							if (x === tileX && y === tileY) {
								if (!probe) {
									lib.setHasUnsavedChanges(true, true);
									lib.actions.push({
										type: lib.UNDO_WALLPAPER,
										isFloor: false,
										areaId: id,
										itemId: this.locationPlan.appliedWallpaper[id],
									});
									this.locationPlan.appliedWallpaper[id] = item.itemId;
									this.updateWallpaper(id);
									lib.drawLayers(document.getElementById('maps-canvas-back'), ['Back', 'Buildings'], []);
								}
								
								return true;
							}
						}
					}
				}
			}
			
			return false;
		}
		
		if (item.itemType !== 'BC' && item.itemType !== 'F') {
			if (feature.meta.domainType === 'sprinkler' && this.doesTileHaveProperty(tileX, tileY, 'NoSprinklers', 'Back') === 'T') {
				return false;
			}
			
			if (lib.wildTreeSeeds.includes(item.qualifiedItemId)) {
				// TODO: canPlaceWildTreeSeed() logic.
				// TODO: resolveTreeTypeFromSeed() logic.
				
				return null;
			}
			
			if (Object.hasOwn(lib.floorPathItemLookup, item.itemId)) {
				if (this.locationPlan.featureLookup.terrainFeatures[tileIndex] != null) {
					return false;
				}
			}
			
			if (item.data.ContextTags && item.data.ContextTags.includes('torch_item')) {
				if (this.locationPlan.featureLookup.objects[tileIndex] != null) {
					return false;
				}
				
				return null;
			}
			
			// TODO: Fence
			
			switch (item.qualifiedItemId) {
			case '(O)TentKit':
			case '(O)926': // Cookout Kit
			case '(O)286': // Cherry Bomb
			case '(O)287': // Bomb
			case '(O)288': // Mega Bomb
			case '(O)893': // Fireworks (Red)
			case '(O)894': // Fireworks (Purple)
			case '(O)895': // Fireworks (Green)
			case '(O)805': // Tree Fertilizer
			case '(O)419': // Vinegar
				// We won't support these in the planner.
				return false;
			
			case '(O)297': // Grass Starter
			case '(O)BlueGrassStarter':
				// In the planner, these shouldn't be placed in object form.
				return false;
			
			case '(O)710': // Crab Pot
				// We should have already checked these completely in canBePlacedHereObject().
				return null;
			
			case '(O)590': // Artifact Spot
			case '(O)SeedSpot': // Seed Spot
				// Planner addition.
				return (this.doesTileHaveProperty(tileX, tileY, 'Diggable', 'Back') == null) ? false : null;
			}
		}
		else {
			let contextTags = item.data.ContextTags ?? [];
			
			if (contextTags.includes('tapper_item')) {
				let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
				
				if (terrainFeature != null &&
					terrainFeature.meta.type === 'Tree' &&
					+terrainFeature.details.growthStage >= 5 &&
					terrainFeature.details.stump !== 'true' &&
					this.locationPlan.featureLookup.objects[tileIndex] == null &&
					terrainFeature.meta.treeType != null
				) {
					let treeData = this.core.content.Data.WildTrees[terrainFeature.meta.treeType];
					
					if (treeData && treeData.TapItems && treeData.TapItems.length > 0) {
						return null;
					}
				}
				
				return false;
			}
			
			if (contextTags.includes('sign_item')) {
				return (this.locationPlan.featureLookup.objects[tileIndex] == null) ? null : false;
			}
			
			if (contextTags.includes('torch_item')) {
				return (this.locationPlan.featureLookup.objects[tileIndex] == null) ? null : false;
			}
			
			switch (item.qualifiedItemId) {
			case '(BC)108': // Tub o' Flowers
			case '(BC)109': // (Missing)
			case '(BC)62': // Garden Pot
			case '(BC)165': // Auto-Grabber
			case '(BC)208': // Workbench
			case '(BC)209': // Mini-Jukebox
			case '(BC)211': // Wood Chipper
			case '(BC)214': // Telephone
				return null;
			
			case '(BC)71': // Staircase
				// Skipped MineShaft logic.
				return false;
			
			case '(BC)232': // Stone Chest
			case '(BC)130': // Chest
			case '(BC)BigChest':
			case '(BC)BigStoneChest':
			case '(BC)248': // Mini-Shipping Bin
			case '(BC)256': // Junimo Chest
			case '(BC)275': // Hopper
				return (this.locationPlan.featureLookup.objects[tileIndex] == null) ? null : false;
			
			case '(BC)163': // Cask
				break;
			
			case '(BC)216': { // Mini-Fridge
				if (this.locationPlan.featureLookup.objects[tileIndex] != null) {
					return false;
				}
				
				if (!['FarmHouse', 'IslandFarmHouse'].includes(this.locationPlan.location.type)) {
					return false;
				}
				
				if (this.locationPlan.location.type === 'FarmHouse' && this.gameState.houseUpgradeLevel < 1) {
					return false;
				}
				
				return null;
			}
			case '(BC)238': { // Mini-Obelisk
				if (this.locationPlan.location.type !== 'Farm') {
					return false;
				}
				
				let count = 0;
				
				for (let feature of this.locationPlan.features) {
					if (feature != null && feature.kind === 'objects' && feature.meta.item.qualifiedItemId === '(BC)238') {
						++count;
					}
				}
				
				if (count >= 2) {
					return false;
				}
				
				break;
			}
			case '(BC)254': // Ostrich Incubator
				if (this.locationPlan.location.type !== 'AnimalHouse' || !this.locationPlan.location.name.includes('Barn')) {
					return false;
				}
				
				break;
			}
		}
		
		// TODO: Sapling
		
		if (item.category === -74 || item.category === -19 || feature.hasCrop()) {
			// category_seeds, category_fertilizer
			
			if (feature.kind === 'terrainFeatures') {
				// See StardewValley.Tools.Hoe:DoFunction()
				
				if (
					feature.meta.type !== 'HoeDirt' ||
					this.locationPlan.featureLookup.terrainFeatures[tileIndex] != null ||
					this.doesTileHaveProperty(tileX, tileY, 'Diggable', 'Back') == null ||
					this.isTileOccupiedBy(tileX, tileY, ~(MapLocation.COL_CHARACTERS | MapLocation.COL_FARMERS) & MapLocation.COL_ALL) ||
					!this.isTilePassable(tileX, tileY)
				) {
					return false;
				}
			}
			else {
				let terrainFeature = this.locationPlan.featureLookup.terrainFeatures[tileIndex];
				
				if (terrainFeature == null || terrainFeature.meta.type !== 'HoeDirt') {
					return false;
				}
			}
			
			// Here is where we would do the StardewValley.Crop:ResolveSeedId()
			// logic to choose specific seeds from mixed seeds. For now, we just
			// won't support mixed seeds.
			
			let seedId = item.itemId;
			
			// See StardewValley.TerrainFeatures.HoeDirt:plant()
			
			if (item.category === -19) {
				// TODO: Fertilizer.
				
				return false;
			}
			
			// TODO: The rest of the planting rules, including garden pots.
			
			return false;
		}
		
		return null;
	}
	
	isTileOccupiedBy (tileX, tileY, collisionMask = MapLocation.COL_ALL, ignorePassables = MapLocation.COL_NONE) {
		let lib = this.core.extensions.maps.lib;
		let ignoreErasable = ((collisionMask & MapLocation.COL_IGNORE_ERASABLE) !== 0);
		
		// See StardewValley.GameLocation:IsTileOccupiedBy()
		
		for (let feature of this.locationPlan.features) {
			if (feature != null) {
				if (ignoreErasable && !feature.meta.noErase) {
					continue;
				}
				
				let occupied = this.featureOccupiesTile(feature, tileX, tileY);
				
				switch (feature.kind) {
				case 'objects':
					if (occupied && (collisionMask & MapLocation.COL_OBJECTS)) {
						if (!(ignorePassables & MapLocation.COL_OBJECTS) || !feature.meta.passable) {
							return true;
						}
					}
					
					break;
				
				case 'furniture':
					if (occupied && (collisionMask & MapLocation.COL_FURNITURE)) {
						if (!(ignorePassables & MapLocation.COL_FURNITURE) || !feature.meta.passable) {
							return true;
						}
					}
					
					break;
				
				case 'resourceClumps':
					if (occupied && (collisionMask & MapLocation.COL_TERRAIN_FEATURES)) {
						if (!(ignorePassables & MapLocation.COL_TERRAIN_FEATURES) || !feature.meta.passable) {
							return true;
						}
					}
					
					break;
				
				case 'largeTerrainFeatures':
					if (occupied && (collisionMask & MapLocation.COL_TERRAIN_FEATURES)) {
						if (!(ignorePassables & MapLocation.COL_TERRAIN_FEATURES) || !feature.meta.passable) {
							return true;
						}
					}
					
					break;
				
				case 'terrainFeatures':
					if (occupied) {
						let relevantMask = (feature.meta.type === 'Flooring' ? MapLocation.COL_FLOORING : MapLocation.COL_TERRAIN_FEATURES);
						
						if (collisionMask & relevantMask) {
							if (!(ignorePassables & relevantMask) || !feature.meta.passable) {
								return true;
							}
						}
					}
					
					break;
				
				case 'buildings':
					if (collisionMask & MapLocation.COL_BUILDINGS) {
						if (ignorePassables & MapLocation.COL_BUILDINGS) {
							if (!this.buildingIsTilePassable(feature, tileX, tileY)) {
								return true;
							}
						}
						else if (occupied) {
							return true;
						}
					}
					
					break;
				}
			}
		}
		
		return false;
	}
	
	isFloorableTile (tileX, tileY, layerName) {
		let tileIndex = this.map.getTile(tileX, tileY, 'Buildings', 'untitled tile sheet');
		
		if (tileIndex >= 197 && tileIndex <= 199) {
			return false;
		}
		
		return this.isFloorableOrWallpaperableTile(tileX, tileY, layerName);
	}
	
	isFloorableOrWallpaperableTile (tileX, tileY, layerName) {
		if (!Object.hasOwn(this.map.layers, layerName)) {
			return false;
		}
		
		let layer = this.map.layers[layerName];
		
		if (!layer.isTileOnMap(tileX, tileY)) {
			return false;
		}
		
		let tileIndex = layer.getTileIndex(tileX, tileY);
		
		if (layer.tiles[tileIndex] < 0) {
			return false;
		}
		
		let tileSheet = this.map.tileSheets[layer.tileAttributes[tileIndex].tileSheetIndex];
		
		if (tileSheet == null) {
			return false;
		}
		
		return (tileSheet.name.includes('walls_and_floors') || tileSheet.name.startsWith('x_WallsAndFloors_'));
	}
	
	isTileOnWall (tileX, tileY) {
		for (let areas of this.wallpaperTiles.values()) {
			for (let [x, y, type] of areas) {
				if (x === tileX && y === tileY) {
					return true;
				}
			}
		}
		
		return false;
	}
	
	getWallTopY (tileX, tileY) {
		for (let areas of this.wallpaperTiles.values()) {
			for (let [x, y, type] of areas) {
				if (x === tileX && y === tileY) {
					return tileY - type;
				}
			}
		}
		
		return -1;
	}
	
	//== Fishing ==//
	
	determineSplash () {
		let common = this.core.common;
		
		let splashes = [];
		
		if (this.locationPlan.location.id === 'Farm' && this.gameState.farmType !== '1') {
			return splashes;
		}
		
		if (!this.map.properties.Outdoors) {
			return splashes;
		}
		
		// See StardewValley.GameLocation:performTenMinuteUpdate()
		
		let splashTileIndex = 0;
		let splashTime = 0;
		let splashX;
		let splashY;
		let frenzy = false;
		
		for (let timeOfDay = 600; timeOfDay <= 2600;) {
			let rng = this.core.createDaySaveRandom(timeOfDay, this.map.width);
			
			if (splashTileIndex === 0 && util.nextBool(rng, .5)) {
				for (let tries = 0; tries < 2; ++tries) {
					let tileX = rng.Next(0, this.map.layers.Back.width);
					let tileY = rng.Next(0, this.map.layers.Back.height);
					
					if (!this.isOpenWater(tileX, tileY) || this.doesTileHaveProperty(tileX, tileY, 'NoFishing', 'Back') != null) {
						continue;
					}
					
					// TODO: Look for tiles blocked by objects.
					
					// Check that the tile is in fishing distance 2..4.
					
					let distance = this.getFishingDistance(tileX, tileY);
					
					if (distance <= 1 || distance >= 5) {
						continue;
					}
					
					if (rng.NextDouble() < ((this.locationPlan.location.id === 'Beach') ? 0.008 : 0.01) && util.daysPlayed(this.gameState) > 3) {
						if (['Town', 'Mountain', 'Forest', 'Beach'].includes(this.locationPlan.location.id)) {
							if (timeOfDay < 2300 && (common.player.stats.fishCaught > 2 || util.daysPlayed(this.gameState) > 14) && common.weather !== 'Festival') {
								// Non-deterministic: Which fish the frenzy is for.
								
								rng.Next(500);
								frenzy = true;
							}
						}
					}
					
					splashTileIndex = this.map.getTileIndex(tileX, tileY);
					splashX = tileX;
					splashY = tileY;
					splashTime = timeOfDay;
					break;
				}
			}
			else if (splashTileIndex !== 0) {
				let durationSoFar = (Math.floor(timeOfDay / 100) - Math.floor(splashTime / 100)) * 60 + timeOfDay % 100 - splashTime % 100;
				
				if (rng.NextDouble() < 0.1 + (durationSoFar / 1800) && durationSoFar > (frenzy ? 120 : 60)) {
					splashes.push({
						tileIndex: splashTileIndex,
						x: splashX,
						y: splashY,
						startTime: splashTime,
						endTime: timeOfDay,
						frenzy: frenzy,
					});
					
					splashTileIndex = 0;
					frenzy = false;
				}
			}
			
			timeOfDay += 10;
			
			if (timeOfDay % 100 >= 60) {
				timeOfDay += 40;
			}
		}
		
		if (splashTileIndex !== 0) {
			splashes.push({
				tileIndex: splashTileIndex,
				x: splashX,
				y: splashY,
				startTime: splashTime,
				endTime: 2600,
				frenzy: frenzy,
			});
		}
		
		return splashes;
	}
	
	getFishingDistance (tileX, tileY) {
		let distance = 5;
		
		for (let checkY = Math.max(0, tileY - distance); checkY <= tileY + distance && checkY < this.map.height; ++checkY) {
			for (let checkX = Math.max(0, tileX - distance); checkX <= tileX + distance && checkX < this.map.width; ++checkX) {
				if (!this.isWaterTile(checkX, checkY)) {
					distance = Math.max(Math.abs(checkX - tileX), Math.abs(checkY - tileY)) - 1;
				}
			}
		}
		
		return distance;
	}
	
	getForageableSpawnRate (tileX, tileY, ignoreErasable = false) {
		// See StardewValley.GameLocation:spawnObjects()
		
		if (this.doesTileHaveProperty(tileX, tileY, 'Spawnable', 'Back') == null) {
			return 0;
		}
		
		{
			// See StardewValley.GameLocation:IsNoSpawnTile()
			//
			// This achieves the same result as this.isNoSpawnTile(), but without
			// the buildings check. We do the buildings check further down, where
			// we also handle ignoreErasable.
			
			let noSpawn = this.doesTileHaveProperty(tileX, tileY, 'NoSpawn', 'Back');
			
			if (![null, 'Grass', 'Tree'].includes(noSpawn)) {
				if (noSpawn.toLowerCase() !== 'false') {
					return 0;
				}
			}
		}
		
		if (
			this.map.hasTile(tileX, tileY, 'Front') ||
			this.map.hasTile(tileX, tileY, 'AlwaysFront') ||
			this.map.hasTile(tileX, tileY, 'AlwaysFront2') ||
			this.map.hasTile(tileX, tileY, 'AlwaysFront3')
		) {
			return 0;
		}
		
		let rate = 1;
		
		for (let feature of this.locationPlan.features) {
			if (feature != null) {
				if (ignoreErasable && !feature.meta.noErase) {
					continue;
				}
				
				switch (feature.kind) {
				case 'buildings':
					if (this.featureOccupiesTile(feature, tileX, tileY) || !this.buildingIsTilePassable(feature, tileX, tileY)) {
						return 0;
					}
					
					break;
				
				case 'largeTerrainFeatures': {
					// See StardewValley.GameLocation:isBehindBush()
					
					let x = tileX;
					let y = tileY + 1;
					
					if (
						x + 1 > feature.tileX &&
						x < feature.tileX + feature.meta.width &&
						y + 2 > feature.tileY &&
						y < feature.tileY + feature.meta.height
					) {
						return 0;
					}
					
					break;
				}
				case 'terrainFeatures':
					// See StardewValley.GameLocation:isBehindTree()
					
					if (feature.meta.type === 'Tree') {
						let x = tileX - 1;
						let y = tileY;
						
						if (
							x + 3 > feature.tileX &&
							x < feature.tileX + feature.meta.width &&
							y + 4 > feature.tileY &&
							y < feature.tileY + feature.meta.height
						) {
							rate = .5;
						}
					}
					
					break;
				}
			}
		}
		
		if (this.doesEitherTileOrTileIndexPropertyEqual(tileX, tileY, 'Spawnable', 'Back', 'F')) {
			return 0;
		}
		
		let collisionMask = MapLocation.COL_ALL;
		
		if (ignoreErasable) {
			collisionMask |= MapLocation.COL_IGNORE_ERASABLE;
		}
		
		if (!this.canItemBePlacedHere(tileX, tileY, false, collisionMask)) {
			return 0;
		}
		
		return rate;
	}
	
	getCropSpawnRate (tileX, tileY, ignoreErasable = false) {
		// Daily spawning of wild crops like spring onions and ginger.
		
		let rate = 0;
		
		for (let rect of this.cropSpawnRects) {
			// See StardewValley.Locations.Forest:DayUpdate()
			
			// We're going to approximate the behavior slightly. The game picks
			// random points in the rectangular region and then finds a bunch of
			// suitable tiles around it in a diamond shape (the same basic search
			// pattern bee houses use to find flowers), with the distance varying
			// somewhat based on what it finds. It's difficult to model, so we'll
			// simplify it and focus on the maximum distance it can produce,
			// based on StardewValley.Utility:recursiveFindOpenTiles()'s
			// maxIterations, which reaches up to 5 tiles from the spawn origin.
			//
			// What this means is that we may end up overestimating the range,
			// marking some tiles as rare when they're actually impossible.
			
			let innerLeft = rect.x
			let innerTop = rect.y;
			let innerRight = rect.x + rect.width - 1;
			let innerBottom = rect.y + rect.height - 1;
			
			if (
				tileX < innerLeft - 5 ||
				tileY < innerTop - 5 ||
				tileX > innerRight + 5 ||
				tileY > innerBottom + 5
			) {
				continue;
			}
			
			// This is the outer rectangle containing the region where crops may
			// spawn. The actual possible spawn positions are based on the
			// taxicab distance from random positions chosen within an inner
			// rectangle. So, the true region will be the outer rectangle with
			// its corners cut off.
			
			if (this.doesTileHaveProperty(tileX, tileY, 'Diggable', 'Back') == null) {
				continue;
			}
			
			let collisionMask = MapLocation.COL_ALL;
			
			if (ignoreErasable) {
				collisionMask |= MapLocation.COL_IGNORE_ERASABLE;
			}
			
			if (!this.canItemBePlacedHere(tileX, tileY, false, collisionMask)) {
				continue;
			}
			
			if (tileY >= innerTop && tileY <= innerBottom && tileX >= innerLeft && tileX <= innerRight) {
				// Within the inner rectangle. This could be a spawning origin.
				
				rate = 1;
				break;
			}
			else if (
				// Exclude the corners.
				
				(tileX >= innerLeft && tileX <= innerRight) ||
				(tileY >= innerTop && tileY <= innerBottom) ||
				(tileX < innerLeft && tileY < innerTop && innerLeft - tileX + innerTop - tileY <= 5) ||
				(tileX > innerRight && tileY < innerTop && tileX - innerRight + innerTop - tileY <= 5) ||
				(tileX < innerLeft && tileY > innerBottom && innerLeft - tileX + tileY - innerBottom <= 5) ||
				(tileX > innerRight && tileY > innerBottom && tileX - innerRight + tileY - innerBottom <= 5)
			) {
				// The actual rate should be based on the distance from the inner
				// rectangle, but we currently don't need that level of precision.
				
				if (rate < .5) {
					rate = .5;
				}
			}
		}
		
		return rate;
	}
};
