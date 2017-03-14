var app = angular.module('goPlay', ['ui.router', 'ui.bootstrap']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl',
                resolve: {
                    clubPromise: ['clubs', function (clubs) {
                        return clubs.getAll();
                    }]
                }
            })
            .state('clubs', {
                url: '/clubs/{id}',
                templateUrl: '/clubs.html',
                controller: 'ClubsCtrl',
                resolve: {
                    club: ['$stateParams', 'clubs', function ($stateParams, clubs) {
                        return clubs.get($stateParams.id);
                    }]
                }
            })
            .state('login', {
                url: '/login',
                templateUrl: '/login.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home')
                    }
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home')
                    }
                }]
            });

        $urlRouterProvider.otherwise('home');
    }
]);

app.factory('clubs', [
    '$http',
    'auth',
    function ($http, auth) {

        var o = {
            clubs: []
        };

        o.getAll = function () {
            return $http.get('/clubs').success(function (data) {
                angular.copy(data, o.clubs);
            });
        };

        o.get = function (id) {
            return $http.get('/clubs/' + id).then(function (res) {
                return res.data;
            });
        };

        o.create = function (club) {
            return $http.post('/clubs', club, {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            }).success(function (data) {
                o.clubs.push(data);
            })
        };
        
        o.addEvent = function (id, event) {
            return $http.post('/clubs/' + id + '/events', event, {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            });
        };

        return o;

}]);

app.factory('auth', [
    '$http',
    '$window',
    function ($http, $window) {

        var auth = {};

        auth.saveToken = function (token) {
            $window.localStorage['goplay-token'] = token;
        };

        auth.getToken = function () {
            return $window.localStorage['goplay-token'];
        };

        auth.isLoggedIn = function () {

            var token = auth.getToken();

            if (token) {
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload.exp > Date.now() / 1000;
            } else {
                return false;
            }
        };

        auth.currentUser = function () {

            if (auth.isLoggedIn()) {

                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload.username;

            }
        };

        auth.register = function (user) {

            return $http.post('/register', user).success(function (data) {
                auth.saveToken(data.token);
            });

        };

        auth.logIn = function (user) {

            return $http.post('/login', user).success(function (data) {
                auth.saveToken(data.token);
            });

        };

        auth.logOut = function () {
            $window.localStorage.removeItem('goplay-token');
        };

        return auth;

    }
]);

app.controller('MainCtrl', [
    '$scope',
    'clubs',
    'auth',
    function ($scope, clubs, auth) {

        $scope.clubs = clubs.clubs;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.createClub = function () {

            if($scope.name === '') { return; }

            clubs.create({
                name: $scope.name,
                desc: $scope.desc
            });

            $scope.name = '';
            $scope.desc = '';
        }
    }
]);

app.controller('ClubsCtrl', [
    '$scope',
    'clubs',
    'club',
    'auth',
    function ($scope, clubs, club, auth) {

        $scope.club = club;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.addEvent = function(){

            if($scope.name === '') { return; }

            clubs.addEvent(club._id, {

                name: $scope.name,
                desc: $scope.desc,
                creator: 'user'

            }).success(function(event) {

                $scope.club.events.push(event);

            });

            $scope.name = '';
            $scope.desc = '';

        }

    }

]);

app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function ($scope, $state, auth) {

        $scope.user = {};

        $scope.register = function(){
            auth.register($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };

        $scope.logIn = function(){
            auth.logIn($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };
    }
]);

app.controller('NavCtrl', [
    '$scope',
    'auth',
    function ($scope, auth) {

        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;

    }
]);

app.controller('ModalCtrl',
    function ($scope, $uibModal, $log) {

          $scope.animationsEnabled = true;

          $scope.open = function (size) {

            var modalInstance = $uibModal.open({
              animation: $scope.animationsEnabled,
              templateUrl: 'form.ejs',
              controller: 'ModalInstanceCtrl',
              size: size
           });

            modalInstance.result.then(function (selectedItem) {
              $scope.selected = selectedItem;
            }, function () {
              $log.info('Modal dismissed at: ' + new Date());
            });
          };

          $scope.toggleAnimation = function () {
            $scope.animationsEnabled = !$scope.animationsEnabled;
          };

});

app.controller('ModalInstanceCtrl',
    function ($scope, $uibModalInstance) {

        $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        };

});

app.controller('listCtrl',
    function ($scope) {

        $scope.clubsShow = true;
        $scope.socsShow = false;

        $scope.clubs = function () {
            if($scope.socsShow) {
                $scope.socsShow = false;
                $scope.clubsShow = true;
            }
        };

        $scope.socs = function () {
            if($scope.clubsShow) {
                $scope.clubsShow = false;
                $scope.socsShow = true;
            }
        };

});
