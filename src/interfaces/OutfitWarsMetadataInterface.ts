import {Phase} from '../ps2alerts-constants/outfitwars/phase';
import OutfitWarsTeamsInterface from './OutfitWarsTeamsInterface';

export default interface OutfitWarsMetadataInterface {
    phase: Phase;
    round: number;
    teams?: OutfitWarsTeamsInterface;
}
