(function () {
    'use strict';

    angular.module('documents')
        .component('scientillaDocument', {
            templateUrl: 'partials/scientilla-document.html',
            controller: scientillaDocument,
            controllerAs: 'vm',
            bindings: {
                document: '<',
                section: '<'
            }
        });

    scientillaDocument.$inject = [
        'ModalService',
        'config',
        'DocumentLabels',
        'context',
        'documentOrigins',
        'documentListSections'
    ];

    function scientillaDocument(ModalService, config, DocumentLabels, context, documentOrigins, documentListSections) {
        const vm = this;
        vm.openDetails = openDetails;
        vm.hasMainGroupAffiliation = hasMainGroupAffiliation;
        vm.editTags = editTags;
        vm.isSynchronized = isSynchronized;
        vm.showScopusMetrics = showScopusMetrics;
        vm.showWOSMetrics = showWOSMetrics;
        vm.getMetricValue = getMetricValue;
        vm.hasMetric = hasMetric;
        vm.getVerifiedNamesHTML = getVerifiedNamesHTML;
        vm.isPublic = isPublic;
        vm.isFavorite = isFavorite;
        vm.isPrivacyToShow = isPrivacyToShow;
        vm.isFavoriteToShow = isFavoriteToShow;
        vm.changePrivacy = changePrivacy;
        vm.changeFavorite = changeFavorite;

        const researchEntity = context.getResearchEntity();
        const documentService = context.getDocumentService();

        vm.checkDuplicates = [
            documentListSections.VERIFIED,
            documentListSections.DRAFT,
            documentListSections.SUGGESTED,
            documentListSections.EXTERNAL
        ].includes(vm.section);

        vm.showPrivateTags = [
            documentListSections.VERIFIED,
            documentListSections.DRAFT
        ].includes(vm.section);

        vm.showPrivacy = [
            documentListSections.VERIFIED
        ].includes(vm.section);

        vm.showFavorite = [
            documentListSections.VERIFIED
        ].includes(vm.section);

        const showExternalLabel = [
            documentListSections.SUGGESTED
        ].includes(vm.section);

        vm.metrics = {
            CITATIONS: 'citations',
            SJR: 'SJR',
            SNIP: 'SNIP',
            IF: 'IF',
            IF5: '5IF',
            AIS: 'AIS'
        };

        vm.$onInit = function () {
            vm.showPrivateTags = vm.showPrivateTags || false;
            vm.verifiedCount = getVerifiedCount();
            vm.scopusCitationsYearStr = getScopusCitationPerYearString();

            if(vm.document.kind === 'e' && showExternalLabel)
                vm.document.addLabel(DocumentLabels.EXTERNAL);

            if (vm.checkDuplicates)
                checkDuplicate();


            addLabels();
        };

        function checkDuplicate() {
            function isSuggested(doc) {
                const f = researchEntity.getType() === 'user' ? 'authors' : 'groups';
                return !doc[f].some(re => re.id === researchEntity.id);
            }

            if (!vm.document.duplicates || !vm.document.duplicates.length)
                return;
            let documentLabel;
            //verified and duplicated
            if (vm.document.kind === 'v' && !isSuggested(vm.document) && vm.document.duplicates.some(d => d.duplicateKind === 'v'))
                documentLabel = DocumentLabels.DUPLICATE;
            //verified and duplicates in drafts (no real duplicates)
            else if (vm.document.kind === 'v' && !isSuggested(vm.document) && vm.document.duplicates.every(d => d.duplicateKind === 'd'))
                ;
            //draft and duplicated
            else if (vm.document.kind === 'd' && vm.document.duplicates.every(d => d.duplicateKind === 'd'))
                documentLabel = DocumentLabels.DUPLICATE;
            //draft and already verified
            else if (vm.document.kind === 'd' && vm.document.duplicates.some(d => d.duplicateKind === 'v'))
                documentLabel = DocumentLabels.ALREADY_VERIFIED;
            //external and already verified
            else if (vm.document.kind === 'e' && vm.document.duplicates.some(d => d.duplicateKind === 'v'))
                documentLabel = DocumentLabels.ALREADY_VERIFIED;
            //external and already in drafts
            else if (vm.document.kind === 'e' && vm.document.duplicates.every(d => d.duplicateKind === 'd'))
                documentLabel = DocumentLabels.ALREADY_IN_DRAFTS;
            //suggested and already verified
            else if (vm.document.kind === 'v' && isSuggested(vm.document) && vm.document.duplicates.some(d => d.duplicateKind === 'v'))
                documentLabel = DocumentLabels.ALREADY_VERIFIED;
            //suggested and already in drafts
            else if (vm.document.kind === 'v' && isSuggested(vm.document) && vm.document.duplicates.every(d => d.duplicateKind === 'd'))
                documentLabel = DocumentLabels.ALREADY_IN_DRAFTS;
            if (documentLabel)
                vm.document.addLabel(documentLabel);
        }

        function addLabels() {
            if (vm.document.kind === 'd' && (new Date(vm.document.createdAt)).toDateString() === (new Date()).toDateString())
                vm.document.addLabel(DocumentLabels.NEW);
        }

        function openDetails() {
            ModalService
                .openScientillaDocumentDetails(vm.document);
        }

        function hasMainGroupAffiliation() {
            return _.some(vm.document.affiliations, function (a) {
                return a.institute === config.mainInstitute.id;
            });
        }

        function editTags() {
            ModalService.openScientillaTagForm(vm.document);
        }

        function getScopusCitationPerYearString() {
            return vm.document.citations.filter(c => c.origin === documentOrigins.SCOPUS)
                .map(c => c.year + ':' + c.citations)
                .join(' ');
        }

        function showScopusMetrics() {
            return hasMetric(vm.metrics.CITATIONS) || hasMetric(vm.metrics.SNIP) || hasMetric(vm.metrics.SJR);
        }

        function showWOSMetrics() {
            return hasMetric(vm.metrics.IF);
        }

        function hasMetric(metric) {
            switch (metric) {
                case vm.metrics.CITATIONS:
                    return !!vm.document.citations.find(cit => cit.origin === documentOrigins.SCOPUS);
                case vm.metrics.SNIP:
                case vm.metrics.SJR:
                case vm.metrics.IF:
                    return !!getMetric(metric);
            }
            return false;
        }

        function getMetricValue(metric) {
            return getMetric(metric).value;
        }

        function getMetric(metric) {
            if (metric === vm.metrics.CITATIONS)
                return {
                    value: vm.document.citations.reduce((tot, val) => val.citations + tot, 0)
                };

            const metricAllYears = vm.document.sourceMetrics.filter(m => m.name === metric);
            const year = Math.max(...metricAllYears.map(m => parseInt(m.year, 10)));
            return metricAllYears.find(m => m.year === year);
        }

        function getVerifiedCount() {
            return vm.document.authorships.filter(a => a.researchEntity)
                .concat(vm.document.groupAuthorships).length;
        }

        function getVerifiedNamesHTML() {
            const verifiedNames = getVerfiedNames();
            if (!verifiedNames.length)
                return 'Nobody has verified this document yet';

            return '<p>This document is verified by:</p><p>' + verifiedNames.join('<br>') + '</p>';
        }

        function getVerfiedNames() {
            return vm.document.groups.map(g => '- <b>' + g.name + '</b>')
                .concat(vm.document.authors.map(a => '- ' + a.name + ' ' + a.surname));
        }

        function isSynchronized() {
            return vm.document.synchronized && vm.document.origin === 'scopus';
        }

        function changePrivacy() {
            const authorship = _.clone(getAuthorship());
            authorship.public = !authorship.public;
            documentService.setAuthorshipPrivacy(authorship);
        }

        function changeFavorite() {
            const authorship = _.clone(getAuthorship());
            authorship.favorite = !authorship.favorite;
            documentService.setAuthorshipFavorite(authorship);
        }

        function isPublic() {
            const authorship = getAuthorship();
            if (!authorship) return false;
            return !!authorship.public;
        }

        function isFavorite() {
            const authorship = getAuthorship();
            if (!authorship) return false;
            return !!authorship.favorite;
        }

        function isPrivacyToShow() {
            return vm.showPrivacy && vm.document.kind === 'v' && getAuthorship();
        }

        function isFavoriteToShow() {
            return vm.showFavorite && vm.document.kind === 'v' && getAuthorship();
        }

        function getAuthorship() {
            let field;
            if (researchEntity.getType() === 'user')
                field = 'authorships';
            else
                field = 'groupAuthorships';

            return vm.document[field].find(a => a.researchEntity === researchEntity.id);
        }

    }


})();