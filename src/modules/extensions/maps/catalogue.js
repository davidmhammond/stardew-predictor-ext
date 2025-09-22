import Feature from './classes/Feature.js';

import * as mapsUtil from './mapsUtil.js';
import * as util from '../../util.js';

export let loadCatalogue = function (context) {
	let tabs = {};
	
	tabs.crops = [{
		group: 'Spring',
		entries: [
			{cropId: '472'}, // Parsnip
			{cropId: '473'}, // Green Bean
			{cropId: '474'}, // Cauliflower
			{cropId: '475'}, // Potato
			{cropId: '476'}, // Garlic
			{cropId: '273'}, // Unmilled Rice
			{cropId: '477'}, // Kale
			{cropId: '478'}, // Rhubarb
			{cropId: '745'}, // Strawberry
			{cropId: '802'}, // Cactus Fruit
			{cropId: '499'}, // Ancient Fruit
			{cropId: '427'}, // Tulip
			{cropId: '429'}, // Blue Jazz
			//{cropId: '495'}, // Wild Horseradish
			{cropId: '885'}, // Fiber
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '3', // Tea Bush
					datePlanted: '-20',
					tileSheetOffset: '1',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
			{cropId: 'CarrotSeeds'}, // Carrot
			{cropId: '890'}, // Qi Fruit
		],
	}, {
		group: 'Summer',
		entries: [
			{cropId: '831'}, // Taro Root
			{cropId: '479'}, // Melon
			{cropId: '480'}, // Tomato
			{cropId: '481'}, // Blueberry
			{cropId: '482'}, // Hot Pepper
			{cropId: '484'}, // Radish
			{cropId: '485'}, // Red Cabbage
			{cropId: '486'}, // Starfruit
			{cropId: '833'}, // Pineapple
			{cropId: '433'}, // Coffee Bean
			{cropId: '802'}, // Cactus Fruit
			{cropId: '487'}, // Corn
			{cropId: '302'}, // Hops
			{cropId: '499'}, // Ancient Fruit
			{cropId: '453'}, // Poppy
			{cropId: '455'}, // Summer Spangle
			{cropId: '431'}, // Sunflower
			//{cropId: '496'}, // Spice Berry
			{cropId: '885'}, // Fiber
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '3', // Tea Bush
					datePlanted: '-20',
					tileSheetOffset: '1',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
			{cropId: 'SummerSquashSeeds'}, // Summer Squash
			{cropId: '890'}, // Qi Fruit
		],
	}, {
		group: 'Fall',
		entries: [
			{cropId: '483'}, // Wheat
			{cropId: '802'}, // Cactus Fruit
			{cropId: '487'}, // Corn
			{cropId: '301'}, // Grape
			{cropId: '299'}, // Amaranth
			{cropId: '488'}, // Eggplant
			{cropId: '489'}, // Artichoke
			{cropId: '490'}, // Pumpkin
			{cropId: '491'}, // Bok Choy
			{cropId: '492'}, // Yam
			{cropId: '493'}, // Cranberries
			{cropId: '494'}, // Beet
			{cropId: '499'}, // Ancient Fruit
			{cropId: '431'}, // Sunflower
			{cropId: '425'}, // Fairy Rose
			{cropId: '347'}, // Sweet Gem Berry
			//{cropId: '497'}, // Common Mushroom
			{cropId: '885'}, // Fiber
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '3', // Tea Bush
					datePlanted: '-20',
					tileSheetOffset: '1',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
			{cropId: 'BroccoliSeeds'}, // Broccoli
			{cropId: '890'}, // Qi Fruit
		],
	}, {
		group: 'Winter',
		entries: [
			{cropId: '802'}, // Cactus Fruit
			//{cropId: '498'}, // Winter Root
			{cropId: '885'}, // Fiber
			{cropId: 'PowdermelonSeeds'}, // Powdermelon
			{cropId: '890'}, // Qi Fruit
		],
	}, {
		group: 'Giant Crops',
		entries: [
			{giantCropId: 'Cauliflower'},
			{giantCropId: 'Melon'},
			{giantCropId: 'Pumpkin'},
			{giantCropId: 'Powdermelon'},
			{giantCropId: 'QiFruit'},
		],
	}];
	
	tabs.foraging = [{
		group: 'Spring',
		entries: [
			'(O)18', // Daffofil
			'(O)22', // Dandelion
			'(O)20', // Leek
			'(O)296', // Salmonberry
			{
				kind: 'terrainFeatures',
				type: 'HoeDirt',
				details: {
					crop: {
						forageCrop: 'true',
						whichForageCrop: '1', // Spring Onion
					},
				},
			},
			'(O)16', // Wild Horseradish
		],
	}, {
		group: 'Summer',
		entries: [
			'(O)259', // Fiddlehead Fern
			'(O)398', // Grape
			'(O)396', // Spice Berry
			'(O)402', // Sweet Pea
		],
	}, {
		group: 'Fall',
		entries: [
			'(O)410', // Blackberry
			'(O)408', // Hazelnut
			'(O)406', // Wild Plum
		],
	}, {
		group: 'Winter',
		entries: [
			'(O)418', // Crocus
			'(O)414', // Crystal Fruit
			'(O)283', // Holly
			'(O)416', // Snow Yam
			'(O)412', // Winter Root
		],
	}, {
		group: 'Mushrooms',
		entries: [
			'(O)404', // Common Mushroom
			'(O)420', // Red Mushroom
			'(O)257', // Morel
			'(O)281', // Chanterelle
			'(O)422', // Purple Mushroom
			'(O)851', // Magma Cap
		],
	}, {
		group: 'Beach',
		entries: [
			'(O)152', // Seaweed
			'(O)719', // Mussel
			'(O)723', // Oyster
			'(O)372', // Clam
			'(O)718', // Cockle
			'(O)393', // Coral
			'(O)392', // Nautilus Shell
			'(O)397', // Sea Urchin
			'(O)394', // Rainbow Shell
		],
	}, {
		group: 'Exotic',
		entries: [
			'(O)90', // Cactus Fruit
			'(O)88', // Coconut
			{
				kind: 'terrainFeatures',
				type: 'HoeDirt',
				details: {
					state: '2',
					crop: {
						forageCrop: 'true',
						whichForageCrop: '2', // Ginger
					},
				},
			},
			'(O)791', // Golden Coconut
		],
	}, {
		group: 'Tree Fruit',
		entries: [
			'(O)634', // Apricot
			'(O)638', // Cherry
			'(O)635', // Orange
			'(O)636', // Peach
			'(O)613', // Apple
			'(O)637', // Pomegranate
		],
	}, {
		group: 'Animal Produce',
		entries: [
			'(O)176', // Small White Egg
			'(O)180', // Small Brown Egg
			'(O)174', // Large White Egg
			'(O)182', // Large Brown Egg
			'(O)305', // Void Egg
			'(O)928', // Golden Egg
			'(O)442', // Duck Egg
			'(O)444', // Duck Feather
			'(O)440', // Wool
			'(O)446', // Rabbit's Foot
			'(O)289', // Ostrich Egg
			'(O)107', // Dinosaur Egg
			'(O)430', // Truffle
			'(BC)56', // Slime Ball
		],
	}, {
		group: 'Minerals',
		entries: [
			'(O)80', // Quartz
			'(O)86', // Earth Crystal
			'(O)84', // Frozen Tear
			'(O)82', // Fire Quartz
		],
	}];
	
	tabs.equipment = [{
		group: 'Fences',
		entries: [
			{
				qualifiedItemId: '(O)325', // Gate
				details: {
					isGate: 'true',
					gatePosition: '0',
				},
			},
			'(O)322', // Wood Fence
			'(O)323', // Stone Fence
			'(O)324', // Iron Fence
			'(O)298', // Hardwood Fence
		],
	}, {
		group: 'Sprinklers',
		entries: [
			'(O)599', // Sprinkler
			'(O)621', // Quality Sprinkler
			'(O)645', // Iridium Sprinkler
			'(O)915', // Pressure Nozzle
			'(O)913', // Enricher
		],
	}, {
		group: 'Artisan',
		entries: [
			'(BC)24', // Mayonnaise Machine
			'(BC)10', // Bee House
			'(BC)15', // Preserves Jar
			'(BC)16', // Cheese Press
			'(BC)17', // Loom
			'(BC)12', // Keg
			'(BC)19', // Oil Maker
			'(BC)163', // Cask
			'(BC)FishSmoker', // Fish Smoker
			'(BC)Dehydrator', // Dehydrator
		],
	}, {
		group: 'Refining',
		entries: [
			'(BC)BaitMaker', // Bait Maker
			'(BC)90', // Bone Mill
			'(BC)114', // Charcoal Kiln
			'(BC)21', // Crystalarium
			'(BC)13', // Furnace
			'(BC)HeavyFurnace', // Heavy Furnace
			'(BC)182', // Geode Crusher
			'(BC)9', // Lightning Rod
			'(BC)MushroomLog', // Mushroom Log
			'(BC)20', // Recycling Machine
			'(BC)25', // Seed Maker
			'(BC)158', // Slime Egg-Press
			'(BC)231', // Solar Panel
			'(BC)105', // Tapper
			'(BC)264', // Heavy Tapper
			'(BC)154', // Worm Bin
			'(BC)DeluxeWormBin', // Deluxe Worm Bin
		],
	}, {
		group: 'Storage',
		entries: [
			'(BC)130', // Chest
			'(BC)BigChest', // Big Chest
			'(BC)232', // Stone Chest
			'(BC)BigStoneChest', // Big Stone Chest
			'(BC)256', // Junimo Chest
			{
				qualifiedItemId: '(BC)216', // Mini-Fridge
				details: {
					fridge: 'true',
				}
			},
		],
	}, {
		group: 'Farming',
		entries: [
			'(BC)8', // Scarecrow
			'(BC)167', // Deluxe Scarecrow
			'(BC)110', // Rarecrow 1
			'(BC)113', // Rarecrow 2
			'(BC)126', // Rarecrow 3
			'(BC)136', // Rarecrow 4
			'(BC)137', // Rarecrow 5
			'(BC)138', // Rarecrow 6
			'(BC)139', // Rarecrow 7
			'(BC)140', // Rarecrow 8
			'(BC)62', // Garden Pot
			'(O)710', // Crab Pot
		],
	}, {
		group: 'Animals',
		entries: [
			'(BC)165', // Auto-Grabber
			'(BC)272', // Auto-Petter
			'(BC)99', // Hay Hopper
			'(BC)104', // Heater
			'(BC)101', // Incubator
			'(BC)254', // Ostrich Incubator
			'(BC)156', // Slime Incubator
		],
	}, {
		group: 'Misc',
		entries: [
			'(BC)Anvil', // Anvil
			'(BC)246', // Coffee Maker
			'(BC)219', // Cursed P.K. Arcade System
			'(BC)265', // Deconstructor
			'(BC)239', // Farm Computer
			'(BC)275', // Hopper
			'(BC)159', // Junimo Kart Arcade System
			'(BC)MiniForge', // Mini-Forge
			'(BC)238', // Mini-Obelisk
			'(BC)248', // Mini-Shipping Bin
			'(BC)141', // Prairie King Arcade System
			'(BC)247', // Sewing Machine,
			'(BC)117', // Soda Machine
			'(BC)StatueOfBlessings', // Statue Of Blessings
			'(BC)127', // Statue of Endless Fortune
			'(BC)160', // Statue of Perfection
			'(BC)StatueOfTheDwarfKing', // Statue Of The Dwarf King
			'(BC)280', // Statue Of True Perfection
			'(BC)214', // Telephone
			'(BC)208', // Workbench
		],
	}, {
		group: 'Temporary',
		entries: [
			{
				qualifiedItemId: '(BC)278', // Campfire (Cookout Kit)
				name: 'Cookout Kit',
			},
			{
				kind: 'largeTerrainFeatures',
				type: 'Tent',
			},
		],
	}, {
		group: 'Unobtainable',
		entries: [
			'(BC)128', // Mushroom Box
			{
				qualifiedItemId: '(O)-1', // Gift Box
				type: 'Chest',
				details: {
					playerChest: 'false',
					giftbox: 'true',
					giftboxIndex: '0',
				},
			},
			{
				qualifiedItemId: '(O)-1', // Gift Box
				type: 'Chest',
				details: {
					playerChest: 'false',
					giftbox: 'true',
					giftboxIndex: '1',
				},
			},
			{
				qualifiedItemId: '(O)-1', // Gift Box
				type: 'Chest',
				details: {
					playerChest: 'false',
					giftbox: 'true',
					giftboxIndex: '2',
				},
			},
			{
				qualifiedItemId: '(O)-1', // Gift Box
				type: 'Chest',
				details: {
					playerChest: 'false',
					giftbox: 'true',
					giftboxIndex: '3',
				},
			},
			{
				qualifiedItemId: '(O)-1', // Gift Box
				type: 'Chest',
				details: {
					playerChest: 'false',
					giftbox: 'true',
					giftboxIndex: '4',
				},
			},
			{
				qualifiedItemId: '(O)-1', // Treasure Chest
				type: 'Chest',
				details: {
					playerChest: 'false',
				},
			},
		],
	}];
	
	tabs.buildings = [{
		group: 'Animal Housing',
		entries: [
			{buildingId: 'Coop'},
			{buildingId: 'Barn'},
			{buildingId: 'Big Coop'},
			{buildingId: 'Big Barn'},
			{buildingId: 'Deluxe Coop'},
			{buildingId: 'Deluxe Barn'},
			{buildingId: 'Stable'},
			{buildingId: 'Slime Hutch'},
		],
	}, {
		group: 'Farming',
		entries: [
			{buildingId: 'Shed'},
			{buildingId: 'Big Shed'},
			{buildingId: 'Silo'},
			{buildingId: 'Mill'},
			{buildingId: 'Well'},
			{buildingId: 'Junimo Hut'},
			{buildingId: 'Shipping Bin'},
		],
	}, {
		group: 'Special',
		entries: [
			{buildingId: 'Earth Obelisk'},
			{buildingId: 'Water Obelisk'},
			{buildingId: 'Desert Obelisk'},
			{buildingId: 'Island Obelisk'},
			{buildingId: 'Gold Clock'},
			//{buildingId: 'Junimo Hut'},
		],
	}, {
		group: 'Fish Ponds',
		entries: [
			{
				buildingId: 'Fish Pond',
			},
			{
				name: 'Lava Eel',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '250',
							G: '30',
							B: '30',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Slimejack',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '60',
							G: '255',
							B: '60',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Void Salmon',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '120',
							G: '20',
							B: '110',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Super Cucumber',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '150',
							G: '100',
							B: '200',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Glacierfish',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '100',
							G: '240',
							B: '220',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Ms. Angler',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '255',
							G: '120',
							B: '200',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Angler',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '255',
							G: '120',
							B: '0',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Mutant Carp',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '50',
							G: '220',
							B: '100',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Crimsonfish',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '230',
							G: '70',
							B: '110',
							A: '255',
						},
					},
				},
			},
			{
				name: 'Legend',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '40',
							G: '150',
							B: '50',
							A: '255',
						},
					},
				},
			},
			/*
			{
				name: 'Default Legendary Fish',
				buildingId: 'Fish Pond',
				details: {
					overrideWaterColor: {
						Color: {
							R: '150',
							G: '50',
							B: '210',
							A: '255',
						},
					},
				},
			},
			*/
		],
	}, {
		group: 'Cabins',
		entries: [
			{
				buildingId: 'Cabin',
				name: 'Stone Cabin',
			},
			{
				buildingId: 'Cabin',
				name: 'Plank Cabin',
				details: {
					skinId: {string: 'Plank Cabin'},
				},
			},
			{
				buildingId: 'Cabin',
				name: 'Log Cabin',
				details: {
					skinId: {string: 'Log Cabin'},
				},
			},
			{
				buildingId: 'Cabin',
				name: 'Neighbor Cabin',
				details: {
					skinId: {string: 'Neighbor Cabin'},
				},
			},
			{
				buildingId: 'Cabin',
				name: 'Rustic Cabin',
				details: {
					skinId: {string: 'Rustic Cabin'},
				},
			},
			{
				buildingId: 'Cabin',
				name: 'Beach Cabin',
				details: {
					skinId: {string: 'Beach Cabin'},
				},
			},
			{
				buildingId: 'Cabin',
				name: 'Trailer Cabin',
				details: {
					skinId: {string: 'Trailer Cabin'},
				},
			},
		],
	}, {
		group: 'Pet Bowls',
		entries: [
			{
				buildingId: 'Pet Bowl',
				name: 'Plank Pet Bowl',
			},
			{
				buildingId: 'Pet Bowl',
				name: 'Stone Pet Bowl',
				details: {
					skinId: {string: 'Stone Pet Bowl'},
				},
			},
			{
				buildingId: 'Pet Bowl',
				name: 'Hay Pet Bowl',
				details: {
					skinId: {string: 'Hay Pet Bowl'},
				},
			},
		],
	}, {
		group: 'Unique Buildings',
		entries: [
			{
				buildingId: 'Farmhouse',
			},
			{
				buildingId: 'Greenhouse',
			},
		],
	}];
	
	tabs.decoration = [{
		group: 'Paths',
		entries: [
			{pathId: '0'},
			{pathId: '1'},
			{pathId: '2'},
			{pathId: '3'},
			{pathId: '4'},
			{pathId: '5'},
			{pathId: '6'},
			{pathId: '7'},
			{pathId: '8'},
			{pathId: '9'},
			{pathId: '10'},
			{pathId: '11'},
			{pathId: '12'},
		],
	}, {
		group: 'Lighting',
		entries: [
			'(O)93', // Torch
			'(O)746', // Jack-O-Lantern
			'(BC)143', // Wooden Brazier
			'(BC)144', // Stone Brazier
			'(BC)150', // Barrel Brazier
			'(BC)147', // Stump Brazier
			'(BC)145', // Gold Brazier
			'(BC)148', // Carved Brazier
			'(BC)149', // Skull Brazier
			'(BC)151', // Marble Brazier
			'(BC)152', // Wood Lamp-post
			'(BC)153', // Iron Lamp-post
			'(BC)146', // Campfire
		],
	}, {
		group: 'Plants',
		entries: [
			'(BC)0', // House Plant
			'(BC)1', // House Plant
			'(BC)2', // House Plant
			'(BC)3', // House Plant
			'(BC)4', // House Plant
			'(BC)5', // House Plant
			'(BC)6', // House Plant
			'(BC)7', // House Plant
			'(BC)35', // Basic Log
			'(BC)45', // Ornamental Hay Bale
			'(BC)46', // Log Section
			'(BC)48', // Seasonal Decor
			'(BC)108', // Tub o' Flowers
			'(BC)112', // Dried Sunflowers
			'(BC)184', // Seasonal Plant
			'(BC)188', // Seasonal Plant
			'(BC)192', // Seasonal Plant
			'(BC)196', // Seasonal Plant
			'(BC)200', // Seasonal Plant
			'(BC)204', // Seasonal Plant
		],
	}, {
		group: 'Signs',
		entries: [
			'(BC)37', // Wood Sign
			'(BC)38', // Stone Sign
			'(BC)39', // Dark Sign
			'(BC)TextSign', // Text Sign
		],
	}, {
		group: 'Misc',
		entries: [
			'(BC)28', // Skeleton Model
			'(BC)32', // Stone Cairn
			'(BC)33', // Suit Of Armor
			'(BC)34', // Sign Of The Vessel
			'(BC)36', // Lawn Flamingo
			'(BC)40', // Big Green Cane
			'(BC)41', // Green Canes
			'(BC)42', // Mixed Cane
			'(BC)43', // Red Canes
			'(BC)44', // Big Red Cane
			'(BC)47', // Grave Stone
			'(BC)52', // Stone Frog
			'(BC)53', // Stone Parrot
			'(BC)54', // Stone Owl
			'(BC)55', // Stone Junimo
			'(BC)83', // Wicked Statue
			'(BC)85', // Sloth Skeleton L
			'(BC)86', // Sloth Skeleton M
			'(BC)87', // Sloth Skeleton R
			'(BC)88', // Standing Geode
			'(BC)89', // Obsidian Vase
			'(BC)94', // Singing Stone
			'(BC)95', // Stone Owl
			'(BC)96', // Strange Capsule
			'(BC)98', // Empty Capsule
			'(BC)107', // Plush Bunny
			'(BC)116', // Stardew Hero Trophy
			'(BC)155', // ??HMTGF??
			'(BC)161', // ??Pinky Lemon??
			'(BC)162', // ??Foroguemon??
			'(BC)164', // Solid Gold Lewis
			'(O)341', // Tea Set
			'(M)MannequinMale', // Mannequin (M)
			'(M)MannequinFemale', // Mannequin (F)
			'(M)CursedMannequinMale', // Cursed Mannequin (M)
			'(M)CursedMannequinFemale', // Cursed Mannequin (F)
		],
	}, {
		group: 'Unobtainable',
		entries: [
			'(BC)22', // Table Piece L
			'(BC)23', // Table Piece R
			'(BC)26', // Wood Chair
			'(BC)27', // Wood Chair
			'(BC)29', // Obelisk
			'(BC)31', // Chicken Statue
			'(BC)64', // Bookcase
			'(BC)65', // Fancy Table
			'(BC)66', // Ancient Table
			'(BC)67', // Ancient Stool
			'(BC)68', // Grandfather Clock
			'(BC)69', // Teddy Timer
			'(BC)70', // Dead Tree
			'(BC)72', // Tall Torch
			'(BC)73', // Ritual Mask
			'(BC)74', // Bonfire
			'(BC)75', // Bongo
			'(BC)76', // Decorative Spears
			'(BC)78', // Boulder
			'(BC)79', // Door
			'(BC)80', // Door
			'(BC)81', // Locked Door
			'(BC)82', // Locked Door
			'(BC)84', // Wicked Statue
			'(BC)106', // Camera
			'(BC)111', // Decorative Pitcher
			'(BC)118', // Barrel
			'(BC)119', // Crate
			'(BC)120', // Barrel
			'(BC)121', // Crate
			'(BC)122', // Barrel
			'(BC)123', // Crate
			'(BC)124', // Barrel
			'(BC)125', // Crate
			'(BC)174', // Barrel
			'(BC)175', // Crate
			'(BC)221', // Item Pedestal
			'(BC)262', // Barrel
			'(BC)263', // Crate
		],
	}];
	
	tabs.furniture = [{
		group: 'Chairs',
		entries: [
			'(F)0', // Oak Chair
			'(F)3', // Walnut Chair
			'(F)6', // Birch Chair
			'(F)9', // Mahogany Chair
			'(F)12', // Red Diner Chair
			'(F)15', // Blue Diner Chair
			'(F)18', // Country Chair
			'(F)21', // Breakfast Chair
			'(F)24', // Pink Office Chair
			'(F)27', // Purple Office Chair
			'(F)30', // Green Office Stool
			'(F)31', // Orange Office Stool
			'(F)64', // Dark Throne
			'(F)67', // Dining Chair (yellow)
			'(F)70', // Dining Chair (red)
			'(F)73', // Green Plush Seat
			'(F)76', // Pink Plush Seat
			'(F)79', // Winter Chair
			'(F)82', // Groovy Chair
			'(F)85', // Cute Chair
			'(F)88', // Stump Seat
			'(F)91', // Metal Chair
			'(F)94', // Green Stool
			'(F)95', // Blue Stool
			'(F)128', // King Chair
			'(F)131', // Crystal Chair
			'(F)134', // Tropical Chair
			'(F)DesertChair', // Desert Chair
			'(F)JojaChair', // Joja Chair
			'(F)JojaStool', // Joja Stool
			'(F)WizardChair', // Wizard Chair
			'(F)WizardStool', // Wizard Stool
			'(F)JunimoChair', // Junimo Chair
			'(F)JunimoStool', // Junimo Stool
			'(F)RetroChair', // Retro Chair
			'(F)RetroStool', // Retro Stool
			'(F)PlasticLawnChair', // Plastic Lawn Chair
		],
	}, {
		group: 'Benches',
		entries: [
			'(F)192', // Oak Bench
			'(F)197', // Walnut Bench
			'(F)202', // Birch Bench
			'(F)207', // Mahogany Bench
			'(F)212', // Modern Bench
		],
	}, {
		group: 'Couches',
		entries: [
			'(F)416', // Blue Couch
			'(F)424', // Red Couch
			'(F)432', // Green Couch
			'(F)440', // Yellow Couch
			'(F)512', // Brown Couch
			'(F)520', // Dark Couch
			'(F)528', // Wizard Couch
			'(F)536', // Woodsy Couch
			'(F)2720', // Large Brown Couch
			'(F)JojaCouch', // JojaCouch
			'(F)JunimoCouch', // JunimoCouch
			'(F)RetroCouch', // RetroCouch
			'(F)MoldyCouch', // MoldyCouch
		],
	}, {
		group: 'Armchairs',
		entries: [
			'(F)288', // Blue Armchair
			'(F)294', // Red Armchair
			'(F)300', // Green Armchair
			'(F)306', // Yellow Armchair
			'(F)312', // Brown Armchair
		],
	}, {
		group: 'Tables',
		entries: [
			'(F)1120', // Oak Table
			'(F)1216', // Oak Tea-Table
			'(F)1391', // Oak End Table
			'(F)1122', // Walnut Table
			'(F)1218', // Walnut Tea-Table
			'(F)1393', // Walnut End Table
			'(F)1124', // Birch Table
			'(F)1220', // Birch Tea-Table
			'(F)1395', // Birch End Table
			'(F)1126', // Mahogany Table
			'(F)1222', // Mahogany Tea-Table
			'(F)1397', // Mahogany End Table
			'(F)1132', // Modern Table
			'(F)1224', // Modern Tea-Table
			'(F)1399', // Modern End Table
			'(F)1144', // Winter Table
			'(F)1401', // Winter End Table
			'(F)1128', // Sun Table
			'(F)1130', // Moon Table
			'(F)1142', // Puzzle Table
			'(F)1146', // Candy Table
			'(F)1148', // Luau Table
			'(F)1150', // Dark Table
			'(F)1138', // Diviner Table
			'(F)1400', // Grandmother End Table
			'(F)1134', // Pub Table
			'(F)1136', // Luxury Table
			'(F)1140', // Neolithic Table
			'(F)724', // Coffee Table
			'(F)727', // Stone Slab
			'(F)WineTable', // Wine Table
			'(F)SpiritsTable', // Spirits Table
			'(F)DesertTable', // Desert Table
			'(F)DesertEndTable', // Desert End Table
			'(F)JojaTable', // Joja Table
			'(F)JojaColaTeaTable', // Joja Cola Tea Table
			'(F)JojaCoffeeTable', // Joja Coffee Table
			'(F)GrayJojaCoffeeTable', // Gray Joja Coffee Table
			'(F)JojaEndTable', // Joja End Table
			'(F)GrayJojaEndTable', // Gray Joja End Table
			'(F)WizardTable', // Wizard Table
			'(F)WizardTeaTable', // Wizard Tea Table
			'(F)WizardEndTable', // Wizard End Table
			'(F)ElixirTable', // Elixir Table
			'(F)LongElixirTable', // Long Elixir Table
			'(F)JunimoTable', // Junimo Table
			'(F)JunimoTeaTable', // Junimo Tea Table
			'(F)JunimoEndTable', // Junimo End Table
			'(F)RetroTable', // Retro Table
			'(F)RetroTeaTable', // Retro Tea Table
			'(F)RetroEndTable', // Retro End Table
			'(F)PlasticLawnEndTable', // Plastic Lawn End Table
		],
	}, {
		group: 'Long Tables',
		entries: [
			'(F)800', // Winter Dining Table
			'(F)807', // Festive Dining Table
			'(F)814', // Mahogany Dining Table
			'(F)821', // Modern Dining Table
			'(F)BountifulDiningTable', // Bountiful Dining Table
		],
	}, {
		group: 'Bookcases',
		entries: [
			'(F)1283', // Artist Bookcase
			'(F)1285', // Luxury Bookcase
			'(F)1287', // Modern Bookcase
			'(F)1289', // Dark Bookcase
			'(F)ShortBookcase', // Short Bookcase
			'(F)JojaBookcase', // Joja Bookcase
			'(F)GrayJojaBookcase', // Gray Joja Bookcase
			'(F)LargeWizardBookcase', // Large Wizard Bookcase
			'(F)WizardBookcase', // Wizard Bookcase
			'(F)ShortWizardBookcase', // Short Wizard Bookcase
			'(F)SmallWizardBookcase', // Small Wizard Bookcase
			'(F)JunimoBookcase', // Junimo Bookcase
			'(F)RetroBookcase', // Retro Bookcase
		],
	}, {
		group: 'Dressers',
		entries: [
			'(F)704', // Oak Dresser
			'(F)709', // Walnut Dresser
			'(F)714', // Birch Dresser
			'(F)719', // Mahogany Dresser
			'(F)JojaDresser', // Joja Dresser
			'(F)GrayJojaDresser', // Gray Joja Dresser
			'(F)WizardDresser', // WizardDresser
			'(F)JunimoDresser', // Junimo Dresser
			'(F)RetroDresser', // Retro Dresser
		],
	}, {
		group: 'Fireplaces',
		entries: [
			'(F)1792', // Brick Fireplace
			'(F)1794', // Stone Fireplace
			'(F)1796', // Iridium Fireplace
			'(F)1798', // Stove Fireplace
			'(F)1800', // Monster Fireplace
			'(F)1866', // Elegant Fireplace
			'(F)DesertFireplace', // Desert Fireplace
			'(F)JojaFireplace', // Joja Fireplace
			'(F)WizardFireplace', // Wizard Fireplace
			'(F)JunimoFireplace', // Junimo Fireplace
			'(F)RetroFireplace', // Retro Fireplace
		],
	}, {
		group: 'Rugs',
		entries: [
			'(F)1755', // Bamboo Mat
			'(F)1742', // Burlap Rug
			'(F)1777', // Woodcut Rug
			'(F)1628', // Monster Rug
			'(F)1228', // Oceanic Rug
			'(F)1451', // Red Rug
			'(F)1456', // Patchwork Rug
			'(F)1461', // Dark Rug
			'(F)1618', // Red Cottage Rug
			'(F)1623', // Green Cottage Rug
			'(F)1664', // Mystic Rug
			'(F)1737', // Nautical Rug
			'(F)1902', // Pirate Rug
			'(F)1909', // Fruit Salad Rug
			'(F)1964', // Bone Rug
			'(F)1978', // Snowy Rug
			'(F)2488', // Light Green Rug
			'(F)2784', // Large Green Rug
			'(F)2790', // Icy Rug
			'(F)2794', // Old World Rug
			'(F)2798', // Large Red Rug
			'(F)2802', // Large Cottage Rug
			'(F)2870', // Funky Rug
			'(F)2875', // Modern Rug
			'(F)2742', // Blossom Rug
			'(F)SandyRug', // Sandy Rug
			'(F)DesertRug', // Desert Rug
			'(F)LargeJojaRug', // Large Joja Rug
			'(F)SquareJojaRug', // Square Joja Rug
			'(F)SmallJojaRug', // Small Joja Rug
			'(F)JojaRug', // Joja Rug
			'(F)RuneRug', // Rune Rug
			'(F)SwirlRug', // Swirl Rug
			'(F)StarryMoonRug', // Starry Moon Rug
			'(F)StoneFlooring', // StoneFlooring
			'(F)SquareJunimoRug', // Square Junimo Rug
			'(F)CircularJunimoRug', // Circular Junimo Rug
			'(F)JunimoRug', // Junimo Rug
			'(F)JunimoMat', // Junimo Mat
			'(F)SmallJunimoMat', // Small Junimo Mat
			'(F)LargeRetroRug', // Large Retro Rug
			'(F)RetroRug', // Retro Rug
			'(F)RetroSquareRug', // Retro Square Rug
			'(F)RetroMat', // Retro Mat
		],
	}, {
		group: 'Floor Dividers',
		entries: [
			'(F)2638', // Floor Divider 1 L
			'(F)2637', // Floor Divider 1 R
			'(F)2640', // Floor Divider 2 L
			'(F)2639', // Floor Divider 2 R
			'(F)2642', // Floor Divider 3 L
			'(F)2641', // Floor Divider 3 R
			'(F)2644', // Floor Divider 4 L
			'(F)2643', // Floor Divider 4 R
			'(F)2646', // Floor Divider 5 L
			'(F)2645', // Floor Divider 5 R
			'(F)2648', // Floor Divider 6 L
			'(F)2647', // Floor Divider 6 R
			'(F)2650', // Floor Divider 7 L
			'(F)2649', // Floor Divider 7 R
			'(F)2652', // Floor Divider 8 L
			'(F)2651', // Floor Divider 8 R
		],
	}, {
		group: 'Cushions',
		entries: [
			'(F)BlueCushion', // Blue Cushion
			'(F)YellowCushion', // Yellow Cushion
			'(F)GreenCushion', // Green Cushion
			'(F)RedCushion', // Red Cushion
			'(F)BrownCushion', // Brown Cushion
			'(F)BlackCushion', // Black Cushion
			'(F)JojaCushion', // Joja Cushion
			'(F)GrayJojaCushion', // Gray Joja Cushion
			'(F)WizardCushion', // Wizard Cushion
			'(F)DarkWizardCushion', // Dark Wizard Cushion
			'(F)JunimoCushion', // Junimo Cushion
			'(F)DarkJunimoCushion', // Dark Junimo Cushion
			'(F)RetroCushion', // Retro Cushion
			'(F)DarkRetroCushion', // Dark Retro Cushion
		],
	}, {
		group: 'Lamps & Wall Sconces',
		entries: [
			'(F)1443', // Country Lamp
			'(F)1445', // Box Lamp
			'(F)1447', // Modern Lamp
			'(F)1449', // Classic Lamp
			'(F)1751', // Candle Lamp
			'(F)1758', // Ornate Lamp
			'(F)OakLampEndTable', // Oak Lamp End Table
			'(F)WalnutLampEndTable', // Walnut Lamp End Table
			'(F)BirchLampEndTable', // Birch Lamp End Table
			'(F)MahoganyLampEndTable', // Mahogany Lamp End Table
			'(F)JojaLamp', // Joja Lamp
			'(F)WizardLamp', // Wizard Lamp
			'(F)JunimoLamp', // Junimo Lamp
			'(F)RetroLamp', // Retro Lamp
			'(F)2734', // Wall Sconce 1
			'(F)2736', // Wall Sconce 2
			'(F)2738', // Wall Sconce 3
			'(F)2740', // Wall Sconce 4
			'(F)2748', // Wall Sconce 5
			'(F)2812', // Wall Sconce 6
			'(F)2750', // Wall Sconce 7
		],
	}, {
		group: 'Windows',
		entries: [
			'(F)1614', // Basic Window
			'(F)1616', // Small Window
			'(F)1673', // Porthole
			'(F)1630', // Boarded Window
			'(F)1678', // Ornate Window
			'(F)1682', // Carved Window
			'(F)1749', // Metal Window
			'(F)TriangleWindow', // Triangle Window
		],
	}, {
		group: 'TVs',
		entries: [
			'(F)1466', // Budget TV
			'(F)1468', // Plasma TV
			'(F)1680', // Floor TV
			'(F)2326', // Tropical TV
			'(F)RetroTV', // Retro TV
			'(F)BrokenTelevision', // Broken Television
		],
	}, {
		group: 'Beds',
		entries: [
			'(F)2076', // Child Bed
			'(F)2048', // Single Bed
			'(F)2052', // Double Bed
			'(F)2058', // Starry Double Bed
			'(F)2064', // Strawberry Double Bed
			'(F)2070', // Pirate Double Bed
			'(F)2176', // Tropical Bed
			'(F)2180', // Tropical Double Bed
			'(F)2186', // Deluxe Red Double Bed
			'(F)2192', // Modern Double Bed
			'(F)2496', // Wild Double Bed
			'(F)2502', // Fisher Double Bed
			'(F)2508', // Birch Double Bed
			'(F)2514', // Exotic Double Bed
			'(F)BluePinstripeBed', // Blue Pinstripe Bed
			'(F)BluePinstripeDoubleBed', // Blue Pinstripe Double Bed
			'(F)MidnightBeachBed', // Midnight Beach Bed
			'(F)MidnightBeachDoubleBed', // Midnight Beach Double Bed
			'(F)JojaBed', // JojaBed
			'(F)WizardBed', // WizardBed
			'(F)JunimoBed', // JunimoBed
			'(F)RetroBed', // RetroBed
		],
	}, {
		group: 'House Plants',
		entries: [
			'(F)1376', // House Plant
			'(F)1377', // House Plant
			'(F)1378', // House Plant
			'(F)1379', // House Plant
			'(F)1380', // House Plant
			'(F)1381', // House Plant
			'(F)1382', // House Plant
			'(F)1383', // House Plant
			'(F)1384', // House Plant
			'(F)1385', // House Plant
			'(F)1386', // House Plant
			'(F)1387', // House Plant
			'(F)1388', // House Plant
			'(F)1389', // House Plant
			'(F)1390', // House Plant
		],
	}, {
		group: 'Freestanding Decorative Plants',
		entries: [
			'(F)984', // Long Cactus
			'(F)985', // Long Palm
			'(F)986', // Exotic Tree
			'(F)989', // Deluxe Tree
			'(F)1294', // Indoor Palm
			'(F)1296', // Manicured Pine
			'(F)1297', // Topiary Tree
			'(F)1307', // Dried Sunflowers
			'(F)1362', // Small Plant
			'(F)1363', // Table Plant
			'(F)1440', // Tree of the Winter Star
			'(F)1744', // Tree Column
			'(F)1747', // S. Pine
			'(F)1748', // Bonsai Tree
			'(F)TallHousePlant', // Tall House Plant
			'(F)CornPlant', // Corn Plant
			'(F)PlasticPlant', // Plastic Plant
			'(F)PlasticSapling', // Plastic Sapling
			'(F)PottedRedMushroom', // Potted Red Mushroom
			'(F)CurlyTree', // Curly Tree
			'(F)LeafyPlant', // Swamp Plant
			'(F)JunimoFlower', // Junimo Flower
			'(F)JunimoPlant', // Junimo Plant
			'(F)JunimoTree', // Junimo Tree
			'(F)RetroFlower', // Retro Flower
			'(F)RetroPlant', // Retro Plant
		],
	}, {
		group: 'Free Cactus',
		entries: [
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '0'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '1'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '2'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '3'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '4'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '5'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '6'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '7'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '8'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '9'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '10'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '11'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '12'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '13'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '14'}},
			{qualifiedItemId: '(F)FreeCactus', details: {topIndex: '15'}},
		],
	}, {
		group: 'Decorative Hanging Plants',
		entries: [
			'(F)1817', // Ceiling Leaves
			'(F)1818', // Ceiling Leaves
			'(F)1819', // Ceiling Leaves
			'(F)1820', // Ceiling Leaves
			'(F)1821', // Ceiling Leaves
			'(F)2627', // Jungle Decal
			'(F)2628', // Jungle Decal
			'(F)2629', // Jungle Decal
			'(F)2630', // Jungle Decal
			'(F)1745', // L. Light String
			'(F)1960', // Indoor Hanging Basket
			'(F)1961', // Winter Tree Decal
			'(F)1973', // Wall Flower
			'(F)1974', // S. Wall Flower
			'(F)2393', // Palm Wall Ornament
			'(F)2425', // Wall Basket
			'(F)2654', // Wall Palm
			'(F)2655', // Wall Cactus
			'(F)LeafyWallPanel', // Leafy Wall Panel
			'(F)DarkLeafyWallPanel', // Dark Leafy Wall Panel
			'(F)LightLeafyWallPanel', // Light Leafy Wall Panel
		],
	}, {
		group: 'Fancy House Plants',
		entries: [
			'(F)FancyTree1', // Fancy House Plant
			'(F)FancyTree2', // Fancy House Plant
			'(F)FancyTree3', // Fancy House Plant
			'(F)FancyHousePlant3', // House Plant
			'(F)FancyHousePlant1', // House Plant
			'(F)FancyHousePlant2', // House Plant
			'(F)FancyHousePlant4', // House Plant
			'(F)FancyHousePlant5', // House Plant
		],
	}, {
		group: 'Paintings',
		entries: [
			'(F)1539', // 'The Muzzamaroo'
			'(F)1541', // 'A Night On Eco-Hill'
			'(F)1543', // 'Pathways'
			'(F)1547', // 'Queen of the Gem Sea'
			'(F)1550', // 'Vanilla Villa'
			'(F)1552', // 'Primal Motion'
			'(F)1554', // 'Jade Hills'
			'(F)1557', // 'Sun #44'
			'(F)1561', // 'Spires'
			'(F)1563', // 'Highway 89'
			'(F)1565', // Calico Falls
			'(F)1567', // Needlepoint Flower
			'(F)1601', // 'Sun #45'
			'(F)1602', // 'Little Tree'
			'(F)1603', // 'Blueberries'
			'(F)1604', // 'Blue City'
			'(F)1606', // 'Dancing Grass'
			'(F)1607', // 'VGA Paradise'
			'(F)1612', // 'Kitemaster '95'
			'(F)1684', // Colorful Set
			'(F)1802', // My First Painting
			'(F)2329', // 'Volcano' Photo
			'(F)2419', // Foliage Print
			'(F)2421', // 'Boat'
			'(F)2423', // 'Vista'
			'(F)2584', // 'Jade Hills Extended'
			'(F)2730', // 'Frozen Dreams'
			'(F)2732', // 'Physics 101'
			'(F)MountedTrout_Painting', // Mounted Trout
			'(F)SquidKid_Painting', // 'Squid Kid'
			'(F)PigPainting', // Pig Painting
			'(F)SunDunes', // Sun Dunes
			'(F)JPainting', // J. Painting
			'(F)JojaColaPainting', // 'Joja Cola'
			'(F)JojaHQPainting', // 'Joja HQ'
			'(F)Runes', // 'Runes'
			'(F)WizardTower', // 'Wizard's Tower'
			'(F)VoidSwirls', // 'Void Swirls'
			'(F)Glyph', // Glyph
			'(F)CommunityCenter', // 'Community Center'
			'(F)LittleBuddies', // 'Little Buddies'
			'(F)Stardrop', // 'Stardrop'
			'(F)Hut', // 'Hut'
			'(F)Groovy', // 'Groovy'
			'(F)Abstract', // 'Abstract'
			'(F)Starship', // 'Starship'
			'(F)Binary', // 'Binary'
			'(F)Checkers', // 'Checkers'
			'(F)UFO', // 'UFO'
		],
	}, {
		group: 'Night Market Paintings',
		entries: [
			'(F)1838', // 'Red Eagle'
			'(F)1840', // 'Portrait Of A Mermaid'
			'(F)1842', // 'Solar Kingdom'
			'(F)1844', // 'Clouds'
			'(F)1846', // '1000 Years From Now'
			'(F)1848', // 'Three Trees'
			'(F)1850', // 'The Serpent'
			'(F)1852', // 'Tropical Fish #173'
			'(F)1854', // 'Land Of Clay'
		],
	}, {
		group: 'Portraits',
		entries: [
			'(F)AbigailPortrait', // Abigail Portrait
			'(F)EmilyPortrait', // Emily Portrait
			'(F)HaleyPortrait', // Haley Portrait
			'(F)LeahPortrait', // Leah Portrait
			'(F)MaruPortrait', // Maru Portrait
			'(F)PennyPortrait', // Penny Portrait
			'(F)AlexPortrait', // Alex Portrait
			'(F)ElliottPortrait', // Elliott Portrait
			'(F)HarveyPortrait', // Harvey Portrait
			'(F)SamPortrait', // Sam Portrait
			'(F)SebastianPortrait', // Sebastian Portrait
			'(F)ShanePortrait', // Shane Portrait
			'(F)KrobusPortrait', // Krobus Portrait
		],
	}, {
		group: 'Movie Posters',
		entries: [
			'(F)1959', // 'It Howls In The Rain'
			'(F)1954', // 'Journey Of The Prairie King: The Motion Picture'
			'(F)1953', // 'Mysterium'
			'(F)1958', // 'Natural Wonders: Exploring Our Vibrant World'
			'(F)1952', // 'The Brave Little Sapling'
			'(F)1957', // 'The Miracle At Coldstar Ranch'
			'(F)1956', // 'The Zuzu City Express'
			'(F)1955', // 'Wumbus'
		],
	}, {
		group: 'Decorative Doors',
		entries: [
			'(F)DecorativeDoor1', // Decorative Door 1
			'(F)DecorativeDoor2', // Decorative Door 2
			'(F)DecorativeDoor3', // Decorative Door 3
			'(F)DecorativeDoor4', // Decorative Door 4
			'(F)DecorativeDoor5', // Decorative Door 5
			'(F)DecorativeDoor6', // Decorative Door 6
			'(F)DecorativeJojaDoor', // Decorative Joja Door
			'(F)DecorativeWizardDoor', // Decorative Wizard Door
			'(F)DecorativeJunimoDoor', // Decorative Junimo Door
			'(F)DecorativeRetroDoor', // Decorative Retro Door
		],
	}, {
		group: 'Banners',
		entries: [
			'(F)1975', // Clouds Banner
			'(F)2624', // Pastel Banner
			'(F)2625', // Winter Banner
			'(F)2626', // Moonlight Jellies Banner
			'(F)2653', // Icy Banner
			'(F)RetroBanner', // Retro Banner
		],
	}, {
		group: 'Wall Hangings',
		entries: [
			'(F)1402', // Calendar
			'(F)1559', // Wallflower Pal
			'(F)1545', // 'Burnt Offering'
			'(F)1600', // Skull Poster
			'(F)1605', // Little Photos
			'(F)1675', // Anchor
			'(F)1676', // World Map
			'(F)1687', // Cloud Decal
			'(F)1692', // Cloud Decal
			'(F)1753', // Miner's Crest
			'(F)1811', // Hanging Shield
			'(F)1812', // Monster Danglers
			'(F)1814', // Ceiling Flags
			'(F)1900', // Pirate Flag
			'(F)1907', // Strawberry Decal
			'(F)1914', // Night Sky Decal 1
			'(F)1915', // Night Sky Decal 2
			'(F)1916', // Night Sky Decal 3
			'(F)1917', // Wall Pumpkin
			'(F)1918', // Small Wall Pumpkin
			'(F)2334', // Pyramid Decal
			'(F)2418', // Lifesaver
			'(F)2631', // Starport Decal
			'(F)2632', // Decorative Pitchfork
			'(F)2633', // Wood Panel
			'(F)2634', // Decorative Axe
			'(F)2635', // Log Panel
			'(F)2636', // Log Panel
			'(F)HangingFish', // Hanging Fish
			'(F)WallClock', // Wall Clock
			'(F)DecorativeOakLadder', // Decorative Oak Ladder
			'(F)DecorativeWalnutLadder', // Decorative Walnut Ladder
			'(F)LightSwitch', // Light Switch
			'(F)Outlet', // Outlet
			'(F)DecorativeShovel', // Decorative Shovel
			'(F)WallSword', // Wall Sword
			'(F)ArtPhoto', // Art Photo
			'(F)ArtPhoto2', // Art Photo 2
			'(F)PierresSign', // Pierre's Sign
			'(F)SamsSkateboard', // Sam's Skateboard
			'(F)ChickenDecal', // Chicken Decal
			'(F)ExoticPalace', // Exotic Palace
			'(F)PeriodicTable', // Periodic Table
			'(F)DustySkull', // Dusty Skull
			'(F)ModelPlanes', // Model Planes
			'(F)DesertFlags', // Desert Flags
			'(F)CowDecal', // Cow Decal
			'(F)1609', // J. Cola Light
			'(F)J', // J (sign)
			'(F)JLight', // J. Light
			'(F)JojaColaOrnament', // Joja Cola Ornament
			'(F)MorrisPortrait', // Manager of the Year
			'(F)WitchBroom', // Witch's Broom
			'(F)SmallElixirShelf', // Small Elixir Shelf
			'(F)ElixirShelf', // Elixir Shelf
			'(F)SmallStackedElixirShelf', // Small Stacked Elixir Shelf
			'(F)StackedElixirShelf', // Stacked Elixir Shelf
			'(F)WizardBookshelf', // Wizard Bookshelf
			'(F)JunimoWallPlaque', // Junimo Wall Plaque
			'(F)JunimoStar', // Junimo Star
			'(F)BulletinBoard', // Bulletin Board
		],
	}, {
		group: 'Fish Tanks',
		entries: [
			'(F)2414', // Modern Fish Tank
			'(F)2322', // Small Fish Tank
			'(F)2304', // Large Fish Tank
			'(F)2312', // Deluxe Fish Tank
			'(F)JungleTank', // Jungle Tank
			'(F)2400', // Aquatic Sanctuary
		],
	}, {
		group: 'Torches',
		entries: [
			'(F)2398', // Stump Torch
			'(F)2397', // Plain Torch
			'(F)2331', // Jungle Torch
		],
	}, {
		group: 'Large Decorations',
		entries: [
			'(F)1280', // China Cabinet
			'(F)1291', // Ceramic Pillar
			'(F)1292', // Gold Pillar
			'(F)1293', // Industrial Pipe
			'(F)1295', // Totem Pole
			'(F)1298', // Standing Geode
			'(F)1299', // Obsidian Vase
			'(F)1301', // Sloth Skeleton L
			'(F)1302', // Sloth Skeleton M
			'(F)1303', // Sloth Skeleton R
			'(F)1304', // Skeleton
			'(F)1305', // Chicken Statue (furniture)
			'(F)1306', // Leah's Sculpture
			'(F)1309', // Sam's Boombox
			'(F)1371', // Wumbus Statue
			'(F)1373', // Bobo Statue
			'(F)1375', // Purple Serpent Statue
			'(F)1471', // Green Serpent Statue
			'(F)1669', // Lg. Futan Bear
			'(F)1671', // Bear Statue
			'(F)1733', // Junimo Plush
			'(F)1971', // Butterfly Hutch
			'(F)2332', // Gourmand Statue
			'(F)2396', // Iridium Krobus
			'(F)2427', // Decorative Trash Can
			'(F)UprightPiano', // Upright Piano
			'(F)CoatStand', // Coat Stand
			'(F)BirdHouse', // Bird House
			'(F)DecorativeSword', // Decorative Sword
			'(F)Clothesline', // Clothesline
			'(F)ElegantVase', // Elegant Vase
			'(F)CatTree', // Cat Tree
			'(F)DarkCatTree', // Dark Cat Tree
			'(F)Doghouse', // Doghouse
			'(F)DarkDoghouse', // Dark Doghouse
			'(F)DarkPiano', // Dark Piano
			'(F)RadioDesk', // Radio Desk
			'(F)CatStatue', // Calico Statue
			'(F)DecorativeBarrel', // Decorative Barrel
			'(F)JojaVault', // Joja Vault
			'(F)StackedJojaCrates', // Stacked Joja Boxes
			'(F)JojaCrate', // Joja Crate
			'(F)JojaShoppingCart', // Joja Shopping Cart
			'(F)LargeJojaCrate', // Large Joja Crate
			'(F)JojaColaFridge', // Joja Cola Fridge
			'(F)WizardStudy', // Wizard Study
			'(F)Cauldron', // Cauldron
			'(F)JunimoHut', // Junimo Hut (furniture)
			'(F)LargeJunimoHut', // Large Junimo Hut
			'(F)SmallJunimoHut', // Small Junimo Hut
			'(F)BrochureCabinet', // Brochure Cabinet
			'(F)RetroCabinet', // Retro Cabinet
		],
	}, {
		group: 'Small Decorations',
		entries: [
			'(F)1300', // Singing Stone
			'(F)1364', // Decorative Bowl
			'(F)1365', // Futan Bear
			'(F)1366', // Globe
			'(F)1367', // Model Ship
			'(F)1368', // Small Crystal
			'(F)1369', // Decorative Lantern
			'(F)1760', // Small Junimo Plush (Green)
			'(F)1761', // Small Junimo Plush (Blue)
			'(F)1762', // Small Junimo Plush (Yellow)
			'(F)1763', // Small Junimo Plush (Pink)
			'(F)1764', // Futan Rabbit
			'(F)2814', // Squirrel Figurine
			'(F)JojaColaCans', // Joja Cola Cans
			'(F)CashRegister', // Cash Register
			'(F)ElixirBundle', // Elixir Bundle
			'(F)CoupleElixirs', // Two Elixirs
			'(F)CrystalBall', // Crystal Ball
			'(F)AmethystCrystalBall', // Amethyst Crystal Ball
			'(F)TopazCrystalBall', // Topaz Crystal Ball
			'(F)AquamarineCrystalBall', // Aquamarine Crystal Ball
			'(F)EmeraldCrystalBall', // Emerald Crystal Ball
			'(F)RubyCrystalBall', // Ruby Crystal Ball
			'(F)SmallBookStack', // Small Book Stack
			'(F)BookStack', // Book Stack
			'(F)LargeBookStack', // Large Book Stack
			'(F)PurpleBook', // Purple Book
			'(F)BlueBook', // Blue Book
			'(F)YellowBook', // Yellow Book
			'(F)RedBook', // Red Book
			'(F)GreenBook', // Green Book
			'(F)BrownBook', // Brown Book
			'(F)FallenPurpleBook', // Fallen Purple Book
			'(F)FallenBlueBook', // Fallen Blue Book
			'(F)FallenYellowBook', // Fallen Yellow Book
			'(F)FallenRedBook', // Fallen Red Book
			'(F)FallenGreenBook', // Fallen Green Book
			'(F)FallenBrownBook', // Fallen Brown Book
			'(F)SmallBookPile', // Small Book Pile
			'(F)BookPile', // Book Pile
			'(F)LargeBookPile', // Large Book Pile
			'(F)JunimoPlaque', // Junimo Plaque
			'(F)JunimoPot', // Junimo Pot
			'(F)JunimoBag', // Junimo Bag
			'(F)JunimoBundle', // Junimo Bundle
			'(F)SmallJunimoPot', // Small Junimo Pot
			'(F)GreenSleepingJunimo', // Green Sleeping Junimo
			'(F)BlueSleepingJunimo', // Blue Sleeping Junimo
			'(F)RedSleepingJunimo', // Red Sleeping Junimo
			'(F)PurpleSleepingJunimo', // Purple Sleeping Junimo
			'(F)YellowSleepingJunimo', // Yellow Sleeping Junimo
			'(F)OrangeSleepingJunimo', // Orange Sleeping Junimo
			'(F)GraySleepingJunimo', // Gray Sleeping Junimo
			'(F)RetroRadio', // Retro Radio
			'(F)DecorativeHatch', // Decorative Hatch
			'(F)SixPackRings', // Six-Pack Rings
			'(F)GreenBottle', // Green Bottle
			'(F)PlasticBag', // Plastic Bag
			'(F)AluminumCan', // Aluminum Can
			'(F)BlueBottle', // Blue Bottle
			'(F)BuriedTire', // Buried Tire
			'(F)Tire', // Tire
			'(F)Wrapper', // Wrapper
			'(F)SpilledBeverage', // Spilled Beverage
			'(F)MessyShirt', // Messy Shirt
			'(F)MessyShorts', // Messy Shorts
		],
	}, {
		group: 'Catalogues',
		entries: [
			'(F)1308', // Catalogue
			'(F)1226', // Furniture Catalogue
			'(F)JojaCatalogue', // Joja Catalogue
			'(F)WizardCatalogue', // Wizard Catalogue
			'(F)JunimoCatalogue', // Junimo Catalogue
			'(F)RetroCatalogue', // Retro Catalogue
			'(F)TrashCatalogue', // Trash Catalogue
		],
	}, {
		group: 'Unobtainable',
		entries: [
			'(F)FoodPetBowl', // Food Pet Bowl
			'(F)WaterPetBowl', // Water Pet Bowl
			'(F)CCFishTank', // CCFishTank
		],
	}];
	
	{
		let entries = [];
		
		for (let item of context.core.items.byType.WP.values()) {
			entries.push(item.qualifiedItemId);
		}
		
		tabs.wallpaper = [{
			group: 'Wallpaper',
			entries: entries,
		}];
	}
	
	{
		let entries = [];
		
		for (let item of context.core.items.byType.FL.values()) {
			entries.push(item.qualifiedItemId);
		}
		
		tabs.flooring = [{
			group: 'Flooring',
			entries: entries,
		}];
	}
	
	tabs.nature = [{
		group: 'Grass',
		entries: [
			{
				kind: 'terrainFeatures',
				type: 'Grass',
				details: {
					grassType: '1',
					numberOfWeeds: '4',
					grassSourceOffset: '20',
				},
			},
			{
				kind: 'terrainFeatures',
				type: 'Grass',
				details: {
					grassType: '7',
					numberOfWeeds: '4',
					grassSourceOffset: '20',
				},
			},
		],
	}, {
		group: 'Wild Trees',
		entries: [
			{wildTreeId: '1'}, // Oak Tree
			{wildTreeId: '2'}, // Maple Tree
			{wildTreeId: '3'}, // Pine Tree
			{wildTreeId: '7'}, // Mushroom Tree
			{wildTreeId: '8'}, // Mahogany Tree
			{wildTreeId: '6'}, // Palm Tree
			{wildTreeId: '9'}, // Palm Tree
			{wildTreeId: '10'}, // Green Rain Tree
			{wildTreeId: '11'}, // Green Rain Tree
			{wildTreeId: '12'}, // Green Rain Tree
			{wildTreeId: '13'}, // Mystic Tree
		],
	}, {
		group: 'Fruit Trees',
		entries: [
			{fruitTreeId: '628'}, // Cherry Tree
			{fruitTreeId: '629'}, // Apricot Tree
			{fruitTreeId: '630'}, // Orange Tree
			{fruitTreeId: '631'}, // Peach Tree
			{fruitTreeId: '632'}, // Pomegranate Tree
			{fruitTreeId: '633'}, // Apple Tree
			{fruitTreeId: '69'}, // Banana Tree
			{fruitTreeId: '835'}, // Mango Tree
		],
	}, {
		group: 'Basic Bushes',
		entries: [
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '0', // Small Bush
					datePlanted: '-20',
					tileSheetOffset: '0',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '0', // Small Bush
					datePlanted: '-20',
					tileSheetOffset: '1',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '1', // Medium Bush
					datePlanted: '-20',
					tileSheetOffset: '0',
					townBush: 'true',
					drawShadow: 'true',
				},
			},
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '2', // Large Bush
					datePlanted: '-20',
					tileSheetOffset: '0',
					townBush: 'true',
					drawShadow: 'true',
				},
			},
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '2', // Large Bush
					datePlanted: '-20',
					tileSheetOffset: '0',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
		],
	}, {
		group: 'Productive Bushes',
		entries: [
			{
				name: 'Berry Bush',
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '1', // Medium Bush
					datePlanted: '-20',
					tileSheetOffset: '0',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
			{
				name: 'Berry Bush',
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '1', // Medium Bush
					datePlanted: '-20',
					tileSheetOffset: '1',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '4', // Walnut Bush
					datePlanted: '-20',
					tileSheetOffset: '0',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
			{
				kind: 'largeTerrainFeatures',
				type: 'Bush',
				details: {
					size: '4', // Walnut Bush
					datePlanted: '-20',
					tileSheetOffset: '1',
					townBush: 'false',
					drawShadow: 'true',
				},
			},
		],
	}, {
		group: 'Large Resources',
		entries: [
			{resourceClumpId: '600'}, // Large Stump
			{resourceClumpId: '602'}, // Large Log
			{resourceClumpId: '672'}, // Boulder
			{resourceClumpId: '622'}, // Meteorite
		],
	}, {
		group: 'Cave Rocks',
		entries: [
			'(O)32', // Earth Rock
			'(O)34', // Earth Rock
			'(O)36', // Earth Rock
			'(O)38', // Earth Rock
			'(O)40', // Earth Rock
			'(O)42', // Earth Rock
			'(O)48', // Frozen Rock
			'(O)50', // Frozen Rock
			'(O)52', // Frozen Rock
			'(O)54', // Frozen Rock
			'(O)56', // Lava Rock
			'(O)58', // Lava Rock
			'(O)668', // Stone Rock
			'(O)670', // Stone Rock
			'(O)845', // Volcanic Rock
			'(O)846', // Volcanic Rock
			'(O)847', // Volcanic Rock
		],
	}, {
		group: 'Ore Nodes',
		entries: [
			'(O)751', // Copper Node
			'(O)849', // Copper Node (volcano)
			'(O)290', // Iron Node
			'(O)850', // Iron Node (volcano)
			'(O)764', // Gold Node
			'(O)VolcanoGoldNode', // Gold Node (volcano)
			'(O)765', // Iridium Node
			'(O)46', // Mystic Node
			'(O)95', // Radioactive Node
			'(O)10', // Topaz Node
			'(O)8', // Amethyst Node
			'(O)14', // Aquamarine Node
			'(O)6', // Jade Node
			'(O)12', // Emerald Node
			'(O)4', // Ruby Node
			'(O)2', // Diamond Node
			'(O)44', // Gem Node
			'(O)818', // Clay Node
			'(O)75', // Geode Node
			'(O)76', // Frozen Geode Node
			'(O)77', // Magma Geode Node
			'(O)819', // Omni Geode Node
			'(O)BasicCoalNode0', // Coal Node
			'(O)BasicCoalNode1', // Coal Node
			'(O)VolcanoCoalNode0', // Coal Node
			'(O)VolcanoCoalNode1', // Coal Node
			'(O)816', // Bone Node
			'(O)817', // Bone Node
			'(O)843', // Cinder Shard Node
			'(O)844', // Cinder Shard Node
			'(O)25', // Mussel Node
			'(O)CalicoEggStone_0', // Calico Egg Node
			'(O)CalicoEggStone_1', // Calico Egg Node
			'(O)CalicoEggStone_2', // Calico Egg Node
		],
	}, {
		group: 'Debris',
		entries: [
			'(O)294', // Twig
			'(O)295', // Twig
			'(O)343', // Rock
			'(O)450', // Rock
			{
				name: 'Weeds (Spring)',
				qualifiedItemId: '(O)674',
			},
			{
				name: 'Weeds (Spring)',
				qualifiedItemId: '(O)675',
			},
			{
				name: 'Weeds (Spring)',
				qualifiedItemId: '(O)784',
			},
			{
				name: 'Special Weeds (Spring)',
				qualifiedItemId: '(O)792',
			},
			{
				name: 'Weeds (Summer)',
				qualifiedItemId: '(O)676',
			},
			{
				name: 'Weeds (Summer)',
				qualifiedItemId: '(O)677',
			},
			{
				name: 'Weeds (Summer)',
				qualifiedItemId: '(O)785',
			},
			{
				name: 'Special Weeds (Summer)',
				qualifiedItemId: '(O)793',
			},
			{
				name: 'Weeds (Fall)',
				qualifiedItemId: '(O)678',
			},
			{
				name: 'Weeds (Fall)',
				qualifiedItemId: '(O)679',
			},
			{
				name: 'Weeds (Fall)',
				qualifiedItemId: '(O)786',
			},
			{
				name: 'Special Weeds (Fall)',
				qualifiedItemId: '(O)794',
			},
		],
	}, {
		group: 'Dig Spots',
		entries: [
			'(O)590', // Artifact Spot
			'(O)SeedSpot', // Seed Spot
		],
	}];
	
	tabs.museum = [{
		group: 'Artifacts',
		entries: [
			{museumPieceId: '96'}, // Dwarf Scroll I
			{museumPieceId: '97'}, // Dwarf Scroll II
			{museumPieceId: '98'}, // Dwarf Scroll III
			{museumPieceId: '99'}, // Dwarf Scroll IV
			{museumPieceId: '100'}, // Chipped Amphora
			{museumPieceId: '101'}, // Arrowhead
			{museumPieceId: '103'}, // Ancient Doll
			{museumPieceId: '104'}, // Elvish Jewelry
			{museumPieceId: '105'}, // Chewing Stick
			{museumPieceId: '106'}, // Ornamental Fan
			{museumPieceId: '107'}, // Dinosaur Egg
			{museumPieceId: '108'}, // Rare Disc
			{museumPieceId: '109'}, // Ancient Sword
			{museumPieceId: '110'}, // Rusty Spoon
			{museumPieceId: '111'}, // Rusty Spur
			{museumPieceId: '112'}, // Rusty Cog
			{museumPieceId: '113'}, // Chicken Statue
			{museumPieceId: '114'}, // Ancient Seed
			{museumPieceId: '115'}, // Prehistoric Tool
			{museumPieceId: '116'}, // Dried Starfish
			{museumPieceId: '117'}, // Anchor
			{museumPieceId: '118'}, // Glass Shards
			{museumPieceId: '119'}, // Bone Flute
			{museumPieceId: '120'}, // Prehistoric Handaxe
			{museumPieceId: '121'}, // Dwarvish Helm
			{museumPieceId: '122'}, // Dwarf Gadget
			{museumPieceId: '123'}, // Ancient Drum
			{museumPieceId: '124'}, // Golden Mask
			{museumPieceId: '125'}, // Golden Relic
			{museumPieceId: '126'}, // Strange Doll
			{museumPieceId: '127'}, // Strange Doll
			{museumPieceId: '579'}, // Prehistoric Scapula
			{museumPieceId: '580'}, // Prehistoric Tibia
			{museumPieceId: '581'}, // Prehistoric Skull
			{museumPieceId: '582'}, // Skeletal Hand
			{museumPieceId: '583'}, // Prehistoric Rib
			{museumPieceId: '584'}, // Prehistoric Vertebra
			{museumPieceId: '585'}, // Skeletal Tail
			{museumPieceId: '586'}, // Nautilus Fossil
			{museumPieceId: '587'}, // Amphibian Fossil
			{museumPieceId: '588'}, // Palm Fossil
			{museumPieceId: '589'}, // Trilobite
		],
	}, {
		group: 'Minerals',
		entries: [
			{museumPieceId: '60'}, // Emerald
			{museumPieceId: '62'}, // Aquamarine
			{museumPieceId: '64'}, // Ruby
			{museumPieceId: '66'}, // Amethyst
			{museumPieceId: '68'}, // Topaz
			{museumPieceId: '70'}, // Jade
			{museumPieceId: '72'}, // Diamond
			{museumPieceId: '74'}, // Prismatic Shard
			{museumPieceId: '80'}, // Quartz
			{museumPieceId: '82'}, // Fire Quartz
			{museumPieceId: '84'}, // Frozen Tear
			{museumPieceId: '86'}, // Earth Crystal
			{museumPieceId: '538'}, // Alamite
			{museumPieceId: '539'}, // Bixite
			{museumPieceId: '540'}, // Baryte
			{museumPieceId: '541'}, // Aerinite
			{museumPieceId: '542'}, // Calcite
			{museumPieceId: '543'}, // Dolomite
			{museumPieceId: '544'}, // Esperite
			{museumPieceId: '545'}, // Fluorapatite
			{museumPieceId: '546'}, // Geminite
			{museumPieceId: '547'}, // Helvite
			{museumPieceId: '548'}, // Jamborite
			{museumPieceId: '549'}, // Jagoite
			{museumPieceId: '550'}, // Kyanite
			{museumPieceId: '551'}, // Lunarite
			{museumPieceId: '552'}, // Malachite
			{museumPieceId: '553'}, // Neptunite
			{museumPieceId: '554'}, // Lemon Stone
			{museumPieceId: '555'}, // Nekoite
			{museumPieceId: '556'}, // Orpiment
			{museumPieceId: '557'}, // Petrified Slime
			{museumPieceId: '558'}, // Thunder Egg
			{museumPieceId: '559'}, // Pyrite
			{museumPieceId: '560'}, // Ocean Stone
			{museumPieceId: '561'}, // Ghost Crystal
			{museumPieceId: '562'}, // Tigerseye
			{museumPieceId: '563'}, // Jasper
			{museumPieceId: '564'}, // Opal
			{museumPieceId: '565'}, // Fire Opal
			{museumPieceId: '566'}, // Celestine
			{museumPieceId: '567'}, // Marble
			{museumPieceId: '568'}, // Sandstone
			{museumPieceId: '569'}, // Granite
			{museumPieceId: '570'}, // Basalt
			{museumPieceId: '571'}, // Limestone
			{museumPieceId: '572'}, // Soapstone
			{museumPieceId: '573'}, // Hematite
			{museumPieceId: '574'}, // Mudstone
			{museumPieceId: '575'}, // Obsidian
			{museumPieceId: '576'}, // Slate
			{museumPieceId: '577'}, // Fairy Stone
			{museumPieceId: '578'}, // Star Shards
		],
	}];
	
	for (let [tab, groups] of Object.entries(tabs)) {
		for (let group of groups) {
			for (let featureInfo of group.entries) {
				let feature = createFeature(context, featureInfo);
				feature.meta.catalogueData = {
					name: featureInfo.name,
					tab: tab,
					group: group.group,
				};
				context.features.push(feature);
			}
		}
	}
};

export let createFeature = function (context, featureInfo) {
	featureInfo = normalizeInfo(featureInfo);
	let kind = featureInfo.kind ?? inferKind(context, featureInfo);
	return new Feature(kind, 0, 0, createDetails(context, kind, featureInfo));
};

let normalizeInfo = function (info) {
	if (typeof info === 'string') {
		info = {
			qualifiedItemId: info,
		};
	}
	
	return info;
};

export let inferKind = function (context, info) {
	if (info.qualifiedItemId != null) {
		let parts = util.parseItemId(info.qualifiedItemId);
		
		switch (parts[0]) {
		case 'F':
			return 'furniture';
		
		default:
			return 'objects';
		}
	}
	else if (
		info.buildingId != null
	) {
		return 'buildings';
	}
	else if (
		info.museumPieceId != null
	) {
		return 'museumPieces';
	}
	else if (
		info.resourceClumpId != null ||
		info.giantCropId != null
	) {
		return 'resourceClumps';
	}
	else if (
		info.cropId != null ||
		info.fruitTreeId != null ||
		info.pathId != null ||
		info.wildTreeId != null
	) {
		return 'terrainFeatures';
	}
	
	return 'objects';
};

export let createDetails = function (context, kind, featureInfo) {
	let core = context.core;
	let lib = core.extensions.maps.lib;
	let details = {};
	let type = null;
	
	switch (kind) {
	case 'buildings':
		details['@@'] = 'Building';
		
		if (featureInfo.buildingId != null) {
			let data = core.content.Data.Buildings[featureInfo.buildingId];
			
			if (data.BuildingType != null) {
				type = data.BuildingType.replace(/^.*\./, '');
			}
			else {
				switch (featureInfo.buildingId) {
				case 'Barn':
				case 'Big Barn':
				case 'Deluxe Barn':
					type = 'Barn';
					break;
				
				case 'Big Coop':
				case 'Coop':
				case 'Deluxe Coop':
					type = 'Coop';
					break;
				
				case 'Mill':
					type = 'Mill';
					break;
				}
			}
			
			if (data.NonInstancedIndoorLocation == null) {
				details.nonInstancedIndoorsName = {
					'string@xsi:nil': 'true',
					string: '',
				};
			}
			else {
				details.nonInstancedIndoorsName = {
					string: data.NonInstancedIndoorLocation,
				};
			}
			
			details.tilesWide = data.Size.X + '';
			details.tilesHigh = data.Size.Y + '';
			details.maxOccupants = data.MaxOccupants + '';
			details.currentOccupants = '0';
			details.daysOfConstructionLeft = '0';
			details.daysUntilUpgrade = '0';
			details.buildingType = featureInfo.buildingId;
			details.hayCapacity = data.HayCapacity + '';
			details.humanDoor = {
				X: data.HumanDoor.X + '',
				Y: data.HumanDoor.Y + '',
			};
			details.animalDoor = {
				X: data.AnimalDoor.X + '',
				Y: data.AnimalDoor.Y + '',
			};
			details.animalDoorOpen = 'false';
			details.animalDoorOpenAmount = '0';
			details.magical = data.MagicalConstruction ? 'true' : 'false';
			details.fadeWhenPlayerIsBehind = data.FadeWhenBehind ? 'true' : 'false';
			
			switch (featureInfo.buildingId) {
			case 'Cabin':
				details['sp:upgradeLevelToShow'] = '0';
				break;
			}
		}
		
		break;
	
	case 'furniture':
		details['@@'] = 'Furniture';
		
		if (featureInfo.qualifiedItemId != null) {
			let [itemType, itemId] = util.parseItemId(featureInfo.qualifiedItemId);
			let item = core.items.get(itemType, itemId);
			let rect = util.getItemRect(item);
			details.itemId = item.itemId;
			details.furniture_type = mapsUtil.getFurnitureType(item) + '';
			details.currentRotation = '0';
			details.defaultSourceRect = {
				X: rect.x + '',
				Y: rect.y + '',
				Width: rect.width + '',
				Height: rect.height + '',
				Location: {
					X: rect.x + '',
					Y: rect.y + '',
				},
				Size: {
					X: rect.width + '',
					Y: rect.height + '',
				},
			};
			
			type = 'Furniture';
			
			switch (details.itemId) {
			case '1466':
			case '1468':
			case '1680':
			case '2326':
			case 'RetroTV':
				type = 'TV';
				break;
			
			default:
				switch (item.data[1]) {
				case 'fishtank':
					type = 'FishTankFurniture';
					break;
				
				case 'dresser':
					type = 'StorageFurniture';
					break;
				
				case 'randomized_plant':
					type = 'RandomizedPlantFurniture';
					break;
				
				default:
					if (item.data[1]?.startsWith('bed')) {
						type = 'BedFurniture';
					}
				}
			}
			
			if (featureInfo.heldObject != null) {
				let itemInfo = normalizeInfo(featureInfo.heldObject);
				let itemDetails = createDetails(context, inferKind(context, itemInfo), itemInfo);
				itemDetails['@@'] = 'heldObject';
				util.addDetail(details, itemDetails);
			}
			
			if (featureInfo.heldItems != null) {
				for (let itemInfo of featureInfo.heldItems) {
					itemInfo = normalizeInfo(itemInfo);
					let itemDetails = createDetails(context, inferKind(context, itemInfo), itemInfo);
					itemDetails['@@'] = 'heldItems';
					util.addDetail(details, itemDetails);
				}
			}
		}
		
		break;
	
	case 'largeTerrainFeatures':
		details['@@'] = 'LargeTerrainFeature';
		break;
	
	case 'museumPieces':
		details['@@'] = 'string';
		
		if (featureInfo.museumPieceId != null) {
			details.$ = featureInfo.museumPieceId;
		}
		
		break;
	
	case 'objects':
		details['@@'] = 'Object';
		
		if (featureInfo.qualifiedItemId != null) {
			let [itemType, itemId] = util.parseItemId(featureInfo.qualifiedItemId);
			let item = core.items.get(itemType, itemId);
			
			details.category = item.category + '';
			details.name = item.name;
			details.parentSheetIndex = item.spriteIndex + '';
			details.itemId = item.itemId;
			details.quality = (featureInfo.quality ?? 0) + '';
			details.stack = (featureInfo.stack ?? 1) + '';
			details.SpecialVariable = '0';
			details.bigCraftable = ['BC', 'M'].includes(item.itemType) ? 'true' : 'false';
			
			if (item.category === -999) {
				details.fragility = '2';
			}
			
			switch (item.itemType) {
			case 'FL':
				type = 'Wallpaper';
				details.isFloor = 'true';
				break;
			
			case 'M':
				type = 'Mannequin';
				details.hat = {'Hat@xsi:nil': 'true', Hat: ''},
				details.shirt = {'Clothing@xsi:nil': 'true', Clothing: ''},
				details.pants = {'Clothing@xsi:nil': 'true', Clothing: ''},
				details.boots = {'Boots@xsi:nil': 'true', Boots: ''},
				details.facing = {int: '2'};
				details.swappedWithFarmerTonight = {boolean: 'false'};
				break;
			
			case 'WP':
				type = 'Wallpaper';
				details.isFloor = 'false';
				break;
			}
			
			// See StardewValley.Object:placementAction()
			
			type ??= {
				'(BC)62': 'IndoorPot', // Garden Pot
				'(BC)130': 'Chest', // Chest
				'(BC)146': 'Torch', // Campfire
				'(BC)163': 'Cask', // Cask
				'(BC)208': 'Workbench', // Workbench
				'(BC)209': 'MiniJukebox', // Mini-Jukebox
				'(BC)211': 'WoodChipper', // Wood Chipper
				'(BC)214': 'Phone', // Telephone
				'(BC)216': 'Chest', // Mini-Fridge
				'(BC)232': 'Chest', // Stone Chest
				'(BC)248': 'Chest', // Mini-Shipping Bin
				'(BC)256': 'Chest', // Junimo Chest
				'(BC)275': 'Chest', // Hopper
				'(BC)278': 'Torch', // Campfire (Cookout Kit)
				'(BC)BigChest': 'Chest', // Big Chest
				'(BC)BigStoneChest': 'Chest', // Big Stone Chest
				'(O)93': 'Torch', // Torch
				'(O)298': 'Fence', // Hardwood Fence
				'(O)322': 'Fence', // Wood Fence
				'(O)323': 'Fence', // Stone Fence
				'(O)324': 'Fence', // Iron Fence
				'(O)325': 'Fence', // Gate
				'(O)710': 'CrabPot', // Crab Pot
			}[item.qualifiedItemId];
			
			if (type == null) {
				if (util.hasContextTag(item, 'sign_item')) {
					type = 'Sign';
				}
				else if (util.hasContextTag(item, 'torch_item')) {
					type = 'Torch';
				}
			}
			
			switch (featureInfo.type ?? type) {
			case 'Chest':
				details.items = {};
				details.playerChest = 'true';
				break;
			
			case 'Torch':
				details.isOn = 'true';
				break;
			}
		}
		
		break;
	
	case 'resourceClumps':
		details['@@'] = 'ResourceClump';
		
		if (featureInfo.resourceClumpId != null) {
			details.width = '2';
			details.height = '2';
			details.parentSheetIndex = featureInfo.resourceClumpId;
			details.health = '20';
		}
		
		if (featureInfo.giantCropId != null) {
			let data = core.content.Data.GiantCrops[featureInfo.giantCropId];
			type = 'GiantCrop';
			details.width = data.TileSize.X + '';
			details.height = data.TileSize.Y + '';
			details.parentSheetIndex = '0';
			details.health = '3';
			details.id = featureInfo.giantCropId;
		}
		
		break;
	
	case 'terrainFeatures':
		details['@@'] = 'TerrainFeature';
		
		if (featureInfo.cropId != null) {
			let data = core.content.Data.Crops[featureInfo.cropId];
			type = 'HoeDirt';
			details.crop = {};
			details.crop.phaseDays = {};
			
			for (let days of data.DaysInPhase) {
				util.addDetail(details.crop.phaseDays, {int: days + ''}, 'int');
			}
			
			util.addDetail(details.crop.phaseDays, {int: '99999'}, 'int');
			details.crop.rowInSpriteSheet = data.SpriteIndex + '';
			details.crop.phaseToShow = '-1';
			details.crop.currentPhase = data.DaysInPhase.length + '';
			details.crop.indexOfHarvest = data.HarvestItemId;
			details.crop.dayOfCurrentPhase = '1';
			//details.crop.fullGrown = 'true';
			details.crop.seedIndex = featureInfo.cropId;
			details.crop.dead = 'false';
			
			if (data.TintColors.length > 0) {
				//details.crop.tintColor = util.serializeColor(util.stringToColor(data.TintColors[0]));
				details.crop.programColored = 'true';
			}
		}
		
		if (featureInfo.fruitTreeId != null) {
			let data = core.content.Data.FruitTrees[featureInfo.fruitTreeId];
			let parts = util.parseItemId(data.Fruit[0].ItemId);
			let fruit = core.items.get(parts[0], parts[1]);
			type = 'FruitTree';
			details.growthStage = '5';
			details.treeId = featureInfo.fruitTreeId;
			details.daysUntilMature = '13';
			details['fruitsOnTree@xsi:nil'] = 'true';
			details.fruitsOnTree = '';
			details.struckByLightningCountdown = '0';
			details.health = '10';
			
			for (let i = 0; i < 3; ++i) {
				util.addDetail(details, {
					'@@': 'fruit',
					'@xsi:type': 'Object',
					itemId: fruit.itemId,
					category: fruit.category + '',
					quality: (featureInfo.quality ?? 0) + '',
					stack: (featureInfo.stack ?? 1) + '',
				});
			}
		}
		
		if (featureInfo.pathId != null) {
			//let data = core.content.Data.FloorsAndPaths[featureInfo.pathId];
			type = 'Flooring';
			details.whichFloor = featureInfo.pathId;
		}
		
		if (featureInfo.wildTreeId != null) {
			//let data = core.content.Data.WildTrees[featureInfo.wildTreeId];
			type = 'Tree';
			details.growthStage = '5';
			details.treeType = featureInfo.wildTreeId;
			details.health = '10';
		}
		
		break;
	}
	
	type = featureInfo.type ?? type;
	
	if (type != null) {
		details['@xsi:type'] = type;
	}
	
	if (featureInfo.details) {
		Object.assign(details, featureInfo.details);
	}
	
	return details;
};
