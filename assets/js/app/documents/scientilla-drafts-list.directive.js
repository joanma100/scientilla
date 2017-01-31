/* global Scientilla */

(function () {
    'use strict';

    angular.module('documents')
        .directive('scientillaDraftsList', scientillaDraftsList);

    function scientillaDraftsList() {
        return {
            restrict: 'E',
            templateUrl: 'partials/scientillaDraftsList.html',
            controller: scientillaDrafsListController,
            controllerAs: 'vm',
            scope: {},
            bindToController: {
                researchEntity: "="
            }
        };
    }

    scientillaDrafsListController.$inject = [
        'context',
        'researchEntityService',
        'documentSearchForm',
        'EventsService'
    ];

    function scientillaDrafsListController(context, researchEntityService, documentSearchForm, EventsService) {
        var vm = this;

        var DocumentsService = context.getDocumentService();

        vm.onFilter = onFilter;

        vm.deleteDraft = DocumentsService.deleteDraft;
        vm.verifyDraft = DocumentsService.verifyDraft;
        vm.openEditPopup = DocumentsService.openEditPopup;
        vm.deleteDrafts = DocumentsService.deleteDrafts;
        vm.verifyDrafts = DocumentsService.verifyDrafts;

        vm.searchForm = documentSearchForm;

        var query = {};

        vm.$onInit = function () {
            EventsService.subscribeAll(vm, [
                EventsService.DRAFT_DELETED,
                EventsService.DRAFT_UPDATED,
                EventsService.DRAFT_CREATED,
                EventsService.DRAFT_VERIFIED,
                EventsService.DRAFT_UNVERIFIED,
                EventsService.DOCUMENT_PRIVATE_TAGS_UPDATED
            ], updateList);
        };

        vm.$onDestroy = function () {
            EventsService.unsubscribeAll(vm);
        };

        function updateList() {
            onFilter(query);
        }

        function onFilter(q) {
            query = q;

            return researchEntityService.getDrafts(vm.researchEntity, q)
                .then(function (documents) {
                    vm.drafts = documents;
                });
        }

    }

})();
