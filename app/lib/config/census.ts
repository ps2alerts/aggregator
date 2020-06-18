import { get } from '../helpers/env'

export default class Census {
    public readonly census: string = get('CENSUS_SERVICE_ID')
}