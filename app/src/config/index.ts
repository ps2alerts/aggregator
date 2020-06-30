import App from './app'
import Census from './census'
import Database from './database'
import Features from './features'
import Logger from './logger'

/**
 * Holds the configuration information for various aspects of the application.
 */
export class Config {
    public readonly app: App = new App()
    public readonly census: Census = new Census()
    // public readonly database: Database = new Database()
    // public readonly features = Features
    public readonly logger: Logger = new Logger()
}

// This is needed here otherwise we get circular reference issues (e.g. logger calling config for logger information...)
export default new Config()
