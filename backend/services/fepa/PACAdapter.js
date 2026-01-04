/**
 * Abstract Class / Interface for FEPA Providers (PACs)
 * All PAC implementations (WebPOS, TheFactory, etc.) must extend this class.
 */
class PACAdapter {
    constructor(config) {
        if (this.constructor === PACAdapter) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.config = config;
    }

    /**
     * Signs and Sends a document to the PAC.
     * @param {Object} documentData - Normalized internal representation of the invoice.
     * @returns {Promise<Object>} { success: boolean, cufe, qr, xmlSigned, error? }
     */
    async signAndSend(documentData) {
        throw new Error("Method 'signAndSend()' must be implemented.");
    }

    /**
     * Checks the status of a document (if async processing is used).
     * @param {string} txId - Transaction ID returned by signAndSend.
     * @returns {Promise<Object>} { status: 'AUTHORIZED'|'REJECTED'|'PROCESSING', ... }
     */
    async checkStatus(txId) {
        throw new Error("Method 'checkStatus()' must be implemented.");
    }

    /**
     * Voids (Annuls) a previously authorized document.
     * @param {string} cufe - The Unique Electronic Invoice Code.
     * @param {string} reason - Reason for voiding.
     * @returns {Promise<Object>} { success: boolean, ... }
     */
    async voidDocument(cufe, reason) {
        throw new Error("Method 'voidDocument()' must be implemented.");
    }
}

module.exports = PACAdapter;
