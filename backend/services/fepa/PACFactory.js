const WebPOSAdapter = require('./adapters/WebPOSAdapter');
// const TheFactoryAdapter = require('./adapters/TheFactoryAdapter'); // Future implementation

class PACFactory {
    /**
     * Returns an instance of the configured PAC Adapter.
     * @param {Object} issuerConfig - FE_IssuerConfig database record
     * @returns {PACAdapter} Instance of a PAC Adapter
     */
    static getAdapter(issuerConfig) {
        if (!issuerConfig) {
            throw new Error('PACFactory: Missing issuer configuration.');
        }

        const providerName = (issuerConfig.pacProvider || 'WEBPOS').toUpperCase();

        switch (providerName) {
            case 'WEBPOS':
                return new WebPOSAdapter(issuerConfig);

            // Future providers:
            // case 'THEFACTORY':
            //     return new TheFactoryAdapter(issuerConfig);

            default:
                throw new Error(`PACFactory: Provider '${providerName}' is not supported.`);
        }
    }
}

module.exports = PACFactory;
