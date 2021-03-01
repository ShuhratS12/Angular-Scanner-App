import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { MAIN_COLUMN_VISIBILITY_FIELD, PREVIOUS_COLUMN_VISIBILITY_FIELD, MISC_VISIBILITY_FIELD, QUICK_FILTERS_GAMES_CURRENTLY_IN_CONFIG, QUICK_FILTERS_MISC_CONFIG, PREV_SELECT_OPTIONS } from './../config/grid-settings-config';
import { MessageService } from '../message.service';
import { environment } from 'src/environments/environment';
import { Sort } from '@angular/material/sort';

@Component({
    selector: 'app-score-grid',
    templateUrl: './score-grid.component.html',
    styleUrls: ['./score-grid.component.scss']
})
export class ScoreGridComponent implements OnInit {

    defaultMainColumnVisibility = MAIN_COLUMN_VISIBILITY_FIELD;
    previousStatsColumnVisibility = PREVIOUS_COLUMN_VISIBILITY_FIELD;
    miscStatsColumnVisibility = MISC_VISIBILITY_FIELD;
    options = PREV_SELECT_OPTIONS

    defaultGamesCurrentlyInFilters = QUICK_FILTERS_GAMES_CURRENTLY_IN_CONFIG
    defaultMiscFilters = QUICK_FILTERS_MISC_CONFIG

    gamesCurrentlyInFilters = []
    miscFilters = [];

    searchValue;

    activeMainColumnVisibility = []

    activePreviousStatsColumnVisibility = [];

    activeMiscStatsColumnVisibility = []

    activeFilters = [];

    scoreFilters = [];

    closeResult = '';

    @Input()
    grid;

    sortedData = [];

    baseMatchRecords;

    @Input()
    gridName;

    @Input()
    gridNumber;

    lastTimeSelection = PREV_SELECT_OPTIONS[0];

    hide = false;

    type;

    gridNameEdit = false;;

    color;
    bells = []

    public static components: ScoreGridComponent[] = [];

    constructor(private modalService: NgbModal, private messageService: MessageService) {
        ScoreGridComponent.components.push(this);
    }

    ngOnInit(): void {
        this.sortedData = this.grid.matches;
        this.activeMainColumnVisibility = JSON.parse(JSON.stringify(this.defaultMainColumnVisibility));
        this.activePreviousStatsColumnVisibility = JSON.parse(JSON.stringify(this.previousStatsColumnVisibility))
        this.activeMiscStatsColumnVisibility = JSON.parse(JSON.stringify(this.miscStatsColumnVisibility))
        this.gamesCurrentlyInFilters = JSON.parse(JSON.stringify(this.defaultGamesCurrentlyInFilters))
        this.miscFilters = JSON.parse(JSON.stringify(this.defaultMiscFilters))
        this.baseMatchRecords = JSON.parse(JSON.stringify(this.grid.matches));
        this.messageService.publishVisibilityEvent.subscribe(publishData => {
            if (this.gridNumber == publishData.gridNumber) {
                this.hide = true;
                this.activeMainColumnVisibility = publishData.activeMainColumnVisibility
                this.activeMiscStatsColumnVisibility = publishData.activeMiscStatsColumnVisibility
                this.activePreviousStatsColumnVisibility = publishData.activePreviousStatsColumnVisibility
                setTimeout(() => { this.hide = false }, 2);
            }
        })

        if (this.isLight()) {
            this.color = '#146853';
        } else {
            this.color = '#ffd000';
        }

        this.messageService.publishQuickFiltersEvent.subscribe(data => {
            if (this.gridNumber == data.gridNumber) {
                this.gamesCurrentlyInFilters = data.gamesCurrentlyInFilters;
                this.miscFilters = data.miscFilters
                this.applyQuickFilters();
            }
        })

        this.messageService.statsFilterEvent.subscribe(data => {
            if (data.gridNumber == this.gridNumber) {
                this.activeFilters = data.filters;
                this.scoreFilters = data.scoreFilters;
                this.applyFilters(data.filters);
                this.applyScoreFilters(data.scoreFilters);
            }
        })

        this.messageService.applyColorToGridEvent.subscribe(colorPublishData => {
            if (colorPublishData.gridNumber == this.gridNumber) {
                this.color = colorPublishData.color;
            }
        })

        environment.headerWidth = "responsive"


    }

    applyScoreFilters(filters) {
        this.sortedData = this.sortedData.filter(match => {
            if (filters && filters.length) {
                return filters.indexOf(match.score) > -1;
            }
            return true;
        })
    }

    applyQuickFilters() {
        let sortedData = JSON.parse(JSON.stringify(this.baseMatchRecords)).filter(match => match)
        if (this.gamesCurrentlyInFilters && this.gamesCurrentlyInFilters.length) {
            let firstHalfCheck = false;
            let secondHalfCheck = false;
            let halfTimeCheck = false;
            let showAllCheck = true
            this.gamesCurrentlyInFilters.forEach(filterOption => {

                if (filterOption.key == 'firstHalf') {
                    firstHalfCheck = filterOption.applyFilter;
                }

                if (filterOption.key == 'secondHalf') {
                    secondHalfCheck = filterOption.applyFilter;
                }

                if (filterOption.key == 'halfTime') {
                    halfTimeCheck = filterOption.applyFilter;
                }

                if (filterOption.key == 'showAll') {
                    showAllCheck = filterOption.applyFilter;
                }
            })

            let drawCheck = false;
            let underdogCheck = false;
            let lowMomentumCheck = false;
            let highMomentumCheck = false;
            this.miscFilters.forEach(filterOption => {
                if (filterOption.key == 'draw') {
                    drawCheck = filterOption.applyFilter;
                }

                if (filterOption.key == 'underdogWinning') {
                    underdogCheck = filterOption.applyFilter;
                }

                if (filterOption.key == 'lowAp') {
                    lowMomentumCheck = filterOption.applyFilter;
                }

                if (filterOption.key == 'highAp') {
                    highMomentumCheck = filterOption.applyFilter;
                }
            });




            this.sortedData = sortedData.filter(match => {
                let retValue = showAllCheck;
                let gameTime = parseInt(match.gameTime + '')
                if (halfTimeCheck) {
                    retValue = gameTime == 45
                }

                if (firstHalfCheck) {
                    retValue = retValue || gameTime < 45
                }

                if (secondHalfCheck) {
                    retValue = retValue || gameTime > 45
                }

                return retValue;
            });

            this.sortedData = this.sortedData.filter(match => {
                if (drawCheck) {
                    return (match.statistics.totalAwayGoals + '' == match.statistics.totalHomeGoals + '')
                }
                return true;
            });

            this.sortedData = this.sortedData.filter(match => {
                if (underdogCheck) {
                    var isReallyUnderDogPerformance = false;

                    if (match && match.preMatchOdds) {
                        let underdogBase1 = (parseFloat(match.preMatchOdds.homeOdds) <= 1.5) && (parseFloat(match.preMatchOdds.awayOdds) >= 5.0);
                        let underdogBase2 = (parseFloat(match.preMatchOdds.awayOdds) <= 1.5) && (parseFloat(match.preMatchOdds.homeOdds) >= 5.0);
                        if (underdogBase1 && (parseInt(match.statistics.totalAwayGoals) > parseInt(match.statistics.totalHomeGoals))) {
                            isReallyUnderDogPerformance = true;
                        } else if (underdogBase2 && (parseInt(match.statistics.totalHomeGoals) > parseInt(match.statistics.totalAwayGoals))) {
                            isReallyUnderDogPerformance = true;
                        }
                    }

                    return isReallyUnderDogPerformance;
                }
                return true;
            })

            this.sortedData = this.sortedData.filter(match => {
                if (lowMomentumCheck) {
                    var isReallyWithLowMomentum = false;

                    if (match && match.homeLast20 && match.awayLast20) {
                        if (parseInt(match.homeLast20.pressureIndex) <= 30 && parseInt(match.awayLast20.pressureIndex) <= 30) {
                            isReallyWithLowMomentum = true;
                        }
                    }

                    return isReallyWithLowMomentum;
                }
                return true;
            })

            this.sortedData = this.sortedData.filter(match => {
                if (highMomentumCheck) {
                    var isReallyWithHighMomentum = false;

                    if (match && match.homeLast20 && match.awayLast20) {
                        if (parseInt(match.homeLast20.pressureIndex) >= 60 && parseInt(match.awayLast20.pressureIndex) >= 30) {
                            isReallyWithHighMomentum = true;
                        }
                    }

                    return isReallyWithHighMomentum;
                }
                return true;
            })

        }
    }

    applyFilters(filters) {
        if (!filters.length) {
            this.sortedData = this.baseMatchRecords.filter(match => match);
        } else {
            this.sortedData = JSON.parse(JSON.stringify(this.baseMatchRecords)).filter(match => match);
            filters.forEach(filter => {
                let field = filter.statType.key;
                let operator = filter.filterType.key;
                let value = filter.filterValue
                this.sortedData = this.generateFilteredData(field, operator, value);
            })
        }

    }


    generateFilteredData(field, operator, value) {
        let sortedData = this.sortedData;
        return sortedData.filter(match => {
            if (operator == 'equals') {
                return match['statistics'][field] == value
            } else if (operator == 'lessThan') {
                return parseInt(match['statistics'][field] + '') < parseInt(value + '')
            } else if (operator == 'lessThanEquals') {
                return parseInt(match['statistics'][field] + '') <= parseInt(value + '')
            } else if (operator == 'greaterThan') {
                return parseInt(match['statistics'][field] + '') > parseInt(value + '')
            } else if (operator == 'greaterThanEquals') {
                return parseInt(match['statistics'][field] + '') >= parseInt(value + '')
            }
            return true;
        })
    }

    open(content) {
        this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'xl' }).result.then((result) => {
            this.closeResult = `Closed with: ${result}`;
        }, (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
    }

    private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return 'by pressing ESC';
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return 'by clicking on a backdrop';
        } else {
            return `with: ${reason}`;
        }
    }

    selectBell(match) {
        /* if(this.bells.indexOf(matchId)==-1){
          this.bells.push(matchId)
        } else{
          this.bells.splice(this.bells.indexOf(matchId),1)
        } */
        match.bell = !match.bell

    }

    public isVisible(type, key) {
        var visibility = true;
        if (type == 'main') {
            this.activeMainColumnVisibility.forEach(condition => {
                if (condition && condition.key == key) {
                    visibility = condition.visible;
                }
            })
        } else if (type == 'previous') {
            this.activePreviousStatsColumnVisibility.forEach(condition => {
                if (condition && condition.key == key) {
                    visibility = condition.visible;
                }
            })
        } else if (type == 'misc') {
            this.activeMiscStatsColumnVisibility.forEach(condition => {
                if (condition && condition.key == key) {
                    visibility = condition.visible;
                }
            })
        }
        return visibility;
    }

    removeMatch(matchId) {
        this.sortedData = this.sortedData.filter(match => {
            return match.matchId != matchId;
        });
    }

    gridToggle() {
        this.gridNameEdit = true;
        //alert(this.gridNameEdit)
    }

    isLight() {
        return environment.theme == 'light';
    }

    selectDropdownValue(value) {
        this.lastTimeSelection = value;
    }

    saveEditable() {
        this.grid.name = this.gridName;
        this.gridNameEdit = false;
    }

    cancelEditable() {
        this.gridName = this.grid.name
        this.gridNameEdit = false;
    }

    sortData(sort: Sort) {
        const data = this.sortedData.slice();
        alert(sort.active)
        alert(sort.direction)
        if (!sort.active || sort.direction === '') {
            this.sortedData = this.grid.matches;
            return;
        }

        this.sortedData = data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'gameTime': return compare(parseInt(a.gameTime), parseInt(b.gameTime), isAsc);
                case 'totalGoals': return compare(parseInt(a.statistics.totalGoals), parseInt(b.statistics.totalGoals), isAsc);
                case 'totalAttacks': return compare(parseInt(a.statistics.totalAttacks), parseInt(b.statistics.totalAttacks), isAsc);
                case 'totalDangerousAttacks': return compare(parseInt(a.statistics.totalDangerousAttacks), parseInt(b.statistics.totalDangerousAttacks), isAsc);
                case 'totalOffTarget': return compare(parseInt(a.statistics.totalOffTarget), parseInt(b.statistics.totalOffTarget), isAsc);
                case 'totalOnTarget': return compare(parseInt(a.statistics.totalOnTarget), parseInt(b.statistics.totalOnTarget), isAsc);
                case 'totalCorners': return compare(parseInt(a.statistics.totalCorners), parseInt(b.statistics.totalCorners), isAsc);
                case 'totalYellowCards': return compare(parseInt(a.statistics.totalYellowCards), parseInt(b.statistics.totalYellowCards), isAsc);
                case 'totalRedCards': return compare(parseInt(a.statistics.totalRedCards), parseInt(b.statistics.totalRedCards), isAsc);
                //case 'totalPossession': return compare(parseInt(a.statistics.totalHomePossession)+parseInt(a.statistics.totalAwayPossession), parseInt(b.statistics.totalHomePossession)+parseInt(b.statistics.totalAwayPossession), isAsc);
                case 'bell': return compare(a.bell, b.bell, isAsc);
                default: return 0;
            }
        });
    }

    public static setColorFromHeader(color) {
        ScoreGridComponent.components[0].color = color;
    }
}


function compare(a: number, b: number, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
