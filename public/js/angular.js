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
            .state('users', {
                url: '/users/{id}',
                templateUrl: '/users.html',
                controller: 'UserCtrl'
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

app.factory('users', [
    '$state',
    '$http',
    '$log',
    'auth',
    function ($state, $http, $log, auth) {

        var o = {
            users: []
        };

        o.get = function (id) {
            $log.info('Retrieving a user of id:');
            $log.info(id);
            return $http.get('/users/' + id).then(function (res) {
                return res.data;
            });
        };
    }
]);

app.factory('clubs', [
    '$state',
    '$http',
    '$log',
    'auth',
    function ($state, $http, $log, auth) {

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

        o.delete = function (id) {
            return $http.delete('/clubs/' + id, {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            }).success(function (data) {
                $log.info(data);
                $state.go('home');
            })
        };
        
        o.addEvent = function (id, event) {
            return $http.post('/clubs/' + id + '/events', event, {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            });
        };

        o.addMember = function (id, member) {
            return $http.post('/clubs/' + id + '/members/' + member + '/join', {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            });
        };

        return o;

}]);

app.factory('auth', [
    '$http',
    '$log',
    '$window',
    function ($http, $log, $window) {

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

                //Payload is the user object
                //$log.info(payload);

                return payload.username;

            }
        };

        auth.currentUserId = function () {

            if (auth.isLoggedIn()) {

                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                $log.info('Returning user id');
                $log.info(payload._id);

                return payload._id;

            }
        };

        auth.currentUserObject = function () {

            if (auth.isLoggedIn()) {

                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload;

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
    '$uibModal',
    '$log',
    'clubs',
    'auth',
    function ($scope, $uibModal, $log, clubs, auth) {

        $scope.animationsEnabled = true;

        $scope.clubModal = function (size) {

            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/clubForm.html',
                controller: 'MainCtrl',
                size: size
            });

            modalInstance.result.then(function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.clubs = clubs.clubs;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.createClub = function () {

            if($scope.name === '' ||
                $scope.desc === '' ||
                $scope.pubKey === '' ||
                $scope.regFee === '') { return; }

            clubs.create({
                name: $scope.name,
                desc: $scope.desc,
                pubKey: $scope.pubKey,
                regFee: $scope.regFee
            });

            $scope.name = '';
            $scope.desc = '';
            $scope.pubKey = '';
            $scope.regFee = '';
        };
    }
]);

app.controller('ClubsCtrl', [
    '$scope',
    '$uibModal',
    '$log',
    'clubs',
    'club',
    'auth',
    function ($scope, $uibModal, $log, clubs, club, auth) {

        var tpl, jsassets, tag, i, l;

        tpl = document.getElementById('/clubs.html');

        jsassets = (tpl.getAttribute('data-jsassets') || '').split(',');

        //Retrieve list of javascript assets and inject them into the page

        for( i = 0, l = jsassets.length; i < l; i++) {
            tag = document.createElement('script');
            tag.type = "text/javascript";
            tag.src = jsassets[i];
            document.head.appendChild(tag);
        }

        $scope.club = club;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.animationsEnabled = true;

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

        };

        $scope.addMember = function () {

            $log.info('addMember called');

            $scope.member = auth.currentUserObject();

            $log.info($scope.member);

            clubs.addMember(club._id, $scope.member._id).success(function (member) {

                $scope.club.members.push(member);

            });

        };

        $scope.deleteClub = function () {

            $log.info('deleteClub called');
            $log.info(club._id);
            clubs.delete(club._id);

        };

        $scope.joinModal = function (size) {

            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/paymentForm.html',
                controller: 'PaymentCtrl',
                size: size
            });

            modalInstance.result.then(function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        }
    }
]);

app.controller('UserCtrl', [
    '$scope',
    '$log',
    'clubs',
    'auth',
    function ($scope, $log, clubs, auth) {

        $scope.user = auth.currentUserObject();

        $log.info($scope.user);

        $scope.username = $scope.user.username;

        $log.info($scope.username);

    }
]);

app.controller('PaymentCtrl', [
    '$scope',
    '$log',
    'auth',
    function ($scope, $log, auth) {

        $scope.makePayment = function () {
            $log.info("makePayment Called");
        };

        $scope.simplifyResponseHandler = function (data) {
            var $paymentForm = $("#simplify-payment-form");
            // Remove all previous errors
            $(".error").remove();
            // Check for errors
            if (data.error) {
                // Show any validation errors
                if (data.error.code == "validation") {
                    var fieldErrors = data.error.fieldErrors,
                        fieldErrorsLength = fieldErrors.length,
                        errorList = "";
                    for (var i = 0; i < fieldErrorsLength; i++) {
                        errorList += "<div class='error'>Field: '" + fieldErrors[i].field +
                            "' is invalid - " + fieldErrors[i].message + "</div>";
                    }
                    // Display the errors
                    $paymentForm.after(errorList);
                }
                // Re-enable the submit button
                $("#process-payment-btn").removeAttr("disabled");
            } else {
                // The token contains id, last4, and card type
                var token = data["id"];
                // Insert the token into the form so it gets submitted to the server
                $paymentForm.append("<input type='hidden' name='token' value='" + token + "' />");
                console.log('test');
                $paymentForm.append("<input type='hidden' name='amount' value='1000' />");
                // Submit the form to the server
                $paymentForm.get(0).submit();
            }
        };

        $(document).ready(function() {
            $("#simplify-payment-form").on("submit", function() {
                console.log('test');
                // Disable the submit button
                $("#process-payment-btn").attr("disabled", "disabled");
                // Generate a card token & handle the response
                SimplifyCommerce.generateToken({
                    key: "sbpb_MzI0ZmI0NWMtZTEwOS00NjBhLWJlMTUtN2JhZjEzNjQ4NThi",
                    card: {
                        number: $("#cc-number").val(),
                        cvc: $("#cc-cvc").val(),
                        expMonth: $("#cc-exp-month").val(),
                        expYear: $("#cc-exp-year").val()
                    }
                }, simplifyResponseHandler);
                // Prevent the form from submitting
                return false;
            });
        });
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
        $scope.currentUserId = auth.currentUserId();
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
