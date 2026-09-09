// Classes

import Feature from './maps/classes/Feature.js';
import Layer from './maps/classes/Layer.js';
import Location from './maps/classes/Location.js';
import LocationPlan from './maps/classes/LocationPlan.js';
import MapLocation from './maps/classes/MapLocation.js';
import Sprite from './maps/classes/Sprite.js';
import TileMap from './maps/classes/TileMap.js';
import TileSheet from './maps/classes/TileSheet.js';
import Warp from './maps/classes/Warp.js';

// Feature types.

import * as fBuildings from './maps/featureTypes/buildings.js';
import * as fFurniture from './maps/featureTypes/furniture.js';
import * as fLargeTerrainFeatures from './maps/featureTypes/largeTerrainFeatures.js';
import * as fMuseumPieces from './maps/featureTypes/museumPieces.js';
import * as fObjects from './maps/featureTypes/objects.js';
import * as fResourceClumps from './maps/featureTypes/resourceClumps.js';
import * as fTerrainFeatures from './maps/featureTypes/terrainFeatures.js';

// Other modules.

import * as catalogue from './maps/catalogue.js';
import * as mapsUtil from './maps/mapsUtil.js';
import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.maps;
	let baseUtil = core.baseUtil;
	let lib = this.lib;
	
	let featureTypeModules = {
		buildings: fBuildings,
		furniture: fFurniture,
		largeTerrainFeatures: fLargeTerrainFeatures,
		museumPieces: fMuseumPieces,
		objects: fObjects,
		resourceClumps: fResourceClumps,
		terrainFeatures: fTerrainFeatures,
	};
	
	core.addDataFile('Data/Buildings');
	core.addDataFile('Data/Characters');
	core.addDataFile('Data/Crops');
	core.addDataFile('Data/FarmAnimals');
	core.addDataFile('Data/Fences');
	core.addDataFile('Data/FloorsAndPaths');
	core.addDataFile('Data/FruitTrees');
	core.addDataFile('Data/GiantCrops');
	core.addDataFile('Data/LocationContexts');
	core.addDataFile('Data/Locations');
	core.addDataFile('Data/Machines');
	core.addDataFile('Data/Mannequins');
	core.addDataFile('Data/PaintData');
	core.addDataFile('Data/WildTrees');
	core.addDataFile('Strings/Buildings');
	
	lib.SUPPORTED_PLAN_FORMAT = 1;
	
	// Variation flags.
	
	lib.VAR_PROBE = 0x01; // Don't set anything, only probe whether variations exist.
	lib.VAR_NEW_FEATURE = 0x02; // Use variation rules for newly added features.
	lib.VAR_RANDOMIZE = 0x04; // Randomize the value.
	lib.VAR_BACKWARDS = 0x08; // Cycle the value backwards.
	
	// Paint results.
	
	lib.PAINT_NONE = 0;
	lib.PAINT_INSTANT = 1;
	lib.PAINT_PICKER = 2;
	
	// Undo entry types.
	
	lib.UNDO_FEATURE = 1;
	lib.UNDO_WALLPAPER = 2; // Wallpaper and flooring.
	
	// Constants from the game.
	
	lib.GAME_JOURNAL_INDEX = 1000; // StardewValley.GameLocation.JOURNAL_INDEX
	
	// Static cache.
	
	lib.paintImageData = new Map();
	lib.wildTreeSeeds = [];
	lib.floorPathItemLookup = {};
	
	lib.seasonWaterColors = [
		{r: 120, g: 200, b: 255, a: 127},
		{r:  60, g: 240, b: 255, a: 127},
		{r: 255, g: 130, b: 200, a: 127},
		{r: 130, g:  80, b: 255, a: 127},
	];
	
	lib.domainTemplates = { // Most of these are populated by loops below.
		beeHouse: {
			5: [],
		},
		fruitTree: {
			1: [],
		},
		junimoHut: {
			8: [],
		},
		scarecrow: {
			9: [],
			17: [],
		},
		sprinkler: {
			0: [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]],
			1: [],
			2: [],
			3: [],
		},
	};
	
	lib.festivals = {
		spring13: {locationId: 'Town', start: 900, end: 1400, mapPath: 'Maps/Town-EggFestival'},
		spring24: {locationId: 'Forest', start: 900, end: 1400, mapPath: 'Maps/Forest-FlowerFestival'},
		summer11: {locationId: 'Beach', start: 900, end: 1400, mapPath: 'Maps/Beach-Luau'},
		summer28: {locationId: 'Beach', start: 2200, end: 2400, mapPath: 'Maps/Beach-Jellies'},
		fall16: {locationId: 'Town', start: 900, end: 1500, mapPath: 'Maps/Town-Fair'},
		fall27: {locationId: 'Town', start: 2200, end: 2350, mapPath: 'Maps/Town-Halloween'},
		winter8: {locationId: 'Forest', start: 900, end: 1400, mapPath: 'Maps/Forest-IceFestival'},
		winter25: {locationId: 'Town', start: 900, end: 1400, mapPath: 'Maps/Town-Christmas'},
	};
	
	lib.newGameState = {
	};
	
	lib.gameStateFields = [
		// General fields.
		
		{name: 'Year', key: 'year', type: 'number', attrs: {min: '1', step: '1', value: '1'}},
		{name: 'Season', key: 'seasonNumber', options: [
			[0, 'Spring'],
			[1, 'Summer'],
			[2, 'Fall'],
			[3, 'Winter'],
		]},
		{name: 'Day of month', key: 'dayOfMonth', options: [
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
			15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
		]},
		{name: 'Raining in Stardew Valley', key: 'weatherIsRainingDefault', group: 'general', locationContexts: ['Default']},
		{name: 'Raining in Calico Desert', key: 'weatherIsRainingDesert', group: 'general', locationContexts: ['Desert']},
		{name: 'Raining in Ginger Island', key: 'weatherIsRainingIsland', group: 'general', locationContexts: ['Island']},
		
		// Location fields.
		
		{name: 'Abandoned JojaMart', key: 'seen191393', locationTypes: ['Town']},
		{name: 'Abandoned JojaMart open', key: 'abandonedJojaMartAccessible', locationTypes: ['Town']},
		{name: 'Add attic', key: 'renovationFarUpperRoomOpen', locationTypes: ['FarmHouse']},
		{name: 'Add corner room', key: 'renovationCornerOpen', locationTypes: ['FarmHouse']},
		{name: 'Add cubby', key: 'renovationCubbyOpen', locationTypes: ['FarmHouse']},
		{name: 'Add dining room', key: 'renovationDiningOpen', locationTypes: ['FarmHouse']},
		{name: 'Add dining room wall', key: 'renovationDiningRoomWallOpen', locationTypes: ['FarmHouse']},
		{name: 'Add southern room', key: 'renovationSouthernOpen', locationTypes: ['FarmHouse']},
		{name: 'Anchor repaired', key: 'willyBoatAnchor', locationTypes: ['BoatTunnel']},
		{name: 'Backpack size', key: 'maxItems', locationTypes: ['SeedShop'], options: [
			[12, 'Normal'],
			[24, 'Large'],
			[36, 'Deluxe'],
		]},
		{name: 'Banana Shrine completed', key: 'islandEastBananaShrineComplete', locationTypes: ['IslandEast']},
		{name: 'Big Tree fallen', key: 'raccoonTreeFallen', locationTypes: ['Forest']},
		{name: 'Boat repaired', key: 'willyBoatFixed', locationTypes: ['BoatTunnel']},
		{name: 'Bridge fixed', key: 'beachBridgeFixed', locations: ['Beach', 'BeachNightMarket']},
		{name: 'Bridge fixed', key: 'islandNorthBridgeFixed', locationTypes: ['IslandNorth']},
		{name: 'Bridge repaired', key: 'ccCraftsRoom', locationTypes: ['Mountain']},
		{name: 'Cave opened', key: 'islandNorthCaveOpened', locationTypes: ['IslandNorth']},
		{name: 'Checked calendar', key: 'checkedBulletinOnce', locationTypes: ['Town']},
		{name: 'Checked Giant Stump', key: 'checkedRaccoonStump', locationTypes: ['Forest']},
		{name: 'Checked monster list', key: 'checkedMonsterBoard', locationTypes: ['AdventureGuild']},
		{name: 'Community Center complete', key: 'ccIsComplete', locationTypes: ['Town']},
		{name: 'Completed Bat', key: 'islandFieldOfficeBatRestored', locationTypes: ['IslandFieldOffice']},
		{name: 'Completed Boiler Room', key: 'ccAreasCompleteBoilerRoom', locationTypes: ['CommunityCenter']},
		{name: 'Completed Bulletin Board', key: 'ccAreasCompleteBB', locationTypes: ['CommunityCenter']},
		{name: 'Completed Crafts Room', key: 'ccAreasCompleteCraftsRoom', locationTypes: ['CommunityCenter']},
		{name: 'Completed Fish Tank', key: 'ccAreasCompleteFishTank', locationTypes: ['CommunityCenter']},
		{name: 'Completed Frog', key: 'islandFieldOfficeFrogRestored', locationTypes: ['IslandFieldOffice']},
		{name: 'Completed Large Animal', key: 'islandFieldOfficeCenterSkeletonRestored', locationTypes: ['IslandFieldOffice']},
		{name: 'Completed Pantry', key: 'ccAreasCompletePantry', locationTypes: ['CommunityCenter']},
		{name: 'Completed Flower Survey', key: 'islandFieldOfficePlantsRestoredLeft', locationTypes: ['IslandFieldOffice']},
		{name: 'Completed Snake', key: 'islandFieldOfficeSnakeRestored', locationTypes: ['IslandFieldOffice']},
		{name: 'Completed Starfish Survey', key: 'islandFieldOfficePlantsRestoredRight', locationTypes: ['IslandFieldOffice']},
		{name: 'Completed Vault', key: 'ccAreasCompleteVault', locationTypes: ['CommunityCenter']},
		{name: 'Crib', key: 'farmHouseCribStyle', locationTypes: ['FarmHouse'], options: [[0, 'No'], [1, 'Yes']]},
		{name: 'Expand corner room', key: 'renovationExtendedCornerOpen', locationTypes: ['FarmHouse']},
		{name: 'Farm obelisk', key: 'islandWestFarmObelisk', locationTypes: ['IslandWest']},
		{name: 'Farm type', key: 'farmType', locationTypes: ['Farm'], options: [
			['0', 'Standard'],
			['1', 'Riverland'],
			['2', 'Forest'],
			['3', 'Hill-top'],
			['4', 'Wilderness'],
			['5', 'Four Corners'],
			['6', 'Beach'],
			['MeadowlandsFarm', 'Meadowlands'],
		]},
		{name: 'Farmhouse restored', key: 'islandWestFarmhouseRestored', locationTypes: ['IslandSouth', 'IslandWest']},
		{name: 'Farmhouse upgrade level', key: 'houseUpgradeLevel', locationTypes: ['Farm', 'FarmHouse'], options: [
			[0, '0 (Starter)'],
			[1, '1 (Kitchen)'],
			[2, '2 (Child Room)'],
			[3, '3 (Cellar)'],
		]},
		{name: 'Fed Old Master Cannoli', key: 'woodsHasUnlockedStatue', locationTypes: ['Woods']},
		{name: 'Game completed', key: 'islandWestCave1Completed', locationTypes: ['IslandWestCave1']},
		{name: 'Gem bird day', key: 'currentGemBirdIndex', locationTypes: ['IslandEast', 'IslandNorth', 'IslandSouth', 'IslandWest'], options: [[0, '1'], [1, '2'], [2, '3'], [3, '4']]},
		{name: 'Giant Stump fixed', key: 'forestStumpFixed', locationTypes: ['Forest']},
		{name: 'Glittering Boulder removed', key: 'ccFishTank', locationTypes: ['Mountain']},
		{name: 'Gold clock turned off', key: 'goldenClocksTurnedOff', locationTypes: ['Farm']},
		{name: 'Golden Joja parrot paid', key: 'activatedGoldenParrot', locationTypes: ['IslandNorth']},
		{name: 'Golden walnuts found', key: 'goldenWalnutsFound', locationTypes: ['IslandNorth'], type: 'number', attrs: {min: '0', step: '1', value: '0'}},
		{name: 'Golem grave', key: 'golemGrave', locations: ['Backwoods']},
		{name: 'Greenhouse repaired', key: 'greenhouseUnlocked', locationTypes: ['Farm']},
		{name: 'Greenhouse was moved', key: 'greenhouseMoved', locationTypes: ['Farm']},
		{name: 'Has achievements', key: 'hasAchievements', locationTypes: ['Forest']},
		{name: 'Has mail', key: 'mailboxHasEntries', locationTypes: ['Farm', 'IslandWest']},
		{name: 'Henchman gone', key: 'henchmanGone', locations: ['WitchSwamp']},
		{name: 'Hull repaired', key: 'willyBoatHull', locationTypes: ['BoatTunnel']},
		{name: 'Island Trader unlocked', key: 'islandNorthTraderActivated', locationTypes: ['IslandNorth']},
		{name: 'Joja member', key: 'jojaMember', locationTypes: ['CommunityCenter', 'Town']},
		{name: 'Leo moved to Stardew Valley', key: 'leoMoved', locationTypes: ['Mountain']},
		{name: 'Lost items', key: 'returnedDonations', locationTypes: ['ManorHouse']},
		{name: 'Magic book', key: 'seen418172', locationTypes: ['WizardHouse']},
		{name: 'Mailbox', key: 'islandWestFarmhouseMailbox', locationTypes: ['IslandWest']},
		{name: 'Marlon order active', key: 'acceptedSpecialOrderType_DesertFestivalMarlon', locationTypes: ['DesertFestival']},
		{name: 'Movie theater', key: 'ccMovieTheater', locationTypes: ['Town'], locations: ['AbandonedJojaMart']},
		{name: 'Movie theater replaces CC', key: 'ccMovieTheaterJoja', locationTypes: ['Town']},
		{name: 'Northern turtle moved', key: 'islandFirstParrot', locationTypes: ['IslandSouth']},
		{name: 'Open bedroom', key: 'renovationBedroomOpen', locationTypes: ['FarmHouse']},
		{name: 'Pam\'s house built', key: 'pamHouseUpgrade', locationTypes: ['Town']},
		{name: 'Parrot Express unlocked', key: 'parrotPlatformsUnlocked', locationTypes: ['IslandEast', 'IslandNorth', 'IslandSouth', 'IslandWest']},
		{name: 'Perfection achieved', key: 'farmEternal', locationTypes: ['Railroad']},
		{name: 'Picked up magic ink', key: 'hasPickedUpMagicInk', locations: ['WitchHut']},
		{name: 'Prize ticket available', key: 'hasSpecialOrderPrizeTickets', locationTypes: ['Town']},
		{name: 'Qi order active', key: 'acceptedSpecialOrderType_Qi', locations: ['QiNutRoom']},
		{name: 'Raccoon requests completed', key: 'timesFedRaccoons', locationTypes: ['Forest'], type: 'number', attrs: {min: '0', step: '1', value: '1'}},
		{name: 'Received Cannoli stardrop', key: 'cfStatue', locationTypes: ['Woods']},
		{name: 'Requests fulfilled', key: 'islandFarmCaveGourmandRequestsFulfilled', locationTypes: ['IslandFarmCave'], options: [0, 1, 2, 3]},
		{name: 'Resort open today', key: 'islandSouthResortOpenToday', locationTypes: ['IslandSouth']},
		{name: 'Resort restored', key: 'islandSouthResortRestored', locationTypes: ['IslandSouth']},
		{name: 'Sports room', key: 'saloonSportsRoom', locations: ['Saloon']},
		{name: 'Sebastian has frog', key: 'sebastianFrog', locationTypes: ['FarmHouse']},
		{name: 'Seen Grandpa\'s note', key: 'hasSeenGrandpaNote', locationTypes: ['Farm']},
		{name: 'Seen parrot event', key: 'seen463391', locations: ['HaleyHouse']},
		{name: 'Shrine completed', key: 'islandShrinePuzzleFinished', locationTypes: ['IslandShrine']},
		{name: 'Special order active', key: 'acceptedSpecialOrderType_', locationTypes: ['Town']},
		{name: 'Spouse/Roommate', key: 'spouse', locations: ['HaleyHouse'], locationTypes: ['Farm', 'FarmHouse', 'Sewer'], options: [
			[null, '(None)'],
			'Abigail',
			'Alex',
			'Elliott',
			'Emily',
			'Haley',
			'Harvey',
			'Krobus',
			'Leah',
			'Maru',
			'Penny',
			'Sam',
			'Sebastian',
			'Shane',
		]},
		{name: 'Ticket stand repaired', key: 'willyBoatTicketMachine', locationTypes: ['BoatTunnel']},
		{name: 'Town shortcuts', key: 'communityUpgradeShortcuts', locationTypes: [
			'Beach',
			'BeachNightMarket',
			'Forest',
			'Mountain',
			'Town',
		], locations: ['Backwoods']},
		{name: 'Trash Bear completed', key: 'trashBearDone', locationTypes: ['Forest', 'Town']},
		{name: 'Tree nut shot', key: 'islandNorthTreeNutShot', locationTypes: ['IslandNorth']},
		{name: 'Western turtle moved', key: 'islandSouthWesternTurtleMoved', locationTypes: ['IslandNorth', 'IslandSouth']},
		{name: 'Witch statue removed', key: 'witchStatueGone', locationTypes: ['Railroad']},
	];
	
	// Map data.
	
	lib.loadId = 0;
	lib.mapCache = {};
	
	lib.mapLocation = null;
	lib.locationPlan = null;
	lib.features = [];
	lib.location = null;
	lib.gameState = {}; // May be modified, but never reassigned.
	lib.festival = null;
	
	lib.timeOfDay = 600;
	
	lib.featureElements = [];
	lib.tileFeatures = {};
	lib.highlightTileIndices = new Set();
	lib.paths = {};
	lib.annotationWarps = [];
	lib.tool = 'inspect';
	lib.undoHistory = {};
	lib.activePlan = null;
	lib.selectionRect = null;
	lib.selectedFeatures = new Set();
	lib.floating = null;
	lib.clicking = false;
	lib.dragging = false;
	lib.lastHoverTileIndex = 0;
	lib.colorPickerState = null;
	lib.actions = [];
	lib.scrollX = -16;
	lib.scrollY = -16;
	lib.destTileX = null;
	lib.destTileY = null;
	lib.hoverTileX = null;
	lib.hoverTileY = null;
	
	// Populate some of the static cache.
	
	for (let y = -5; y <= 5; ++y) {
		for (let x = -5; x <= 5; ++x) {
			if (Math.abs(x) + Math.abs(y) <= 5) {
				lib.domainTemplates.beeHouse[5].push([x, y]);
			}
		}
	}
	
	for (let radius of [9, 17]) {
		for (let y = -radius; y <= radius; ++y) {
			for (let x = -radius; x <= radius; ++x) {
				if (Math.hypot(x, y) < radius) {
					lib.domainTemplates.scarecrow[radius].push([x, y]);
				}
			}
		}
	}
	
	for (let apothem of [1, 2, 3]) {
		for (let y = -apothem; y <= apothem; ++y) {
			for (let x = -apothem; x <= apothem; ++x) {
				lib.domainTemplates.sprinkler[apothem].push([x, y]);
				
				if (apothem === 1) {
					lib.domainTemplates.fruitTree[apothem].push([x, y]);
				}
			}
		}
	}
	
	for (let apothem of [8]) {
		for (let y = -apothem; y <= apothem; ++y) {
			for (let x = -apothem; x <= apothem; ++x) {
				lib.domainTemplates.junimoHut[apothem].push([x, y]);
			}
		}
	}
	
	core.addPageInitializer(function () {
		for (let wildTree of Object.values(core.content.Data.WildTrees)) {
			if (wildTree.SeedPlantable) {
				lib.wildTreeSeeds.push(wildTree.SeedItemId);
			}
		}
		
		for (let [id, floorPath] of Object.entries(core.content.Data.FloorsAndPaths)) {
			if (floorPath.ItemId != null && floorPath.ItemId !== '') {
				lib.floorPathItemLookup[floorPath.ItemId] = id;
			}
		}
		
		// Game state fields.
		
		{
			let groupHTML = {
				general: '',
				location: '',
			};
			let boolOptions = [[false, 'No'], [true, 'Yes']];
			
			for (let field of lib.gameStateFields) {
				// Note: Options can be dynamically populated (e.g., from data files) here if needed.
				
				// Field output.
				
				let locationDependent = (field.locations != null || field.locationContexts != null || field.locationTypes != null);
				let group = field.group ?? (locationDependent ? 'location' : 'general');
				
				let labelExtra = '';
				
				if (field.title != null) {
					labelExtra += ` title="${util.escapeHTML(field.title)}"`;
				}
				
				let html = '';
				html += `<label id="maps-gamestate-${util.escapeHTML(field.key)}" class="field-option maps-gamestate"${labelExtra}><span>\n`;
				
				switch (field.type ?? 'Select') {
				case 'Select':
					html += `<select name="maps-gamestate-${util.escapeHTML(field.key)}">\n`;
					
					for (let option of field.options ?? boolOptions) {
						if (!(option instanceof Array)) {
							option = [option, option + ''];
						}
						
						html += `<option value="${util.escapeHTML(JSON.stringify(option[0]))}">${util.escapeHTML(option[1])}</option>\n`;
					}
					
					html += '</select>';
					break;
				
				default: {
					let inputExtra = '';
					
					for (let [name, value] of Object.entries(field.attrs ?? {})) {
						inputExtra += ` ${name}="${util.escapeHTML(value)}"`;
					}
					
					html += `<input type="${util.escapeHTML(field.type)}" name="maps-gamestate-${util.escapeHTML(field.key)}"${inputExtra}>\n`;
				}}
				
				html += `</span>\n<span>${util.escapeHTML(field.name)}</span></label>\n`;
				groupHTML[group] += html;
			}
			
			for (let [group, html] of Object.entries(groupHTML)) {
				$(`#maps-gamestategroup-${group}`).html(html);
			}
		}
		
		// Event handlers.
		
		$('#sec-maps .maps-gamestate').find('input, select').on('change', function (e) {
			let key = this.name.replace(/^maps-gamestate-/, '');
			let value = lib.getGameStateInputValue(this);
			lib.setGameStates([[key, value]]);
		});
		
		$('html').on('keydown', function (e) {
			// Make sure the Maps tab is active.
			
			if (!$('#tab-maps').prop('checked') && $('#maps-map').length !== 0) {
				return;
			}
			
			// Don't react if a text input is focused.
			
			let element = document.activeElement;
			
			switch (element.tagName.toLowerCase()) {
			case 'input':
				switch (element.type) {
				case 'button':
				case 'checkbox':
				case 'file':
				case 'radio':
				case 'reset':
				case 'submit':
					// Allow our keyboard shortcuts on these.
					break;
				
				default:
					return;
				}
				
				break;
			
			case 'select':
			case 'textarea':
				return;
			}
			
			let modifier = (
				(e.altKey ? 0x01 : 0) |
				(e.ctrlKey ? 0x02 : 0) |
				(e.metaKey ? 0x04 : 0) |
				(e.shiftKey ? 0x08 : 0)
			);
			
			switch (modifier) {
			case 0x00: // No modifier.
				switch (e.which) {
				case 27: // Escape
					if (lib.floating != null) {
						e.preventDefault();
						lib.cancelFloating();
					}
					else if (lib.selectedFeatures.size > 0) {
						e.preventDefault();
						lib.clearSelection();
					}
					
					break;
				
				case 46: // Delete
					if (lib.floating != null || lib.selectedFeatures.size > 0) {
						e.preventDefault();
						lib.cancelFloating(true);
						lib.eraseSelection();
						lib.flushActions();
					}
					
					break;
				
				case 67: // KeyC
					e.preventDefault();
					$('#maps-tool-copy').trigger('click');
					break;
				
				case 69: // KeyE
					e.preventDefault();
					$('#maps-tool-erase').trigger('click');
					break;
				
				case 70: // KeyF
					e.preventDefault();
					$('#maps-button-fullView').trigger('click');
					break;
				
				case 73: // KeyI
					e.preventDefault();
					$('#maps-tool-inspect').trigger('click');
					break;
				
				case 77: // KeyM
					e.preventDefault();
					$('#maps-tool-move').trigger('click');
					break;
				
				case 80: // KeyP
					e.preventDefault();
					$('#maps-tool-paint').trigger('click');
					break;
				
				case 83: // KeyS
					e.preventDefault();
					$('#maps-tool-select').trigger('click');
					break;
				
				case 84: // KeyT
					e.preventDefault();
					$('#maps-tool-transform').trigger('click');
					break;
				}
				
				break;
			
			case 0x02: // Ctrl
				switch (e.which) {
				case 68: // KeyD
					if (lib.selectedFeatures.size > 0) {
						e.preventDefault();
						lib.clearSelection();
					}
					
					break;
				
				case 71: // KeyG
					e.preventDefault();
					$('#maps-option-showGrid').trigger('click');
					break;
				
				case 83: // KeyS
					e.preventDefault();
					$('#maps-button-save').trigger('click');
					break;
				
				case 89: // KeyY
					e.preventDefault();
					$('#maps-button-redo').trigger('click');
					break;
				
				case 90: // KeyZ
					e.preventDefault();
					$('#maps-button-undo').trigger('click');
					break;
				}
				
				break;
			
			case 0x08: // Shift
				switch (e.which) {
				case 67: // KeyC
					if (lib.floating != null || lib.selectedFeatures.size > 0) {
						e.preventDefault();
						
						if (lib.floating != null) {
							lib.copyFloating();
						}
						else {
							lib.copySelection();
						}
					}
					
					break;
				
				case 77: // KeyM
					if (lib.floating == null && lib.selectedFeatures.size > 0) {
						e.preventDefault();
						lib.moveSelection();
					}
					
					break;
				
				case 82: // KeyR
					if (lib.selectedFeatures.size > 0) {
						e.preventDefault();
						lib.transformSelection(null, true);
					}
					
					break;
				
				case 84: // KeyT
					if (lib.selectedFeatures.size > 0) {
						e.preventDefault();
						lib.transformSelection();
						lib.flushActions();
					}
					
					break;
				}
				
				break;
			
			case 0x0a: // Ctrl + Shift
				switch (e.which) {
				case 90: // KeyZ
					e.preventDefault();
					$('#maps-button-redo').trigger('click');
					break;
				}
				
				break;
			}
		});
		
		$('#sec-maps select.autobrowse').on('change', function (e) {
			lib.scrollX = -16;
			lib.scrollY = -16;
			core.baseUtil.updateTab('maps', false, +$('#maps-current').val());
		});
		
		$('#maps-catalogue-search').val('').on('input', function (e) {
			lib.searchCatalogue(this.value);
		});
		
		$('#maps-catalogue-search-button').on('click', function (e) {
			lib.searchCatalogue($('#maps-catalogue-search').val(), true);
		});
		
		$('#sec-maps .option').on('change', function (e) {
			let name = lib.getOptionInputName(this);
			let value = lib.getOptionInputValue(this);
			let oldValue = lib.options[name];
			
			lib.options[name] = value;
			lib.store('options', lib.options);
			
			switch (name) {
			case 'allowPlacingAnywhere':
				if (lib.location != null) {
					lib.updateCatalogueTabVisibilities(lib.location);
				}
				
				break;
			
			case 'cropSpawning':
			case 'cropSpawningIgnoreErasable':
			case 'farmable':
			case 'fishingDistance':
			case 'forageableSpawning':
			case 'forageableSpawningIgnoreErasable':
			case 'paddies':
			case 'showGrid':
			case 'diggable':
				lib.updateOverlay();
				break;
			
			case 'hideFront':
				$('#maps-row-canvases-front, #maps-layer-always-front').toggle(!value);
				break;
			
			case 'hideGrass':
				for (let feature of lib.features) {
					if (feature != null && feature.isGrass()) {
						lib.featureElements[feature.index].classList.toggle('hidden-grass', value);
					}
				}
				
				break;
			
			case 'hideSpecial':
				for (let feature of lib.features) {
					if (feature != null && feature.kind === 'special') {
						lib.featureElements[feature.index].classList.toggle('hidden-special', value);
					}
				}
				
				lib.drawAboveBuildingsSprites();
				lib.drawAboveAlwaysFrontSprites();
				
				break;
			
			case 'highlight-artifactSpot':
			case 'highlight-beeHouse':
			case 'highlight-forageable':
			case 'highlight-fruitTree':
			case 'highlight-harvest':
			case 'highlight-junimoHut':
			case 'highlight-scarecrow':
			case 'highlight-sprinkler':
				lib.updateHighlightTypes();
				lib.updateOverlay();
				break;
			
			case 'passClicksToSprites':
				$('#maps-map').toggleClass('pass-clicks-to-sprites', value);
				break;
			
			case 'showWarps':
				$('#maps-warps').toggle(value);
				break;
			
			case 'showSplashes':
				// TODO: Avoid a full update, if possible.
				core.baseUtil.updateTab('maps', false, +$('#maps-current').val());
				break;
			
			case 'sidebarRight':
				$('#maps-planner').toggleClass('sidebar-right', value);
				break;
			
			case 'undoSize':
				lib.resizeUndoHistory();
				break;
			
			case 'verboseInfo':
				lib.updateMapInfo();
				break;
			
			case 'zoom': {
				let map = lib.mapCache.map;
				let $mapBox = $('#maps-map-box');
				let mapBoxRect = $mapBox[0].getBoundingClientRect();
				
				// Get the current target scrollLeft/scrollTop values (at the old zoom).
				
				let scrollLeft = (lib.scrollX - (map.minX * map.tileWidth)) * oldValue;
				let scrollTop = (lib.scrollY - (map.minY * map.tileHeight)) * oldValue;
				
				// Try to zoom in/out at the center of the viewport.
				
				scrollLeft = (scrollLeft + mapBoxRect.width / 2) / oldValue * value - mapBoxRect.width / 2;
				scrollTop = (scrollTop + mapBoxRect.height / 2) / oldValue * value - mapBoxRect.height / 2;
				
				// Update the scroll tracking.
				
				lib.scrollX = scrollLeft / value + map.minX * map.tileWidth;
				lib.scrollY = scrollTop / value + map.minY * map.tileHeight;
				
				$mapBox
					.css('--zoom', value + '')
					.prop('scrollLeft', Math.max(0, scrollLeft))
					.prop('scrollTop', Math.max(0, scrollTop));
				$('#maps-zoom').css('image-rendering', (value < 1) ? 'smooth' : 'pixelated');
				break;
			}}
		});
		
		$('.maps-tool').on('click', function (e) {
			$(`.maps-feature.hover-${lib.tool}`).removeClass(`hover-${lib.tool}`);
			$('.maps-tool.active').removeClass('active');
			lib.tool = this.value;
			
			if (lib.floating != null) {
				lib.cancelFloating();
			}
			
			lib.updateSelectionRect(lib.hoverTileX, lib.hoverTileY);
			lib.closePicker();
			$(this).addClass('active');
		});
		
		$('#maps-button-undo').on('click', function (e) {
			lib.applyUndoEntry(lib.popUndoHistory());
		});
		
		$('#maps-button-redo').on('click', function (e) {
			lib.applyUndoEntry(lib.repushUndoHistory());
		});
		
		$('#maps-button-save').on('click', function (e) {
			$('#maps-save-plan').trigger('click');
		});
		
		$('#maps-button-fullView').on('click', function (e) {
			let $option = $('#maps-option-fullView');
			$option
				.prop('checked', !$option.prop('checked'))
				.trigger('change');
		});
		
		$('#maps-option-fullView')
			.prop('checked', false)
			.on('change', function (e) {
				$('body, #maps-planner').toggleClass('full-planner', this.checked);
				$('#maps-button-fullView').toggleClass('active', this.checked);
			});
		
		$('#maps-plan-name').on('input', function (e) {
			lib.activePlan.name = this.value;
			lib.setHasUnsavedChanges(true, true);
		});
		
		$('#maps-save-plan').on('click', function (e) {
			lib.cancelFloating();
			
			// Even if there we no changes from the initial state, make sure we
			// at least save the current map.
			
			lib.locationPlan.initialState = false;
			
			let plans = lib.retrievePlans();
			
			lib.packPlan(lib.activePlan).then(function (plan) {
				let index = plans.findIndex((checkPlan) => checkPlan.name === plan.name);
				
				if (index === -1) {
					plans.push(plan);
				}
				else {
					plans[index] = plan;
				}
				
				if (lib.store('plans', plans)) {
					lib.setHasUnsavedChanges(false, false);
					lib.regenPlanList();
				}
			});
		});
		
		$('#maps-export-plan').on('click', function (e) {
			lib.cancelFloating();
			lib.packPlan(lib.activePlan).then(function (plan) {
				let blob = new Blob([JSON.stringify(plan)], {type: 'application/json'});
				let link = document.createElement('a');
				link.href = URL.createObjectURL(blob);
				link.download = (plan.name || 'Plan') + '.json';
				link.click();
				URL.revokeObjectURL(link.href);
			});
		});
		
		$('#maps-import-plan').on('click', function (e) {
			lib.cancelFloating();
			
			if (!extension.hasUnsavedChanges || window.confirm('Discard unsaved changes?')) {
				let input = document.createElement('input');
				input.type = 'file';
				input.accept = '.json,application/json';
				input.onchange = function () {
					if (this.files[0]) {
						let reader = new FileReader();
						
						reader.onload = function () {
							try {
								let plan = JSON.parse(reader.result);
							}
							catch (e) {
								window.alert('The selected file is not a valid plan (Failed JSON parsing).');
							}
							
							if (!Object.hasOwn(plan, 'format')) {
								window.alert('The selected file is not a valid plan (Missing format version).');
							}
							else if (plan.format > lib.SUPPORTED_PLAN_FORMAT) {
								window.alert('The selected file requires a later version of the planner.');
							}
							else {
								lib.loadPlan(plan);
							}
						};
						
						reader.onerror = function () {
							window.alert('The selected file is not a valid plan (Reader error).');
						};
						
						reader.readAsText(this.files[0]);
					}
				};
				input.click();
			}
		});
		
		$('#maps-load-plan').on('click', function (e) {
			lib.cancelFloating();
			
			if (!extension.hasUnsavedChanges || window.confirm('Discard unsaved changes?')) {
				let $select = $('#maps-select-plan');
				let value = $select.val();
				let plan = null;
				
				switch (value) {
				case 'default':
					plan = lib.createPlan('default', 'Untitled Plan');
					break;
				
				case 'empty':
					plan = lib.createPlan('empty', 'Untitled Plan');
					break;
				
				default:
					if (value.startsWith('@')) {
						let name = value.substring(1);
						plan = lib.retrievePlans().find((plan) => plan.name === name);
					}
				}
				
				lib.loadPlan(plan ?? lib.createGamePlan());
			}
		});
		
		$('#maps-delete-plan').on('click', function (e) {
			let $select = $('#maps-select-plan');
			let value = $select.val();
			
			if (value.startsWith('@')) {
				let name = value.substring(1);
				
				if (window.confirm(`Delete the plan "${name}"? This cannot be undone.`)) {
					let plans = lib.retrievePlans();
					let index = plans.findIndex((plan) => plan.name === name);
					
					if (index !== -1) {
						plans.splice(index, 1);
					}
					
					if (lib.store('plans', plans)) {
						lib.regenPlanList();
					}
				}
			}
		});
		
		$('#maps-save-image').on('click', function (e) {
			lib.downloadImage();
		});
		
		$('#maps-color-picker .component').each(function () {
			let $input = $(this).find('input');
			let $range = $(this).find('.range');
			
			$range.on('mousedown', function (e) {
				if (e.buttons !== 1) {
					return;
				}
				
				core.dragHandler = {
					move: function (e) {
						let rect = $range[0].getBoundingClientRect();
						let pc = Math.max(0, Math.min(1, (e.clientX - rect.x) / rect.width));
						let value = Math.round((+$input.prop('max') - +$input.prop('min')) * pc + +$input.prop('min'));
						$input.val(value);
						lib.updatePickerComponents(true);
					},
				};
				core.dragHandler.move(e);
				e.preventDefault();
			})
			
			$input.on('input', function (e) {
				lib.updatePickerComponents(true);
			});
		});
		
		$('#maps-reset-color').on('click', function (e) {
			lib.pickBuildingPaintColor(null);
		});
		
		lib.regenPlanList();
		
		let optionDefaults = {
			'hideFrontNearCursor': true,
			'highlight-artifactSpot': true,
			'highlight-forageable': true,
			'highlight-harvest': true,
			'showSplashes': true,
			'showWarps': true,
			'highlightHover': true,
			'undoHistory': 50,
			'zoom': 1,
		};
		
		lib.options = lib.retrieve('options') ?? {};
		
		$('#maps-sec-options .option').each(function () {
			let name = lib.getOptionInputName(this);
			lib.options[name] ??= optionDefaults[name] ?? false;
			lib.setOptionInputValue(this, lib.options[name]);
		});
	});
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		// General save data.
		
		ext.specialOrderRulesActive = [];
		ext.secretNotesSeenCounts = [0, 0];
		ext.inventorySecretNoteCounts = [0, 0];
		
		// Game state derived from the save file. Note: The active game state is lib.gameState.
		
		ext.gameState = lib.newGameState;
		
		// Locations.
		
		ext.locations = {};
		ext.locationIds = [];
		
		// Predicted information for summaries.
		
		ext.artifactSpots = [];
		ext.dailyForageables = [];
		ext.forageables = [];
		
		++lib.loadId;
		lib.mapCache = {};
		lib.clearUndoHistory();
		lib.setHasUnsavedChanges(false, true);
		
		if (xmlDoc == null) {
			return;
		}
		
		$(xmlDoc).find(':root > player > secretNotesSeen > int').each(function () {
			let id = +this.textContent;
			let noteTypeIndex = (id < lib.GAME_JOURNAL_INDEX) ? 0 : 1;
			++ext.secretNotesSeenCounts[noteTypeIndex];
		});
		
		$(xmlDoc).find(':root > player > items > Item').each(function () {
			let details = util.getElementDetails(this);
			let item = core.items.resolve(details.itemId, details);
			let noteTypeIndex = {
				'(O)79': 0,
				'(O)842': 1,
			}[item.qualifiedItemId];
			
			if (noteTypeIndex != null) {
				++ext.inventorySecretNoteCounts[noteTypeIndex];
			}
		});
		
		$(xmlDoc).find(':root > specialOrders > SpecialOrder').each(function () {
			let specialRule = $(this).find('> specialRule').first().text();
			
			if (specialRule) {
				ext.specialOrderRulesActive.push(specialRule);
			}
		});
		
		let $gameLocations = $(xmlDoc).find(':root > locations > GameLocation');
		let locationDetails = new Map();
		
		$gameLocations.each(function () {
			let details = util.getElementDetails(this, {
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
			locationDetails.set(details.name, details);
		});
		
		let ccAreasComplete = [];
		
		for (let boolean of util.getDetailsMultiple(locationDetails.get('CommunityCenter')?.areasComplete, 'boolean')) {
			ccAreasComplete.push(boolean.$ === 'true');
		}
		
		let acceptedSpecialOrderTypes = [];
		
		$(xmlDoc).find(':root > acceptedSpecialOrderTypes > string').each(function () {
			acceptedSpecialOrderTypes.push(this.textContent);
		});
		
		ext.gameState = {
			abandonedJojaMartAccessible: common.player.mailReceived.has('abandonedJojaMartAccessible'),
			acceptedSpecialOrder: acceptedSpecialOrderTypes.includes(''),
			acceptedSpecialOrder_DesertFestivalMarlon: acceptedSpecialOrderTypes.includes('DesertFestivalMarlon'),
			acceptedSpecialOrder_Qi: acceptedSpecialOrderTypes.includes('Qi'),
			activatedGoldenParrot: $(xmlDoc).find(':root > activatedGoldenParrot').first().text() === 'true',
			beachBridgeFixed: locationDetails.get('Beach')?.bridgeFixed === 'true',
			ccAreasCompletePantry: ccAreasComplete[0] === true,
			ccAreasCompleteCraftsRoom: ccAreasComplete[1] === true,
			ccAreasCompleteFishTank: ccAreasComplete[2] === true,
			ccAreasCompleteBoilerRoom: ccAreasComplete[3] === true,
			ccAreasCompleteVault: ccAreasComplete[4] === true,
			ccAreasCompleteBB: ccAreasComplete[5] === true,
			ccCraftsRoom: common.player.mailReceived.has('ccCraftsRoom'),
			ccFishTank: common.player.mailReceived.has('ccFishTank'),
			ccIsComplete: common.player.mailReceived.has('ccIsComplete'),
			ccMovieTheater: common.player.mailReceived.has('ccMovieTheater'),
			ccMovieTheaterJoja: common.player.mailReceived.has('ccMovieTheaterJoja'),
			cfStatue: common.player.mailReceived.has('CF_Statue'),
			checkedBulletinOnce: common.player.mailReceived.has('checkedBulletinOnce'),
			checkedMonsterBoard: common.player.mailReceived.has('checkedMonsterBoard'),
			checkedRaccoonStump: common.player.mailReceived.has('checkedRaccoonStump'),
			communityUpgradeShortcuts: common.player.mailReceived.has('communityUpgradeShortcuts'),
			currentGemBirdIndex: +($(xmlDoc).find(':root > currentGemBirdIndex').first().text() || 0),
			dayOfMonth: common.dayOfMonth,
			farmEternal: common.player.mailReceived.has('Farm_Eternal'),
			farmHouseCribStyle: +(locationDetails.get('FarmHouse')?.cribStyle ?? 0),
			farmType: common.farmType,
			forestStumpFixed: locationDetails.get('Forest')?.stumpFixed === 'true',
			goldenClocksTurnedOff: false, // Currently (version 1.6.15), the game doesn't actually save this state.
			goldenWalnutsFound: +($(xmlDoc).find(':root > goldenWalnutsFound').first().text() || 0),
			golemGrave: common.worldStateIds.has('golemGrave'),
			greenhouseUnlocked: save.greenhouseUnlocked,
			greenhouseMoved: locationDetails.get('Farm')?.greenhouseMoved === 'true',
			hasAchievements: $(xmlDoc).find(':root > player > achievements > int').length > 0,
			hasPickedUpMagicInk: common.player.mailReceived.has('hasPickedUpMagicInk'),
			hasSeenGrandpaNote: common.player.mailReceived.has('hasSeenGrandpaNote'),
			hasSpecialOrderPrizeTickets: (common.player.stats.specialOrderPrizeTickets ?? 0) > 0,
			henchmanGone: common.player.mailReceived.has('henchmanGone'),
			houseUpgradeLevel: common.player.houseUpgradeLevel,
			islandEastBananaShrineComplete: locationDetails.get('IslandEast')?.bananaShrineComplete?.boolean === 'true',
			islandFarmCaveGourmandRequestsFulfilled: +(locationDetails.get('IslandFarmCave')?.gourmandRequestsFulfilled ?? 0),
			islandFieldOfficeBatRestored: locationDetails.get('IslandFieldOffice')?.batRestored === 'true',
			islandFieldOfficeCenterSkeletonRestored: locationDetails.get('IslandFieldOffice')?.centerSkeletonRestored === 'true',
			islandFieldOfficeFrogRestored: locationDetails.get('IslandFieldOffice')?.frogRestored === 'true',
			islandFieldOfficePlantsRestoredLeft: locationDetails.get('IslandFieldOffice')?.plantsRestoredLeft === 'true',
			islandFieldOfficePlantsRestoredRight: locationDetails.get('IslandFieldOffice')?.plantsRestoredRight === 'true',
			islandFieldOfficeSnakeRestored: locationDetails.get('IslandFieldOffice')?.snakeRestored === 'true',
			islandFirstParrot: common.player.mailReceived.has('Island_FirstParrot'),
			islandNorthBridgeFixed: locationDetails.get('IslandNorth')?.bridgeFixed === 'true',
			islandNorthCaveOpened: locationDetails.get('IslandNorth')?.caveOpened === 'true',
			islandNorthTraderActivated: locationDetails.get('IslandNorth')?.traderActivated === 'true',
			islandNorthTreeNutShot: locationDetails.get('IslandNorth')?.treeNutShot === 'true',
			islandShrinePuzzleFinished: locationDetails.get('IslandShrine')?.puzzleFinished === 'true',
			islandSouthResortRestored: locationDetails.get('IslandSouth')?.resortRestored === 'true',
			islandSouthResortOpenToday: locationDetails.get('IslandSouth')?.resortOpenToday === 'true',
			islandSouthWesternTurtleMoved: locationDetails.get('IslandSouth')?.westernTurtleMoved === 'true',
			islandWestCave1Completed: locationDetails.get('IslandWestCave1')?.completed === 'true',
			islandWestFarmObelisk: locationDetails.get('IslandWest')?.farmObelisk === 'true',
			islandWestFarmhouseMailbox: locationDetails.get('IslandWest')?.farmhouseMailbox === 'true',
			islandWestFarmhouseRestored: locationDetails.get('IslandWest')?.farmhouseRestored === 'true',
			jojaMember: common.player.mailReceived.has('JojaMember'),
			leoMoved: (common.player.mailReceived.has('leoMoved') || common.player.mailReceived.has('leoMoved%&NL&%')),
			mailboxHasEntries: $(xmlDoc).find(':root > player > mailbox > string').length > 0,
			maxItems: +($(xmlDoc).find(':root > player > maxItems').first().text() || 12),
			pamHouseUpgrade: common.player.mailReceived.has('pamHouseUpgrade'),
			parrotPlatformsUnlocked: $(xmlDoc).find(':root > parrotPlatformsUnlocked').first().text() === 'true',
			raccoonTreeFallen: common.player.mailReceived.has('raccoonTreeFallen'),
			renovationBedroomOpen: common.player.mailReceived.has('renovation_bedroom_open'),
			renovationCornerOpen: common.player.mailReceived.has('renovation_corner_open'),
			renovationCubbyOpen: common.player.mailReceived.has('renovation_cubby_open'),
			renovationDiningOpen: common.player.mailReceived.has('renovation_dining_open'),
			renovationDiningRoomWallOpen: common.player.mailReceived.has('renovation_diningroomwall_open'),
			renovationExtendedCornerOpen: common.player.mailReceived.has('renovation_extendedcorner_open'),
			renovationFarUpperRoomOpen: common.player.mailReceived.has('renovation_farupperroom_open'),
			renovationSouthernOpen: common.player.mailReceived.has('renovation_southern_open'),
			returnedDonations: $(xmlDoc).find(':root > returnedDonations > Item').length > 0,
			saloonSportsRoom: common.worldStateIds.has('saloonSportsRoom'),
			sebastianFrog: common.worldStateIds.has('sebastianFrog'),
			seasonNumber: common.seasonNumber,
			seen191393: common.player.eventsSeen.has('191393'),
			seen418172: common.player.eventsSeen.has('418172'),
			seen463391: common.player.eventsSeen.has('463391'),
			skullShrineActivated: $(xmlDoc).find(':root > skullShrineActivated').first().text() === 'true',
			spouse: common.player.isMarriedOrRoommates ? common.player.spouse : null,
			timesFedRaccoons: +($(xmlDoc).find(':root > timesFedRaccoons').first().text() || 0),
			trashBearDone: common.player.mailReceived.has('trashBearDone'),
			weatherIsRainingDefault: common.locationWeather.Default.isRaining,
			weatherIsRainingDesert: common.locationWeather.Desert.isRaining,
			weatherIsRainingIsland: common.locationWeather.Island.isRaining,
			willyBoatAnchor: common.player.mailReceived.has('willyBoatAnchor'),
			willyBoatFixed: common.player.mailReceived.has('willyBoatFixed'),
			willyBoatHull: common.player.mailReceived.has('willyBoatHull'),
			willyBoatTicketMachine: common.player.mailReceived.has('willyBoatTicketMachine'),
			witchStatueGone: (locationDetails.get('Railroad')?.witchStatueGone === 'true' || common.player.mailReceived.has('witchStatueGone')),
			woodsHasUnlockedStatue: locationDetails.get('Woods')?.hasUnlockedStatue === 'true',
			year: common.year,
		};
		lib.setActivePlan(lib.createGamePlan());
		
		// Initialize all the non-instanced locations.
		
		for (let details of locationDetails.values()) {
			let location = new Location(core, details.name, details);
			ext.locations[location.id] = location;
			ext.locationIds.push(location.id);
		}
		
		// Load the features. This logic may need to reference other non-instanced locations.
		
		$gameLocations.each(function () {
			let locationId = $(this).find('> name').first().text();
			let location = ext.locations[locationId];
			
			let featureContext = {
				core: core,
				location: location,
				features: location.saveFeatures,
			};
			
			fBuildings.loadXML(this, featureContext);
			fFurniture.loadXML(this, featureContext);
			fLargeTerrainFeatures.loadXML(this, featureContext);
			fMuseumPieces.loadXML(this, featureContext);
			fObjects.loadXML(this, featureContext);
			fResourceClumps.loadXML(this, featureContext);
			fTerrainFeatures.loadXML(this, featureContext);
		});
		
		let locationList = [];
		
		for (let locationId of ext.locationIds) {
			locationList.push({
				name: locationId,
				title: ext.locations[locationId].displayName,
			});
		}
		
		locationList.sort(function(a, b) {
			return (b.name === 'Farm') - (a.name === 'Farm') ||
				a.title.localeCompare(b.title) ||
				a.name.localeCompare(b.name);
		});
		
		for (let location of locationList) {
			let option = $('<option></option>')
				.prop('value', location.name)
				.text(`${location.title} (${location.name})`)
				.prop('selected', location.name === 'Farm');
			$('#maps-location').append(option);
		}
		
		// Prepare planner catalogue.
		
		let catalogueFeatureContext = {
			core: core,
			location: ext.locations.Farm,
			features: [],
		};
		
		catalogue.loadCatalogue(catalogueFeatureContext);
		
		let tabs = {};
		
		for (let feature of catalogueFeatureContext.features) {
			let catData = feature.meta.catalogueData;
			
			if (catData.tab != null) {
				if (!Object.hasOwn(tabs, catData.tab)) {
					tabs[catData.tab] = {};
				}
				
				if (!Object.hasOwn(tabs[catData.tab], catData.group)) {
					tabs[catData.tab][catData.group] = [];
				}
				
				let json = JSON.stringify({
					kind: feature.kind,
					details: feature.details,
				});
				
				feature.index = -1;
				lib.updateFeature(feature, catalogueFeatureContext.location);
				lib.drawFeature(feature, catalogueFeatureContext.location);
				lib.recalculateFeature(feature, true);
				let html = lib.getFeatureHTML(feature, true);
				
				let minX = 0;
				let minY = 0;
				let maxX = 0;
				let maxY = 0;
				
				for (let sprite of feature.sprites) {
					if (!sprite.isLight) {
						minX = Math.min(minX, sprite.x);
						minY = Math.min(minY, sprite.y);
						maxX = Math.max(maxX, sprite.x + sprite.width * sprite.scale);
						maxY = Math.max(maxY, sprite.y + sprite.height * sprite.scale);
					}
				}
				
				let $button = $(`<button class="maps-catalogue-item" data-feature="${util.escapeHTML(json)}"><span style="padding: ${-minY}px 0 0 ${-minX}px; width: ${maxX}px; height: ${maxY}px;">${html}</span><span>${util.escapeHTML(catData.name ?? feature.meta.name)}</span></button>`);
				lib.initFeatureElement(feature, $button.find('.maps-feature')[0]);
				tabs[catData.tab][catData.group].push($button[0]);
			}
		}
		
		lib.updateCatalogueTabs(tabs);
	});
	
	core.addSummaryWriter('maps.artifactSpots', 'Artifact Spots', function (wasChanged) {
		let output = '';
		output += '<h3>Artifact Spots</h3>';
		output += '<div class="summary-list">';
		
		for (let spot of ext.artifactSpots) {
			let dropsHTML = [];
			
			for (let dayDrops of spot.drops) {
				let dayDropsHTML = [];
				
				for (let drop of dayDrops) {
					dayDropsHTML.push(mapsUtil.getDropHTML(core, drop));
				}
				
				dropsHTML.push(dayDropsHTML.join(', '));
			}
			
			output += '<span class="result">' + spot.locationName + ' (' + spot.x + ', ' + spot.y + '): ' + dropsHTML.join(' &rarr; ') + '</span><br>';
		}
		
		output += '</div>';
		return output;
	});
	
	core.addSummaryWriter('maps.spawnedObjects', 'Spawned Objects', function (wasChanged) {
		let output = '';
		output += '<h3>Spawned Objects</h3>';
		output += '<div class="summary-list" style="column-count: 6;">';
		
		for (let forageable of ext.forageables) {
			if (!forageable.isWeekly) {
				let dropsHTML = [];
				
				for (let drop of forageable.drops) {
					dropsHTML.push((drop === null) ? '' : mapsUtil.getDropHTML(core, drop));
				}
				
				output += '<span class="result">' + forageable.locationName + ' (' + forageable.x + ', ' + forageable.y + '): ' + dropsHTML.join(' &rarr; ') + '</span><br>';
			}
		}
		
		output += '</div>';
		return output;
	});
	
	core.addSummaryWriter('maps.weeklyForageables', 'Weekly Forageables', function (wasChanged) {
		let output = '';
		output += '<h3>Weekly Forageables</h3>';
		output += '<div class="summary-list">';
		
		for (let forageable of ext.forageables) {
			if (forageable.isWeekly) {
				let dropsHTML = [];
				
				for (let drop of forageable.drops) {
					dropsHTML.push((drop === null) ? '' : mapsUtil.getDropHTML(core, drop));
				}
				
				output += '<span class="result">' + forageable.locationName + ' (' + forageable.x + ', ' + forageable.y + '): ' + dropsHTML.join(' &rarr; ') + '</span><br>';
			}
		}
		
		output += '</div>';
		return output;
	});
	
	core.addSummaryWriter('maps.dailyForageables', 'Daily Forageables', function (wasChanged) {
		let output = '';
		output += '<h3>Daily Forageables</h3>';
		output += '<div class="summary-list" style="column-count: 6;">';
		
		for (let forageable of ext.dailyForageables) {
			let dropsHTML = [];
			
			for (let drop of forageable.drops) {
				dropsHTML.push(mapsUtil.getDropHTML(core, drop));
			}
			
			output += '<span class="result">' + forageable.locationName + ' (' + forageable.x + ', ' + forageable.y + '): ' + dropsHTML.join(' &rarr; ') + '</span><br>';
		}
		
		output += '</div>';
		return output;
	});
	
	core.addPredictor('maps', 'Maps', function (isSearch, offset, extra) {
		// The loadId needs to be checked at the beginning of each state-
		// changing asynchronously-called operation in the loading process, to
		// see if a later load superseded this one.
		
		let localLoadId = ++lib.loadId;
		
		lib.cancelFloating();
		
		let output = '';
		let locationId = $('#maps-location').val();
		let location = ext.locations[locationId];
		
		if (typeof offset === 'undefined' || offset == 0) {
			offset = 600;
		}
		
		let timeChanged = (offset !== lib.timeOfDay);
		lib.timeOfDay = offset;
		$('#maps-prev-time').val((offset % 100 < 10) ? offset - 50 : offset - 10);
		$('#maps-next-time').val((offset % 100 >= 50) ? offset + 50 : offset + 10);
		$('#maps-prev-hour').val(offset - 100);
		$('#maps-next-hour').val(offset + 100);
		$('#maps-current, #maps-predict-button').val(offset);
		$('#maps-reset').val('reset');
		
		$('#maps-prev-hour').prop("disabled", offset < 700);
		$('#maps-prev-time').prop("disabled", offset < 610);
		$('#maps-next-hour').prop("disabled", offset > 2500);
		$('#maps-next-time').prop("disabled", offset > 2550);
		
		$('#maps-plan-name').val(lib.activePlan.name);
		
		lib.updateCatalogueTabVisibilities(location);
		
		lib.festival = null;
		let festivalDate = util.getSeasonName(lib.gameState.seasonNumber) + lib.gameState.dayOfMonth;
		
		if (Object.hasOwn(lib.festivals, festivalDate)) {
			let festival = lib.festivals[festivalDate];
			
			if (
				festival.locationId === locationId &&
				offset >= festival.start &&
				offset < festival.end
			) {
				lib.festival = lib.festivals[festivalDate];
			}
		}
		
		let mapPath = lib.festival?.mapPath ?? location.getMapPath();
		
		if (
			lib.mapCache.locationId === locationId &&
			mapPath === lib.mapCache.defaultMapPath &&
			!lib.mapCache.forceFullUpdate
		) {
			if (location.isTimeSensitiveMap() && timeChanged) {
				lib.mapCache.forceMapUpdate = true;
			}
			
			// Even though we have no dependencies to load, we should still call
			// updateMap() asynchronously for behavioral consistency.
			
			window.setTimeout(function () {
				if (lib.loadId !== localLoadId) {
					// Superseded by a later update.
					return;
				}
				
				lib.updateMap();
			}, 0);
		}
		else {
			$('#async-maps').empty().addClass('loading');
			
			if (lib.mapCache?.imageBitmaps != null) {
				for (let imageBitmap of lib.mapCache.imageBitmaps.values()) {
					if (imageBitmap != null) {
						imageBitmap.close();
					}
				}
			}
			
			lib.mapCache = {
				defaultMapPath: mapPath,
				sourceMaps: {},
				imageBitmaps: new Map(),
				
				// Note: The absence of a locationId indicates that the map's
				// dependencies haven't finished loading yet.
			};
			
			let mapFiles = [];
			
			mapFiles.push({
				url: util.contentURI(`${mapPath}.tmx`),
				path: mapPath,
			});
			
			for (let subMapPath of location.getSubMapPaths()) {
				mapFiles.push({
					url: util.contentURI(`${subMapPath}.tmx`),
					path: subMapPath,
				});
			}
			
			let filesRemaining = mapFiles.length;
			
			let fileLoaded = function () {
				--filesRemaining;
				
				if (filesRemaining === 0) {
					lib.mapCache.locationId = locationId;
					
					for (let subMapFile of mapFiles) {
						lib.mapCache.sourceMaps[subMapFile.path] = subMapFile.map;
					}
					
					for (let [key, visible] of lib.getGameStateKeyVisibilities(location)) {
						$(`#maps-gamestate-${key}`).toggle(visible);
					}
					
					lib.updateMap();
					$('#async-maps').removeClass('loading');
				}
			};
			
			let loadImageBitmap = function (url) {
				if (!lib.mapCache.imageBitmaps.has(url)) {
					lib.mapCache.imageBitmaps.set(url, null);
					++filesRemaining;
					
					window.fetch(url)
						.then(function (response) {return response.blob();})
						.then(function (blob) {return window.createImageBitmap(blob);})
						.then(function (imageBitmap) {
							if (lib.loadId !== localLoadId) {
								// Superseded by a later update.
								imageBitmap.close();
								return;
							}
							
							lib.mapCache.imageBitmaps.set(url, imageBitmap);
							fileLoaded();
						});
				}
			};
			
			loadImageBitmap(util.contentURI('LooseSprites/Cursors.png'));
			
			if (location.isDecoratable()) {
				for (let entry of core.content.Data.AdditionalWallpaperFlooring) {
					loadImageBitmap(util.contentURI(util.normalizeTexture(entry.Texture) + '.png'));
				}
			}
			
			// Load the map file and any submap files.
			
			for (let mapFile of mapFiles) {
				window.fetch(mapFile.url)
					.then(function (response) {return response.text();})
					.then(function (xml) {
						if (lib.loadId !== localLoadId) {
							// Superseded by a later update.
							return;
						}
						
						let xmlDoc = $.parseXML(xml);
						mapFile.map = new TileMap(mapFile.path, lib.mapCache.sourceMaps);
						mapFile.map.loadXMLDoc(xmlDoc, location);
						xmlDoc.documentElement.replaceChildren();
						
						// Also load the tilesheet image files.
						
						for (let tileSheet of mapFile.map.tileSheets) {
							loadImageBitmap(tileSheet.url);
						}
						
						fileLoaded();
					});
			}
		}
		
		output += '<table class="current-time"><thead><tr><th id="maps-current-time">';
		output += (((Math.floor(lib.timeOfDay / 100) - 1) % 12) + 1) + ':' + ((lib.timeOfDay % 100) + '').padStart(2, '0') + ' ' + ((lib.timeOfDay < 1200 || lib.timeOfDay >= 2400) ? 'am' : 'pm');
		output += '</th></tr></thead></table>';
		
		return output;
	});
	
	lib.updateMap = function () {
		if (lib.mapCache.locationId == null) {
			// The map files haven't been loaded. There might be a reload in progress.
			
			return;
		}
		
		let searchType = $('#maps-search-type').val();
		let hour = Math.floor(lib.timeOfDay / 100) % 24;
		let minute = lib.timeOfDay % 100;
		let xm = (hour < 12 || hour >= 24) ? 'am' : 'pm';
		lib.options = {};
		
		$('#maps-sec-options .option').each(function () {
			lib.options[lib.getOptionInputName(this)] = lib.getOptionInputValue(this);
		});
		
		lib.store('options', lib.options);
		lib.updateHighlightTypes();
		$('#maps-planner').toggleClass('sidebar-right', lib.options.sidebarRight == true);
		lib.location = ext.locations[lib.mapCache.locationId];
		let needsMapInit = (lib.mapCache.map == null || lib.mapCache.forceMapUpdate);
		let needsLocationInit = !Object.hasOwn(lib.activePlan.data.locationPlans, lib.location.id);
		let effectivePlanType = null;
		
		if (lib.festival !== null) {
			needsLocationInit = needsMapInit;
			effectivePlanType = 'default';
			
			if (needsLocationInit) {
				lib.locationPlan = new LocationPlan(lib.location);
			}
		}
		else if (needsLocationInit) {
			lib.locationPlan = new LocationPlan(lib.location);
			lib.activePlan.data.locationPlans[lib.location.id] = lib.locationPlan;
		}
		else {
			lib.locationPlan = lib.activePlan.data.locationPlans[lib.location.id];
		}
		
		effectivePlanType ??= lib.activePlan.data.type;
		
		if (needsMapInit) {
			let mapPath = lib.mapCache.defaultMapPath;
			lib.mapCache.map = new TileMap(mapPath, lib.mapCache.sourceMaps);
			lib.mapCache.map.importMap(lib.mapCache.sourceMaps[mapPath]);
			lib.mapLocation = new MapLocation(core, lib.mapCache.map, lib.locationPlan, lib.gameState);
			lib.mapCache.hasOutput = false;
			lib.searchCatalogue($('#maps-catalogue-search').val(), false);
			delete lib.mapCache.forceMapUpdate;
		}
		
		let map = lib.mapCache.map;
		
		if (needsLocationInit) {
			switch (effectivePlanType) {
			case 'game':
				lib.locationPlan.features = [];
				
				for (let feature of lib.location.saveFeatures) {
					let clone = Feature.from(feature);
					lib.updateFeature(clone);
					lib.locationPlan.features.push(clone);
				}
				
				for (let item of util.getDetailsMultiple(lib.location.details.appliedWallpaper?.SerializableDictionaryOfStringString, 'item')) {
					lib.locationPlan.appliedWallpaper[item.key.string] = item.value.string;
				}
				
				for (let item of util.getDetailsMultiple(lib.location.details.appliedFloor?.SerializableDictionaryOfStringString, 'item')) {
					lib.locationPlan.appliedFloor[item.key.string] = item.value.string;
				}
				
				break;
			
			default:
				lib.mapLocation.addInitialFeatures(effectivePlanType !== 'default');
			}
		}
		
		for (let key of Object.keys(lib.locationPlan.featureLookup)) {
			lib.locationPlan.featureLookup[key] = {};
		}
		
		lib.features = lib.locationPlan.features;
		lib.paths = {};
		lib.clearSelection();
		lib.selectionRect = null;
		lib.updateSelectionRect(null, null);
		lib.clicking = false;
		lib.dragging = false;
		let undoHistory = Object.hasOwn(lib.undoHistory, lib.location.id) ? lib.undoHistory[lib.location.id] : null;
		
		// Remove temporal features.
		
		for (let i = 0; i < lib.features.length; ++i) {
			let feature = lib.features[i];
			
			if (feature != null && feature.meta.temporal) {
				lib.features.splice(i--, 1);
				
				if (undoHistory) {
					// Adjust undo history to account for the temporal feature we just removed.
					
					for (let entry of undoHistory.entries) {
						if (entry != null) {
							for (let action of entry) {
								if (action.index > i) {
									--action.index;
								}
							}
						}
					}
				}
			}
		}
		
		// Make modifications based on the location and game state.
		
		if (!lib.mapCache.hasOutput && lib.festival === null) {
			lib.mapLocation.makeMapModifications(lib.timeOfDay);
		}
		
		lib.mapLocation.drawMapSprites(lib.timeOfDay, lib.festival);
		
		// Fish splash prediction.
		
		lib.mapCache.splashes ??= lib.mapLocation.determineSplash(lib.location.id);
		
		if (lib.options.showSplashes) {
			for (let splash of lib.mapCache.splashes) {
				if (splash.startTime <= lib.timeOfDay && splash.endTime > lib.timeOfDay) {
					let feature = Feature.createTemporal(splash.x, splash.y);
					lib.features.push(feature);
					feature.meta.name = splash.frenzy ? 'Fish frenzy' : 'Fish splashing';
					let note =
						Math.floor(splash.startTime / 100) + ':' + (splash.startTime % 100 + '').padStart(2, '0') +
						'-' + Math.floor(splash.endTime / 100) + ':' + (splash.endTime % 100 + '').padStart(2, '0');
					feature.addNote(note, Feature.NOTE_SPACE);
					feature.meta.domainType = 'special';
					feature.drawSprite(util.tx.objectSpriteSheet, [feature.tileX * 64, feature.tileY * 64], new util.Rect(304, 448, 16, 16), null, 0, null, 4, Sprite.EF_NONE, feature.tileY * 64 / 10000);
				}
			}
		}
		
		if (undoHistory) {
			// Adjust undo history to account for any temporal features we just added.
			
			for (let [index, feature] of lib.features.entries()) {
				if (feature != null && feature.meta.temporal) {
					for (let entry of undoHistory.entries) {
						if (entry != null) {
							for (let action of entry) {
								if (action.index >= index) {
									++action.index;
								}
							}
						}
					}
				}
			}
		}
		
		if (!lib.mapCache.hasOutput) {
			if (Object.hasOwn(lib.undoHistory, lib.location.id)) {
				let history = lib.undoHistory[lib.location.id];
				$('#maps-button-undo').toggleClass('disabled', history.position === history.start);
				$('#maps-button-redo').toggleClass('disabled', history.position === history.end);
			}
			else {
				$('#maps-button-undo, #maps-button-redo').addClass('disabled');
			}
			
			let frontLayerIndex = map.layerList.length;
			let alwaysFrontLayerIndex = map.layerList.length;
			
			for (let i = 0; i < frontLayerIndex; ++i) {
				if (/^(?:Front|AlwaysFront)/.test(map.layerList[i].name)) {
					frontLayerIndex = i;
					break;
				}
			}
			
			for (let i = frontLayerIndex; i < alwaysFrontLayerIndex; ++i) {
				if (/^(?:AlwaysFront)/.test(map.layerList[i].name)) {
					alwaysFrontLayerIndex = i;
					break;
				}
			}
			
			lib.mapCache.annotations = {};
			let output = '';
			
			let imageRendering = (lib.options.zoom < 1) ? 'smooth' : 'pixelated';
			output += `<div id="maps-map-box" style="--zoom: ${lib.options.zoom}; padding: calc(${-map.minY * map.tileHeight}px * var(--zoom)) calc(${(map.maxX - map.width) * map.tileWidth}px * var(--zoom)) calc(${(map.maxY - map.height) * map.tileHeight}px * var(--zoom)) calc(${-map.minX * map.tileWidth}px * var(--zoom));">`;
			output += `<div id="maps-center" style="width: calc(${map.width * map.tileWidth}px * var(--zoom)); height: calc(${map.height * map.tileHeight}px * var(--zoom));">`;
			output += `<div id="maps-zoom" style="width: ${map.width * map.tileWidth}px; height: ${map.height * map.tileHeight}px; image-rendering: ${imageRendering};">`;
			output += '<div id="maps-backgrounds"></div>';
			output += `<div id="maps-map">`;
			
			// Back and Buildings layers.
			
			output += '<div id="maps-layer-back" class="maps-layer maps-layer-back">';
			output += `<canvas id="maps-canvas-back" width="${map.width * map.tileWidth}" height="${map.height * map.tileHeight}"></canvas>`;
			output += '<div id="maps-sprites-back"></div>';
			output += '</div>';
			
			// Front layers.
			
			output += '<div id="maps-layer-front" class="maps-layer maps-layer-front">';
			output += '<div id="maps-sprites-front"></div>';
			output += '<div id="maps-row-canvases-front"></div>';
			output += '</div>';
			
			// AlwaysFront layers.
			
			output += '<div id="maps-layer-always-front" class="maps-layer maps-layer-always-front">';
			output += `<canvas id="maps-canvas-always-front" width="${map.width * map.tileWidth}" height="${map.height * map.tileHeight}"></canvas>`;
			output += '<div id="maps-sprites-always-front"></div>';
			output += '</div>';
			
			// Planner overlays.
			
			output += '<div id="maps-selection"></div>';
			output += '<div id="maps-floating-container">';
			output += '<div id="maps-floating-feature"></div>';
			output += '</div>'; // End of #maps-floating-container
			output += '<div id="maps-overlay"></div>';
			output += '<div id="maps-warps" class="warps"></div>';
			
			output += '</div>'; // End of #maps-map
			output += '</div>'; // End of #maps-zoom
			output += '</div>'; // End of #maps-center
			output += '</div>'; // End of #maps-map-box
			
			$('#async-maps').html(output);
			$('#maps-map').toggleClass('pass-clicks-to-sprites', lib.options.passClicksToSprites);
			lib.drawLayers(document.getElementById('maps-canvas-back'), ['Back', 'Buildings'], lib.mapCache.annotations);
			lib.drawLayers(document.getElementById('maps-row-canvases-front'), ['Front'], lib.mapCache.annotations);
			lib.drawLayers(document.getElementById('maps-canvas-always-front'), ['AlwaysFront'], lib.mapCache.annotations);
			lib.mapCache.frontRows = [];
			
			$('#maps-row-canvases-front > canvas').each(function () {
				lib.mapCache.frontRows.push({
					y: +this.dataset.y,
					layerDepth: +this.dataset.layerDepth,
					element: this,
				});
			});
			
			$('#maps-map-box').on('scrollend', function () {
				lib.scrollX = this.scrollLeft / lib.options.zoom + lib.mapCache.map.minX * lib.mapCache.map.tileWidth;
				lib.scrollY = this.scrollTop / lib.options.zoom + lib.mapCache.map.minY * lib.mapCache.map.tileHeight;
			});
			
			lib.updateMapInfo();
			lib.mapCache.hasOutput = true;
		}
		
		let backgroundHTML = '';
		
		for (let style of lib.mapLocation.getBackgroundStyles(lib.timeOfDay)) {
			backgroundHTML += `<div class="maps-layer" style="${util.escapeHTML(style)}"></div>`;
		}
		
		$('#maps-backgrounds').html(backgroundHTML);
		
		$('#maps-layer-always-front').css('mask-image', 'none');
		$('#maps-row-canvases-front > canvas').css('mask-image', 'none');
		$('#maps-out-inspect').addClass('hidden');
		
		lib.tileObscuredBy = new Array(map.width * map.height);
		
		for (let i = 0; i < lib.tileObscuredBy.length; ++i) {
			lib.tileObscuredBy[i] = [];
		}
		
		$('#maps-sprites-front').empty();
		lib.featureWarps = [];
		lib.featuresByDomainType = {};
		
		for (let [index, feature] of lib.features.entries()) {
			if (feature != null) {
				feature.index = index;
				lib.drawFeature(feature);
				lib.attachFeature(feature);
			}
		}
		
		lib.drawAboveBuildingsSprites();
		lib.drawAboveAlwaysFrontSprites();
		
		let overlayOutput = '';
		overlayOutput += `<table class="maps-layer" id="maps-layer-top">`;
		lib.annotationWarps = [];
		
		for (let y = 0, tileIndex = 0; y < map.height; ++y) {
			overlayOutput += '<tr>';
			
			for (let x = 0; x < map.width; ++x, ++tileIndex) {
				if (Object.hasOwn(lib.mapCache.annotations, tileIndex)) {
					for (let annotation of lib.mapCache.annotations[tileIndex]) {
						let value = annotation.value;
						
						switch (annotation.type) {
						case 'Action':
							switch (value[0]) {
							case 'BoatTicket':
								lib.annotationWarps.push(new Warp(x, y, 'IslandSouth', 21, 43));
								break;
							
							case 'EnterSewer':
								lib.annotationWarps.push(new Warp(x, y, 'Sewer', 16, 11));
								break;
							
							case 'FarmObelisk':
								switch (lib.gameState.farmType) {
								case '5':
									lib.annotationWarps.push(new Warp(x, y, 'Farm', 82, 29));
									break;
								
								case '6':
									lib.annotationWarps.push(new Warp(x, y, 'Farm', 48, 39));
									break;
								
								default:
									lib.annotationWarps.push(new Warp(x, y, 'Farm', 48, 7));
								}
								
								break;
							
							case 'LockedDoorWarp':
							case 'Warp':
							case 'WarpMensLocker':
							case 'WarpWomensLocker':
								lib.annotationWarps.push(new Warp(x, y, value[3], value[1], value[2]));
								break;
							
							case 'MasteryRoom':
								lib.annotationWarps.push(new Warp(x, y, 'MasteryCave', 7, 11));
								break;
							
							case 'Theater_Entrance':
								lib.annotationWarps.push(new Warp(x, y, 'MovieTheater', 13, 15));
								break;
							
							case 'Warp_Sunroom_door':
								lib.annotationWarps.push(new Warp(x, y, 'Sunroom', 5, 13));
								break;
							
							case 'WarpBoatTunnel':
								lib.annotationWarps.push(new Warp(x, y, 'BoatTunnel', 6, 11));
								break;
							
							case 'WarpCommunityCenter':
								lib.annotationWarps.push(new Warp(x, y, 'CommunityCenter', 32, 23));
								break;
							
							case 'WarpGreenhouse':
								lib.annotationWarps.push(new Warp(x, y, 'Greenhouse', 10, 23));
								break;
							
							case 'WizardHatch':
								lib.annotationWarps.push(new Warp(x, y, 'WizardHouseBasement', 4, 4));
								break;
							}
							
							break;
						
						case 'TouchAction':
							switch (value[0]) {
							case 'DesertBus':
								lib.annotationWarps.push(new Warp(x, y, 'BusStop', 22, 10));
								break;
							
							case 'LeaveIsland':
								lib.annotationWarps.push(new Warp(x, y, 'BoatTunnel', 6, 9));
								break;
							
							case 'MagicWarp':
							case 'Warp':
								lib.annotationWarps.push(new Warp(x, y, value[1], value[2], value[3]));
								break;
							
							case 'Theater_Exit':
								lib.annotationWarps.push(new Warp(x, y, 'Town', value[1], value[2]));
								break;
							}
							
							break;
						}
					}
				}
				
				overlayOutput += `<td data-tile-index="${tileIndex}" data-x="${x}" data-y="${y}"></td>`;
			}
			
			overlayOutput += '</tr>';
		}			
		
		overlayOutput += '</table>';
		$('#maps-overlay').html(overlayOutput);
		lib.overlayCells = [];
		
		$('#maps-overlay td').each(function () {
			lib.overlayCells.push(this);
		});
		
		lib.featureElements = new Array(lib.features.length);
		lib.featureElements.fill(null);
		lib.updateOverlay();
		
		let mapBoxRect = document.getElementById('maps-map-box').getBoundingClientRect();
		
		if (lib.destTileX != null) {
			lib.scrollX = Math.round((lib.destTileX + .5) * map.tileWidth - mapBoxRect.width / (2 * lib.options.zoom));
			lib.destTileX = null;
		}
		
		if (lib.destTileY != null) {
			lib.scrollY = Math.round((lib.destTileY + .5) * map.tileHeight - mapBoxRect.height / (2 * lib.options.zoom));
			lib.destTileY = null;
		}
		
		$('#maps-map-box')
			.prop('scrollLeft', Math.max(0, (lib.scrollX - map.minX * map.tileWidth) * lib.options.zoom))
			.prop('scrollTop', Math.max(0, (lib.scrollY - map.minY * map.tileHeight) * lib.options.zoom));
		
		$('#maps-sprites-front > .maps-feature').each(function () {
			lib.featureElements[this.dataset.featureIndex] = this;
		});
		
		$('#maps-layer-top').on('mousemove', function (e) {
			let map = lib.mapCache.map;
			
			if (e.buttons !== 1) {
				lib.flushActions();
			}
			
			let rect = this.getBoundingClientRect();
			let x = (e.clientX - rect.x) / lib.options.zoom;
			let y = (e.clientY - rect.y) / lib.options.zoom;
			
			if (lib.options.hideFrontNearCursor) {
				let tileY = Math.floor(y / map.tileHeight);
				document.getElementById('maps-layer-always-front').style.maskImage = `radial-gradient(circle ${map.tileHeight * 4}px at ${x}px ${y}px, transparent 50%, white)`;
				
				for (let row of lib.mapCache.frontRows) {
					if (row.y < tileY - 4 || row.y > tileY + 4) {
						row.element.style.maskImage = 'none';
					}
					else {
						row.element.style.maskImage = `radial-gradient(circle ${map.tileHeight * 4}px at ${x}px ${y - row.y * map.tileHeight}px, transparent 50%, white)`;
					}
				}
			}
			
			if (e.buttons === 1 && lib.selectionRect != null) {
				let tileX = Math.floor(x / 16);
				let tileY = Math.floor(y / 16);
				
				if (lib.canSelect(map.getTileIndex(tileX, tileY))) {
					lib.selectionRect[2] = tileX;
					lib.selectionRect[3] = tileY;
					lib.updateSelectionRect(tileX, tileY);
				}
			}
			
			if (lib.tool === 'paint') {
				$('.paint-region.hover-paint').removeClass('hover-paint');
				let tileX = Math.floor(x / 16);
				let tileY = Math.floor(y / 16);
				let tileIndex = map.getTileIndex(tileX, tileY);
				let paintTarget = lib.getPaintTargetAt(tileIndex, x, y);
				
				if (paintTarget != null && paintTarget.result === lib.PAINT_PICKER) {
					let feature = paintTarget.feature;
					let regionIndex = lib.getPaintRegionAt(feature, x, y);
					
					if (regionIndex !== null) {
						$(lib.featureElements[feature.index]).find(`.paint-region-${regionIndex}`).addClass('hover-paint');
					}
				}
			}
		});
		
		$('#maps-layer-top').on('mouseleave', function (e) {
			$('#maps-floating-feature').css('display', 'none')
			$('.paint-region.hover-paint').removeClass('hover-paint');
			lib.updateSelectionRect(null, null);
			
			if (lib.options.hideFrontNearCursor) {
				$('#maps-layer-always-front').css('mask-image', 'none');
				$('#maps-row-canvases-front > canvas').css('mask-image', 'none');
			}
		});
		
		$('#maps-layer-top').on('mouseenter', 'td.tile', function (e) {
			lib.hoverTile(+this.dataset.tileIndex, e.buttons);
			
			if (e.buttons === 1) {
				if (lib.clicking) {
					lib.dragging = true;
					lib.clicking = false;
				}
				
				let canMultiAct = true;
				
				if (!['inspect', 'erase'].includes(lib.tool)) {
					if (lib.dragging) {
						canMultiAct = false;
					}
					else if (lib.floating !== null) {
						for (let feature of lib.floating.features) {
							if (feature.index >= 0) {
								canMultiAct = false;
								break;
							}
						}
					}
				}
				
				if (canMultiAct) {
					lib.act(this, e);
				}
			}
			else {
				lib.clicking = false;
				lib.dragging = false;
			}
		});
		
		$('#maps-layer-top').on('mouseleave', 'td.tile', function (e) {
			let tileIndex = +this.dataset.tileIndex;
			//this.classList.remove('hover');
			
			for (let featureIndex of lib.tileObscuredBy[tileIndex]) {
				lib.featureElements[featureIndex].classList.remove('fade');
			}
			
			if (lib.floating !== null) {
				$('.tile.build-ok, .tile.build-bad').removeClass('build-ok').removeClass('build-bad');
			}
			else {
				$(`.maps-feature.hover-${lib.tool}`).removeClass(`hover-${lib.tool}`);
			}
			
			$('#maps-overlay td.tile.hover-highlight').removeClass('hover-highlight');
		});
		
		$('#maps-layer-top').on('mousedown', 'td.tile', function (e) {
			if (e.button !== 0) {
				return;
			}
			
			if (lib.tool === 'select') {
				//this.classList.remove('hover');
			}
			
			if (lib.floating === null) {
				lib.clicking = true;
			}
			
			e.preventDefault();
			lib.act(this, e);
		});
		
		$('#maps-layer-top').on('mousedown', function (e) {
			if (e.button !== 0) {
				return;
			}
			
			let rect = this.getBoundingClientRect();
			let tileX = Math.floor((e.clientX - rect.x) / (16 * lib.options.zoom));
			let tileY = Math.floor((e.clientY - rect.y) / (16 * lib.options.zoom));
			
			if (lib.canSelect(lib.mapCache.map.getTileIndex(tileX, tileY))) {
				if (!e.ctrlKey) {
					lib.selectedFeatures.clear();
				}
				
				lib.selectionRect = [tileX, tileY, tileX, tileY];
				lib.updateSelectionRect(tileX, tileY);
			}
		});
		
		$('#maps-layer-top').on('mouseup', 'td.tile', function (e) {
			if (lib.floating !== null) {
				if (lib.dragging) {
					lib.act(this, e);
					lib.dragging = false;
				}
			}
			else if (lib.tool === 'select') {
				//this.classList.add('hover');
			}
		});
		
		$('#maps-layer-top').on('mouseup', function (e) {
			lib.flushActions();
			//$('#maps-selection').css('display', 'none');
			
			if (lib.selectionRect !== null) {
				for (let feature of lib.getPendingSelectedFeatures()) {
					lib.selectedFeatures.add(feature);
				}
				
				let tileX = lib.selectionRect[2];
				let tileY = lib.selectionRect[3];
				lib.selectionRect = null;
				lib.updateSelectionRect(tileX, tileY);
			}
		});
		
		$('#maps-row-canvases-front, #maps-layer-always-front').toggle(!lib.options.hideFront);
		$('#maps-warps').toggle(lib.options.showWarps);
		$(`#maps-tool-${lib.tool}`).trigger('click');
	};
	
	lib.act = function (td, e) {
		let map = lib.mapCache.map;
		let tileIndex = +td.dataset.tileIndex;
		let rehover = true;
		
		floatingAct: if (lib.floating !== null) {
			let tileX = map.getTileX(tileIndex) + lib.floating.relX;
			let tileY = map.getTileY(tileIndex) + lib.floating.relY;
			
			if (lib.checkFloatingDestination(tileX, tileY, false)) {
				if (lib.floating.features.length === 1) {
					let feature = lib.floating.features[0];
					
					// Single feature placement behaviors.
					
					if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
						// See if we can drop the feature into another feature.
						
						let baseFeature = lib.tileFeatures[tileIndex];
						let action = {
							type: lib.UNDO_FEATURE,
							index: baseFeature.index,
							details: window.structuredClone(baseFeature.details),
						};
						let removedAccessory = lib.grabAccessory(baseFeature, false);
						
						if (lib.mapLocation.performObjectDropInAction(baseFeature, feature, false)) {
							let moved = false;
							
							if (feature.index >= 0 && feature.restorationDetails != null) {
								lib.actions.push({
									type: lib.UNDO_FEATURE,
									index: feature.index,
									details: feature.restorationDetails,
								});
								feature.index = -1;
								feature.restorationDetails = null;
								moved = true;
							}
							
							lib.actions.push(action);
							lib.setHasUnsavedChanges(true, true);
							
							if (feature.index >= 0 && lib.canEraseFeature(feature)) {
								moved = true;
							}
							
							if (moved || lib.dragging || removedAccessory != null) {
								lib.cancelFloating(true);
								lib.eraseSelection();
								$(moved ? '#maps-tool-move' : '#maps-tool-copy').trigger('click');
								
								if (removedAccessory != null) {
									lib.updateFeature(removedAccessory);
									lib.drawFeature(removedAccessory);
									lib.floatFeatures([removedAccessory]);
								}
							}
							
							lib.redrawFeature(baseFeature);
							lib.updateOverlay();
							break floatingAct;
						}
					}
					
					if (feature.kind === 'objects') {
						if (lib.mapLocation.placementAction(tileX, tileY, feature)) {
							break floatingAct;
						}
					}
				}
				
				// Additional placement behaviors.
				
				let gameStateChanges = [];
				
				for (let feature of lib.floating.features) {
					switch (feature.kind) {
					case 'buildings':
					case 'resourceClumps':
						// Erase features in the way.
						
						for (let tile of lib.mapLocation.getAllPlacementTiles(feature, true)) {
							let checkX = tileX + feature.tileX + tile.tileX;
							let checkY = tileY + feature.tileY + tile.tileY;
							
							if (!map.isTileOnMap(checkX, checkY)) {
								continue;
							}
							
							for (let checkFeature of lib.features) {
								if (checkFeature != null && lib.canEraseFeature(checkFeature) && lib.mapLocation.featureOccupiesTile(checkFeature, checkX, checkY)) {
									lib.eraseFeature(checkFeature);
								}
							}
						}
						
						if (feature.kind === 'buildings' && feature.meta.type === 'GreenhouseBuilding') {
							gameStateChanges.push(['greenhouseMoved', true]);
						}
						
						break;
					
					case 'terrainFeatures':
						switch (feature.meta.type) {
						case 'FruitTree':
							feature.details.greenHouseTileTree = (lib.location.details.IsGreenhouse === 'true' && lib.mapLocation.doesTileHaveProperty(tileX + feature.tileX, tileY + feature.tileY, 'Type', 'Back') === 'Stone') ? 'true' : 'false';
							break;
						
						case 'HoeDirt': {
							let crop = feature.details.crop ?? null;
							
							if (crop !== null) {
								let cropData = core.content.Data.Crops[crop.seedIndex] ?? {};
								
								if (cropData.IsPaddyCrop) {
									feature.details.state = lib.mapLocation.nearWaterForPaddy(tileX + feature.tileX, tileY + feature.tileY) ? '1' : '0';
								}
							}
							
							break;
						}}
						
						break;
					}
				}
				
				// Place the features.
				
				lib.setHasUnsavedChanges(true, true);
				lib.placeFloating(tileX, tileY);
				lib.updateOverlay();
				lib.setGameStates(gameStateChanges);
			}
		}
		else {
			switch (lib.tool) {
			case 'inspect':
				lib.inspect(tileIndex);
				break;
			
			case 'move':
				if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
					lib.moveSelection(lib.tileFeatures[tileIndex], map.getTileX(tileIndex), map.getTileY(tileIndex));
				}
				
				break;
			
			case 'copy':
				if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
					lib.copySelection(lib.tileFeatures[tileIndex], map.getTileX(tileIndex), map.getTileY(tileIndex));
				}
				
				break;
			
			case 'erase':
				if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
					lib.eraseSelection(lib.tileFeatures[tileIndex]);
				}
				
				break;
			
			case 'transform':
				if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
					lib.transformSelection(lib.tileFeatures[tileIndex], e.ctrlKey || e.shiftKey);
				}
				
				break;
			
			case 'paint': {
				let rect = document.getElementById('maps-layer-top').getBoundingClientRect();
				let x = (e.clientX - rect.x) / lib.options.zoom;
				let y = (e.clientY - rect.y) / lib.options.zoom;
				let target = lib.getPaintTargetAt(tileIndex, x, y);
				
				if (target != null) {
					let feature = target.feature;
					let action = {
						type: lib.UNDO_FEATURE,
						index: feature.index,
						details: window.structuredClone(feature.details),
					};
					
					let result = lib.changePaint(feature, (e.ctrlKey || e.shiftKey) ? lib.VAR_BACKWARDS : 0);
					
					if (result === lib.PAINT_INSTANT) {
						lib.actions.push(action);
						lib.redrawFeature(feature);
						lib.setHasUnsavedChanges(true, true);
						rehover = false;
					}
					else if (result === lib.PAINT_PICKER) {
						let regionIndex = lib.getPaintRegionAt(feature, x, y);
						
						if (regionIndex !== null) {
							lib.colorPickerState = {
								featureIndex: feature.index,
								regionIndex: regionIndex,
								hasChange: false,
							};
							let region = feature.meta.paintRegions[regionIndex];
							$('#maps-color-picker h4').text(`${feature.meta.name} - ${region.name}`);
							$('#maps-picker-input-l').prop({
								min: region.brightnessRange[0],
								max: region.brightnessRange[1],
							});
							let color = feature.details.buildingPaintColor;
							$('#maps-picker-input-h').val(color?.[`Color${regionIndex + 1}Hue`]?.int ?? '0');
							$('#maps-picker-input-s').val(color?.[`Color${regionIndex + 1}Saturation`]?.int ?? '0');
							$('#maps-picker-input-l').val(color?.[`Color${regionIndex + 1}Lightness`]?.int ?? '0');
							lib.updatePickerComponents(false);
							$('#maps-reset-color').prop('disabled', (color?.[`Color${regionIndex + 1}Default`]?.boolean ?? 'true') === 'true');
							$('#maps-out-inspect').addClass('hidden');
							$('#maps-color-picker').removeClass('hidden');
							$('#maps-tab-info').prop('checked', true).trigger('change').focus();
						}
					}
				}
				
				break;
			}}
		}
		
		if (rehover) {
			lib.hoverTile(+td.dataset.tileIndex, e.buttons);
		}
	};
	
	lib.pushOrInitialize = function (dict, key, elements) {
		if (Object.hasOwn(dict, key)) {
			dict[key].push(...elements);
		}
		else {
			dict[key] = elements;
		}
	};
	
	lib.hoverTile = function (tileIndex = null, mouseButtons = 0) {
		let map = lib.mapCache.map;
		
		tileIndex ??= lib.lastHoverTileIndex;
		lib.lastHoverTileIndex = tileIndex;
		
		if (lib.selectionRect === null) {
			lib.updateSelectionRect(map.getTileX(tileIndex), map.getTileY(tileIndex));
		}
		
		let paintTarget = (lib.tool === 'paint') ? lib.getPaintTargetAt(tileIndex) : null;
		
		for (let featureIndex of lib.tileObscuredBy[tileIndex]) {
			if (paintTarget === null || (paintTarget.feature.index !== featureIndex && lib.changePaint(lib.features[featureIndex], lib.VAR_PROBE) !== lib.PAINT_PICKER)) {
				lib.featureElements[featureIndex].classList.add('fade');
			}
		}
		
		if (lib.floating !== null) {
			let tileX = map.getTileX(tileIndex) + lib.floating.relX;
			let tileY = map.getTileY(tileIndex) + lib.floating.relY;
			$('#maps-floating-feature')
				.css('display', 'block')
				.css('left', tileX * 16)
				.css('top', tileY * 16);
			let canBuild = lib.checkFloatingDestination(tileX, tileY, true);
			
			if (lib.options.highlightHover && canBuild) {
				for (let feature of lib.floating.features) {
					for (let position of feature.domain) {
						let checkX = feature.tileX + tileX + position[0] + feature.meta.domainOffsetX;
						let checkY = feature.tileY + tileY + position[1] + feature.meta.domainOffsetY;
						
						if (map.isTileOnMap(checkX, checkY)) {
							$(lib.overlayCells[map.getTileIndex(checkX, checkY)]).addClass('hover-highlight');
						}
					}
				}
			}
		}
		
		if (lib.tool === 'paint') {
			if (paintTarget != null) {
				if (paintTarget.result === lib.PAINT_INSTANT) {
					lib.featureElements[paintTarget.feature.index].classList.add('hover-paint');
				}
			}
		}
		else if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
			let feature = lib.tileFeatures[tileIndex];
			let features;
			
			if (lib.selectedFeatures.has(feature) && mouseButtons !== 1) {
				features = lib.selectedFeatures.values().toArray();
			}
			else {
				features = [feature];
			}
			
			for (let feature of features) {
				if (lib.floating === null) {
					let addHoverClass = false;
					
					switch (lib.tool) {
					case 'move':
						addHoverClass = lib.canMoveFeature(feature);
						break;
					
					case 'copy':
						addHoverClass = true;
						break;
					
					case 'erase':
						addHoverClass = lib.canEraseFeature(feature);
						break;
					
					case 'transform':
						addHoverClass = lib.changeVariation(feature, lib.VAR_PROBE);
						break;
					}
					
					if (addHoverClass) {
						lib.featureElements[feature.index].classList.add(`hover-${lib.tool}`);
					}
				}
				
				if (lib.options.highlightHover) {
					for (let domainTileIndex of feature.domainTileIndices) {
						$(lib.overlayCells[domainTileIndex]).addClass('hover-highlight');
					}
				}
			}
		}
	};
	
	lib.canMoveFeature = function (feature) {
		if (lib.festival !== null) {
			return false;
		}
		
		if (feature.meta.temporal) {
			return false;
		}
		
		if (lib.options.allowMovingAnything) {
			return true;
		}
		
		if (feature.meta.noMove) {
			return false;
		}
		
		return true;
	};
	
	lib.canEraseFeature = function (feature, allFeatures = null) {
		if (lib.festival !== null) {
			return false;
		}
		
		if (feature.meta.temporal) {
			return false;
		}
		
		if (lib.options.allowErasingAnything) {
			return true;
		}
		
		if (feature.meta.noErase) {
			return false;
		}
		
		if (feature.kind === 'buildings') {
			let minCount = feature.getMinBuildingCount(lib.location);
			
			if (minCount !== null) {
				let count = 0;
				
				for (let searchFeature of allFeatures ?? lib.features) {
					if (searchFeature != null && searchFeature.kind === 'buildings' && searchFeature.meta.buildingType === feature.meta.buildingType) {
						++count;
					}
				}
				
				if (allFeatures == null && lib.floating != null) {
					for (let searchFeature of lib.floating.features) {
						if (searchFeature.index != null && searchFeature.kind === 'buildings' && searchFeature.meta.buildingType === feature.meta.buildingType) {
							++count;
						}
					}
				}
				
				if (count <= minCount) {
					return false;
				}
			}
		}
		
		return true;
	};
	
	lib.updateFeature = function (feature, location = null) {
		if (feature.kind === 'special') {
			return;
		}
		
		let module = featureTypeModules[feature.kind];
		location ??= lib.location ?? ext.locations[lib.mapCache.locationId ?? 'Farm'];
		
		module.syncDetails(feature, location, core);
		feature.beginUpdate();
		module.updateFeature(feature, location, core);
		feature.endUpdate();
	};
	
	lib.drawFeature = function (feature, location = null) {
		if (feature.kind === 'special') {
			return;
		}
		
		feature.sprites.splice(0);
		featureTypeModules[feature.kind].drawFeature(feature, location ?? lib.location ?? ext.locations[lib.mapCache.locationId ?? 'Farm'], core);
	};
	
	lib.recalculateFeature = function (feature, standAlone = false) {
		let map = lib.mapCache.map;
		
		feature.maxLayerDepth = 0;
		feature.obscures.clear();
		
		for (let [i, sprite] of feature.sprites.entries()) {
			if (sprite.layerDepth > feature.maxLayerDepth) {
				feature.maxLayerDepth = sprite.layerDepth;
			}
			
			if (!standAlone && !sprite.isShadow && !sprite.isLight) {
				let absX = feature.tileX * 16 + sprite.x;
				let absY = feature.tileY * 16 + sprite.y;
				
				let leftTileX = Math.max(0, Math.floor(absX / 16));
				let rightTileX = Math.min(map.width - 1, Math.floor((absX + sprite.width * sprite.scale - 1) / 16));
				let topTileY = Math.max(0, Math.floor(absY / 16));
				let bottomTileY = Math.min(map.height - 1, Math.floor((absY + sprite.height * sprite.scale - 1) / 16));
				
				for (let y = topTileY; y <= bottomTileY; ++y) {
					for (let x = leftTileX; x <= rightTileX; ++x) {
						if (!lib.mapLocation.featureOccupiesTile(feature, x, y)) {
							let tileIndex = x + y * map.width;
							
							if (sprite.layerDepth >= y * 64e-4) {
								feature.obscures.add(tileIndex);
							}
						}
					}
				}
			}
		}
		
		feature.domain = lib.domainTemplates[feature.meta.domainType]?.[feature.meta.domainSize] ?? [];
		feature.domainTileIndices.splice(0);
		
		if (!standAlone) {
			for (let position of feature.domain) {
				let x = feature.tileX + position[0] + feature.meta.domainOffsetX;
				let y = feature.tileY + position[1] + feature.meta.domainOffsetY;
				
				if (x >= 0 && y >= 0 && x < map.width && y < map.height) {
					feature.domainTileIndices.push(x + y * map.width);
				}
			}
		}
	};
	
	lib.addTileFeature = function (feature) {
		for (let y = feature.tileY; y < feature.tileY + feature.meta.height; ++y) {
			for (let x = feature.tileX; x < feature.tileX + feature.meta.width; ++x) {
				let tileIndex = lib.mapCache.map.getTileIndex(x, y);
				
				if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
					if (lib.compareFeatures(feature, lib.tileFeatures[tileIndex]) >= 0) {
						lib.tileFeatures[tileIndex] = feature;
					}
				}
				else {
					lib.tileFeatures[tileIndex] = feature;
				}
			}
		}
	};
	
	lib.compareFeatures = function (a, b) {
		return (
			((a.kind === 'objects') - (b.kind === 'objects')) ||
			((a.meta.name != null) - (b.meta.name != null)) ||
			((a.maxLayerDepth ?? 0) - (b.maxLayerDepth ?? 0)) ||
			((a.tileY + a.meta.height) - (b.tileY + b.meta.height))
		);
	};
	
	lib.getFeatureHTML = function (feature, standAlone = false) {
		let className = 'maps-feature';
		
		if (lib.options.hideGrass && feature.isGrass() && !standAlone) {
			className += ' hidden-grass';
		}
		
		if (lib.options.hideSpecial && feature.kind === 'special' && !standAlone) {
			className += ' hidden-special';
		}
		
		let output = `<div class="${className}" data-feature-index="${feature.index}">`;
		
		for (let [index, sprite] of feature.sprites.entries()) {
			if (sprite.time != null && sprite.time !== lib.timeOfDay) {
				continue;
			}
			
			let className = 'maps-sprite';
			let content = '';
			let style = '';
			
			switch (sprite.type) {
			case Sprite.TYPE_SOLID:
				if (sprite.tintColor != null) {
					if (sprite.linearTint) {
						style += `background-color: color(srgb-linear ${((sprite.tintColor[0] ?? 255) / 255).toFixed(4)} ${((sprite.tintColor[1] ?? 255) / 255).toFixed(4)} ${((sprite.tintColor[2] ?? 255) / 255).toFixed(4)} / ${((sprite.tintColor[3] ?? 255) / 255).toFixed(4)});`
					}
					else {
						style += `background-color: rgb(${sprite.tintColor[0] ?? 255} ${sprite.tintColor[1] ?? 255} ${sprite.tintColor[2] ?? 255} / ${((sprite.tintColor[3] ?? 255) / 255).toFixed(4)});`
					}
				}
				else {
					style += 'background-color: rgb(255 255 255 / 1.0000);';
				}
				
				break;
			
			case Sprite.TYPE_TEXTURE:
				if (sprite.texture != null && sprite.paint == null) {
					let url = util.contentURI(`${sprite.texture}.png`);
					style += `background-image: url("${url}");`;
					style += `background-position: ${-sprite.sheetX}px ${-sprite.sheetY}px;`;
				}
				
				if (sprite.tintColor != null) {
					let filter = util.getTintFilter(sprite.tintColor[0] ?? 255, sprite.tintColor[1] ?? 255, sprite.tintColor[2] ?? 255, true, sprite.linearTint);
					
					if (filter !== null) {
						style += `--sprite-filter: ${filter};`;
					}
					
					if ((sprite.tintColor[3] ?? 255) !== 255) {
						style += `--opacity: ${(sprite.tintColor[3] / 255).toFixed(4)};`;
					}
				}
				
				break;
			}
			
			style += `left: ${feature.tileX * 16 + sprite.x}px;`;
			style += `top: ${feature.tileY * 16 + sprite.y}px;`;
			style += `width: ${sprite.width}px;`;
			style += `height: ${sprite.height}px;`;
			style += `z-index: ${Math.min(2147483647, Math.floor(sprite.layerDepth * 2147483648))};`;
			let transform = '';
			let relTransform = '';
			
			if (sprite.scale !== 1) {
				relTransform += ` scale(${sprite.scale.toFixed(4)})`;
			}
			
			if (sprite.rotation !== 0) {
				relTransform += ` rotate(${sprite.rotation.toFixed(4)}rad)`;
			}
			
			if (relTransform !== '') {
				transform += ' translate(-50%, -50%)';
				
				if (sprite.origin[0] !== 0 || sprite.origin[1] !== 0) {
					transform += ` translate(${sprite.origin[0].toFixed(4)}px, ${sprite.origin[1].toFixed(4)}px)`;
					transform += relTransform;
					transform += ` translate(${-(sprite.origin[0]).toFixed(4)}px, ${-(sprite.origin[1]).toFixed(4)}px)`;
				}
				else {
					transform += relTransform;
				}
				
				transform += ' translate(50%, 50%)';
			}
			
			if (sprite.effects & (Sprite.EF_FLIP_HORIZONTALLY | Sprite.EF_FLIP_VERTICALLY)) {
				transform += ` scale(${(sprite.effects & Sprite.EF_FLIP_HORIZONTALLY) ? -1 : 1}, ${(sprite.effects & Sprite.EF_FLIP_VERTICALLY) ? -1 : 1})`;
			}
			
			if (transform !== '') {
				style += `transform: ${transform};`;
			}
			
			if (sprite.style != null) {
				style += sprite.style;
			}
			
			if (sprite.accessoryIndex === feature.meta.maxAccessoryIndex) {
				className += ' front';
			}
			
			if (feature.meta.maxGrabbableAccessoryIndex < 0 || sprite.accessoryIndex === feature.meta.maxGrabbableAccessoryIndex) {
				className += ' front-grabbable';
			}
			
			if (sprite.isLight) {
				className += ' lighting';
			}
			
			if (sprite.className != null) {
				className += ` ${sprite.className}`;
			}
			
			if (sprite.paint != null) {
				className += ` sprite-${index}`;
				
				if (sprite.paint.useRegions) {
					className += ' paint-sprite';
				}
			}
			
			output += `<div class="${util.escapeHTML(className)}" style="${util.escapeHTML(style)}">${content}</div>`;
		}
		
		output += '</div>';
		return output;
	};
	
	lib.initFeatureElement = function (feature, element) {
		lib.initElementPaint(feature, element);
	};
	
	lib.eraseFeature = function (feature) {
		lib.features[feature.index] = null;
		lib.detachFeature(feature);
		lib.actions.push({
			type: lib.UNDO_FEATURE,
			index: feature.index,
			kind: feature.kind,
			tileX: feature.tileX,
			tileY: feature.tileY,
			details: window.structuredClone(feature.details),
		});
	};
	
	lib.drawLayers = function (element, layerTypes, annotations) {
		let map = lib.mapCache.map;
		let canvasPerRow = (element.tagName.toLowerCase() !== 'canvas');
		let context = canvasPerRow ? null : element.getContext('2d');
		
		for (let layerType of layerTypes) {
			let layers = [];
			
			for (let layer of map.layerList) {
				if (layer.name.startsWith(layerType)) {
					layers.push(layer);
				}
			}
			
			for (let [i, layer] of layers.entries()) {
				let newAnnotations = [];
				
				for (let y = 0, tileIndex = 0; y < layer.height; ++y) {
					if (canvasPerRow) {
						context = null;
					}
					
					for (let x = 0; x < layer.width; ++x, ++tileIndex) {
						let tile = layer.tiles[tileIndex];
						
						if (tile < 0) {
							continue;
						}
						
						let attrs = layer.tileAttributes[tileIndex];
						let tileSheet = map.tileSheets[attrs.tileSheetIndex];
						let imageBitmap = lib.mapCache.imageBitmaps.get(tileSheet.url);
						let sourceX = (tile % tileSheet.columns) * tileSheet.tileWidth;
						let sourceY = Math.floor(tile / tileSheet.columns) * tileSheet.tileHeight;
						let positionY = y * tileSheet.tileHeight;
						
						if (canvasPerRow) {
							if (context === null) {
								// See StardewValley.Game1:DrawWorld() and xTile.Layers.Layer:DrawNormal()
								
								let layerDepth = 0;
								
								if (layers.length > 1) {
									layerDepth = i / (layers.length - 1);
								}
								
								layerDepth = (y * 64 + 64 + (64 + .1 * layerDepth)) / 10000;
								
								// Create the canvas for this row (in canvasPerRow mode).
								
								let canvas = document.createElement('canvas');
								canvas.width = layer.width * tileSheet.tileWidth;
								canvas.height = tileSheet.tileHeight;
								canvas.style.top = positionY + 'px';
								canvas.style.zIndex = Math.min(2147483647, Math.floor(layerDepth * 2147483648));
								canvas.dataset.layerDepth = layerDepth;
								canvas.dataset.y = y;
								element.appendChild(canvas);
								context = canvas.getContext('2d');
							}
							
							positionY = 0;
						}
						
						context.drawImage(imageBitmap, sourceX, sourceY, tileSheet.tileWidth, tileSheet.tileHeight, x * tileSheet.tileWidth, positionY, tileSheet.tileWidth, tileSheet.tileHeight);
						
						if (attrs.properties.Action != null) {
							newAnnotations.push({
								type: 'Action',
								value: attrs.properties.Action.split(' '),
							});
						}
						
						if (attrs.properties.TouchAction != null) {
							newAnnotations.push({
								type: 'TouchAction',
								value: attrs.properties.TouchAction.split(' '),
							});
						}
						
						if (layer.name === 'Buildings') {
							switch (lib.location.type) {
							case 'BusStop':
								if (tile === 1057 && tileSheet.name === 'outdoors') {
									newAnnotations.push({type: 'Action', value: ['Warp', '16', '24', 'Desert']});
								}
								
								break;
							
							case 'Forest':
								if (tile === 1394 && tileSheet.name === 'outdoors') {
									newAnnotations.push({type: 'Action', value: ['Warp', '3', '48', 'Sewer']});
								}
								
								break;
							
							case 'IslandWest':
								if (tile === 1470 && tileSheet.name === 'untitled tile sheet') {
									newAnnotations.push({type: 'Action', value: ['Warp', '7', '8', 'QiNutRoom']});
								}
								
								break;
							
							case 'Sewer':
								if (tile === 21 && tileSheet.name === 'st') {
									newAnnotations.push({type: 'Action', value: ['Warp', '35', '97', 'Town']});
								}
								
								break;
							
							case 'Town':
								if ([2000, 2001, 2032, 2022].includes(tile) && tileSheet.name === 'Town') {
									newAnnotations.push({type: 'Action', value: ['Warp', '9', '13', 'AbandonedJojaMart']});
								}
								
								break;
							}
						}
						
						if (newAnnotations.length > 0) {
							lib.pushOrInitialize(annotations, map.getTileIndex(x, y), newAnnotations);
							newAnnotations = [];
						}
					}
				}
			}
			
			if (layers.length > 0 && layerType === 'Back') {
				// We just finished the last back layer. Draw water waves here.
				
				let water = new OffscreenCanvas(map.tileWidth, map.tileHeight * 2);
				let waterContext = water.getContext('2d');
				let color;
				
				if (lib.location.details.waterColor != null) {
					color = [
						+lib.location.details.waterColor.R / 255,
						+lib.location.details.waterColor.G / 255,
						+lib.location.details.waterColor.B / 255,
						+lib.location.details.waterColor.A / 255,
					];
				}
				else {
					let seasonColor = lib.seasonWaterColors[lib.location.getSeasonNumber()];
					color = [
						seasonColor.r / 255,
						seasonColor.g / 255,
						seasonColor.b / 255,
						seasonColor.a / 255,
					];
				}
				
				let cursorsBitmap = lib.mapCache.imageBitmaps.get(util.contentURI('LooseSprites/Cursors.png'));
				waterContext.drawImage(cursorsBitmap, 0, 2064, 64, 64, 0, 0, water.width, map.tileHeight);
				waterContext.drawImage(cursorsBitmap, 0, 2064 + 128, 64, 64, 0, map.tileHeight, water.width, map.tileHeight);
				let imageData = waterContext.getImageData(0, 0, water.width, water.height);
				
				for (let i = 0; i < imageData.data.length; i += 4) {
					for (let j = 0; j < 3; ++j) {
						// Convert from sRGB to linear RGB for the multiplication.
						//
						// Although most of the tinting effects seem to look more correct
						// when directly multiplying the sRGB values, the waves here and
						// in fish ponds seem to need linear RGB multiplication. I haven't
						// figured out why that discrepancy exists.
						
						let c = imageData.data[i + j];
						c = (c <= .04045) ? (c / 12.92) : Math.pow((c + .055) / 1.055, 2.4);
						c *= color[j];
						c = (c <= .0031308) ? (c * 12.92) : (Math.pow(c, 1 / 2.4) * 1.055 - .055);
						imageData.data[i + j] = c;
					}
					
					imageData.data[i + 3] *= color[3];
				}
				
				waterContext.putImageData(imageData, 0, 0);
				
				// The colored water pattern is prepared. Draw it on all the water tiles.
				
				let layer = layers[0];
				
				for (let y = 0; y < layer.height; ++y) {
					for (let x = 0; x < layer.width; ++x) {
						if (lib.mapLocation.isWaterTile(x, y)) {
							context.drawImage(water, 0, ((x + y) % 2 === 0) ? 0 : map.tileHeight, map.tileWidth, map.tileHeight, x * map.tileWidth, y * map.tileHeight, map.tileWidth, map.tileHeight);
						}
					}
				}
			}
		}
	};
	
	lib.drawAboveBuildingsSprites = function () {
		let html = '';
		
		for (let feature of lib.mapLocation.aboveBuildingsFeatures) {
			html += lib.getFeatureHTML(feature);
		}
		
		$('#maps-sprites-back').html(html);
	};
	
	lib.drawAboveAlwaysFrontSprites = function () {
		let html = '';
		
		for (let feature of lib.mapLocation.aboveAlwaysFrontFeatures) {
			html += lib.getFeatureHTML(feature);
		}
		
		$('#maps-sprites-always-front').html(html);
	};
	
	lib.updateMapInfo = function () {
		let output = '';
		output += `<h4>${util.escapeHTML(lib.location.displayName)}</h4>`;
		output += '<ul class="maps-info-values">';
		output += `<li>Size: ${lib.mapCache.map.width}x${lib.mapCache.map.height}</li>`;
		
		if (lib.location.type != null) {
			output += `<li>Type: ${util.escapeHTML(lib.location.type)}</li>`;
		}
		
		if (lib.location.locationType != null) {
			output += `<li>Location Type: ${util.escapeHTML(lib.location.locationType)}</li>`;
		}
		
		output += '</ul>';
		
		if (lib.options.verboseInfo) {
			output += '<div class="tab-container textbox-tabs"><div class="tabset">';
			output += '<input type="radio" name="maps-info-tabset" id="maps-info-tab-xml" value="xml" checked><label for="maps-info-tab-xml">XML</label>';
			output += '<input type="radio" name="maps-info-tabset" id="maps-info-tab-location" value="location"><label for="maps-info-tab-location">Location</label>';
			output += '<input type="radio" name="maps-info-tabset" id="maps-info-tab-map" value="map"><label for="maps-info-tab-map">Map</label>';
			output += '</div><div class="tab-panels">';
			
			output += '<div id="maps-info-sec-xml" class="tab-panel"><textarea readonly>';
			output += util.escapeHTML(util.detailsToXML(lib.location.details));
			output += '</textarea></div>';
			
			output += '<div id="maps-info-sec-location" class="tab-panel"><textarea readonly>';
			output += util.escapeHTML(JSON.stringify(lib.location, lib.stripUnwieldyProperties, 2));
			output += '</textarea></div>';
			
			output += '<div id="maps-info-sec-map" class="tab-panel"><textarea readonly>';
			output += util.escapeHTML(JSON.stringify(lib.mapCache.map, lib.stripUnwieldyProperties, 2));
			output += '</textarea></div>';
			
			output += '</div></div>';
		}
		
		output += '<h4>Fish Splashes</h4>';
		
		if (lib.mapCache.splashes.length === 0) {
			output += '<p>(None)</p>';
		}
		else {
			output += '<div class="summary-list">';
			
			for (let splash of lib.mapCache.splashes) {
				let type = splash.frenzy ? '<b>Frenzy</b>' : 'Splash';
				output += `<span class="result">${util.formatTimeOfDay(splash.startTime)} - ${util.formatTimeOfDay(splash.endTime)}: ${type} at (${splash.x}, ${splash.y})</span><br>`;
			}
			
			output += '</div>';
		}
		
		$('#maps-out-mapinfo').html(output);
		$('#maps-out-mapinfo .tab-container').each(function () {
			util.initTabContainer(core, this, function (input) {
				switch (input.value) {
				case 'location':
					console.log(lib.location);
					break;
				
				case 'map':
					console.log(lib.mapCache.map);
					break;
				}
			});
		});
	};
	
	lib.stripUnwieldyProperties = function (key, value) {
		if (value instanceof Layer) {
			value = {...value};
			delete value.tiles;
			delete value.tileAttributes;
		}
		else if (value instanceof Location) {
			value = {...value};
			delete value.saveFeatures;
			delete value.gameState;
			delete value.gameContent;
		}
		else if (value instanceof TileMap) {
			value = {...value};
			delete value.sourceMaps;
			delete value.layers;
		}
		
		return value;
	};
	
	lib.inspect = function (tileIndex) {
		let map = lib.mapCache.map;
		
		let output = '';
		let tileX = map.getTileX(tileIndex);
		let tileY = map.getTileY(tileIndex);
		let features = [];
		
		for (let feature of lib.features) {
			if (feature != null && lib.mapLocation.featureOccupiesTile(feature, tileX, tileY)) {
				features.push(feature);
			}
		}
		
		if (features.length > 0) {
			let i = 0;
			features.sort(lib.compareFeatures);
			features.reverse();
			
			for (let feature of features) {
				let position = `(${feature.tileX}, ${feature.tileY})`;
				
				if (feature.meta.width > 1 || feature.meta.height > 1) {
					position += ` ${feature.meta.width}x${feature.meta.height}`;
				}
				
				output += `<h4>${util.escapeHTML(feature.meta.name ?? 'Feature')}</h4>`;
				
				if (core.isExtensionEnabled('inventories')) {
					for (let chest of core.extensions.inventories.lib.getChests(feature.kind, feature.details, lib.location.id)) {
						output += core.extensions.inventories.lib.getChestHTML(chest);
					}
				}
				
				output += '<ul class="maps-info-values">';
				output += `<li>Position: ${position}</li>`;
				output += `<li>Kind: ${util.escapeHTML(feature.kind)}</li>`;
				
				if (feature.meta.type != null) {
					output += `<li>Type: ${util.escapeHTML(feature.meta.type)}</li>`;
				}
				
				switch (feature.kind) {
				case 'buildings':
					output += `<li>Building Type: ${util.escapeHTML(feature.meta.buildingType)}</li>`;
					break;
				
				case 'furniture':
					output += `<li>Furniture Type: ${util.escapeHTML(feature.meta.furnitureType)}</li>`;
					break;
				}
				
				if (feature.meta.item != null) {
					output += `<li>Item ID: ${feature.meta.item.qualifiedItemId}</li>`;
				}
				
				if (feature.meta.notes != null) {
					for (let note of feature.meta.notes) {
						output += `<li>Note: ${util.escapeHTML(note.text)}</li>`;
					}
				}
				
				output += '</ul>';
				
				if (lib.options.verboseInfo) {
					output += '<div class="tab-container textbox-tabs"><div class="tabset">';
					output += `<input type="radio" name="maps-inspect-tabset-${i}" id="maps-inspect-tab-${i}-xml" value="xml" checked><label for="maps-inspect-tab-${i}-xml">XML</label>`;
					output += `<input type="radio" name="maps-inspect-tabset-${i}" id="maps-inspect-tab-${i}-feature" value="feature"><label for="maps-inspect-tab-${i}-feature">Feature</label>`;
					output += '</div><div class="tab-panels">';
					
					output += `<div id="maps-inspect-sec-${i}-xml" class="tab-panel"><textarea readonly>`;
					output += util.escapeHTML(util.detailsToXML(feature.details));
					output += '</textarea></div>';
					
					
					output += `<div id="maps-inspect-sec-${i}-feature" class="tab-panel"><textarea readonly>`;
					output += util.escapeHTML(JSON.stringify(feature, null, 2));
					output += '</textarea></div>';
					
					output += '</div></div>';
				}
				
				++i;
			}
		}
		
		output += `<h4>Tile (${tileX}, ${tileY})</h4>`;
		
		switch (lib.location.type) {
		case 'FarmHouse':
		case 'IslandFarmHouse':
			// See StardewValley.GameLocation:GetFridge()
			//
			// A fridge position of (0, 0) indicates that it hasn't been unlocked yet.
			
			if (tileX !== 0 && tileY !== 0) {
				if (core.isExtensionEnabled('inventories') && tileX === +(lib.location.details.fridgePosition?.X ?? 0) && tileY === +(lib.location.details.fridgePosition?.Y ?? 0)) {
					for (let chest of core.extensions.inventories.lib.getFridge(lib.location.details, lib.location.id)) {
						output += core.extensions.inventories.lib.getChestHTML(chest);
					}
				}
			}
			
			break;
		}
		
		output += '<ul class="maps-info-values">';
		
		let tileProperties = {};
		
		for (let layer of map.layerList) {
			let layerTileIndex = layer.getTileIndex(tileX, tileY);
			let layerTileProperties = [];
			tileProperties[layer.name] = layerTileProperties;
			let layerOutput = '';
			let attrs = layer.tileAttributes[layerTileIndex];
			
			for (let [propertyName, value] of Object.entries(attrs.properties)) {
				layerTileProperties.push({
					source: 'Tile',
					name: propertyName,
					value: value,
				});
			}
			
			let tile = layer.tiles[layerTileIndex];
			let tileSheet = map.tileSheets[attrs.tileSheetIndex];
			let tileSheetProperties = tileSheet?.tileProperties?.[tile];
			
			if (tileSheetProperties) {
				for (let [propertyName, value] of Object.entries(tileSheetProperties)) {
					if (!Object.hasOwn(attrs.properties, propertyName)) {
						layerTileProperties.push({
							source: 'TileSheet',
							name: propertyName,
							value: value,
						});
					}
				}
			}
			
			if (tile >= 0) {
				output += `<li>${util.escapeHTML(layer.name)}: ${tile}, Tilesheet ${attrs.tileSheetIndex}:${util.escapeHTML(tileSheet?.name ?? '')}</li>`;
			}
		}
		
		output += '</ul>';
		
		for (let feature of lib.features) {
			if (feature != null && feature.meta.tileProperties != null && feature.meta.tileProperties.length > 0 && lib.mapLocation.featureOccupiesTile(feature, tileX, tileY, true)) {
				let relX = tileX - feature.tileX;
				let relY = tileY - feature.tileY;
				let seenFeatureProperties = new Set();
				
				for (let tileProperty of feature.meta.tileProperties) {
					let key = `${tileProperty.layer}:${tileProperty.name}`;
					
					if (
						relX >= tileProperty.x &&
						relY >= tileProperty.y &&
						relX < tileProperty.x + tileProperty.width &&
						relY < tileProperty.y + tileProperty.height &&
						!seenFeatureProperties.has(key)
					) {
						if (!Object.hasOwn(tileProperties, tileProperty.layer)) {
							tileProperties[tileProperty.layer] = [];
						}
						
						tileProperties[tileProperty.layer].push({
							source: 'Feature',
							name: tileProperty.name,
							value: tileProperty.value,
						});
						seenFeatureProperties.add(key);
					}
				}
			}
		}
		
		for (let [layerName, layerTileProperties] of Object.entries(tileProperties)) {
			if (layerTileProperties.length > 0) {
				output += `<h4>Tile Properties (${layerName})</h4>`;
				output += '<ul class="maps-info-values">';
				
				for (let tileProperty of layerTileProperties) {
					output += `<li>(${tileProperty.source}) <i>${util.escapeHTML(tileProperty.name)}</i>: ${util.escapeHTML(tileProperty.value + '')}</li>`;
				}
				
				output += '</ul>';
			}
		}
		
		$('#maps-out-inspect').html(output).removeClass('hidden');
		
		$('#maps-out-inspect .tab-container').each(function () {
			util.initTabContainer(core, this, function (input) {
				switch (input.value) {
				case 'feature':
					console.log(features[input.name.replace(/^.*-/, '')]);
					break;
				}
			});
		});
		
		if (output !== '') {
			$('#maps-tab-info').prop('checked', true).trigger('change').focus();
		}
	};
	
	lib.itemIsSapling = function (item) {
		// See StardewValley.Object:isSapling()
		
		if (item.qualifiedItemId === '(O)251') {
			return true;
		}
		
		if (lib.wildTreeSeeds.includes(item.qualifiedItemId)) {
			return true;
		}
		
		if (item.itemType === 'O' && Object.hasOwn(core.content.Data.FruitTrees, item.itemId)) {
			return true;
		}
		
		return false;
	};
	
	lib.itemIsPassable = function (item) {
		// See StardewValley.Object:isPassable()
		
		if (item.itemType === 'BC') {
			return false;
		}
		
		switch (item.qualifiedItemId) {
		case '(O)286':
		case '(O)287':
		case '(O)288':
		case '(O)893':
		case '(O)894':
		case '(O)895':
		case '(O)590':
		case '(O)SeedSpot':
		case '(O)297':
		case '(O)BlueGrassStarter':
		case '(O)93':
			return true;
		
		default:
			if (Object.hasOwn(lib.floorPathItemLookup, item.itemId)) {
				return true;
			}
			
			if (item.category === -74 || item.category === -19) {
				if (lib.itemIsSapling(item)) {
					return false;
				}
				
				switch (item.qualifiedItemId) {
				case '(O)301':
				case '(O)302':
				case '(O)473':
					return false;
				}
				
				return true;
			}
		}
		
		return false;
	};
	
	/*
	lib.itemIsPlaceable = function (item) {
		// See StardewValley.Object:isPlaceable()
		
		if (item.data.ContextTags) {
			if (item.data.ContextTags.includes('placeable')) {
				return true;
			}
			
			if (item.data.ContextTags.includes('not_placeable')) {
				return false;
			}
		}
		
		if ([-8, -9, -74, -19].includes(item.category) || item.type === 'Crafting' || lib.itemIsSapling(item) || item.qualifiedItemId === '(O)710') {
			if ((item.data.Edibility ?? -300) < 0 || lib.wildTreeSeeds.includes(item.qualifiedItemId)) {
				return true;
			}
		}
		
		return false;
	};
	*/
	
	//== Catalogue ==//
	
	lib.updateCatalogueTabs = function (tabs) {
		for (let [tab, groups] of Object.entries(tabs)) {
			let $tab = $(`#maps-out-catalogue-${tab}`);
			$tab.empty();
			
			for (let [group, buttons] of Object.entries(groups)) {
				let $tabGroup = $(`<div class="maps-catalogue-group"><h4>${util.escapeHTML(group)}</h4> <div class="maps-catalogue-list"></div></div>`);
				$tabGroup.find('.maps-catalogue-list').append(buttons);
				$(buttons).on('click', lib.catalogueItemClickHandler);
				$tab.append($tabGroup);
			}
		}
	};
	
	lib.catalogueItemClickHandler = function (e) {
		lib.cancelFloating();
		$('#maps-tool-move').trigger('click').removeClass('active');
		
		let feature = Feature.from(JSON.parse(this.dataset.feature));
		lib.updateFeature(feature);
		lib.drawFeature(feature);
		lib.floatFeatures([feature], null, feature.meta.height - 1);
		this.classList.add('active');
	};
	
	lib.updateCatalogueTabVisibilities = function (location) {
		let isDecoratable = location.isDecoratable();
		lib.toggleCatalogueTabVisibility('buildings', location.type === 'Farm');
		lib.toggleCatalogueTabVisibility('wallpaper', isDecoratable);
		lib.toggleCatalogueTabVisibility('flooring', isDecoratable);
		lib.toggleCatalogueTabVisibility('museum', location.type === 'LibraryMuseum');
	};
	
	lib.toggleCatalogueTabVisibility = function (tabName, state) {
		if (lib.options.allowPlacingAnywhere) {
			state = true;
		}
		
		let $input = $(`#maps-tab-${tabName}`);
		$input.toggle(state);
		$input.parent().find(`label[for="maps-tab-${tabName}"]`).toggle(state);
		
		if (!state && $input.prop('checked')) {
			$('#maps-tab-info').prop('checked', true).trigger('change').focus();
		}
	};
	
	lib.searchCatalogue = function (needle, switchToTab = null) {
		needle = needle.trim().toLowerCase();
		let results = {};
		let hasResults = false;
		
		if (needle !== '') {
			$('#maps-editor .tabset > input[name="maps-tabset"]:visible').each(function () {
				let sectionId = this.id.replace(/^maps-tab-/, 'maps-sec-');
				let tabName = this.nextElementSibling.textContent;
				let seen = new Set();
				
				$(document.getElementById(sectionId)).find('.maps-catalogue-item').each(function () {
					if (this.textContent.toLowerCase().includes(needle)) {
						if (!seen.has(this.dataset.feature)) {
							seen.add(this.dataset.feature);
							let clone = this.cloneNode(true);
							
							// Copy any canvases.
							
							let canvases = [];
							
							$(this).find('canvas').each(function () {
								canvases.push(this);
							});
							
							$(clone).find('canvas').each(function (index) {
								this.getContext('2d').drawImage(canvases[index], 0, 0);
							});
							
							results[tabName] ??= [];
							results[tabName].push(clone);
							hasResults = true;
						}
					}
				});
			});
		}
		
		if (switchToTab ?? (needle !== '')) {
			$('#maps-tab-search').prop('checked', true).trigger('change').focus();
		}
		
		if (hasResults) {
			lib.updateCatalogueTabs({search: results});
		}
		else {
			$('#maps-out-catalogue-search').html((needle === '') ? '' : '<p>No Results</p>');
		}
	};
	
	//== Sharing ==//
	
	lib.downloadImage = function () {
		let ref = {
			plan: lib.activePlan,
			imageBitmaps: lib.mapCache.imageBitmaps,
			backCanvas: document.getElementById('maps-canvas-back'),
			backFeatures: [...lib.mapLocation.aboveBuildingsFeatures],
			frontRows: lib.mapCache.frontRows,
			features: [...lib.features],
			alwaysFrontCanvas: document.getElementById('maps-canvas-always-front'),
			alwaysFrontFeatures: [...lib.mapLocation.aboveAlwaysFrontFeatures],
		};
		
		if (lib.options.hideGrass) {
			ref.features = ref.features.filter((feature) => !feature.isGrass());
		}
		
		if (lib.options.hideSpecial) {
			ref.backFeatures = ref.backFeatures.filter((feature) => feature.kind !== 'special');
			ref.features = ref.features.filter((feature) => feature.kind !== 'special');
			ref.alwaysFrontFeatures = ref.alwaysFrontFeatures.filter((feature) => feature.kind !== 'special');
		}
		
		let filesRemaining = 1; // Include a dummy entry to cover cases where there's nothing to load.
		
		let fileLoaded = function () {
			--filesRemaining;
			
			if (filesRemaining === 0) {
				// All textures loaded. Generate the image.
				
				lib.downloadImageNoPreload(ref);
			}
		}
		
		// Load any textures we need for sprites.
		
		for (let feature of ref.features) {
			if (feature != null) {
				for (let sprite of feature.sprites) {
					if (sprite.texture != null) {
						let url = util.contentURI(`${sprite.texture}.png`);
						
						if (!ref.imageBitmaps.has(url)) {
							ref.imageBitmaps.set(url, null);
							++filesRemaining;
							
							window.fetch(url)
								.then(function (response) {return response.blob();})
								.then(function (blob) {return window.createImageBitmap(blob);})
								.then(function (imageBitmap) {
									ref.imageBitmaps.set(url, imageBitmap);
									fileLoaded();
								});
						}
					}
				}
			}
		}
		
		fileLoaded();
	};
	
	lib.downloadImageNoPreload = function (ref) {
		let canvas = document.createElement('canvas');
		canvas.width = ref.backCanvas.width;
		canvas.height = ref.backCanvas.height;
		let context = canvas.getContext('2d');
		context.fillStyle = '#fff';
		let sources;
		
		// Back and Buildings layers.
		
		sources = [{
			layerDepth: 0,
			element: ref.backCanvas,
			y: 0,
		}];
		
		for (let feature of ref.backFeatures) {
			for (let sprite of feature.sprites) {
				sources.push({
					layerDepth: sprite.layerDepth,
					feature: feature,
					sprite: sprite,
				});
			}
		}
		
		lib.drawSourcesToContext(context, sources, ref.imageBitmaps);
		
		// Front layers.
		
		sources = [...ref.frontRows];
		
		for (let feature of ref.features) {
			if (feature != null) {
				for (let sprite of feature.sprites) {
					sources.push({
						layerDepth: sprite.layerDepth,
						feature: feature,
						sprite: sprite,
					});
				}
			}
		}
		
		lib.drawSourcesToContext(context, sources, ref.imageBitmaps);
		
		// AlwaysFront layers.
		
		sources = [{
			layerDepth: 0,
			element: ref.alwaysFrontCanvas,
			y: 0,
		}];
		
		for (let feature of ref.alwaysFrontFeatures) {
			for (let sprite of feature.sprites) {
				sources.push({
					layerDepth: sprite.layerDepth,
					feature: feature,
					sprite: sprite,
				});
			}
		}
		
		lib.drawSourcesToContext(context, sources, ref.imageBitmaps);
		
		// Download the result.
		
		let link = document.createElement('a');
		link.href = canvas.toDataURL();
		link.download = (ref.plan.name || 'Plan') + '.png';
		link.click();
		URL.revokeObjectURL(link.href);
	};
	
	lib.drawSourcesToContext = function (context, sources, imageBitmaps) {
		sources.sort(function (a, b) {
			return a.layerDepth - b.layerDepth;
		});
		
		for (let source of sources) {
			if (source.element != null) {
				context.drawImage(source.element, 0, source.y * source.element.height);
			}
			else {
				let feature = source.feature;
				let sprite = source.sprite;
				
				if (sprite.tintColor !== null) {
					context.globalAlpha = (sprite.tintColor?.[3] ?? 255) / 255;
					let filter = util.getTintFilter(sprite.tintColor[0] ?? 255, sprite.tintColor[1] ?? 255, sprite.tintColor[2] ?? 255, true, sprite.linearTint);
					
					if (filter !== null) {
						context.filter = filter;
					}
				}
				
				context.translate(feature.tileX * 16 + sprite.x + sprite.width * .5, feature.tileY * 16 + sprite.y + sprite.height * .5);
				
				if (sprite.scale !== 1 || sprite.rotation !== 0) {
					let translateX = (sprite.origin[0] ?? 0) - sprite.width * .5;
					let translateY = (sprite.origin[1] ?? 0) - sprite.height * .5;
					context.translate(translateX, translateY);
					context.scale(sprite.scale, sprite.scale);
					context.rotate(sprite.rotation);
					context.translate(-translateX, -translateY);
				}
				
				if (sprite.effects & (Sprite.EF_FLIP_HORIZONTALLY | Sprite.EF_FLIP_VERTICALLY)) {
					context.scale((sprite.effects & Sprite.EF_FLIP_HORIZONTALLY) ? -1 : 1, (sprite.effects & Sprite.EF_FLIP_VERTICALLY) ? -1 : 1);
				}
				
				context.translate(sprite.width * -.5, sprite.height * -.5);
				
				switch (sprite.type) {
				case Sprite.TYPE_SOLID:
					context.fillRect(0, 0, sprite.width, sprite.height);
					break;
				
				case Sprite.TYPE_TEXTURE: {
					if (sprite.texture != null && sprite.paint == null) {
						let imageBitmap = imageBitmaps.get(util.contentURI(`${sprite.texture}.png`));
						
						if (imageBitmap != null) {
							context.drawImage(imageBitmap, sprite.sheetX, sprite.sheetY, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
						}
					}
					
					break;
				}}
				
				for (let canvas of sprite.paintCanvases ?? []) {
					context.drawImage(canvas, 0, 0);
				}
				
				context.resetTransform();
				context.globalAlpha = 1;
				context.filter = 'none';
			}
		}
	};
	
	//== Game States ==//
	
	lib.setGameStates = function (values, triggerUpdate = true) {
		let changedStates = [];
		
		for (let [key, value] of values) {
			if (value != null && lib.gameState[key] === value) {
				continue;
			}
			
			$(`#maps-gamestate-${key}`).find('input, select').each(function () {
				if (value == null) {
					value = lib.getGameStateInputValue(this, true);
				}
				
				lib.setGameStateInputValue(this, value);
			});
			
			lib.gameState[key] = value;
			changedStates.push(key);
		}
		
		if (triggerUpdate && changedStates.length > 0) {
			lib.gameStateUpdate(changedStates);
		}
	};
	
	lib.gameStateUpdate = function (changedStates) {
		if (changedStates.includes('farmType')) {
			// The Farm's location data depends on the farmType game state. Update it.
			
			lib.activePlan.data.locationPlans.Farm?.location?.updateData(core);
		}
		
		if (changedStates.includes('seasonNumber')) {
			// The season can affect the tilesheet URLs on any map. Do a full update.
			
			lib.mapCache.forceFullUpdate = true;
		}
		
		for (let locationPlan of Object.values(lib.activePlan.data.locationPlans)) {
			for (let feature of locationPlan.features) {
				if (feature != null) {
					lib.updateFeature(feature, locationPlan.location);
				}
			}
		}
		
		lib.mapCache.forceMapUpdate = true;
		core.baseUtil.updateTab('maps', false, +$('#maps-current').val());
	};
	
	lib.getGameStateInputValue = function (element, useDefault = false) {
		return util.getInputValue(element, true, useDefault);
	};
	
	lib.setGameStateInputValue = function (element, value) {
		util.setInputValue(element, value, true);
	};
	
	lib.getGameStateKeyVisibilities = function* (location) {
		let locationContext = location.getLocationContext();
		let empty = [];
		let result = [];
		
		for (let field of lib.gameStateFields) {
			result[0] = field.key;
			result[1] =
				(field.locations == null && field.locationContexts == null && field.locationTypes == null) ||
				(field.locations ?? empty).includes(location.name) ||
				(field.locationContexts ?? empty).includes(locationContext) ||
				(field.locationTypes ?? empty).includes(location.type);
			yield result;
		}
	};
	
	//== Options ==//
	
	lib.getOptionInputName = function (element) {
		return element.name.replace(/^maps-/, '');
	};
	
	lib.getOptionInputValue = function (element) {
		return util.getInputValue(element, true);
	};
	
	lib.setOptionInputValue = function (element, value) {
		util.setInputValue(element, value, true);
	};
	
	//== Plan Management ==//
	
	lib.setActivePlan = function (plan) {
		lib.activePlan = plan;
		
		for (let key of Object.keys(lib.gameState)) {
			delete lib.gameState[key];
		}
		
		Object.assign(lib.gameState, plan.data.gameState);
		
		$('#maps-sec-options .maps-gamestate').find('input, select').each(function () {
			let key = this.name.replace(/^maps-gamestate-/, '');
			let value = lib.gameState[key];
			
			if (value == null) {
				value = lib.getGameStateInputValue(this, true);
				lib.gameState[key] = value;
			}
			
			lib.setGameStateInputValue(this, value);
		});
	};
	
	lib.loadPlan = async function (plan) {
		let planData = await lib.decompressPlanData(plan.data);
		let locationPlans = planData.locationPlans;
		planData.locationPlans = {};
		
		lib.setActivePlan({
			name: plan.name,
			format: plan.format,
			data: planData,
		});
		
		for (let values of Object.values(locationPlans)) {
			let location = ext.locations[values.locationId];
			let locationPlan = new LocationPlan(location);
			locationPlan.importValues(values);
			lib.activePlan.data.locationPlans[location.id] = locationPlan;
			
			for (let feature of locationPlan.features) {
				lib.updateFeature(feature, location);
			}
		}
		
		lib.clearUndoHistory();
		lib.setHasUnsavedChanges(false, true);
		$('#maps-plan-name').val(plan.name);
		lib.mapCache.forceFullUpdate = true;
		core.baseUtil.updateTab('maps', false, +$('#maps-current').val());
	};
	
	lib.packPlan = async function (plan) {
		let planData = {...plan.data};
		
		if (planData.type === 'game') {
			planData.type = 'default';
		}
		
		planData.gameState = {};
		planData.locationPlans = {};
		
		for (let [locationId, locationPlan] of Object.entries(plan.data.locationPlans)) {
			if (locationPlan.initialState) {
				continue;
			}
			
			for (let [key, visibility] of lib.getGameStateKeyVisibilities(locationPlan.location)) {
				if (visibility) {
					planData.gameState[key] = lib.gameState[key];
				}
			}
			
			planData.locationPlans[locationId] = locationPlan.getExportValues();
		}
		
		return {
			name: plan.name,
			format: lib.SUPPORTED_PLAN_FORMAT,
			data: await lib.compressPlanData(planData),
		};
	};
	
	lib.compressPlanData = async function (planData) {
		try {
			let stream = new Blob([JSON.stringify(planData)])
				.stream()
				.pipeThrough(new CompressionStream('deflate-raw'));
			let bytes = await new Response(stream).bytes();
			return btoa(Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')); // Until bytes.toBase64() is widely supported.
		}
		catch (ex) {
			// Failed to compress (likely unsupported). Store the uncompressed data instead.
			
			return planData;
		}
	};
	
	lib.decompressPlanData = async function (planData) {
		if (typeof planData !== 'string') {
			// Uncompressed data.
			
			return planData;
		}
		
		let bytes = Uint8Array.from(atob(planData), (char) => char.codePointAt(0)); // Until Uint8Array.fromBase64(planData) is widely supported.
		let stream = new Blob([bytes])
			.stream()
			.pipeThrough(new DecompressionStream('deflate-raw'));
		let json = await new Response(stream).text();
		return JSON.parse(json);
	};
	
	lib.store = function (key, value) {
		if (!util.store(`maps.${key}`, value)) {
			window.alert('Unable to save data, because storage is full. Try deleting some plans first.');
			return false;
		}
		
		return true;
	};
	
	lib.retrieve = function (key) {
		return util.retrieve(`maps.${key}`);
	};
	
	lib.retrievePlans = function () {
		let plans = lib.retrieve('plans');
		return (plans instanceof Array) ? plans : [];
	};
	
	lib.regenPlanList = function () {
		let $select = $('#maps-select-plan');
		$select.empty();
		$select.append('<option value="">(Current game state)</option>');
		$select.append('<option value="default">(New farm plan)</option>');
		$select.append('<option value="empty">(New empty plan)</option>');
		let plans = lib.retrievePlans();
		plans.sort(function (a, b) {
			return String.prototype.localeCompare.call(a.name ?? '', b.name ?? '');
		});
		
		for (let plan of plans) {
			// We're only measuring the size of the data and name, not
			// technically the entire plan entry. The rest of the entry is
			// normally insignificant in size, so it isn't worth re-serializing
			// it to get a more precise measurement.
			
			$select.append(`<option value="@${util.escapeHTML(plan.name)}">${util.escapeHTML(plan.name)} (${((plan.data.length + plan.name.length) / 1000).toFixed(1)} kB)</option>`);
		}
	};
	
	lib.createGamePlan = function () {
		return lib.createPlan('game', `${common.player.farmName}_${save.gameID}_${save.daysPlayed}`, ext.gameState);
	};
	
	lib.createPlan = function (type, name, gameState = null) {
		if (gameState != null) {
			gameState = {...gameState};
		}
		else {
			gameState = {...lib.newGameState};
			gameState.farmType = lib.gameState.farmType;
		}
		
		return {
			name: name,
			format: lib.SUPPORTED_PLAN_FORMAT,
			data: {
				type: type,
				gameState: gameState,
				locationPlans: {},
			},
		};
	};
	
	lib.setHasUnsavedChanges = function (state, saveButtonState) {
		if (state) {
			lib.locationPlan.initialState = false;
		}
		
		extension.hasUnsavedChanges = state;
		$('#maps-button-save').toggleClass('disabled', !saveButtonState);
		$('#maps-save-plan').prop('disabled', !saveButtonState);
	};
	
	//== Floating Features ==//
	
	lib.floatFeatures = function (features, grabX = null, grabY = null, move = false) {
		// Warning: This may modify the provided features array.
		
		let minX = Infinity;
		let minY = Infinity;
		let maxX = 0;
		let maxY = 0;
		
		for (let feature of features) {
			minX = Math.min(minX, feature.tileX);
			maxX = Math.max(maxX, feature.tileX + feature.meta.width);
			minY = Math.min(minY, feature.tileY);
			maxY = Math.max(maxY, feature.tileY + feature.meta.height);
		}
		
		grabX ??= Math.floor((minX + maxX) / 2);
		grabY ??= Math.floor((minY + maxY) / 2);
		
		let html = '';
		let hasPlanUpdate = false;
		
		$('#maps-tool-move').trigger('click').removeClass('active');
		lib.floating = {
			features: features,
			relX: minX - grabX,
			relY: minY - grabY,
			originalX: minX,
			originalY: minY,
		};
		
		let $container = $('#maps-floating-feature');
		$container.empty();
		
		for (let [i, feature] of features.entries()) {
			let updated = false;
			
			if (feature.meta.maxGrabbableAccessoryIndex >= 0 && !lib.selectedFeatures.has(feature)) {
				let restorationDetails = move ? window.structuredClone(feature.details) : null;
				let floatFeature = lib.grabAccessory(feature, move);
				
				if (floatFeature != null) {
					if (move && feature.index >= 0) {
						lib.redrawFeature(feature);
						updated = true;
						hasPlanUpdate = true;
						floatFeature.index = feature.index;
						floatFeature.restorationDetails = restorationDetails;
					}
					
					floatFeature.tileX += feature.tileX + grabX - minX;
					floatFeature.tileY += feature.tileY + grabY - minY;
					feature = floatFeature;
					features[i] = feature;
					lib.updateFeature(feature);
					lib.drawFeature(feature);
				}
			}
			
			if (!updated && feature.index >= 0) {
				if (move) {
					lib.features[feature.index] = null;
					lib.detachFeature(feature);
					hasPlanUpdate = true;
				}
				else {
					feature = Feature.from(feature);
					features[i] = feature;
					lib.updateFeature(feature);
					lib.drawFeature(feature);
				}
			}
			
			feature.tileX -= minX;
			feature.tileY -= minY;
			lib.recalculateFeature(feature, true);
			let element = $(lib.getFeatureHTML(feature, true))[0];
			$container.append(element);
			lib.initFeatureElement(feature, element);
		}
		
		$('.maps-catalogue-item.active').removeClass('active');
		lib.clearSelection();
		
		if (hasPlanUpdate) {
			lib.updateOverlay();
		}
	};
	
	lib.cancelFloating = function (selectAll = false) {
		if (lib.floating == null) {
			return;
		}
		
		if (lib.mapCache.map == null) {
			lib.clearFloating();
			return;
		}
		
		lib.clearSelection();
		
		for (let feature of lib.floating.features) {
			if (feature.index >= 0) {
				// Cancel moving an existing feature.
				
				if (feature.restorationDetails != null) {
					// This is an accessory being moved. Restore the original feature.
					
					let details = feature.restorationDetails;
					feature = lib.features[feature.index];
					feature.details = details;
					lib.redrawFeature(feature);
				}
				else {
					lib.features[feature.index] = feature;
					feature.tileX += lib.floating.originalX;
					feature.tileY += lib.floating.originalY;
					
					// TODO: Deal with a scenario where the tile the object/terrainFeature is being returned to is somehow occupied now. What if neither feature can be erased? Can this scenario even occur without hacking?
					
					lib.attachFeature(feature);
				}
				
				if (selectAll || lib.floating.features.length > 1) {
					lib.selectedFeatures.add(feature);
				}
			}
		}
		
		lib.clearFloating();
		lib.updateOverlay();
		lib.highlightSelectedFeatures();
	};
	
	lib.copyFloating = function () {
		if (lib.floating == null) {
			return;
		}
		
		for (let feature of lib.floating.features) {
			if (feature.index >= 0) {
				// This feature is being moved. Copy it back to where it was.
				
				if (feature.restorationDetails != null) {
					let original = lib.features[feature.index];
					original.details = feature.restorationDetails;
					lib.redrawFeature(original);
					feature.restorationDetails = null;
				}
				else {
					let clone = Feature.from(feature);
					lib.features[feature.index] = clone;
					clone.tileX += lib.floating.originalX;
					clone.tileY += lib.floating.originalY;
					lib.updateFeature(clone);
					lib.drawFeature(clone);
					lib.attachFeature(clone);
				}
				
				feature.index = -1;
			}
		}
		
		lib.updateOverlay();
		lib.hoverTile();
	};
	
	lib.clearFloating = function () {
		lib.floating = null;
		$('#maps-floating-feature').css('display', 'none').html('');
		$('.maps-catalogue-item.active').removeClass('active');
	};
	
	lib.checkFloatingDestination = function (tileX, tileY, drawOverlay) {
		let map = lib.mapCache.map;
		
		let result = true;
		let isSingle = (lib.floating.features.length === 1);
		
		for (let feature of lib.floating.features) {
			let canBuildTile = null;
			
			for (let tile of lib.mapLocation.getAllPlacementTiles(feature)) {
				let checkX = tileX + feature.tileX + tile.tileX;
				let checkY = tileY + feature.tileY + tile.tileY;
				
				if (!map.isTileOnMap(checkX, checkY)) {
					if (drawOverlay) {
						result = false;
						continue;
					}
					
					return false;
				}
				
				let checkTileIndex = map.getTileIndex(checkX, checkY);
				
				// Furniture checks the entire area at once, so we'll only use its
				// first result.
				
				if (canBuildTile === null || feature.kind !== 'furniture') {
					canBuildTile = lib.mapLocation.canBePlacedHere(checkX, checkY, feature, undefined, isSingle);
				}
				
				if (feature.kind === 'objects') {
					if (!canBuildTile) {
						// Check if another floating feature resolves this (example: a floating tree resolves a floating tapper).
						
						for (let otherFeature of lib.floating.features) {
							if (otherFeature !== feature && lib.mapLocation.featureOccupiesTile(otherFeature, feature.tileX + tile.tileX, feature.tileY + tile.tileY)) {
								if (lib.mapLocation.canBePlacedHere(checkX, checkY, otherFeature, undefined, isSingle)) {
									canBuildTile = true;
									break;
								}
							}
						}
					}
				}
				else {
					let oldFeature = lib.locationPlan.featureLookup[feature.kind]?.[checkTileIndex];
					
					if (oldFeature != null && !lib.canEraseFeature(oldFeature)) {
						// There can be only one of this kind of feature per tile, and the existing feature can't be erased.
						
						canBuildTile = false;
					}
				}
				
				if (drawOverlay) {
					$(lib.overlayCells[checkTileIndex]).addClass(canBuildTile ? 'build-ok' : 'build-bad');
					result &&= canBuildTile;
				}
				else if (!canBuildTile) {
					return false;
				}
			}
		}
		
		return result;
	};
	
	lib.placeFloating = function (tileX, tileY) {
		if (lib.festival !== null) {
			return;
		}
		
		lib.clearSelection();
		let moved = false;
		
		for (let feature of lib.floating.features) {
			let oldFeature = lib.locationPlan.featureLookup[feature.kind]?.[lib.mapCache.map.getTileIndex(feature.tileX + tileX, feature.tileY + tileY)];
			
			if (oldFeature != null) {
				// Only one of this kind of feature per tile. Replace the existing feature.
				
				lib.eraseFeature(oldFeature);
			}
			
			if (feature.index >= 0 && feature.restorationDetails != null) {
				// Moving an accessory from an existing feature.
				
				lib.actions.push({
					type: lib.UNDO_FEATURE,
					index: feature.index,
					details: feature.restorationDetails,
				});
				feature.index = -1;
				feature.restorationDetails = null;
				moved = true;
			}
			
			if (feature.index >= 0) {
				// Moving an existing feature.
				
				lib.actions.push({
					type: lib.UNDO_FEATURE,
					index: feature.index,
					tileX: feature.tileX + lib.floating.originalX,
					tileY: feature.tileY + lib.floating.originalY,
				});
				feature.tileX += tileX;
				feature.tileY += tileY;
				moved = true;
				lib.features[feature.index] = feature;
				lib.updateFeature(feature);
				
				if (lib.floating.features.length > 1 || feature.meta.maxGrabbableAccessoryIndex >= 0) {
					lib.selectedFeatures.add(feature);
				}
			}
			else {
				// Adding a new feature.
				
				feature = Feature.from(feature);
				feature.tileX += tileX;
				feature.tileY += tileY;
				lib.setAdded(feature);
				lib.updateFeature(feature);
				
				if (!lib.options.noRandom) {
					lib.initRandomVariation(feature);
				}
				
				feature.index = lib.features.length;
				lib.features.push(feature);
				lib.featureElements.push(null);
				lib.actions.push({
					type: lib.UNDO_FEATURE,
					index: feature.index,
					kind: null,
				});
				
				if (lib.dragging && lib.floating.features.length > 1) {
					lib.selectedFeatures.add(feature);
				}
			}
			
			lib.drawFeature(feature);
			lib.attachFeature(feature);
		}
		
		if (moved || lib.dragging) {
			lib.clearFloating();
			$(moved ? '#maps-tool-move' : '#maps-tool-copy').trigger('click');
		}
		
		lib.highlightSelectedFeatures();
	};
	
	lib.setAdded = function (feature) {
		if (feature.details['sp:added'] == null) {
			util.addDetail(feature.details, {'@@': 'sp:added', $: 'true'});
		}
	};
	
	lib.attachFeature = function (feature, localOnly = false) {
		lib.recalculateFeature(feature);
		let element = $(lib.getFeatureHTML(feature))[0];
		$('#maps-sprites-front').append(element);
		lib.initFeatureElement(feature, element);
		lib.featureElements[feature.index] = element;
		
		for (let tileIndex of feature.obscures.values()) {
			lib.tileObscuredBy[tileIndex].push(feature.index);
		}
		
		if (feature.meta.pathTypes) {
			for (let pathType of feature.meta.pathTypes) {
				if (!Object.hasOwn(lib.paths, pathType)) {
					lib.paths[pathType] = new Set();
				}
				
				lib.paths[pathType].add(feature.tileX + feature.tileY * 10000);
			}
			
			if (!localOnly) {
				lib.redrawNeighborPaths(feature);
			}
		}
		
		if (feature.meta.warp != null) {
			feature.warpIndex = lib.featureWarps.length;
			lib.featureWarps.push(new Warp(feature.tileX + feature.meta.warp.x, feature.tileY + feature.meta.warp.y, feature.meta.warp.locationId, feature.meta.warp.destX, feature.meta.warp.destY));
		}
		
		if (feature.meta.domainType != null) {
			if (!Object.hasOwn(lib.featuresByDomainType, feature.meta.domainType)) {
				lib.featuresByDomainType[feature.meta.domainType] = [];
			}
			
			lib.featuresByDomainType[feature.meta.domainType].push(feature);
		}
		
		if (Object.hasOwn(lib.locationPlan.featureLookup, feature.kind)) {
			lib.locationPlan.featureLookup[feature.kind][lib.mapCache.map.getTileIndex(feature.tileX, feature.tileY)] = feature;
		}
	};
	
	lib.detachFeature = function (feature, localOnly = false) {
		$(lib.featureElements[feature.index]).remove();
		lib.featureElements[feature.index] = null;
		
		for (let tileIndex of feature.obscures.values()) {
			let obscuredBy = lib.tileObscuredBy[tileIndex];
			let index = obscuredBy.indexOf(feature.index);
			
			if (index !== -1) {
				obscuredBy.splice(index, 1);
			}
		}
		
		if (feature.meta.pathTypes) {
			for (let pathType of feature.meta.pathTypes) {
				lib.paths[pathType].delete(feature.tileX + feature.tileY * 10000);
			}
			
			if (!localOnly) {
				lib.redrawNeighborPaths(feature);
			}
		}
		
		if (feature.warpIndex != null) {
			let warp = lib.featureWarps[feature.warpIndex];
			
			if (warp && warp.element != null) {
				$(warp.element).remove();
			}
			
			lib.featureWarps[feature.warpIndex] = null;
			feature.warpIndex = null;
		}
		
		if (feature.meta.domainType != null) {
			let features = lib.featuresByDomainType[feature.meta.domainType];
			let index = features.indexOf(feature);
			
			if (index !== -1) {
				features.splice(index, 1);
			}
		}
		
		if (Object.hasOwn(lib.locationPlan.featureLookup, feature.kind)) {
			delete lib.locationPlan.featureLookup[feature.kind][lib.mapCache.map.getTileIndex(feature.tileX, feature.tileY)];
		}
	};
	
	lib.redrawFeature = function (feature, localOnly = false) {
		lib.detachFeature(feature, localOnly);
		lib.updateFeature(feature);
		lib.drawFeature(feature);
		lib.attachFeature(feature, localOnly);
	};
	
	lib.redrawNeighborPaths = function (feature) {
		let featureTable = lib.locationPlan.featureLookup[feature.kind];
		
		for (let y = -1; y <= 1; ++y) {
			for (let x = -1; x <= 1; ++x) {
				if (y !== 0 || x !== 0) {
					let tileX = feature.tileX + x;
					let tileY = feature.tileY + y;
					
					for (let pathType of feature.meta.pathTypes) {
						if (lib.paths[pathType].has(tileX + tileY * 10000)) {
							// This neighbor needs to be redrawn.
							
							let neighbor = featureTable[lib.mapCache.map.getTileIndex(tileX, tileY)];
							
							if (neighbor != null) {
								lib.redrawFeature(neighbor, true);
							}
							
							break;
						}
					}
				}
			}
		}
	};
	
	lib.updateHighlightTypes = function () {
		lib.highlightTypes = ['special'];
		
		for (let option in lib.options) {
			if (Object.hasOwn(lib.options, option) && lib.options[option]) {
				if (/^highlight-/.test(option)) {
					lib.highlightTypes.push(option.substring(10));
				}
			}
		}
	};
	
	lib.updateOverlay = function () {
		let map = lib.mapCache.map;
		
		lib.mapLocation.enableWaterCache();
		lib.tileFeatures = {};
		
		for (let feature of lib.features) {
			if (feature != null) {
				lib.addTileFeature(feature);
			}
		}
		
		lib.highlightTileIndices.clear();
		
		for (let highlightType of lib.highlightTypes) {
			for (let feature of lib.featuresByDomainType[highlightType] ?? []) {
				for (let tileIndex of feature.domainTileIndices ?? []) {
					lib.highlightTileIndices.add(tileIndex);
				}
			}
		}
		
		if (lib.options.diggable || (lib.options.farmable && lib.location.data.CanPlantHere)) {
			for (let y = 0, tileIndex = 0; y < map.height; ++y) {
				for (let x = 0; x < map.width; ++x, ++tileIndex) {
					if (
						lib.mapLocation.doesTileHaveProperty(x, y, 'Diggable', 'Back') != null &&
						lib.mapLocation.isTilePassable(x, y) &&
						(lib.options.diggable || lib.mapLocation.canPlantSeedsHere(x, y))
					) {
						lib.highlightTileIndices.add(tileIndex);
					}
				}
			}
		}
		else if (lib.options.paddies && lib.location.data.CanPlantHere) {
			let prevIsWaterTile = false;
			
			for (let tileY = 0; tileY < map.height; ++tileY) {
				for (let tileX = 0; tileX < map.width; ++tileX) {
					if (!lib.mapLocation.isWaterTile(tileX, tileY)) {
						prevIsWaterTile = false;
					}
					else {
						// Found a water tile. Check for suitable tiles within a 7x7 square.
						// Avoid redundantly checking sides that will be checked by neighboring water tiles.
						
						let apothemTop = (tileY <= 0 || lib.mapLocation.isWaterTile(tileX, tileY - 1)) ? 0 : -3;
						let apothemBottom = (tileY + 1 >= map.height || lib.mapLocation.isWaterTile(tileX, tileY + 1)) ? 0 : 3;
						let apothemLeft = (tileX <= 0 || prevIsWaterTile) ? 0 : -3;
						let apothemRight = (tileX + 1 >= map.width || lib.mapLocation.isWaterTile(tileX + 1, tileY)) ? 0 : 3;
						prevIsWaterTile = true;
						
						for (let y = apothemTop; y <= apothemBottom; ++y) {
							for (let x = apothemLeft; x <= apothemRight; ++x) {
								if (x === 0 && y === 0) {
									continue;
								}
								
								let checkX = tileX + x;
								let checkY = tileY + y;
								
								if (map.isTileOnMap(checkX, checkY)) {
									if (
										lib.mapLocation.doesTileHaveProperty(checkX, checkY, 'Diggable', 'Back') != null &&
										lib.mapLocation.isTilePassable(checkX, checkY) &&
										lib.mapLocation.canPlantSeedsHere(checkX, checkY)
									) {
										lib.highlightTileIndices.add(map.getTileIndex(checkX, checkY));
									}
								}
							}
						}
					}
				}
			}
		}
		
		for (let td of lib.overlayCells) {
			lib.updateOverlayTile(td);
		}
		
		// Update warps.
		
		let $warps = $('#maps-warps').empty();
		
		for (let warps of [map.warps, lib.annotationWarps, lib.featureWarps]) {
			for (let warp of warps) {
				if (warp != null && ext.locations[warp.locationId] != null) {
					let locationId = warp.locationId;
					let destTileX = warp.destX ?? ext.locations[locationId].data.DefaultArrivalTile?.X ?? null;
					let destTileY = warp.destY ?? ext.locations[locationId].data.DefaultArrivalTile?.Y ?? null;
					
					// See StardewValley.Game1:warpCharacter()
					
					if (locationId === 'Trailer' && lib.gameState.pamHouseUpgrade) {
						locationId = 'Trailer_Big';
						
						if (destTileX === 12 && destTileY === 9) {
							destTileX = 13;
							destTileY = 24;
						}
					}
					
					let dest = (destTileX !== null || destTileY !== null) ? `${destTileX},${destTileY}` : 'Entrance';
					let $warp = $(`<div class="warp" style="left: ${warp.x * map.tileWidth}px; top: ${warp.y * map.tileHeight}px;" title="Warp to ${ext.locations[locationId].displayName ?? locationId} (${dest})"></div>`);
					$warp.on('click', function () {
						lib.warp(locationId, destTileX, destTileY);
					});
					$warps.append($warp);
					warp.element = $warp[0];
				}
			}
		}
		
		lib.mapLocation.disableWaterCache();
	};
	
	lib.warp = function (locationId, tileX, tileY) {
		lib.destTileX = tileX;
		lib.destTileY = tileY;
		$('#maps-location').val(locationId);
		let tabInitialized = core.tabsUpdated.has('maps');
		
		if (!$('#tab-maps').prop('checked')) {
			$('#tab-maps').prop('checked', true).trigger('change');
		}
		
		if (tabInitialized) {
			$('#maps-location').trigger('change');
		}
	};
	
	lib.updateOverlayTile = function (td) {
		let tileIndex = +td.dataset.tileIndex;
		let tileX = +td.dataset.x;
		let tileY = +td.dataset.y;
		let hoverText = `(${tileX},${tileY})`;
		let className = 'tile';
		
		if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
			let feature = lib.tileFeatures[tileIndex];
			
			if (feature.meta.name) {
				hoverText += ' - ' + feature.meta.name + feature.getStyledNotes();
			}
			
			if (lib.highlightTypes.includes(feature.meta.domainType) && feature.domain.length === 0) {
				className += ' highlight-single';
				
				if (feature.width === 1 && feature.height === 1) {
					className += ' highlight-single-all';
				}
				else {
					if (feature.tileY === tileY) className += ' highlight-single-top';
					if (feature.tileX + feature.meta.width - 1 === tileX) className += ' highlight-single-right';
					if (feature.tileY + feature.meta.height - 1 === tileY) className += ' highlight-single-bottom';
					if (feature.tileX === tileX) className += ' highlight-single-left';
				}
			}
		}
		else if (Object.hasOwn(lib.mapCache.annotations, tileIndex)) {
			for (let annotation of lib.mapCache.annotations[tileIndex]) {
				let value = annotation.value;
				
				switch (annotation.type) {
				case 'Action':
					switch (value[0]) {
					case 'Billboard':
						if (value[1] === '3' && core.isExtensionEnabled('quests')) {
							let quest = core.extensions.quests.lib.getQuestOfTheDay(lib.gameState);
							
							if (quest === null) {
								hoverText += ' - Help Wanted: (None)';
							}
							else {
								hoverText += ' - Help Wanted: ' + core.extensions.quests.lib.getQuestHTML(quest, 'plainText');
							}
						}
					}
				}
			}
		}
		
		if (lib.highlightTileIndices.has(tileIndex)) {
			className += ' highlight';
		}
		
		if (lib.options.fishingDistance && lib.mapLocation.isWaterTile(tileX, tileY)) {
			className += ' fishing-distance-' + lib.mapLocation.getFishingDistance(tileX, tileY);
		}
		
		if (lib.options.forageableSpawning) {
			let rate = lib.mapLocation.getForageableSpawnRate(tileX, tileY, lib.options.forageableSpawningIgnoreErasable);
			
			if (rate > .5) {
				className += ' spawnable-high';
			}
			else if (rate > 0) {
				className += ' spawnable-low';
			}
		}
		
		if (lib.options.cropSpawning) {
			let rate = lib.mapLocation.getCropSpawnRate(tileX, tileY, lib.options.cropSpawningIgnoreErasable);
			
			if (rate > .5) {
				className += ' spawnable-crop-high';
			}
			else if (rate > 0) {
				className += ' spawnable-crop-low';
			}
		}
		
		if (lib.options.showGrid) {
			className += ' grid-cell';
		}
		
		td.className = className;
		td.title = hoverText;
	};
	
	//== Selections ==//
	
	lib.canSelect = function (tileIndex) {
		if (lib.floating != null) {
			return false;
		}
		
		switch (lib.tool) {
		case 'select':
			return true;
		
		case 'move':
		case 'copy':
			if (lib.selectionRect !== null) {
				return true;
			}
			
			return !Object.hasOwn(lib.tileFeatures, tileIndex);
		}
		
		return false;
	};
	
	lib.clearSelection = function () {
		lib.selectedFeatures.clear();
		$('.maps-feature.selected').removeClass('selected');
	};
	
	lib.updateSelectionRect = function (tileX, tileY) {
		lib.hoverTileX = tileX;
		lib.hoverTileY = tileY;
		let $selection = $('#maps-selection');
		
		if (lib.selectionRect === null) {
			if (tileX === null || (lib.tool !== 'inspect' && lib.tool !== 'select')) {
				$selection.css('display', 'none');
			}
			else {
				$selection
					.removeClass('multi')
					.css('width', '16px')
					.css('height', '16px')
					.css('display', 'block')
					.css('left', `${tileX * 16}px`)
					.css('top', `${tileY * 16}px`);
			}
			
			return;
		}
		
		$selection
			.addClass('multi')
			.css('display', 'block')
			.css('left', `${Math.min(lib.selectionRect[0], lib.selectionRect[2]) * 16}px`)
			.css('top', `${Math.min(lib.selectionRect[1], lib.selectionRect[3]) * 16}px`)
			.css('width', `${Math.abs(lib.selectionRect[2] - lib.selectionRect[0]) * 16 + 16}px`)
			.css('height', `${Math.abs(lib.selectionRect[3] - lib.selectionRect[1]) * 16 + 16}px`);
		
		lib.highlightSelectedFeatures();
	};
	
	lib.highlightSelectedFeatures = function () {
		$('.maps-feature.selected').removeClass('selected');
		
		for (let feature of lib.selectedFeatures) {
			lib.featureElements[feature.index].classList.add('selected');
		}
		
		for (let feature of lib.getPendingSelectedFeatures()) {
			lib.featureElements[feature.index].classList.add('selected');
		}
	};
	
	lib.getPendingSelectedFeatures = function* () {
		if (lib.selectionRect !== null) {
			let tileLeft = Math.min(lib.selectionRect[0], lib.selectionRect[2]);
			let tileRight = Math.max(lib.selectionRect[0], lib.selectionRect[2]);
			let tileTop = Math.min(lib.selectionRect[1], lib.selectionRect[3]);
			let tileBottom = Math.max(lib.selectionRect[1], lib.selectionRect[3]);
			
			for (let feature of lib.features) {
				if (feature != null && feature.tileX <= tileRight && feature.tileY <= tileBottom && (feature.tileX + feature.meta.width - 1) >= tileLeft && (feature.tileY + feature.meta.height - 1) >= tileTop) {
					yield feature;
				}
			}
		}
	};
	
	lib.moveSelection = function (feature = null, grabX = null, grabY = null) {
		let features;
		
		if (feature === null || lib.selectedFeatures.has(feature)) {
			if (lib.selectedFeatures.size === 0) {
				return;
			}
			
			features = lib.selectedFeatures.values();
		}
		else {
			features = [feature];
		}
		
		let movableFeatures = [];
		
		for (let feature of features) {
			if (!lib.canMoveFeature(feature)) {
				continue;
			}
			
			movableFeatures.push(feature);
		}
		
		if (movableFeatures.length === 0) {
			return;
		}
		
		lib.floatFeatures(movableFeatures, grabX, grabY, true);
		lib.hoverTile();
	};
	
	lib.copySelection = function (feature = null, grabX = null, grabY = null) {
		let features;
		
		if (feature === null || lib.selectedFeatures.has(feature)) {
			if (lib.selectedFeatures.size === 0) {
				return;
			}
			
			features = lib.selectedFeatures.values().toArray();
		}
		else {
			// Copy a single non-selected feature.
			
			features = [feature];
		}
		
		lib.floatFeatures(features, grabX, grabY);
		lib.hoverTile();
	};
	
	lib.eraseSelection = function (feature = null) {
		let features;
		
		if (feature === null || lib.selectedFeatures.has(feature)) {
			if (lib.selectedFeatures.size === 0) {
				return;
			}
			
			features = lib.selectedFeatures.values().toArray();
		}
		else {
			// Erase a single non-selected feature.
			
			features = [feature];
		}
		
		let hasPlanUpdate = false;
		
		for (let feature of features) {
			if (!lib.canEraseFeature(feature)) {
				continue;
			}
			
			let updated = false;
			
			if (feature.meta.maxAccessoryIndex >= 0 && !lib.selectedFeatures.has(feature)) {
				let action = {
					type: lib.UNDO_FEATURE,
					index: feature.index,
					details: window.structuredClone(feature.details),
				};
				
				updated = lib.removeAccessory(feature);
				
				if (updated) {
					lib.actions.push(action);
					lib.redrawFeature(feature);
					hasPlanUpdate = true;
				}
			}
			
			if (!updated) {
				lib.eraseFeature(feature);
				hasPlanUpdate = true;
			}
		}
		
		if (hasPlanUpdate) {
			lib.clearSelection();
			lib.setHasUnsavedChanges(true, true);
			lib.updateOverlay();
		}
	};
	
	lib.transformSelection = function (feature = null, backwards = false) {
		let features;
		
		if (feature === null || lib.selectedFeatures.has(feature)) {
			if (lib.selectedFeatures.size === 0) {
				return;
			}
			
			features = lib.selectedFeatures.values().toArray();
		}
		else {
			features = [feature];
		}
		
		let hasPlanUpdate = false;
		
		for (let feature of features) {
			let action = {
				type: lib.UNDO_FEATURE,
				index: feature.index,
				details: window.structuredClone(feature.details),
			};
			
			if (lib.changeVariation(feature, backwards ? lib.VAR_BACKWARDS : 0)) {
				hasPlanUpdate = true;
				lib.actions.push(action);
				lib.redrawFeature(feature);
			}
		}
		
		if (hasPlanUpdate) {
			lib.highlightSelectedFeatures();
			lib.setHasUnsavedChanges(true, true);
			lib.updateOverlay();
		}
	};
	
	//== Accessories ==//
	
	lib.removeAccessory = function (feature) {
		let accessory = feature.getTopAccessory();
		
		if (accessory == null) {
			return false;
		}
		
		switch (feature.kind) {
		case 'buildings':
			switch (accessory) {
			case 'FishPond.sign':
				feature.details.sign = {'Object@xsi:nil': 'true', 'Item': ''};
				return true;
			
			case 'FishPond.goldenAnimalCracker':
				feature.details.goldenAnimalCracker.boolean = 'false';
				return true;
			
			case 'FishPond.neededItem':
				feature.details.neededItem = {'Item@xsi:nil': 'true', 'Item': ''};
				return true;
			
			case 'FishPond.output':
				feature.details.output = {'Item@xsi:nil': 'true', 'Item': ''};
				return true;
			}
			
			break;
		
		case 'furniture':
			switch (accessory) {
			case 'heldObject':
				util.deleteDetail(feature.details, 'heldObject');
				return true;
			}
		
		case 'objects':
			switch (accessory) {
			case 'sprinklerUpgrade':
				util.deleteDetail(feature.details, 'heldObject');
				return true;
			
			case 'sprinklerTorch':
				feature.details.SpecialVariable = 0;
				return true;
			
			case 'Fence.heldObject':
				util.deleteDetail(feature.details, 'heldObject');
				return true;
			
			case 'IndoorPot.crop':
				util.deleteDetail(feature.details.hoeDirt, 'crop');
				util.deleteDetail(feature.details, 'heldObject');
				util.deleteDetail(feature.details, 'bush');
				return true;
			
			case 'readyForHarvest':
				feature.details.readyForHarvest = 'false';
				util.deleteDetail(feature.details, 'heldObject');
				return true;
			}
		}
		
		return false;
	};
	
	lib.grabAccessory = function (feature, move) {
		let accessory = feature.getTopGrabbableAccessory();
		
		if (accessory == null) {
			return null;
		}
		
		switch (feature.kind) {
		case 'furniture':
			switch (accessory) {
			case 'heldObject':
				return lib.extractHeldObject(feature.details, move);
			}
			
			break;
		
		case 'objects':
			switch (accessory) {
			case 'sprinklerTorch':
				if (move) {
					feature.details.SpecialVariable = 0;
				}
				
				return lib.createTorch();
			
			case 'Fence.heldObject':
				return lib.extractHeldObject(feature.details, move);
			
			case 'IndoorPot.crop':
				if (feature.details.bush != null) {
					let bush = window.structuredClone(util.rootDetails(feature.details, 'bush'));
					bush['@@'] = 'LargeTerrainFeature';
					bush['@xsi:type'] ??= 'Bush';
					
					if (bush.inPot?.boolean != null) {
						bush.inPot.boolean = 'false';
					}
					
					bush.drawShadow = 'true';
					
					if (move) {
						util.deleteDetail(feature.details, 'bush');
					}
					
					return new Feature('largeTerrainFeatures', 0, 0, bush);
				}
				else if (feature.details.heldObject != null) {
					return lib.extractHeldObject(feature.details, move);
				}
				else {
					let hoeDirt = window.structuredClone(util.rootDetails(feature.details, 'hoeDirt'));
					hoeDirt['@@'] = 'TerrainFeature';
					hoeDirt['@xsi:type'] ??= 'HoeDirt';
					hoeDirt.state = '0';
					hoeDirt.fertilizer = '0';
					
					if (move) {
						util.deleteDetail(feature.details.hoeDirt, 'crop');
					}
					
					return new Feature('terrainFeatures', 0, 0, hoeDirt);
				}
			}
			
			break;
		}
		
		return null;
	};
	
	lib.extractHeldObject = function (details, move, tagName = 'heldObject') {
		let heldObject = window.structuredClone(util.rootDetails(details, tagName));
		let itemType = core.items.getItemType(heldObject.itemId, heldObject);
		
		if (itemType === 'F') {
			heldObject['@@'] = 'Furniture';
			
			if (heldObject['@xsi:type'] === 'Furniture') {
				delete heldObject['@xsi:type'];
			}
		}
		else {
			heldObject['@@'] = 'Object';
		}
		
		if (move) {
			util.deleteDetail(details, tagName);
		}
		
		return new Feature((itemType === 'F') ? 'furniture' : 'objects', 0, 0, heldObject);
	};
	
	lib.createTorch = function () {
		let details = catalogue.createDetails(lib.mapLocation.featureContext, 'objects', {qualifiedItemId: '(O)93'}); // Torch
		return new Feature('objects', 0, 0, details);
	};
	
	//== Variations ==//
	
	lib.initRandomVariation = function (feature) {
		let needsUpdate = lib.changeVariation(feature, lib.VAR_NEW_FEATURE | lib.VAR_RANDOMIZE);
		
		if (lib.changePaint(feature, lib.VAR_NEW_FEATURE | lib.VAR_RANDOMIZE) === lib.PAINT_INSTANT) {
			needsUpdate = true;
		}
		
		if (needsUpdate) {
			lib.updateFeature(feature);
		}
	};
	
	lib.changeVariation = function (feature, flags = 0) {
		if (lib.festival !== null) {
			return false;
		}
		
		switch (feature.kind) {
		case 'buildings':
			switch (feature.meta.type) {
			case 'Barn':
			case 'Coop':
				lib.setVariationProperty(feature.details, 'animalDoorOpenAmount', flags, ['0', '1']);
				return true;
			
			case 'FishPond':
				lib.setVariationProperty(feature.details, 'nettingStyle', flags, [
					{int: '0'},
					{int: '1'},
					{int: '2'},
					{int: '3'},
				]);
				return true;
			
			case 'PetBowl':
				lib.setVariationProperty(feature.details, 'watered', flags, ['false', 'true']);
				return true;
			}
			
			switch (feature.meta.buildingType) {
			case 'Cabin':
				if (!(flags & lib.VAR_RANDOMIZE)) {
					lib.setVariationProperty(feature.details, 'sp:upgradeLevelToShow', flags, ['0', '1', '2']);
				}
				
				return true;
			}
			
			break;
		
		case 'furniture':
			// See StardewValley.Objects.Furniture:rotate()
			
			switch (feature.meta.type) {
			case 'RandomizedPlantFurniture':
				lib.setVariationProperty(feature.details, 'middleIndex', flags, [
					 '0', '1', '2', '3', '4', '5', '6', '7',
					 '8', '9', '10', '11', '12', '13', '14', '15',
					 '16', '17', '18', '19', '20', '21', '22', '23',
				]);
				return true;
			}
			
			switch (feature.meta.furnitureType) {
			case 14:
			case 16:
				lib.setVariationProperty(feature.details, 'isOn', flags, ['false', 'true']);
				return true;
			}
			
			if (feature.meta.rotations >= 2) {
				if (flags & lib.VAR_PROBE) {
					return true;
				}
				
				if (flags & lib.VAR_RANDOMIZE) {
					return true;
				}
				
				let values;
				
				switch (feature.meta.rotations) {
				// Hardcode the main cases.
				case 2: values = ['0', '2']; break;
				case 4: values = ['0', '1', '2', '3']; break;
				default:
					// General case.
					
					let rotationAmount = (feature.meta.rotations === 4) ? 1 : 2;
					values = [];
					
					for (let i = 1; i < feature.meta.rotations; ++i) {
						values.push((rotationAmount * i) + '');
					}
					
					values.push('0');
				}
				
				lib.setVariationProperty(feature.details, 'currentRotation', flags, values);
				return true;
			}
			
			break;
		
		case 'largeTerrainFeatures':
			switch (feature.meta.type) {
			case 'Bush':
				lib.setVariationProperty(feature.details, 'flipped', flags, ['false', 'true']);
				return true;
			}
			
			break;
		
		case 'objects':
			switch (feature.meta.type) {
			case 'Fence':
				if (feature.details.isGate === 'true') {
					if (!(flags & lib.VAR_RANDOMIZE)) {
						lib.setVariationProperty(feature.details, 'gatePosition', flags, ['0', '88']);
					}
					
					return true;
				}
				
				break;
			
			case 'Mannequin':
				if (flags & lib.VAR_PROBE) {
					return true;
				}
				
				if (flags & lib.VAR_RANDOMIZE) {
					return true;
				}
				
				feature.details.facing ??= {int: '0'};
				lib.setVariationProperty(feature.details.facing, 'int', flags, ['0', '1', '2', '3']);
				return true;
			
			case 'Torch':
				if (feature.details.bigCraftable === 'true' && feature.meta.item.qualifiedItemId !== '(BC)278') {
					lib.setVariationProperty(feature.details, 'isOn', flags, ['false', 'true']);
					return true;
				}
				
				break;
			
			default:
				if (feature.meta.item != null && feature.meta.item.itemType !== 'BC' && /^(?:[1-9]\d*|0)$/.test(feature.meta.item.itemId)) {
					let itemId = +feature.meta.item.itemId;
					
					if (itemId > 52 && (itemId < 384 || itemId > 391)) {
						lib.setVariationProperty(feature.details, 'flipped', flags, ['false', 'true']);
						return true;
					}
				}
			}
			
			break;
		
		case 'terrainFeatures':
			switch (feature.meta.type) {
			case 'Flooring':
				if (core.content.Data.FloorsAndPaths[feature.details.whichFloor]?.ConnectType === 'Random') {
					lib.setVariationProperty(feature.details, 'whichView', flags, [
						'0', '1', '2', '3', '4', '5', '6', '7',
						'8', '9', '10', '11', '12', '13', '14', '15',
					]);
					return true;
				}
				
				break;
			
			case 'FruitTree':
			case 'Tree':
				lib.setVariationProperty(feature.details, 'flipped', flags, ['false', 'true']);
				return true;
			
			case 'Grass':
				if (!(flags & lib.VAR_RANDOMIZE)) {
					lib.setVariationProperty(feature.details, 'numberOfWeeds', flags, ['1', '2', '3', '4']);
				}
				
				return true;
			
			case 'HoeDirt':
				if (feature.details.crop) {
					lib.setVariationProperty(feature.details.crop, 'flip', flags, ['false', 'true']);
					return true;
				}
				
				break;
			}
			
			break;
		}
		
		return false;
	};
	
	lib.setVariationProperty = function (object, property, flags, values, randomIndex) {
		// If the value is not set or doesn't match any of the values in the
		// list, cycling behaves as if it's the first value in the list.
		
		if (flags & lib.VAR_PROBE) {
			return;
		}
		
		if ((flags & lib.VAR_NEW_FEATURE) && object[property] != null) {
			return;
		}
		
		let valueIndex;
		
		if (flags & lib.VAR_RANDOMIZE) {
			valueIndex = randomIndex ?? Math.floor(Math.random() * values.length);
		}
		else if (flags & lib.VAR_NEW_FEATURE) {
			valueIndex = 0;
		}
		else {
			let needle = object[property];
			let isObject = (typeof needle === 'object' && needle !== null);
			
			if (isObject) {
				needle = JSON.stringify(needle);
			}
			
			valueIndex = 0;
			
			for (let [index, value] of values.entries()) {
				if (needle === (isObject ? JSON.stringify(value) : value)) {
					valueIndex = index;
					break;
				}
			}
			
			valueIndex += (flags & lib.VAR_BACKWARDS) ? -1 : 1;
			valueIndex = (valueIndex + values.length) % values.length;
		}
		
		object[property] = values[valueIndex];
	};
	
	//== Paint ==//
	
	lib.getPaintTargetAt = function (tileIndex, x, y) {
		// Look for any obscuring features that are paintable via a picker.
		
		let targets = [];
		
		for (let featureIndex of lib.tileObscuredBy[tileIndex]) {
			let feature = lib.features[featureIndex];
			let result = lib.changePaint(feature, lib.VAR_PROBE);
			
			if (result === lib.PAINT_PICKER) {
				if (x == null || y == null || lib.getPaintRegionAt(feature, x, y) !== null) {
					targets.push({
						feature: lib.features[featureIndex],
						result: result,
					});
				}
			}
		}
		
		if (targets.length > 0) {
			// Use the frontmost matching feature.
			
			return targets.reduce(function (a, b) {
				return a.feature.maxLayerDepth > b.feature.maxLayerDepth ? a : b;
			});
		}
		
		// Fall back to the tile feature, if it's paintable at all.
		
		if (Object.hasOwn(lib.tileFeatures, tileIndex)) {
			let feature = lib.tileFeatures[tileIndex];
			let result = lib.changePaint(feature, lib.VAR_PROBE);
			
			if (result) {
				return {
					feature: feature,
					result: result,
				};
			}
		}
		
		// TODO: Consider falling back to any paintable feature that occupies
		// the tile. Skipping this for now for performance reasons.
		
		return null;
	};
	
	lib.changePaint = function (feature, flags = 0) {
		let result = lib.PAINT_NONE;
		
		if (lib.festival !== null) {
			return result;
		}
		
		switch (feature.kind) {
		case 'buildings':
			if (!(flags & lib.VAR_NEW_FEATURE)) {
				if (feature.meta.paintRegions) {
					return lib.PAINT_PICKER;
				}
				
				let buildingData = core.content.Data.Buildings[feature.meta.buildingType];
				
				// Try cycling skins instead.
				
				if (buildingData?.Skins?.length > 0) {
					result = lib.PAINT_INSTANT;
					
					if (flags & lib.VAR_PROBE) {
						return result;
					}
					
					let values = [null];
					
					for (let skin of buildingData.Skins) {
						values.push(skin.Id);
					}
					
					feature.details.skinId ??= {};
					lib.setVariationProperty(feature.details.skinId, 'string', flags, values);
					
					if (feature.details.skinId.string === null) {
						feature.details.skinId.string = '';
						feature.details.skinId['string@xsi:nil'] = 'true';
					}
					else {
						delete feature.details.skinId['string@xsi:nil'];
					}
				}
			}
			
			break;
		
		case 'furniture':
			switch (feature.meta.type) {
			case 'RandomizedPlantFurniture':
				result = lib.PAINT_INSTANT;
				
				if (flags & lib.VAR_PROBE) {
					return result;
				}
				
				lib.setVariationProperty(feature.details, 'bottomIndex', flags, [
					'0', '1', '2', '3', '4', '5', '6', '7',
					'8', '9', '10', '11', '12', '13', '14', '15',
				]);
				break;
			}
			
			break;
		
		case 'objects':
			switch (feature.meta.type) {
			case 'Chest':
				if (!(flags & lib.VAR_NEW_FEATURE)) {
					result = lib.PAINT_INSTANT;
					
					if (flags & lib.VAR_PROBE) {
						return result;
					}
					
					let colors = [
						[85, 85, 255], [119, 191, 255], [0, 170, 170], [0, 234, 175],
						[0, 170, 0], [159, 236, 0], [255, 234, 18], [255, 167, 18],
						[255, 105, 18], [255, 0, 0], [135, 0, 35], [255, 173, 199],
						[255, 117, 195], [172, 0, 198], [143, 0, 255], [89, 11, 142],
						[64, 64, 64], [100, 100, 100], [200, 200, 200], [254, 254, 254],
						[0, 0, 0],
					];
					
					let values = [];
					
					for (let color of colors) {
						values.push(util.serializeColor(color));
					}
					
					lib.setVariationProperty(feature.details, 'playerChoiceColor', flags, values);
				}
				
				break;
			}
			
			break;
		
		case 'terrainFeatures':
			switch (feature.meta.type) {
			case 'HoeDirt':
				if (feature.hasCrop() && core.content.Data.Crops[feature.details.crop?.seedIndex]?.TintColors?.length > 0) {
					result = lib.PAINT_INSTANT;
					
					if (flags & lib.VAR_PROBE) {
						return result;
					}
					
					let values = [];
					
					for (let tintColor of core.content.Data.Crops[feature.details.crop.seedIndex]?.TintColors ?? []) {
						let color = util.stringToColor(tintColor);
						
						if (color !== null) {
							values.push(util.serializeColor(color));
						}
					}
					
					let randomIndex = null;
					
					if (flags & lib.VAR_RANDOMIZE) {
						let rng = new CSRandom(baseUtil.getRandomSeed(feature.tileX * 1000, feature.tileY, ((util.daysPlayed(lib.gameState) - 1) % 28) + 1));
						randomIndex = rng.Next(0, values.length);
					}
					
					lib.setVariationProperty(feature.details.crop, 'tintColor', flags, values, randomIndex);
				}
				
				break;
			}
			
			break;
		}
		
		return result;
	};
	
	lib.getPaintRegionAt = function (feature, x, y) {
		for (let sprite of feature.sprites) {
			if (sprite.paint?.useRegions) {
				let relX = Math.round(x - (feature.tileX * 16 + sprite.x));
				let relY = Math.round(y - (feature.tileY * 16 + sprite.y));
				
				if (relX >= 0 && relY >= 0 && relX < sprite.width && relY < sprite.height) {
					let entry = lib.paintImageData.get(mapsUtil.getPaintImageDataKey(sprite));
					
					if (entry != null && entry.pending === 0) {
						let colorIndex = entry.mask[(relX + sprite.sheetX) + (relY + sprite.sheetY) * entry.imageData.texture.width];
						
						if (colorIndex > 0) {
							return colorIndex - 1;
						}
					}
				}
			}
		}
		
		return null;
	};
	
	lib.updatePickerComponents = function (isChange = false) {
		let $picker = $('#maps-color-picker');
		let sInput;
		let color = {};
		
		for (let component of ['h', 's', 'l']) {
			let input = $(`#maps-picker-input-${component}`)[0];
			color[component] = +input.value;
			let pct = (+input.value - +input.min) / (+input.max - +input.min);
			
			if (!(pct >= 0 && pct <= 1)) {
				pct = 0;
			}
			
			$picker.find(`.component-${component} .range-marker`).css('left', (pct * 100).toFixed(4) + '%');
			
			if (component === 's') {
				sInput = input;
			}
		}
		
		$picker.find('.component-s .range').css({
			'--color-start': `hsl(${color.h}, ${sInput.min}%, 50%)`,
			'--color-end': `hsl(${color.h}, ${sInput.max}%, 50%)`,
		});
		$picker.find('.component-l .range').css({
			'--color-start': `hsl(${color.h}, ${color.s}%, 25%)`,
			'--color-end': `hsl(${color.h}, ${color.s}%, 50%)`,
		});
		
		if (isChange) {
			lib.pickBuildingPaintColor(color);
		}
	};
	
	lib.pickBuildingPaintColor = function (color) {
		if (lib.colorPickerState === null) {
			return;
		}
		
		let feature = lib.features[lib.colorPickerState.featureIndex];
		let featureElement = lib.featureElements[lib.colorPickerState.featureIndex];
		
		if (feature == null || featureElement == null) {
			return;
		}
		
		if (color === null || !lib.colorPickerState.hasChange) {
			lib.actions.push({
				type: lib.UNDO_FEATURE,
				index: feature.index,
				details: window.structuredClone(feature.details),
			});
			lib.flushActions();
			lib.colorPickerState.hasChange = (color !== null);
		}
		
		feature.details.buildingPaintColor ??= {
			ColorName: {'string@xsi:nil': 'true', string: ''},
			Color1Default: {boolean: 'true'},
			Color1Hue: {int: '0'},
			Color1Saturation: {int: '0'},
			Color1Lightness: {int: '0'},
			Color2Default: {boolean: 'true'},
			Color2Hue: {int: '0'},
			Color2Saturation: {int: '0'},
			Color2Lightness: {int: '0'},
			Color3Default: {boolean: 'true'},
			Color3Hue: {int: '0'},
			Color3Saturation: {int: '0'},
			Color3Lightness: {int: '0'},
		};
		
		let colorIndex = lib.colorPickerState.regionIndex + 1;
		feature.details.buildingPaintColor[`Color${colorIndex}Default`].boolean = (color === null ? 'true' : 'false');
		feature.details.buildingPaintColor[`Color${colorIndex}Hue`].int = (color?.h ?? 0) + '';
		feature.details.buildingPaintColor[`Color${colorIndex}Saturation`].int = (color?.s ?? 0) + '';
		feature.details.buildingPaintColor[`Color${colorIndex}Lightness`].int = (color?.l ?? 0) + '';
		$('#maps-reset-color').prop('disabled', color === null);
		lib.setHasUnsavedChanges(true, true);
		
		for (let sprite of feature.sprites) {
			if (sprite.paint?.useRegions) {
				lib.drawMaskPaint(sprite, colorIndex, color);
			}
		}
	};
	
	lib.closePicker = function () {
		$('#maps-color-picker').addClass('hidden');
		lib.colorPickerState = null;
	};
	
	lib.initElementPaint = function (feature, element) {
		for (let [spriteIndex, sprite] of feature.sprites.entries()) {
			if (sprite.paint == null) {
				continue;
			}
			
			sprite.paintCanvases = [];
			let $spriteElement = $(element).find(`.sprite-${spriteIndex}`).first();
			let entryKey = mapsUtil.getPaintImageDataKey(sprite);
			let entry = lib.paintImageData.get(entryKey);
			let preparePaint;
			
			let mainCanvas = document.createElement('canvas');
			mainCanvas.className = 'paint-region';
			mainCanvas.width = sprite.width;
			mainCanvas.height = sprite.height;
			sprite.paintCanvases.push(mainCanvas);
			$spriteElement.append(mainCanvas);
			
			if (sprite.paint.useRegions) {
				// This sprite can be painted region-by-region in the UI. Build the
				// regions as separate canvases, and base the paint color on the
				// current details.
				
				for (let [i, region] of feature.meta.paintRegions.entries()) {
					let canvas = document.createElement('canvas');
					canvas.className = `paint-region paint-region-${i}`;
					canvas.width = sprite.width;
					canvas.height = sprite.height;
					sprite.paintCanvases.push(canvas);
					$spriteElement.append(canvas);
				}
				
				preparePaint = function (entry) {
					lib.drawMaskPaint(sprite, 0, null);
					
					for (let [i, region] of feature.meta.paintRegions.entries()) {
						let colorIndex = i + 1;
						
						switch (feature.kind) {
						case 'buildings': {
							let paintColor = null;
							
							if ((feature.details.buildingPaintColor?.[`Color${colorIndex}Default`]?.boolean ?? 'true') !== 'true') {
								paintColor = {
									h: +(feature.details.buildingPaintColor?.[`Color${colorIndex}Hue`]?.int ?? 0),
									s: +(feature.details.buildingPaintColor?.[`Color${colorIndex}Saturation`]?.int ?? 0),
									l: +(feature.details.buildingPaintColor?.[`Color${colorIndex}Lightness`]?.int ?? 0),
								};
							}
							
							lib.drawMaskPaint(sprite, colorIndex, paintColor);
							break;
						}}
					}
				};
			}
			else {
				// This is painted directly by the draw logic, not as UI-paintable
				// regions. Build this as a single canvas.
				
				preparePaint = function (entry) {
					if (sprite.paint.colors != null) {
						// Convert pixel references into direct colors.
						
						let paintColors = sprite.paint.colors;
						
						for (let [i, color] of paintColors.entries()) {
							if (color?.ref != null && color?.[0] == null) {
								let data = entry.imageData[color.ref].data;
								
								if (color.tintIndex != null && data[color.tintIndex * 4 + 3] === 255) {
									let index = color.tintIndex * 4;
									paintColors[i] = [
										Math.round(data[index] * color.tintColor[0] / 255),
										Math.round(data[index + 1] * color.tintColor[1] / 255),
										Math.round(data[index + 2] * color.tintColor[2] / 255),
										color.tintColor[3],
									];
								}
								else {
									let index = color.index * 4;
									paintColors[i] = data.subarray(index, index + 4);
								}
							}
						}
					}
					
					lib.drawMaskPaint(sprite);
				};
			}
			
			if (entry) {
				// We've attempted to load these textures for painting before.
				
				if (entry.pending > 0) {
					// It's still loading. Add a listener for when it's ready.
					
					entry.listeners.push(preparePaint);
				}
				else {
					// The textures are already loaded. Proceed.
					
					preparePaint(entry);
				}
			}
			else {
				// We need to fetch the textures and prepare them for painting.
				
				entry = {
					pending: 0,
					imageData: {},
					mask: null,
					listeners: [preparePaint],
				};
				lib.paintImageData.set(entryKey, entry);
				let paintTypeDef = Feature.paintTypeDefs[sprite.paint.type];
				
				let loadListener = function (e) {
					let canvas = document.createElement('canvas');
					canvas.width = this.naturalWidth;
					canvas.height = this.naturalHeight;
					
					let context = canvas.getContext('2d');
					context.drawImage(this, 0, 0);
					let imageData = context.getImageData(0, 0, canvas.width, canvas.height)
					
					switch (this.dataset.type) {
					case 'mask':
						let mask = new Uint8Array(canvas.width * canvas.height);
						let length = imageData.data.length;
						let colorToIndex = {};
						
						if (paintTypeDef?.keys != null) {
							for (let [i, key] of paintTypeDef.keys.entries()) {
								colorToIndex[(key << 8) | 0xff] = i + 1;
							}
						}
						else if (paintTypeDef?.keyPixelIndices != null) {
							for (let [i, pixelIndex] of paintTypeDef.keyPixelIndices.entries()) {
								let j = pixelIndex * 4;
								let key =
									(imageData.data[j] << 24) |
									(imageData.data[j + 1] << 16) |
									(imageData.data[j + 2] << 8) |
									imageData.data[j + 3];
								colorToIndex[key] = i + 1;
							}
						}
						
						for (let i = 0, j = 0; i < length; i += 4, ++j) {
							let key =
								(imageData.data[i] << 24) |
								(imageData.data[i + 1] << 16) |
								(imageData.data[i + 2] << 8) |
								imageData.data[i + 3];
							mask[j] = colorToIndex[key] ?? 0;
						}
						
						entry.mask = mask;
						break;
					
					case 'imageData':
						entry.imageData[this.dataset.key] = imageData;
						break;
					}
					
					this.remove();
					--entry.pending;
					
					if (entry.pending === 0) {
						for (let listener of entry.listeners) {
							listener(entry);
						}
						
						delete entry.listeners;
					}
				};
				
				let images = [];
				images.push($(`<img src="${util.escapeHTML(util.contentURI(sprite.texture + '.png'))}" data-type="imageData" data-key="texture">`)[0]);
				images.push($(`<img src="${util.escapeHTML(util.contentURI(sprite.paint.mask + '.png'))}" data-type="mask">`)[0]);
				
				if (paintTypeDef.refImages != null) {
					for (let refImage of paintTypeDef.refImages) {
						images.push($(`<img src="${util.escapeHTML(util.contentURI(refImage[1] + '.png'))}" data-type="imageData" data-key="${util.escapeHTML(refImage[0])}">`)[0]);
					}
				}
				
				entry.pending = images.length;
				$(images)
					.on('load', loadListener)
					.appendTo('#maps-data');
			}
		}
	};
	
	lib.drawMaskPaint = function (sprite, colorIndex, paintColor) {
		// paintColor should be one of:
		//  - An array of 4 numbers, for direct RGBA values.
		//  - A plain object with {h, s, l} values, where l is relative.
		//  - null to use the base image.
		
		let canvas = sprite.paintCanvases[colorIndex ?? 0];
		let context = canvas.getContext('2d');
		let bitmap = new Uint8ClampedArray(canvas.width * canvas.height * 4);
		let entry = lib.paintImageData.get(mapsUtil.getPaintImageDataKey(sprite));
		
		let j = sprite.sheetX + sprite.sheetY * entry.imageData.texture.width;
		let baseOffset = j * 4;
		let i = baseOffset;
		let rowOffset = entry.imageData.texture.width - sprite.width;
		let baseData = entry.imageData.texture.data;
		let rgba = new Uint8ClampedArray(4);
		let mergedCanvas = (colorIndex == null);
		
		for (let y = 0; y < sprite.height; ++y) {
			for (let x = 0; x < sprite.width; ++x, i += 4, ++j) {
				if (mergedCanvas) {
					colorIndex = entry.mask[j];
					paintColor = (colorIndex < 1) ? null : sprite.paint.colors[colorIndex - 1];
				}
				else if (entry.mask[j] !== colorIndex) {
					continue;
				}
				
				if (paintColor === null) {
					// Copy the unaltered pixel.
					
					bitmap.set(baseData.subarray(i, i + 4), i - baseOffset);
				}
				else if (paintColor[0] != null) {
					// Direct RGBA color.
					
					bitmap.set(paintColor, i - baseOffset);
				}
				else if (paintColor.h != null) {
					// Applying an HSL color. The base pixel affects lightness.
					
					let r = baseData[i] / 255;
					let g = baseData[i + 1] / 255;
					let b = baseData[i + 2] / 255;
					let h = paintColor.h;
					let s = paintColor.s / 100;
					let l = paintColor.l / 100 + (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
					l = Math.max(0, Math.min(1, l));
					lib.hslToRGB(h, s, l, rgba);
					rgba[3] = baseData[i + 3];
					bitmap.set(rgba, i - baseOffset);
				}
			}
			
			baseOffset += rowOffset * 4;
			i += rowOffset * 4;
			j += rowOffset;
		}
		
		canvas.getContext('2d').putImageData(new ImageData(bitmap, canvas.width, canvas.height), 0, 0);
	};
	
	lib.hslToRGB = function (h, s, l, outRGB) {
		let p2 = (l <= .5) ? (l * (1 + s)) : (l + s - l * s);
		let p1 = 2 * l - p2;
		
		if (s === 0) {
			outRGB[2] = outRGB[1] = outRGB[0] = Math.floor(l * 255);
		}
		else {
			outRGB[0] = Math.floor(lib.qqhToRGB(p1, p2, h + 120) * 255);
			outRGB[1] = Math.floor(lib.qqhToRGB(p1, p2, h) * 255);
			outRGB[2] = Math.floor(lib.qqhToRGB(p1, p2, h - 120) * 255);
		}
	};
	
	lib.qqhToRGB = function (q1, q2, hue) {
		if (hue > 360) {
			hue -= 360;
		}
		else if (hue < 0) {
			hue += 360;
		}
		
		if (hue < 60) {
			return q1 + (q2 - q1) * hue / 60;
		}
		else if (hue < 180) {
			return q2;
		}
		else if (hue < 240) {
			return q1 + (q2 - q1) * (240 - hue) / 60;
		}
		
		return q1;
	};
	
	//== Undo History ==//
	
	lib.clearUndoHistory = function () {
		lib.undoHistory = {};
		lib.updateUndoButtons();
	};
	
	lib.applyUndoEntry = function (entry) {
		if (entry == null) {
			return;
		}
		
		// Make sure we don't have a move in progress.
		
		if (lib.floating != null) {
			for (let feature of lib.floating.features) {
				if (feature.index >= 0) {
					// A feature is being moved. Restore its original position.
					
					lib.cancelFloating();
					break;
				}
			}
		}
		
		// The reversal actions are initially populated in the order the
		// actions are made. We should apply them in the opposite order.
		
		entry.reverse();
		
		// Create any missing entries and detach all relevant features.
		
		for (let action of entry) {
			while (action.index >= lib.features.length) {
				lib.features.push(null);
			}
			
			let feature = lib.features[action.index];
			
			if (feature != null) {
				lib.detachFeature(feature);
			}
		}
		
		// Apply changes.
		
		let presentFeatures = new Set();
		let wallpaperUpdated = false;
		
		for (let action of entry) {
			switch (action.type) {
			case lib.UNDO_FEATURE: {
				let feature = lib.features[action.index];
				
				if (action.kind === null) { // Only null, not undefined.
					// Erase the feature.
					
					if (feature != null) {
						action.kind = feature.kind;
						action.tileX = feature.tileX;
						action.tileY = feature.tileY;
						action.details = window.structuredClone(feature.details);
						lib.features[action.index] = null;
						presentFeatures.delete(feature);
					}
				}
				else {
					if (feature == null) {
						// Create a feature.
						
						feature = Feature.from(action);
						feature.index = action.index;
						lib.features[action.index] = feature;
						action.kind = null;
						delete action.tileX;
						delete action.tileY;
						delete action.details;
					}
					else {
						// Update a feature.
						
						for (let [key, value] of Object.entries(action)) {
							if (key !== 'type') {
								let oldValue = window.structuredClone(feature[key]);
								feature[key] = value;
								action[key] = oldValue ?? null;
							}
						}
					}
					
					presentFeatures.add(feature);
				}
				
				break;
			}
			case lib.UNDO_WALLPAPER:
				if (action.isFloor) {
					let oldValue = lib.locationPlan.appliedFloor[action.areaId];
					lib.locationPlan.appliedFloor[action.areaId] = action.itemId;
					action.itemId = oldValue;
					lib.mapLocation.updateFloor(action.areaId);
				}
				else {
					let oldValue = lib.locationPlan.appliedWallpaper[action.areaId];
					lib.locationPlan.appliedWallpaper[action.areaId] = action.itemId;
					action.itemId = oldValue;
					lib.mapLocation.updateWallpaper(action.areaId);
				}
				
				wallpaperUpdated = true;
				break;
			}
		}
		
		// Update and attach features.
		
		for (let feature of presentFeatures.values()) {
			lib.updateFeature(feature);
			lib.drawFeature(feature);
			lib.attachFeature(feature);
		}
		
		if (wallpaperUpdated) {
			lib.drawLayers(document.getElementById('maps-canvas-back'), ['Back', 'Buildings'], []);
		}
		
		lib.selectionRect = null;
		lib.updateSelectionRect(null, null);
		lib.updateOverlay();
		lib.touchUndoHistory();
		lib.closePicker();
		
		// The reversal actions have been negated, and their order has been
		// reversed, so they're ready to be used for redo (or, if we just did
		// a redo, they're ready to be used for undo).
	};
	
	lib.flushActions = function () {
		if (lib.actions.length > 0) {
			lib.pushUndoHistory(lib.actions);
			lib.actions = [];
		}
	};
	
	lib.pushUndoHistory = function (entry) {
		if (!Object.hasOwn(lib.undoHistory, lib.location.id)) {
			lib.undoHistory[lib.location.id] = {
				entries: new Array(lib.options.undoSize + 1),
				start: 0,
				end: 0,
				position: 0,
			};
		}
		
		let history = lib.undoHistory[lib.location.id];
		history.entries[history.position] = entry;
		++history.position;
		
		if (history.position === history.entries.length) {
			history.position = 0;
		}
		
		history.end = history.position;
		
		if (history.start === history.position) {
			++history.start;
			
			if (history.start === history.entries.length) {
				history.start = 0;
			}
		}
		
		lib.touchUndoHistory();
		lib.updateUndoButtons();
	};
	
	lib.popUndoHistory = function () { // Move backward (as in undo).
		if (!Object.hasOwn(lib.undoHistory, lib.location.id)) {
			return null;
		}
		
		let history = lib.undoHistory[lib.location.id];
		
		if (history.position === history.start) {
			return null;
		}
		
		if (history.position === 0) {
			history.position = history.entries.length;
		}
		
		--history.position;
		lib.touchUndoHistory();
		lib.updateUndoButtons();
		return history.entries[history.position];
	};
	
	lib.repushUndoHistory = function () { // Move forward (as in redo).
		if (!Object.hasOwn(lib.undoHistory, lib.location.id)) {
			return null;
		}
		
		let history = lib.undoHistory[lib.location.id];
		
		if (history.position === history.end) {
			return null;
		}
		
		let entry = history.entries[history.position];
		++history.position;
		
		if (history.position === history.entries.length) {
			history.position = 0;
		}
		
		lib.touchUndoHistory();
		lib.updateUndoButtons();
		return entry;
	};
	
	lib.updateUndoButtons = function () {
		let history = (lib.location == null) ? null : lib.undoHistory[lib.location.id];
		
		if (history == null) {
			$('#maps-button-undo').toggleClass('disabled', true);
			$('#maps-button-redo').toggleClass('disabled', true);
		}
		else {
			$('#maps-button-undo').toggleClass('disabled', history.position === history.start);
			$('#maps-button-redo').toggleClass('disabled', history.position === history.end);
		}
	};
	
	lib.touchUndoHistory = function () {
		if (lib.colorPickerState !== null) {
			lib.colorPickerState.hasChange = false;
		}
	};
	
	lib.resizeUndoHistory = function () {
		for (let history of Object.values(lib.undoHistory)) {
			let depth = history.end - history.start;
			
			if (depth < 0) {
				depth += history.entries.length;
			}
			
			// Rotate the entries so the oldest entry is index 0.
			
			history.entries.push(...history.entries.splice(0, history.start));
			history.position -= history.start;
			history.start = 0;
			
			if (history.position < 0) {
				history.position += history.entries.length;
			}
			
			// When removing entries to fit the new size, we prioritize removing
			// unapplied undo entries (starting with the oldest/pastmost),
			// followed by redo entries (starting with the oldest/futuremost).
			
			let newLength = lib.options.undoSize + 1;
			
			if (history.entries.length - history.position > newLength) {
				// Not enough space to hold all redo entries. Remove all unapplied
				// undo entries and the futuremost redo entries.
				
				history.entries.splice(0, history.position);
				history.entries.splice(newLength);
				history.position = 0;
				history.end = newLength - 1;
			}
			else if (depth >= newLength) {
				// Not enough space to hold all unapplied undo entries. Remove the
				// pastmost entries.
				
				let shift = history.entries.length - newLength;
				history.position -= shift;
				history.entries.splice(0, shift);
				history.end = newLength - 1;
			}
			else {
				// Any change in size is beyond the current undo entries.
				
				history.entries.length = newLength;
				history.end = depth;
			}
		}
		
		lib.updateUndoButtons();
	};
};
