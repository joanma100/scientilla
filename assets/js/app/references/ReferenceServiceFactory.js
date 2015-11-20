(function () {
    angular.module("references").
            factory("ReferenceServiceFactory", ReferenceServiceFactory);

    ReferenceServiceFactory.$inject = ['Restangular'];

    function ReferenceServiceFactory(Restangular) {
        return function (userId) {
            var service = Restangular.service("references", Restangular.one('users', userId));

            service.getNewReference = function () {
                return {
                    title: "",
                    authors: "",
                    owner: userId
                };
            };

            service.delete = function (reference) {
                return reference.remove()
            };

            service.put = function (reference) {
                return Restangular
                        .copy(reference)
                        .customPUT(reference, '/users/' + userId + '/references/' + reference.id);
            };

            return service;
        };
    }
}());