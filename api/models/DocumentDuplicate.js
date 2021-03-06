/**
 * DocumentDuplicate.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        duplicate: {
            model: 'document'
        },
        document: {
            model: 'document'
        },
        researchEntity : {
            model: 'user'
        },
        researchEntityType: 'string',
        duplicateKind: 'string'
    },

    migrate: 'safe',
    tableName: 'documentduplicate',
    autoUpdatedAt: false,
    autoCreatedAt: false
};

