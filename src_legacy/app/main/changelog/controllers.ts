module MyApp.Main.Changelog {
    class ChangelogController extends BaseController {
        static $inject = ['$scope', 'logger', '$q', 'model'];
        static $name = 'ChangelogController';

        constructor($scope, logger, $q, model) {
            super($scope, logger, $q);

            $scope.changelog = model;

            $scope.changelogOldShown = false;
            $scope.toggleOlderChangelogs = () => {
                if ($scope.changelogOld) {
                    $scope.changelogOldShown = !$scope.changelogOldShown;
                } else if (!$scope.changelogOldShown) {
                    $scope.changelogOldShown = true;
                    $scope.request(GetChangelogOldQuery)
                        .then(result => $scope.changelogOld = result.lastResult);
                }
            };
        }
    }

    registerController(ChangelogController);

    export class GetChangelogQuery extends DbQueryBase {
        static $name = 'GetChangelog';
        public execute = [() => this.context.getDocMd("CHANGELOG.md", true)];
    }

    registerCQ(GetChangelogQuery);

    export class GetChangelogOldQuery extends DbQueryBase {
        static $name = 'GetChangelogOld';
        public execute = [() => this.context.getDocMd("CHANGELOG_HISTORY.md", true)];
    }

    registerCQ(GetChangelogOldQuery);

    export class GetMiniChangelogQuery extends DbQueryBase {
        static $name = 'GetMiniChangelog';
        public execute = [() => this.context.getDocMd("CHANGELOG.md", true)];
    }

    registerCQ(GetMiniChangelogQuery);
}
