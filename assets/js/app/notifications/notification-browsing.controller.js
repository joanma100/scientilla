/* global Scientilla */

(function () {
    angular
            .module('notifications')
            .controller('NotificationBrowsingController', NotificationBrowsingController);

    NotificationBrowsingController.$inject = [
        'AuthService',
        'ModalService',
        'Restangular',
        'researchEntityService',
        'Notification'
    ];

    function NotificationBrowsingController(AuthService, ModalService, Restangular, researchEntityService, Notification) {

        var vm = this;
        vm.copyDocument = copyDocument;
        vm.verifyDocument = verifyDocument;
        vm.getVerifyDocuments = getVerifyDocuments;
        vm.discardDocument = discardDocument;
        vm.getDiscardDocuments = getDiscardDocuments;

        vm.targets = _.map(_.union([AuthService.user], AuthService.user.admininstratedGroups),
                function (reserarchEntity) {
                    return {
                        researchEntity: reserarchEntity,
                        documents: [],
                        query: {}
                    };
                });

        vm.listRefreshGenerator = listRefreshGenerator;
        vm.getDataGenerator = getDataGenerator;

        vm.searchForm = {
            rejected: {
                inputType: 'checkbox',
                label: 'Include discarded documents',
                defaultValue: false,
                matchColumn: 'discarded',
                matchRule: 'is null'
            }
        };

        function getDataGenerator(target) {
            return function (query) {
                target.query = query;
                return getData(target);
            };
        }

        function listRefreshGenerator(target) {
            return function (documents) {
                target.documents = documents;
                listRefresh(target);
            };
        }


        function copyDocument(document, target) {

            var restType = target.researchEntity.getType() + 's';

            var restResearchEntity = Restangular
                    .one(restType, target.researchEntity.id);

            ModalService
                    .openScientillaDocumentForm(
                            Scientilla.reference.copyDocument(document, target.researchEntity),
                            restResearchEntity)
                    .then(function () {
                        reload(target);
                    });

        }

        function verifyDocument(document, target) {
            //sTODO move to a service
            researchEntityService
                    .verifyDocument(target.researchEntity, document.id)
                    .then(function () {
                        Notification.success('Document verified');
                        reload(target);
                    })
                    .catch(function () {
                        Notification.warning('Failed to verify document');
                    });
        }

        function getVerifyDocuments(target) {
            return function (documents) {
                var documentIds = _.map(documents, 'id');
                researchEntityService
                        .verifyDocuments(target.researchEntity, documentIds)
                        .then(function (allDocs) {
                            Notification.success(allDocs.length + " document(s) verified");
                            reload(target);
                        })
                        .catch(function (err) {
                            Notification.warning("An error happened");
                        });

            };
        }

        function discardDocument(document, target) {
            //sTODO move to a service
            researchEntityService
                    .discardDocument(target.researchEntity, document.id)
                    .then(function () {
                        Notification.success('Document discarded');
                        reload(target);
                    })
                    .catch(function () {
                        Notification.warning('Failed to discard document');
                    });
        }

        function getDiscardDocuments(target) {
            return function (documents) {
                var documentIds = _.map(documents, 'id');
                researchEntityService
                        .discardDocuments(target.researchEntity, documentIds)
                        .then(function (results) {
                            var resultPartitioned = _.partition(results, function (o) {
                                return o;
                            });
                            Notification.success(resultPartitioned[0].length + " document(s) discarded");
                            reload(target);
                        })
                        .catch(function (err) {
                            Notification.warning("An error happened");
                        });

            };
        }


        // private
        function reload(target) {
            getData(target).
                    then(function (documents) {
                        target.documents = documents;
                        listRefresh(target);
                    });
        }

        function getData(target) {
            return researchEntityService.getSuggestedDocuments(target.researchEntity, target.query);
        }

        function listRefresh(target) {
            _.forEach(target.documents, function (d) {
                if (d)
                    _.defaults(d, Scientilla.reference);
                _.forEach(d.privateCoauthors, function (c) {
                    _.defaults(c, Scientilla.user);
                });
                _.forEach(d.publicCoauthors, function (c) {
                    _.defaults(c, Scientilla.user);
                });
            });
        }
    }
})();
