import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameSchemaInterface} from '../models/instance/InstanceMetagame';
import Census from '../config/census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import {Faction} from '../constants/faction';
import ApplicationException from '../exceptions/ApplicationException';
import FactionUtils from '../utils/FactionUtils';

interface FacilityCaptureResultInterface {
    facility: number;
    faction: Faction;
    timestamp: Date;
}

interface FactionScoreInterface {
    faction: Faction;
    score: number;
}

export default class PS2AlertsMetagameInstanceEndAction implements ActionInterface {
    private static readonly logger = getLogger('PS2AlertsMetagameInstanceEndAction');
    private readonly instance: PS2AlertsMetagameInstance;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>;
    private readonly censusConfig: Census;
    private readonly instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;

    constructor(
        instance: PS2AlertsMetagameInstance,
        instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>,
        censusConfig: Census,
    ) {
        this.instance = instance;
        this.instanceFacilityControlFactory = instanceFacilityControlFactory;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.censusConfig = censusConfig;
    }

    public async execute(): Promise<boolean> {
        PS2AlertsMetagameInstanceEndAction.logger.info(`Running endActions() for instance "${this.instance.world}-${this.instance.censusInstanceId}"`);

        // Update database record
        await this.instanceMetagameFactory.model.updateOne(
            {instanceId: this.instance.instanceId},
            {winner: await this.calculateWinner()},
        ).catch((err: Error) => {
            throw new ApplicationException(`Unable to set winner for instance ${this.instance.instanceId}! Err: ${err.message}`);
        });

        return true;
    }

    public async calculateWinner(): Promise<Faction> {
        // Count the initial facility count so we can use it to calculate territory % (and is game update safe as well!)
        // Note, we still count the total number, even if faction ID = 0, as that's how the game calculates it (yes it's dumb).
        let baseCount = 0;
        await this.instanceFacilityControlFactory.model.countDocuments({
            instance: this.instance.instanceId,
            isInitial: true,
        }).then((count) => {
            baseCount = count;
        });

        const perBasePercent = 100 / baseCount; // Usually something like 1.639%
        const scores: FactionScoreInterface[] = [];
        // Init the array
        [1, 2, 3].forEach((val: number) => {
            scores[val] = {faction: val, score: 0};
        });
        let winner: Faction = 0;
        let draw = false;

        // Aggregate to return all facilities by ID, along with the last empire that captured it
        const aggregations = [
            {
                $match: {
                    instance: {$eq: this.instance.instanceId},
                    newFaction: {$gt: 0},
                    isDefence: {$eq: false},
                },
            },
            {
                $sort: {
                    facility: 1,
                    timestamp: 1,
                },
            },
            {
                $group: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    _id: '$facility',
                    facility: {
                        $last: '$facility',
                    },
                    faction: {
                        $last: '$newFaction',
                    },
                },
            },
            {
                $sort: {
                    facility: 1,
                },
            },
        ];

        // Pull in all distinct facility records ordered by last capture time (showing current ownership)
        await this.instanceFacilityControlFactory.model.aggregate(aggregations)
            .then((facilities: FacilityCaptureResultInterface[]) => {
                if (!facilities) {
                    throw new ApplicationException(`No capture data was found for instance ${this.instance.instanceId}!`, 'PS2AlertsMetagameInstanceEndAction');
                }

                facilities.forEach((facility: FacilityCaptureResultInterface) => {
                    // Every base has a faction, if it has no faction, it's inactive for the alert. It is currently not
                    // possible in game to deactivate bases mid-alert (may not be the case for Jaeger events etc though).
                    if (facility.faction === Faction.NONE) {
                        return;
                    }

                    scores[facility.faction].score += perBasePercent;
                });

                // Format values to how the game uses them
                scores.forEach((obj: FactionScoreInterface) => {
                    obj.score = Math.round(obj.score);
                });

                // Arrange scores numerically
                scores.sort(function(a: FactionScoreInterface, b: FactionScoreInterface) {
                    if (a.score < b.score) {
                        return 1;
                    }

                    if (a.score > b.score) {
                        return -1;
                    }

                    return 0;
                });

                // Calculate if we have a draw
                if (scores[0].score === scores[1].score) {
                    draw = true;
                } else {
                    winner = scores[0].faction;
                }
            });

        if (draw) {
            PS2AlertsMetagameInstanceEndAction.logger.info('DRAW!');
        } else {
            PS2AlertsMetagameInstanceEndAction.logger.info(`Winner is: ${FactionUtils.parseFactionIdToShortName(winner).toUpperCase()}!`);
        }

        return winner;
    }
}
