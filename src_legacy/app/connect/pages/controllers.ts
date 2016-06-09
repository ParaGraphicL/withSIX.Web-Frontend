declare var Fingerprint;

module MyApp.Connect.Pages {
    class ResendActivationController extends BaseController {
        static $name = "ResendActivationController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams'];

        constructor(public $scope, public logger, $q, $routeParams) {
            super($scope, logger, $q);

            $scope.model = {
                email: $routeParams.email,
                fingerPrint: new Fingerprint().get()
            };
            $scope.submit = () => this.requestAndProcessResponse(Components.Dialogs.ResendActivationCommand, { data: $scope.model });
        }
    }

    registerController(ResendActivationController);

    class ForgotPasswordController extends BaseController {
        static $name = "ForgotPasswordController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams'];

        constructor(public $scope, public logger, $q, $routeParams) {
            super($scope, logger, $q);

            $scope.model = {};
            $scope.submit = () => this.processCommand($scope.request(Components.Dialogs.ForgotPasswordCommand, { data: $scope.model }).then(result => $scope.success = true), "Request sent!");
        }
    }

    registerController(ForgotPasswordController);

    class ForgotUsernameController extends BaseController {
        static $name = "ForgotUsernameController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams'];

        constructor(public $scope, public logger, $q, $routeParams) {
            super($scope, logger, $q);

            $scope.model = {};
            $scope.submit = () => this.processCommand($scope.request(Components.Dialogs.ForgotUsernameCommand, { data: $scope.model }).then(result => $scope.success = true), "Request sent!");
        }
    }

    registerController(ForgotUsernameController);

    class ResetPasswordController extends BaseController {
        static $name = "ResetPasswordController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams'];

        constructor(public $scope, public logger, $q, $routeParams) {
            super($scope, logger, $q);

            $scope.model = {
                password: "",
                confirmPassword: "",
                passwordResetCode: $routeParams.resetCode
            };
            // TODO
            $scope.tokenKnown = true;

            $scope.submit = () => this.processCommand($scope.request(ResetPasswordCommand, { data: $scope.model })
                .then(result => $scope.success = true));
        }
    }

    registerController(ResetPasswordController);

/*    class FinalizeController extends BaseController {
        static $name = 'FinalizeController'

        constructor(public $scope, public logger, $q) {
            super($scope, logger, $q);

            $scope.model = { fingerPrint: new Fingerprint().get() };
            $scope.finalize = () => this.requestAndProcessResponse(FinalizeCommand, { data: $scope.model });
            $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });
        }
    }

    registerController(FinalizeController);*/


    class RegisterController extends BaseController {
        static $name = "RegisterController";

        constructor(public $scope, public logger, $q) {
            super($scope, logger, $q);

            $scope.model = { fingerPrint: new Fingerprint().get() };
            $scope.register = () => this.requestAndProcessResponse(Components.Dialogs.RegisterCommand, { data: $scope.model });
            $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });
            //$scope.openLoginDialog = () => $scope.request(Components.Dialogs.OpenLoginDialogQuery);
        }
    }

    registerController(RegisterController);
}
