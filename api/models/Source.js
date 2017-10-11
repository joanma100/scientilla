/* global Source, SourceMetricSource */
"use strict";

const fields = [
    'title',
    'issn',
    'eissn',
    'acronym',
    'location',
    'year',
    'publisher',
    'isbn',
    'website',
    'type',
    'scopusId'
];

module.exports = {
    attributes: {
        title: 'string',
        issn: 'string',
        eissn: 'string',
        acronym: 'string',
        location: 'string',
        year: 'int',
        publisher: 'string',
        isbn: 'string',
        website: 'string',
        type: 'string',
        scopusId: 'string',
        documents: {
            collection: 'document',
            via: 'source'
        },
        metrics: {
            collection: 'SourceMetric',
            via: 'sources',
            through: 'sourcemetricsource'
        },

    },
    searchCopies: async function (source) {

        const orCriteria = [];

        if (source.title)
            orCriteria.push({
                title: source.title
            });

        if (source.scopusId)
            orCriteria.push({
                scopusId: source.scopusId,
            });

        if (source.issn)
            orCriteria.push({
                issn: source.issn,
            });

        return await Source.find({
            id: {'!': source.id},
            or: orCriteria
        });
    },
    merge: async function (source, copies) {
        function mergeFields(src, cp) {
            const merged = {};
            for (const f of fields) {
                if (src[f] === cp[f])
                    merged[f] = src[f];
                else if (src[f] && !cp[f])
                    merged[f] = src[f];
                else if (!src[f] && cp[f])
                    merged[f] = cp[f];
                else
                    return false;
            }

            return merged;
        }

        let mergedFields = source;
        const sourcesToRemove = [];

        for (const copy of copies) {
            const newMergedFields = mergeFields(mergedFields, copy);
            if (newMergedFields) {
                sourcesToRemove.push(copy);
                mergedFields = newMergedFields;
            }
        }

        if (_.isEqual(mergedFields, source))
            return false;

        await Source.update({id: source.id}, mergedFields);


        for (const sourceToRemove of sourcesToRemove) {
            const documents = await Document.find({source: sourceToRemove.id});
            if (documents.length) {
                const documentIds = documents.map(d => d.id);
                const updateDocuments = await Document.update({id: documentIds}, {source: source.id});
                sails.log.info(`${updateDocuments.length} documents updated from source ${source.id} to ${sourceToRemove.id}`);
            }

            const sourcemetrisources = await SourceMetricSource.find({source: sourceToRemove.id});
            if (sourcemetrisources.length) {
                const sourcemetrisourcesIds = sourcemetrisources.map(d => d.id);
                await SourceMetricSource.destroy({id: sourcemetrisourcesIds});
                for (const sms of sourcemetrisources) {
                    const smsFound = await SourceMetricSource.findOne({
                        sourceMetric: sms.sourceMetric,
                        source: source.id
                    });
                    if (!smsFound)
                        await SourceMetricSource.create({
                            sourceMetric: sms.sourceMetric,
                            source: source.id
                        });
                }
            }

            await sourceToRemove.destroy();
        }

        return sourcesToRemove;

    }
};

