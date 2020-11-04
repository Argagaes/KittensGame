
// These control the button statuses
var auto = {}; // Is a toggle holder. Use like ``auto.craft = true; if (auto.craft) { ...
var programBuild = false;

// These will allow quick selection of the buildings which consume energy
var bldBioLab = gamePage.bld.getBuildingExt('biolab').meta;
var bldOilWell = gamePage.bld.getBuildingExt('oilWell').meta;
var bldFactory = gamePage.bld.getBuildingExt('factory').meta;
var bldCalciner = gamePage.bld.getBuildingExt('calciner').meta;
var bldAccelerator = gamePage.bld.getBuildingExt('accelerator').meta;

// These are the assorted variables
var paperChoice = 'none';
var autoChoice = "farmer";
var cycleChoice = 0;
var secResRatio = 25;
var steamOn = 0;


/* These are the data structures that govern the automation scripts */
/* These are the data structures that govern the automation scripts */
/* These are the data structures that govern the automation scripts */
/* These are the data structures that govern the automation scripts */
/* These are the data structures that govern the automation scripts */


var minorOptions = {
    observe:{name:"Auto Observe", enabled:true}, // XXX TODO
    explore:{name:"Auto Explore", enabled:false}, // XXX TODO
    feed:{name:"Auto Feed Elders", enabled:false}, // XXX TODO
    promote:{name:"Auto Promote Leader", enabled:false}, // XXX TODO
    religion2praise:{name:"Praise After Religion", enabled:false},
    unicornIvory:{name:"Unicorn Ivory Optimization", enabled:false}, // XXX TODO
};

// Building lists for controlling Auto Build/Space/Time
var cathBuildings = {/* list is autogenerated, looks like:
    field:{name:"Catnip Field", enabled:false},
    ...
*/};
buildGroup(gamePage.bld.buildingsData, cathBuildings);

// Group like buildings for menu. Needs to be manual, because it's a judgement call.
var cathGroups = [
    ["Kitten Housing", ["hut", "logHouse", "mansion"]],
    ["Craft Bonuses", ["workshop", "factory"]],
    ["Production", ["field", "pasture", "mine", "lumberMill", "aqueduct", "oilWell", "quarry"]],
    ["Conversion", ["smelter", "biolab", "calciner", "reactor", "accelerator", "steamworks", "magneto"]],
    ["Science", ["library", "academy", "observatory"]],
    ["Storage", ["barn", "harbor", "warehouse"]],
    ["Culture", ["amphitheatre", "chapel", "temple"]],
    ["Other", ["tradepost", "mint", "unicornPasture", /*...*/]],
    ["Megastructures", ["ziggurat", "chronosphere", "aiCore"]],
];
// Add missing buildings to "Other"
for (name in cathBuildings) {
    if (! cathGroups.map(function(x){return x[1]}).flat().includes(name)) {
        for (var j=0; j<cathGroups.length; j++) {
            if (cathGroups[j][0] == "Other") cathGroups[j][1].push(name);
        }
    }
}

var spaceBuildings = {/*
    spaceElevator:{name:"Space Elevator", enabled:false},
    ...
*/};
var spaceGroups = [/*
    ["cath", ["spaceElevator", "sattelite", "spaceStation"]],
    ...
*/];
for (var i=0; i<gamePage.space.planets.length; i++) {
    var planet = gamePage.space.planets[i];
    spaceGroups.push([planet.label, buildGroup(planet.buildings, spaceBuildings)]);
}

var timeBuildings = {/*
    // As above, but for Ziggurats, Cryptotheology, Chronoforge, Void Space
    ...
*/};
var timeGroups = [/*
    // As above
    ...
*/];
timeGroups.push(['Ziggurats', buildGroup(gamePage.religion.zigguratUpgrades, timeBuildings)]);
timeGroups.push(['Cryptotheology', buildGroup(gamePage.religion.transcendenceUpgrades, timeBuildings)]);
timeGroups.push(['Chronoforge', buildGroup(gamePage.time.chronoforgeUpgrades, timeBuildings)]);
timeGroups.push(['Void Space', buildGroup(gamePage.time.voidspaceUpgrades, timeBuildings)]);

function buildGroup(upgrades, buildings) {
    var group = [];
    for (var i=0; i<upgrades.length; i++) {
        var data = upgrades[i];
        if (upgrades==gamePage.religion.zigguratUpgrades && data.effects.unicornsRatioReligion) continue; // covered by autoUnicorn()
        if (! data.stages) var label = data.label;
        else var label = data.stages.map(function(x){return x.label}).join(' / '); // for "Library / Data Center", etc
        buildings[data.name] = {name:label, enabled:false};
        group.push(data.name);
    }
    return group;
}

var resources = [
    [    "wood", [["catnip", 50]]],
    [    "beam", [["wood", 175]]],
    [    "slab", [["minerals", 250]]],
    [   "steel", [["iron", 100],["coal", 100]]],
    [   "plate", [["iron", 125]]],
    [   "alloy", [["titanium", 10],["steel", 75]]],
    ["kerosene", [["oil", 7500]]],
    [ "thorium", [["uranium", 250]]],
    [ "eludium", [["unobtainium", 1000],["alloy", 2500]]],
    ["scaffold", [["beam", 50]]],
    ["concrate", [["steel", 25],["slab", 2500]]], // sic concrate
    [    "gear", [["steel", 15]]],
    /* These must be last, anything after may be skipped by paperStarts..paperChoice */
    [ "parchment", [["furs",175]]],
    ["manuscript", [["parchment", 20],["culture",300]]],
    [ "compedium", [["manuscript", 50],["science",10000]]], // sic compedium
    [ "blueprint", [["compedium", 25],["science",25000]]]
];
var paperStarts = resources.findIndex(function(r){return r[0]=='parchment'});


/* These is the part of the code that lays out the GUI elements */
/* These is the part of the code that lays out the GUI elements */
/* These is the part of the code that lays out the GUI elements */
/* These is the part of the code that lays out the GUI elements */
/* These is the part of the code that lays out the GUI elements */


$("#footerLinks").append('<div id="SK_footerLink" class="column">'
    + ' | <a href="#" onclick="$(\'#SK_mainOptions\').toggle();"> ScriptKitties </a>'
    + '</div>');
$("#game").append(generateMenu());
$("#SK_mainOptions").hide(); // only way I can find to have display:grid but start hidden
$("#game").append(generateBuildingMenu());
switchTab('cath'); // default
$("#game").append(generateMinorOptionsMenu());

function generateMenu() {
    // Auto Assign drop-down
    var workerDropdown = '<select id="SK_assignChoice" style="{{grid}}" onclick="autoChoice=this.value;">';
    gamePage.village.jobs.forEach(job => { workerDropdown += `<option value="${job.name}">${job.title}</option>`; });
    workerDropdown += '</select>';

    // Auto Craft Paper drop-down
    var paperDropdown = '<select id="SK_paperChoice" style="{{grid}}" onchange="paperChoice=this.value;">';
    paperDropdown += '<option value="none" selected="selected">None</option>';
    paperDropdown += '<option value="parchment">Parchment</option>';
    paperDropdown += '<option value="manuscript">Manuscript</option>';
    paperDropdown += '<option value="compedium">Compendium</option>';
    paperDropdown += '<option value="blueprint">Blueprint</option>';
    paperDropdown += '</select>';

    // Auto Cycle drop-down
    var cycleDropdown = '<select id="SK_cycleChoice" style="{{grid}}" onchange="cycleChoice=parseInt(this.value);">';
    for (var i = 0; i < game.calendar.cycles.length; i++) {
        var cycle = game.calendar.cycles[i];
        var sel = (i==cycleChoice) ? ' selected="selected"' : '';
        var label = `${cycle.glyph} ${cycle.title}`;
        cycleDropdown += `<option value="${i}"${sel}>${label}</option>`;
    }
    cycleDropdown += '</select>';

    var grid = [ // Grid Layout
        [autoButton('Kill Switch', 'clearScript()')],
        [autoButton('Check Efficiency', 'kittenEfficiency()'), autoButton('Minor Options', '$(\'#SK_minorOptions\').toggle();')],
        [autoSwitchButton('Auto Build', 'build'), autoButton('Select Building', '$(\'#SK_buildingOptions\').toggle();')],
        [autoSwitchButton('Auto Assign', 'assign'), workerDropdown],
        [autoSwitchButton('Auto Craft', 'craft'), paperDropdown],
        ['<label style="{{grid}}">Secondary Craft %</label>', `<span style="{{grid}}" title="Between 0 and 100"><input type="text" style="width:25px" onchange="secResRatio=this.value" value="${secResRatio}"></span>`],
        ['<span style="height:10px;{{grid}}"></span>'],
        [autoSwitchButton('Auto Hunt', 'hunt'), autoSwitchButton('Auto Praise', 'praise')],
        [autoSwitchButton('Auto Trade', 'trade'), autoSwitchButton('Auto Embassy', 'embassy')],
        [autoSwitchButton('Auto Party', 'party')],
        ['<span style="height:10px;{{grid}}"></span>'],
        [autoSwitchButton('Auto Cycle', 'cycle'), cycleDropdown],
        [autoSwitchButton('Shatterstorm', 'shatter'), autoSwitchButton('Auto BCoin', 'bcoin')],
        ['<span style="height:10px;{{grid}}"></span>'],
        [autoSwitchButton('Auto Science', 'research'), autoSwitchButton('Auto Upgrade', 'workshop')],
        [autoSwitchButton('Auto Religion', 'religion'), autoSwitchButton('Auto Unicorn', 'unicorn')],
        [autoSwitchButton('Energy Control', 'energy')],
    ];

    var menu = '<div id="SK_mainOptions" class="dialog" style="display:grid; grid-template-columns:177px 177px; column-gap:5px; row-gap:5px; left:auto; top:auto !important; right:30px; bottom: 30px; padding:10px">';
    menu += '<a href="#" onclick="$(\'#SK_mainOptions\').hide();" style="position: absolute; top: 10px; right: 15px;">close</a>';
    for (var row = 0; row < grid.length; row++) {
        for (var col = 0; col < grid[row].length; col++) {
            if (!grid[row][col].includes('{{grid}}')) console.warn(`Cell at [${row+1},${col+1}] does not have position marker`);
            menu += grid[row][col].replace('{{grid}}', `grid-row:${row+1}; grid-column:${col+1};`);
        }
    }
    menu += '</div>';
    return menu;
}

function generateMinorOptionsMenu() {
    menu = '';
    menu += '<div id="SK_minorOptions" class="dialog help" style="border: 1px solid gray; display:none;">';
    menu += '<a href="#" onclick="$(\'#SK_minorOptions\').hide();" style="position: absolute; top: 10px; right: 15px;">close</a>';
    for (opt in minorOptions) {
        menu += `<input type="checkbox" id="SK_${opt}" onchange="minorOptions['${opt}'].enabled=this.checked""${minorOptions[opt].enabled?' checked':''}>`;
        menu += `<label style="padding-left:10px;" for="SK_${opt}">${minorOptions[opt].name}</label><br>`;
    }
    menu += '</div>';
    return menu;
}

function generateBuildingMenu() {
    menu = '';
    menu += '<div id="SK_buildingOptions" class="dialog help" style="border: 1px solid gray; display:none;">';
    menu +=   '<a href="#" onclick="$(\'#SK_buildingOptions\').hide();" style="position: absolute; top: 10px; right: 15px;">close</a>';
    menu +=   '<div class="tabsContainer">';
    menu +=     '<a href="#" id="SK_cathTab" class="tab" onclick="switchTab(\'cath\')" style="white-space: nowrap;">Cath</a>';
    menu +=     '<span> | </span>';
    menu +=     '<a href="#" id="SK_spaceTab" class="tab" onclick="switchTab(\'space\')" style="white-space: nowrap;">Space</a>';
    menu +=     '<span> | </span>';
    menu +=     '<a href="#" id="SK_timeTab" class="tab" onclick="switchTab(\'time\')" style="white-space: nowrap;">Time</a>';
    menu +=   '</div>';
    menu +=   '<div id="SK_BuildingFrame" class="tabInner">';
    menu +=     generateBuildingPane(cathGroups, 'cathBuildings');
    menu +=     generateBuildingPane(spaceGroups, 'spaceBuildings');
    menu +=     generateBuildingPane(timeGroups, 'timeBuildings');
    menu +=   '</div>';
    menu += '</div>';
    return menu;
}

function switchTab(name) {
    $("#SK_cathTab").removeClass("activeTab");
    $("#SK_spaceTab").removeClass("activeTab");
    $("#SK_timeTab").removeClass("activeTab");
    $("#SK_cathBuildingsPane").hide();
    $("#SK_spaceBuildingsPane").hide();
    $("#SK_timeBuildingsPane").hide();

    switch(name) {
        case 'cath':
            $("#SK_cathTab").addClass("activeTab");
            $("#SK_cathBuildingsPane").show();
            break;
        case 'space':
            $("#SK_spaceTab").addClass("activeTab");
            $("#SK_spaceBuildingsPane").show();
            break;
        case 'time':
            $("#SK_timeTab").addClass("activeTab");
            $("#SK_timeBuildingsPane").show();
            break;
    }
}

function autoButton(label, script, id=null) {
    var cssClass = 'btn nosel modern';
    if (id) cssClass += ' disabled';
    var content = `<div class="btnContent" style="padding:unset"><span class="btnTitle">${label}</span></div>`;
    var button = `<div ${id?'id="'+id+'"':''} class="${cssClass}" style="width:auto; {{grid}}" onclick="${script}">${content}</div>`;
    return button;
}

function autoSwitchButton(label, key) {
    var element = 'SK_auto' + key[0].toUpperCase() + key.slice(1);
    var script = `autoSwitch('${key}', '${element}');`;
    return autoButton(label, script, element);
}

function generateBuildingPane(groups, elementsName) {
    var menu = '';
    menu += `<div id="SK_${elementsName}Pane" style="display:none; columns:2; column-gap:20px;">\n`;
    if (elementsName == 'spaceBuildings') {
        menu += '<input type="checkbox" id="SK_programs" onchange="programBuild=this.checked;">';
        menu += '<label for="SK_programs">Programs</label><br>\n';
    }
    var tab = elementsName.substring(0,4); // tab prefix
    menu += `<input type="checkbox" id="SK_${tab}TabChecker" onchange="selectChildren('SK_${tab}TabChecker','SK_${tab}Check');">`;
    menu += `<label for="SK_${tab}TabChecker">SELECT ALL</label><br>\n`;
    for (var i = 0; i < groups.length; i++)  {
        var label = groups[i][0];
        var lab = label.substring(0,3); // used for prefixes, "lab" is prefix of "label"
        menu += '<p style="break-inside: avoid;">'; // we want grouping to avoid widows/orphans
        menu += `<input type="checkbox" id="SK_${lab}Checker" class="SK_${tab}Check" onchange="selectChildren('SK_${lab}Checker','SK_${lab}Check');">`;
        menu += `<label for="SK_${lab}Checker"><b>${label}</b></label><br>\n`;

        for (var j = 0; j < groups[i][1].length; j++) {
            var bld = groups[i][1][j];
            var elements = window[elementsName];
            var bldLabel = elements[bld].name;
            menu += `<input type="checkbox" id="SK_${bld}" class="SK_${lab}Check" onchange="verifyElementSelected(${elementsName},\'${bld}\',this.checked)">`;
            menu += `<label style="padding-left:10px;" for="SK_${bld}">${bldLabel}</label><br>\n`;
        }
        menu += '</p>\n';
    }
    menu += '</div>\n';
    return menu;
}

function selectChildren(checker, checkee) {
    $('.'+checkee).prop('checked', document.getElementById(checker).checked).change();
}

function verifyElementSelected(elements, id, checked) {
    elements[id].enabled = checked;
}

function autoSwitch(id, element) {
    auto[id] = !auto[id];
    gamePage.msg(`${element} is now  ${(auto[id] ? 'on' : 'off')}`);
    $(`#${element}`).toggleClass('disabled', !auto[id]);
}

function clearScript() {
    $("#SK_footerLink").remove();
    $("#SK_mainOptions").remove();
    $("#SK_buildingOptions").remove();
    $("#SK_minorOptions").remove();
    clearInterval(runAllAutomation);
    auto = {}; // wipe fields
    bldSelectAddition = null;
    spaceSelectAddition = null;
    htmlMenuAddition = null;
    clearInterval();
    gamePage.msg('Script is dead');
}

// Show current kitten efficiency in the in-game log
function kittenEfficiency() {
    var secondsPlayed = game.calendar.trueYear() * game.calendar.seasonsPerYear * game.calendar.daysPerSeason * game.calendar.ticksPerDay / game.ticksPerSecond;
    var numberKittens = gamePage.resPool.get('kittens').value;
    var curEfficiency = (numberKittens - 70) / (secondsPlayed / 3600);
    gamePage.msg("Your current efficiency is " + parseFloat(curEfficiency).toFixed(2) + " Paragon per hour.");
}


/* These are the functions which are controlled by the runAllAutomation timer */
/* These are the functions which are controlled by the runAllAutomation timer */
/* These are the functions which are controlled by the runAllAutomation timer */
/* These are the functions which are controlled by the runAllAutomation timer */
/* These are the functions which are controlled by the runAllAutomation timer */


// Auto Observe Astronomical Events
function autoObserve() {
    var checkObserveBtn = document.getElementById("observeBtn");
    if (typeof(checkObserveBtn) != 'undefined' && checkObserveBtn != null) {
        document.getElementById('observeBtn').click();
    }
}

// Auto praise the sun
function autoPraise() {
    if (auto.praise && gamePage.bld.getBuildingExt('temple').meta.val > 0) {
        gamePage.religion.praise();
    }
}

// Build buildings automatically
function autoBuild() {
    if (auto.build && gamePage.ui.activeTabId == 'Bonfire') {
        var buttons = gamePage.tabs[0].buttons;

        for (i = 2; i < buttons.length; i++) {
            var name = buttons[i].model.metadata.name;
            if (buttons[i].model.enabled && cathBuildings[name].enabled) {
                buttons[i].controller.buyItem(buttons[i].model, {}, function(result) {
                    if (result) {buttons[i].update();}
                });
            }
        }
        if (gamePage.getResourcePerTick('coal') > 0.01 && steamOn < 1) {
            gamePage.bld.getBuildingExt('steamworks').meta.on = gamePage.bld.getBuildingExt('steamworks').meta.val;
            steamOn = 1;
        }
    }
}

// Build space stuff automatically
function autoSpace() {
    if (auto.build && gamePage.spaceTab && gamePage.spaceTab.planetPanels) {
        // Build space buildings
        for (i = 0; i < gamePage.spaceTab.planetPanels.length; i++) {
            for (j = 0; j < gamePage.spaceTab.planetPanels[i].children.length; j++) {
                var spBuild = gamePage.spaceTab.planetPanels[i].children[j];
                if (spaceBuildings[spBuild.id].enabled && gamePage.space.getBuilding(spBuild.id).unlocked) {
                    // .enabled doesn't update automatically unless the tab is active, force it
                    if (! spBuild.model.enabled) spBuild.controller.updateEnabled(spBuild.model);
                    if (spBuild.model.enabled) {
                        spBuild.controller.buyItem(spBuild.model, {}, function(result) {
                            if (result) {spBuild.update();}
                        });
                    }
                }
            }
        }

        // Build space programs
        if (programBuild && gamePage.spaceTab && gamePage.spaceTab.GCPanel) {
            var spcProg = gamePage.spaceTab.GCPanel.children;
            for (var i = 0; i < spcProg.length; i++) {
                if (spcProg[i].model.metadata.unlocked && spcProg[i].model.on == 0) {
                    if (! spcProg[i].model.enabled) spcProg[i].controller.updateEnabled(spcProg[i].model);
                    if (spcProg[i].model.enabled) {
                        spcProg[i].controller.buyItem(spcProg[i].model, {}, function(result) {
                            if (result) {spcProg[i].update();}
                        });
                    }
                }
            }
        }
    }
}

// Build religion/time stuff automatically
function autoTime() {
    if (auto.build) {
        var buttonGroups = [
            gamePage.religionTab?.zgUpgradeButtons,
            gamePage.religionTab?.ctPanel?.children[0]?.children,
            gamePage.timeTab?.cfPanel?.children[0]?.children,
            gamePage.timeTab?.vsPanel?.children[0]?.children
        ];

        for (buttons of buttonGroups) {
            if (buttons) {
                for (var i = 0; i < buttons.length; i++) {
                    var button = buttons[i];
                    if (timeBuildings[button.id]?.enabled && button.model.metadata.unlocked) {
                        if (! button.model.enabled) button.controller.updateEnabled(button.model);
                        if (button.model.enabled) {
                            button.controller.buyItem(button.model, {}, function(result) {
                                if (result) {button.update();}
                            });
                        }
                    }
                }
            }
        }
    }
}

// Trade automatically
function autoTrade() {
    var ticksPerCycle = 25;
    // autoTrade happens every 25 ticks
    if (auto.trade) {
        var goldResource = gamePage.resPool.get('gold');
        var goldPerCycle = gamePage.getResourcePerTick('gold') * ticksPerCycle;
        var powerResource = gamePage.resPool.get('manpower');
        var powerPerCycle = gamePage.getResourcePerTick('manpower') * ticksPerCycle;
        var powerPerCycle = Math.min(powerPerCycle, powerResource.value); // don't try to spend more than we have
        var sellCount = Math.floor(Math.min(goldPerCycle/15, powerPerCycle/50));

        if (goldResource.value > (goldResource.maxValue - goldPerCycle)) { // don't check catpower
            var titRes = gamePage.resPool.get('titanium');
            var unoRes = gamePage.resPool.get('unobtainium');

            if (unoRes.value > 5000 && gamePage.diplomacy.get('leviathans').unlocked && gamePage.diplomacy.get('leviathans').duration != 0) {
                gamePage.diplomacy.tradeAll(game.diplomacy.get("leviathans"));
            } else if (titRes.value < (titRes.maxValue * 0.9) && gamePage.diplomacy.get('zebras').unlocked) {
                // don't waste the iron, make some space for it.
                var ironRes = gamePage.resPool.get('iron');
                var sellIron = game.diplomacy.get("zebras").sells[0];
                var expectedIron = sellIron.value * sellCount *
                    (1 + (sellIron.seasons ? sellIron.seasons[game.calendar.getCurSeason().name] : 0)) *
                    (1 + game.diplomacy.getTradeRatio() + game.diplomacy.calculateTradeBonusFromPolicies('zebras', game));
                if (ironRes.value > (ironRes.maxValue - expectedIron)) {
                    gamePage.craft('plate', (ironRes.value - (ironRes.maxValue - expectedIron))/125); // 125 is iron per plate
                }

                gamePage.diplomacy.tradeMultiple(game.diplomacy.get("zebras"), sellCount);
            } else if (gamePage.diplomacy.get('dragons').unlocked) {
                gamePage.diplomacy.tradeMultiple(game.diplomacy.get("dragons"), sellCount);
            }
        }
    }
}

// Build Embassies automatically
function autoEmbassy() {
    if (auto.embassy && gamePage.diplomacyTab.racePanels && gamePage.diplomacyTab.racePanels[0]) {
        var culture = gamePage.resPool.get('culture');
        if (culture.value >= culture.maxValue * 0.99) { // can exceed due to MS usage
            var panels = gamePage.diplomacyTab.racePanels;
            var btn = panels[0].embassyButton;
            for (var z = 1; z < panels.length; z++) {
                var candidate = panels[z].embassyButton;
                if (candidate && candidate.model.prices[0].val < btn.model.prices[0].val) {
                    btn = candidate;
                }
            }
            btn.controller.buyItem(btn.model, {}, function(result) {
                if (result) {btn.update();}
            });
        }
    }
}

// Hunt automatically
function autoHunt() {
    if (auto.hunt) {
        var catpower = gamePage.resPool.get('manpower');
        if (catpower.value > (catpower.maxValue - 1)) {
            gamePage.village.huntAll();
        }
    }
}

// Craft primary resources automatically
function autoCraft() {
    /* Note: In this function, rounding gives us grief.
     * If we have enough resource to craft 3.75 of of something, and ask for
     * that, the game rounds up to 4 and then fails because we don't have
     * enough.
     *
     * However, we mostly craft "off the top", making space for production,
     * so we'll usually have the slack. But when we don't, it effectively turns
     * off autoCraft for that resource.
     *
     * On the other hand, we don't want to always round down, or else we'll be
     * wasting resources, and in some cases *cough*eludium*cough*, we'll be
     * rounding down to zero.
     */
    var ticksPerCycle = 3; // we execute every 3 ticks

    if (auto.craft) {
        // Craft primary resources
        for (var i = 0; i < resources.length; i++) {
            var output = resources[i][0];
            var inputs = resources[i][1];
            var outRes = gamePage.resPool.get(output);
            if (output == 'parchment' && paperChoice == 'none') break; // user asked for no papers
            if (! outRes.unlocked) continue;

            var craftCount = Infinity;
            for (var j = 0; j < inputs.length; j++) {
                var inRes = gamePage.resPool.get(inputs[j][0]);
                craftCount = Math.min(craftCount, Math.floor(inRes.value / inputs[j][1])); // never try to use more than we have

                if (inRes.maxValue != 0) {
                    // primary resource
                    var resourcePerCycle = gamePage.getResourcePerTick(inputs[j][0], 0) * ticksPerCycle;
                    if (resourcePerCycle < inRes.maxValue && inRes.value < (inRes.maxValue - resourcePerCycle)) {
                        craftCount = 0;
                    } else {
                        craftCount = Math.min(craftCount, resourcePerCycle / inputs[j][1]);
                    }
                } else if (i < paperStarts) {
                    // secondary resource
                    var resMath = inRes.value / inputs[j][1];
                    if (resMath <= 1 || outRes.value > (inRes.value * (secResRatio / 100))) craftCount = 0;
                    craftCount = Math.min(craftCount, resMath * (secResRatio / 100));
                } else {
                    // secondary resource: fur, parchment, manuscript, compendium
                    craftCount = Math.min(craftCount, (inRes.value / inputs[j][1]));
                }
            }
            if (craftCount == 0 || craftCount == Infinity) {
                // nothing to do
            } else if (paperChoice == 'blueprint' && output == 'compedium' && gamePage.resPool.get('compedium').value > 25) {
                // save science for making blueprints
            } else {
                gamePage.craft(output, craftCount);
            }
            if (output == paperChoice) break; // i.e. if we're processing the user's choice, then we're done
        }
    }
}

// Auto Research
function autoResearch() {
    if (auto.research && gamePage.libraryTab.visible) {
        var buttons = gamePage.libraryTab.buttons;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].model.metadata.unlocked && buttons[i].model.metadata.researched != true) {
                if ( ! buttons[i].model.enabled) buttons[i].update();
                if (buttons[i].model.enabled) {
                    buttons[i].controller.buyItem(buttons[i].model, {}, function(result) {
                        if (result) {buttons[i].update();}
                    });
                }
            }
        }
    }
}

// Auto Workshop upgrade, tab 3
function autoWorkshop() {
    if (auto.workshop && gamePage.workshopTab.visible) {
        var buttons = gamePage.workshopTab.buttons;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].model.metadata.unlocked && buttons[i].model.metadata.researched != true) {
                if ( ! buttons[i].model.enabled) buttons[i].update();
                if (buttons[i].model.enabled) {
                    buttons[i].controller.buyItem(buttons[i].model, {}, function(result) {
                        if (result) {buttons[i].update();}
                    });
                }
            }
        }
    }
}

// Auto buy religion upgrades
function autoReligion() {
    var bought = false;
    if (auto.religion && gamePage.religionTab.visible) {
        var buttons = gamePage.religionTab.rUpgradeButtons;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].model.visible && buttons[i].model.metadata.researched != true) {
                if ( ! buttons[i].model.enabled) buttons[i].update();
                if (buttons[i].model.enabled) {
                    buttons[i].controller.buyItem(buttons[i].model, {}, function(result) {
                        if (result) {
                            bought = true;
                            buttons[i].update();
                        }
                    });
                }
            }
        }
    }
    var faith = gamePage.resPool.get('faith');
    if (minorOptions.religion2praise.enabled && bought == false && faith.value >= faith.maxValue) {
        autoSwitch('praise', 'SK_autoPraise');
        auto.praise = true;
    }
}

// Auto buy unicorn upgrades
function autoUnicorn() {
    if (auto.unicorn && gamePage.religionTab.visible) {
        /* About Unicorn Rifts
         * Each Tower causes a 0.05% chance for a rift per game-day
         * Each rift produces 500 Unicorns * (Unicorn Production Bonus)/10
         */
        var riftUnicorns = 500 * (1 + game.getEffect("unicornsRatioReligion") * 0.1);
        var upsprc = riftUnicorns / (100000/5); // unicorns per second per riftChance
        var ups = 5 * gamePage.getResourcePerTick('unicorns') / (1 + game.getEffect("unicornsRatioReligion"));

        // find which is the best value
        var buttons = gamePage.religionTab.zgUpgradeButtons;
        var bestButton = null;
        var bestValue = 0.0;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].model.metadata.unlocked) {
                var ratio = buttons[i].model.metadata.effects.unicornsRatioReligion;
                var rifts = buttons[i].model.metadata.effects.riftChance || 0;
                var tearCost = buttons[i].model.prices.find(function(element){return element.name==='tears'});
                if (tearCost == null) continue;
                var value = (ratio * ups + rifts * upsprc) / tearCost.val;
                if (value > bestValue) {
                    bestButton = buttons[i];
                    bestValue = value;
                }
            }
        }

        // can we afford it?
        if (bestButton != null) {
            var cost = bestButton.model.prices.find(function(element){return element.name==='tears'}).val;
            var unicorns = gamePage.resPool.get('unicorns').value;
            var tears = gamePage.resPool.get('tears').value;
            var zigs = game.bld.get("ziggurat").on;
            var available = tears + Math.floor(unicorns / 2500) * zigs;
            if (available > cost) {
                if (tears < cost) {
                    var sacButton = gamePage.religionTab.sacrificeBtn;
                    // XXX: I don't like calling an internal function like _transform
                    // But it's the only way to request a specific number of Unicorn sacrifices, instead of spam-clicking...
                    sacButton.controller._transform(sacButton.model, Math.ceil((cost - tears) / zigs));
                }
                if ( ! bestButton.model.enabled) bestButton.update();
                bestButton.controller.buyItem(bestButton.model, {}, function(result) {
                    if (result) {bestButton.update();}
                });
            }
        }
    }
}

// Festival automatically
function autoParty() {
    if (auto.party && gamePage.science.get("drama").researched) {
        var catpower = gamePage.resPool.get('manpower').value;
        var culture = gamePage.resPool.get('culture').value;
        var parchment = gamePage.resPool.get('parchment').value;

        if (catpower > 1500 && culture > 5000 && parchment > 2500) {
            if (gamePage.prestige.getPerk("carnivals").researched && gamePage.calendar.festivalDays < 400*10) {
                gamePage.village.holdFestival(1);
            } else if (gamePage.calendar.festivalDays == 0) {
                gamePage.village.holdFestival(1);
            }
        }
    }
}

// Auto assign new kittens to selected job
function autoAssign() {
    if (auto.assign && gamePage.village.getJob(autoChoice).unlocked) {
        gamePage.village.assignJob(gamePage.village.getJob(autoChoice), 1);
    }
}

// Try to manipulate time to force the cycle of our choosing
function autoCycle() {
    if (auto.cycle && gamePage.timeTab.cfPanel.visible && game.calendar.cycle != cycleChoice) {
        // desired cycle: cycleChoice
        // current cycle: game.calendar.cycle
        // year in cycle: game.calendar.cycleYear
        var deltaCycle = (cycleChoice - game.calendar.cycle + game.calendar.cycles.length) % game.calendar.cycles.length;
        var deltaYears = deltaCycle*5 - game.calendar.cycleYear;
        var timeCrystals = gamePage.resPool.get('timeCrystal').value;

        // click the button
        if (timeCrystals != 0 && deltaYears != 0 && deltaYears <= timeCrystals) {
            var btn = gamePage.timeTab.cfPanel.children[0].children[0]; // no idea why there's two layers in the code
            btn.controller.doShatterAmt(btn.model, deltaYears);
        }
    }
}

// Keep Shattering as long as Space-Time is cool enough
function autoShatter() {
    var ticksPerCycle = 300;
    if (auto.shatter) {
        if (game.time.heat < ticksPerCycle * game.getEffect("heatPerTick")) {
            var factor = game.challenges.getChallenge("1000Years").researched ? 5 : 10;
            var shatter = (game.getEffect('heatMax') - game.time.heat) / factor;
            shatter = Math.min(shatter, gamePage.resPool.get('timeCrystal').value);
            if (shatter > 100) shatter -= shatter % 50; // try to keep same cycle

            // find and click the button
            if (shatter > 0) {
                for (var i = 0; i < gamePage.timeTab.children.length; i++) {
                    if (gamePage.timeTab.children[i].name == "Chronoforge" && gamePage.timeTab.children[i].visible) {
                        var btn = gamePage.timeTab.children[i].children[0].children[0]; // no idea why there's two layers in the code
                        btn.controller.doShatterAmt(btn.model, shatter);
                    }
                }
            }
        }
    }
}

// Control Energy Consumption
function energyControl() {
    if (auto.energy) {
        proVar = gamePage.resPool.energyProd;
        conVar = gamePage.resPool.energyCons;

        if (bldAccelerator.val > bldAccelerator.on && proVar > (conVar + 3)) {
            bldAccelerator.on++;
            conVar++;
        } else if (bldCalciner.val > bldCalciner.on && proVar > (conVar + 3)) {
            bldCalciner.on++;
            conVar++;
        } else if (bldFactory.val > bldFactory.on && proVar > (conVar + 3)) {
            bldFactory.on++;
            conVar++;
        } else if (bldOilWell.val > bldOilWell.on && proVar > (conVar + 3)) {
            bldOilWell.on++;
            conVar++;
        } else if (bldBioLab.val > bldBioLab.on && proVar > (conVar + 3)) {
            bldBioLab.on++;
            conVar++;
        } else if (bldBioLab.on > 0 && proVar < conVar) {
            bldBioLab.on--;
            conVar--;
        } else if (bldOilWell.on > 0 && proVar < conVar) {
            bldOilWell.on--;
            conVar--;
        } else if (bldFactory.on > 0 && proVar < conVar) {
            bldFactory.on--;
            conVar--;
        } else if (bldCalciner.on > 0 && proVar < conVar) {
            bldCalciner.on--;
            conVar--;
        } else if (bldAccelerator.on > 0 && proVar < conVar) {
            bldAccelerator.on--;
            conVar--;
        }
    }
}

// Auto buys and sells bcoins optimally (not yet tested)
function autoBCoin() {
    if (auto.bcoin && gamePage.science.get("antimatter").researched) {
        // When the price is > 1100 it loses 20-30% of its value
        // 880+ε is the highest it could be after an implosion
        //
        // Prior was buy < 881; sell > 1099
        // However, we want to keep stuffing BC in until the last minute
        // Well, the last hour or two.
        if (gamePage.calendar.cryptoPrice < 1095) {
            gamePage.diplomacy.buyBcoin();
        } else if (gamePage.resPool.get('blackcoin').value > 0) {
            gamePage.diplomacy.sellBcoin();
        }
    }
}

function autoNip() {
    if (auto.build && gamePage.bld.buildingsData[0].val < 20) {
        $(".btnContent:contains('Gather')").trigger("click");
    }
}

// This function keeps track of the game's ticks and uses math to execute these functions at set times relative to the game.
// Offsets are staggered to spread out the load. (Not that there is much).
clearInterval(runAllAutomation);
var runAllAutomation = setInterval(function() {
    autoNip();
    autoPraise();
    autoBuild();

    ticks = gamePage.timer.ticksTotal

    // every 0.6 seconds
    switch (ticks % 3) {
        case 0: autoCraft(); break;
        case 1: autoObserve(); autoHunt(); autoAssign(); break;
        case 2: energyControl(); break;
    }

    // every 2 seconds == every game-day
    switch (ticks % 10) {
        case 1: autoSpace(); break;
        case 2: autoParty(); break;
        case 3: autoTime(); break;
    }

    // every 5 seconds
    switch (ticks % 25) {
        case  2: autoResearch(); break;
        case  7: autoWorkshop(); break;
        case 12: autoReligion(); break;
        case 17: autoTrade();    break;
        case 22: autoEmbassy();  break;
    }

    // every minute
    switch (ticks % 300) {
        case   1: autoCycle(); autoShatter(); break;
        case 101: autoUnicorn(); break;
        case 203: autoBCoin();   break;
    }
}, 200);
