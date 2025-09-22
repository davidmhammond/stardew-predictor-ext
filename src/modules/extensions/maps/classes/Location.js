import * as mapsUtil from '../mapsUtil.js';
import * as util from '../../../util.js';

export default class Location {
	id;
	details;
	parent;
	
	type;
	name;
	displayName;
	locationType;
	data;
	
	saveFeatures = [];
	
	gameState;
	gameContent;
	
	// Location types that extend the DecoratableLocation class.
	
	static decoratableLocationTypes = new Set([
		'FarmHouse',
		'IslandFarmHouse',
		'Shed',
		'SlimeHutch',
	]);
	
	// Location types that extend the IslandLocation class.
	
	static islandLocationTypes = new Set([
		'Caldera',
		'IslandFarmCave',
		'IslandFieldOffice',
		'IslandForestLocation',
		'IslandHut',
		'IslandNorth',
		'IslandSecret',
		'IslandSouth',
		'IslandSouthEastCave',
		'IslandSouthEast',
		'IslandWestCave1',
		'IslandWest',
		'VolcanoDungeon',
	]);
	
	// Value of the "SeasonOverride" map property, as a season number
	// (hardcoded here so it's available even when the map isn't loaded).
	
	static mapSeasonOverrides = new Map([
		['Maps/Caldera', 1],
		['Maps/Island_CaptainRoom', 1],
		['Maps/Island_E', 1],
		['Maps/Island_FarmCave', 1],
		['Maps/IslandFarmHouse', 1],
		['Maps/Island_FieldOffice', 1],
		['Maps/Island_Hut', 1],
		['Maps/IslandNorthCave1', 1],
		['Maps/Island_N', 1],
		['Maps/Island_SE', 1],
		['Maps/Island_Shrine', 1],
		['Maps/IslandSouthEastCave_pirates', 1],
		['Maps/IslandSouthEastCave', 1],
		['Maps/Island_S', 1],
		['Maps/IslandWestCave1', 1],
		['Maps/Island_W', 1],
		['Maps/Mines/VolcanoTemplate', 1],
		['Maps/QiNutRoom', 1],
	]);
	
	// Value of the "LocationContext" map property (hardcoded here to it's
	// available even when the map isn't loaded).
	
	static mapLocationContexts = new Map([
		['Maps/Club', 'Desert'],
		['Maps/Desert-Festival', 'Desert'],
		['Maps/Desert', 'Desert'],
		['Maps/SandyHouse', 'Desert'],
		['Maps/SkullCave', 'Desert'],
		['Maps/Caldera', 'Island'],
		['Maps/Island_CaptainRoom', 'Island'],
		['Maps/Island_E', 'Island'],
		['Maps/Island_FarmCave', 'Island'],
		['Maps/IslandFarmHouse', 'Island'],
		['Maps/Island_FieldOffice', 'Island'],
		['Maps/Island_Hut', 'Island'],
		['Maps/IslandNorthCave1', 'Island'],
		['Maps/Island_N', 'Island'],
		['Maps/Island_SE', 'Island'],
		['Maps/Island_Shrine', 'Island'],
		['Maps/IslandSouthEastCave_pirates', 'Island'],
		['Maps/IslandSouthEastCave', 'Island'],
		['Maps/Island_S', 'Island'],
		['Maps/IslandWestCave1', 'Island'],
		['Maps/Island_W', 'Island'],
		['Maps/Mines/VolcanoTemplate', 'Island'],
		['Maps/QiNutRoom', 'Island'],
	]);
	
	constructor (core, id, details, parent = null, data = null) {
		this.gameState = core.extensions.maps.lib.gameState;
		this.gameContent = core.content;
		
		this.id = id;
		this.details = details;
		this.parent = parent;
		
		this.type = details['@xsi:type'] ?? null;
		this.name = details.name;
		
		this.updateData(core, data);
	}
	
	updateData (core, data = null) {
		if (data == null) {
			switch (this.type) {
			case 'Cellar':
				this.locationType = 'Cellar';
				break;
			
			case 'Farm':
				this.locationType = mapsUtil.farmLocationDataIds.get(this.gameState.farmType);
				break;
			
			default:
				this.locationType = this.id;
			}
			
			if (!Object.hasOwn(this.gameContent.Data.Locations, this.locationType)) {
				this.locationType = 'Default';
			}
			
			this.data = this.gameContent.Data.Locations[this.locationType];
		}
		else {
			this.locationType = null;
			this.data = data;
		}
		
		if (this.data.DisplayName == null) {
			this.displayName = this.name;
		}
		else {
			this.displayName = core.localizer.parseText(this.data.DisplayName);
		}
	}
	
	isDecoratable () {
		// Whether the location class extends DecoratableLocation.
		
		return Location.decoratableLocationTypes.has(this.type);
	}
	
	isIslandLocation () {
		// Whether the location class extends IslandLocation.
		
		return Location.islandLocationTypes.has(this.type);
	}
	
	isTimeSensitiveMap () {
		// Whether the map modifications vary based on the time of day.
		
		return [
			'IslandSouthEast',
			'IslandSouthEastCave',
		].includes(this.type);
	}
	
	getLocationContext () {
		return Location.mapLocationContexts.get(this.getMapPath()) ?? 'Default';
	}
	
	getSeasonNumber () {
		// See StardewValley.GameLocation:GetSeason()
		
		return Location.mapSeasonOverrides.get(this.getMapPath()) ??
			this.gameContent.Data.LocationContexts[this.getLocationContext()].SeasonOverride ??
			this.parent?.getSeasonNumber() ??
			this.gameState.seasonNumber;
	}
	
	getSeasonName () {
		return util.getSeasonName(this.getSeasonNumber());
	}
	
	isRainingHere () {
		return this.gameState['weatherIsRaining' + this.getLocationContext()] == true;
	}
	
	getStartingToGetDarkTime () {
		// See StardewValley.Game1:getStartingToGetDarkTime()
		
		if (this.getLocationContext() === 'Island') {
			return 1800;
		}
		
		switch (this.getSeasonNumber()) {
		case 2: return 1700;
		case 3: return 1500;
		default: return 1800;
		}
	}
	
	getModeratelyDarkTime () {
		return this.getStartingToGetDarkTime() + 100;
	}
	
	getTrulyDarkTime () {
		return this.getStartingToGetDarkTime() + 200;
	}
	
	getMapPath () {
		switch (this.name) {
		case 'Farm':
			return mapsUtil.farmMapPaths.get(this.gameState.farmType);
		}
		
		switch (this.type) {
		case 'CommunityCenter': {
			if (this.gameState.jojaMember) {
				return 'Maps/CommunityCenter_Joja';
			}
			else if (mapsUtil.allCCAreasComplete(this.gameState)) {
				return 'Maps/CommunityCenter_Refurbished';
			}
			
			break;
		}
		case 'FarmHouse': {
			let mapPath = 'Maps/FarmHouse';
			
			if (this.gameState.houseUpgradeLevel > 0) {
				mapPath += Math.min(this.gameState.houseUpgradeLevel, 2);
				
				if (this.gameState.spouse != null) {
					mapPath += '_marriage';
				}
			}
			
			return mapPath;
		}}
		
		return this.data.CreateOnLoad?.MapPath?.replace(/\\+/g, '/') ?? `Maps/${this.name}`;
	}
	
	getSubMapPaths () {
		// See StardewValley.GameLocation:MakeMapModifications
		
		switch (this.name) {
		case 'Backwoods':
			return [
				'Maps/Backwoods_GraveSite',
				'Maps/Backwoods_Staircase',
			];
		
		case 'Saloon':
			return ['Maps/RefurbishedSaloonRoom'];
		
		case 'SkullCave':
			return ['Maps/SkullCaveAltar'];
		}
		
		switch (this.type) {
		case 'Beach':
			return [
				'Maps/Beach_SquidFest',
				'Maps/Beach_SquidFest_Revert',
				'Maps/Beach_SquidFestSign_Revert',
				'Maps/Forest_FishingDerbySign',
			];
		
		case 'CommunityCenter':
			return ['Maps/CommunityCenter_Refurbished', 'Maps/CommunityCenter_Joja'];
		
		case 'Farm':
			return [
				'Maps/Farm_Greenhouse_Dirt',
				'Maps/Farm_Greenhouse_Dirt_FourCorners',
				'Maps/spousePatios',
			];
		
		case 'FarmHouse':
			return [
				'Maps/FarmHouse_Bedroom_Normal',
				'Maps/FarmHouse_Bedroom_Open',
				'Maps/FarmHouse_Cellar',
				'Maps/FarmHouse_CornerRoom_Add',
				'Maps/FarmHouse_CornerRoom_Remove',
				'Maps/FarmHouse_Crib_0',
				'Maps/FarmHouse_Crib_1',
				'Maps/FarmHouse_Cubby_Add',
				'Maps/FarmHouse_Cubby_Remove',
				'Maps/FarmHouse_DiningRoomWall_Add',
				'Maps/FarmHouse_DiningRoomWall_Remove',
				'Maps/FarmHouse_DiningRoom_Add',
				'Maps/FarmHouse_DiningRoom_Remove',
				'Maps/FarmHouse_ExtendedCornerRoom_Add',
				'Maps/FarmHouse_ExtendedCornerRoom_Remove',
				'Maps/FarmHouse_FarUpperRoom_Add',
				'Maps/FarmHouse_FarUpperRoom_Remove',
				'Maps/FarmHouse_SouthernRoom_Add',
				'Maps/FarmHouse_SouthernRoom_Remove',
				'Maps/FarmHouse1',
				'Maps/FarmHouse1_marriage',
				'Maps/FarmHouse2',
				'Maps/FarmHouse2_marriage',
				'Maps/spouseRooms',
			];
		
		case 'Forest':
			return [
				'Maps/Forest-SewerClean',
				'Maps/Forest_FishingDerby',
				'Maps/Forest_FishingDerby_Revert',
				'Maps/Forest_FishingDerbySign',
				'Maps/Forest_FishingDerbySign_Revert',
				'Maps/Forest_RaccoonHouse',
				'Maps/Forest_RaccoonStump',
			];
		
		case 'IslandNorth':
			return [
				'Maps/Island_Bridge_Broken',
				'Maps/Island_Bridge_Repaired',
				'Maps/Island_N_Trader',
			];
		
		case 'IslandSouth':
			return ['Maps/Island_Resort'];
		
		case 'IslandWest':
			return [
				'Maps/Island_House_Bin',
				'Maps/Island_House_Cave',
				'Maps/Island_House_Restored',
				'Maps/Island_W_Obelisk',
			];
		
		case 'Mountain':
			return [
				'Maps/Mountain-BridgeFixed',
				'Maps/Mountain_Shortcuts',
			];
		
		case 'Town':
			return [
				'Maps/Town-DogHouse',
				'Maps/Town-Theater',
				'Maps/Town-TheaterCC',
				'Maps/Town-TheaterCC-Halloween2',
				'Maps/Town-TrashGone',
			];
		
		case 'VolcanoDungeon':
			return [
				'Maps/Mines/Volcano_DwarfShop',
				'Maps/Mines/Volcano_SetPieces_3',
				'Maps/Mines/Volcano_SetPieces_4',
				'Maps/Mines/Volcano_SetPieces_8',
				'Maps/Mines/Volcano_SetPieces_16',
				'Maps/Mines/Volcano_SetPieces_32',
				'Maps/Mines/Volcano_Well',
			];
		}
		
		return [];
	}
	
	getWalls () {
		// See StardewValley.DecoratableLocation:getWalls()
		
		switch (this.type) {
		case 'FarmHouse':
			switch (this.gameState.houseUpgradeLevel) {
			case 0:
				return [
					new util.Rect(1, 1, 10, 3),
				];
			
			case 1:
				return [
					new util.Rect(1, 1, 17, 3),
					new util.Rect(18, 6, 2, 2),
					new util.Rect(20, 1, 9, 3),
				];
			
			case 2:
			case 3:
				{
					let walls = [
						new util.Rect(1, 1, 12, 3),
						new util.Rect(15, 1, 13, 3),
						new util.Rect(13, 3, 2, 2),
						new util.Rect(1, 10, 10, 3),
						new util.Rect(13, 10, 8, 3),
					];
					let bedroomWidthReduction = this.gameState.renovationCornerOpen ? -3 : 0;
					
					if (this.gameState.renovationBedroomOpen) {
						walls.push(new util.Rect(21, 15, 0, 2));
						walls.push(new util.Rect(21, 10, 13 + bedroomWidthReduction, 3));
					}
					else {
						walls.push(new util.Rect(21, 15, 2, 2));
						walls.push(new util.Rect(23, 10, 11 + bedroomWidthReduction, 3));
					}
					
					if (this.gameState.renovationSouthernOpen) {
						walls.push(new util.Rect(23, 24, 3, 3));
						walls.push(new util.Rect(31, 24, 3, 3));
					}
					else {
						walls.push(new util.Rect(0, 0, 0, 0));
						walls.push(new util.Rect(0, 0, 0, 0));
					}
					
					if (this.gameState.renovationCornerOpen) {
						walls.push(new util.Rect(30, 1, 9, 3));
						walls.push(new util.Rect(28, 3, 2, 2));
					}
					else {
						walls.push(new util.Rect(0, 0, 0, 0));
						walls.push(new util.Rect(0, 0, 0, 0));
					}
					
					for (let wall of walls) {
						wall.x += 15;
						wall.y += 10;
					}
					
					return walls;
				}
				
				break;
			}
			
			break;
		
		case 'IslandFarmHouse':
			return [
				new util.Rect(1, 1, 10, 3),
				new util.Rect(18, 1, 11, 3),
				new util.Rect(12, 5, 5, 2),
				new util.Rect(17, 9, 2, 2),
				new util.Rect(21, 9, 8, 2),
			];
		}
		
		return [];
	}
	
	getFloors () {
		// See StardewValley.DecoratableLocation:getFloors()
		
		switch (this.type) {
		case 'FarmHouse':
			switch (this.gameState.houseUpgradeLevel) {
			case 0:
				return [
					new util.Rect(1, 3, 10, 9),
				];
			
			case 1:
				return [
					new util.Rect(1, 3, 6, 9),
					new util.Rect(7, 3, 11, 9),
					new util.Rect(18, 8, 2, 2),
					new util.Rect(20, 3, 9, 8),
				];
			
			case 2:
			case 3:
				{
					let floors = [
						new util.Rect(1, 3, 12, 6),
						new util.Rect(15, 3, 13, 6),
						new util.Rect(13, 5, 2, 2),
						new util.Rect(0, 12, 10, 11),
						new util.Rect(10, 12, 11, 9),
					];
					let bedroomWidthReduction = this.gameState.renovationCornerOpen ? -3 : 0;
					
					if (this.gameState.renovationBedroomOpen) {
						floors.push(new util.Rect(21, 17, 0, 2));
						floors.push(new util.Rect(21, 12, 14, 11));
					}
					else {
						floors.push(new util.Rect(21, 17, 2, 2));
						floors.push(new util.Rect(23, 12, 12, 11));
					}
					
					if (this.gameState.renovationSouthernOpen) {
						floors.push(new util.Rect(23, 26, 11, 8));
					}
					else {
						floors.push(new util.Rect(0, 0, 0, 0));
					}
					
					if (this.gameState.renovationCornerOpen) {
						floors.push(new util.Rect(28, 5, 2, 3));
						floors.push(new util.Rect(30, 3, 9, 6));
					}
					else {
						floors.push(new util.Rect(0, 0, 0, 0));
						floors.push(new util.Rect(0, 0, 0, 0));
					}
					
					for (let floor of floors) {
						floor.x += 15;
						floor.y += 10;
					}
					
					return floors;
				}
				
				break;
			}
			
			break;
		
		case 'IslandFarmHouse':
			return [
				new util.Rect(1, 3, 11, 12),
				new util.Rect(11, 7, 6, 9),
				new util.Rect(18, 3, 11, 6),
				new util.Rect(17, 11, 12, 6),
			];
		}
		
		return [];
	}
	
	seedsIgnoreSeasonsHere () {
		if (this.isIslandLocation()) {
			return true;
		}
		else {
			return this.details.IsGreenhouse === 'true';
		}
	}
};
