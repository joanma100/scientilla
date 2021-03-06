/* global AuthorshipGroup*/
"use strict";
/**
 * AuthorshipGroup.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
const _ = require('lodash');
const BaseModel = require("../lib/BaseModel.js");

module.exports = _.merge({}, BaseModel, {

    attributes: {
        researchEntity: {
            model: 'Group',
        },
        document: {
            model: 'Document'
        },
        public: 'boolean',
        favorite: 'boolean',
        synchronize: 'boolean',
        unverify: function () {
            return this.destroy();
        }
    },
    setPrivacy: async function (documentId, groupId, privacy) {
        const authorshipGroup = await AuthorshipGroup.findOne({document: documentId, researchEntity: groupId});
        if (!authorshipGroup)
            throw 'Athorship not found';

        authorshipGroup.public = !!privacy;
        return authorshipGroup.savePromise();
    },
    setFavorite: async function (documentId, groupId, favorite) {
        if (favorite) {
            const favorited = await AuthorshipGroup.find({researchEntity: groupId, favorite: true});
            if (favorited.length >= sails.config.scientilla.maxUserFavorite)
                throw 'Favorite max limit reached';
        }

        const authorshipGroup = await AuthorshipGroup.findOne({document: documentId, researchEntity: groupId});
        if (!authorshipGroup)
            throw 'Athorship not found';

        authorshipGroup.favorite = !!favorite;
        return authorshipGroup.savePromise();
    }
});

