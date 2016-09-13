import { GetModFileQuery, GetModQuery, GetModRelatedQuery, GetModCreditsQuery } from './mods';
import { NewMissionQuery, EditMissionQuery, GetPublishMissionVersionQuery, GetMissionQuery} from './missions'
import { GetCollectionQuery, GetForkedCollectionsQuery } from './collections'
import { GetGameQuery } from './games';
import {Tk} from '../services/legacy/tk'
import {LegacyMediator} from '../services/mediator';
import {Role} from '../services/dtos';

export const configure = (app: ng.IModule) => {
  function getModFileResolve(fileType) {
    return {
      model: [
        'aur.legacyMediator', '$route',
        (m: LegacyMediator, $route) => m.legacyRequest(GetModFileQuery.$name, { fileType: fileType, gameSlug: $route.current.params.gameSlug, modId: $route.current.params.modId })
      ]
    };
  }
  app.config([
    '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
      var $routeProvider = new Tk.RoutingHandler($r1, $r2, "/p");
      var setupQuery = $routeProvider.setupQuery;
      var setupQueryPart = $routeProvider.setupQueryPart;

      $routeProvider.
        when('/', 'games').
        segment('games', {});
      var game = $routeProvider.
        when('/:gameSlug', 'game').
        when('/:gameSlug/order', 'game.order').
        when('/:gameSlug/stream', 'game.stream').
        //when('/:gameSlug/stream/:streamType?', 'game.stream').
        when('/:gameSlug/servers', 'game.servers').
        when('/:gameSlug/mods', 'game.mods').
        when('/:gameSlug/mods/:modId/:modSlug?/download', 'game.modsShow.download').
        when('/:gameSlug/mods/:modId/:modSlug?/related', 'game.modsShow.related').
        when('/:gameSlug/mods/:modId/:modSlug?/credits', 'game.modsShow.credits').
        when('/:gameSlug/mods/:modId/:modSlug?/readme', 'game.modsShow.readme').
        when('/:gameSlug/mods/:modId/:modSlug?/license', 'game.modsShow.license').
        when('/:gameSlug/mods/:modId/:modSlug?/changelog', 'game.modsShow.changelog').
        when('/:gameSlug/mods/:modId/:modSlug?/settings', 'game.modsShow.settings').
        when('/:gameSlug/mods/:modId/:modSlug?/blog', 'game.modsShow.blog').
        when('/:gameSlug/mods/:modId/:modSlug?', 'game.modsShow').
        when('/:gameSlug/missions', 'game.missions').
        when('/:gameSlug/missions/new', 'game.new_mission').
        when('/:gameSlug/missions/:missionId/:missionSlug?/edit', 'game.edit_mission').
        when('/:gameSlug/missions/:missionId/:missionSlug?/versions/new', 'game.new_mission_version').
        when('/:gameSlug/missions/:missionId/:missionSlug?/versions/:versionSlug/publish', 'game.publish_mission_version').
        when('/:gameSlug/missions/:missionId/:missionSlug?/download', 'game.missionsShow.download').
        when('/:gameSlug/missions/:missionId/:missionSlug?', 'game.missionsShow').
        when('/:gameSlug/collections', 'game.collections').
        when('/:gameSlug/collections/:collectionId/:collectionSlug?', 'game.collectionsShow').
        when('/:gameSlug/collections/:collectionId/:collectionSlug?/related', 'game.collectionsShow.related').
        when('/:gameSlug/collections/:collectionId/:collectionSlug?/content', 'game.collectionsShow.content').
        when('/:gameSlug/collections/:collectionId/:collectionSlug?/content/edit', 'game.collectionsShow.content-edit').
        /*                            when('/:gameSlug/test', 'game.test').*/
        segment('game', {
          controller: 'GameController',
          dependencies: ['gameSlug'],
          templateUrl: '/src_legacy/app/play/gameSubLayout.html',
          resolve: setupQuery(GetGameQuery)
        }).within();
      game.
        segment('stream', {
          default: true
        }).
        segment('servers', {}).
        segment('mods', {}).
        segment('missions', {}).
        segment('collections', {});


      game.
        segment('order', {
          controller: 'OrderController',
          templateUrl: '/src_legacy/app/play/games/order.html',
        });

      // game
      //   .segment('stream', {
      //     controller: 'StreamController',
      //     templateUrl: '/src_legacy/app/play/games/stream/index.html',
      //     dependencies: ['gameSlug', 'streamType'],
      //     resolve: setupQuery(Games.GetStreamQuery, { streamType: 'Content' }),
      //     default: true // TODO: Generally we have some games that have Stream as default, others have Order as default...
      //   }).
      //   segment('stream_personal', {
      //     controller: 'PersonalStreamController',
      //     templateUrl: '/src_legacy/app/play/games/stream/index.html',
      //     dependencies: ['gameSlug', 'streamType'],
      //     resolve: setupQuery(Games.GetPersonalStreamQuery, { streamType: 'Content' })
      //   });

      game.
        segment('modsShow', {
          controller: 'ModController',
          templateUrl: '/src_legacy/app/play/mods/show.html',
          dependencies: ['gameSlug', 'modId', 'modSlug'],
          resolve: setupQuery(GetModQuery),
        })
        .within()
        .segment('info', {
          default: true,
          controller: 'ModInfoController',
          templateUrl: '/src_legacy/app/play/mods/show/info.html',
        }).segment('related', {
          controller: 'ModRelatedController',
          templateUrl: '/src_legacy/app/play/mods/show/related.html',
          resolve: setupQuery(GetModRelatedQuery)
        }).segment('download', {
          templateUrl: '/src_legacy/app/play/mods/show/download.html',
        }).segment('credits', {
          controller: 'ModCreditsController',
          templateUrl: '/src_legacy/app/play/mods/show/credits.html',
          resolve: setupQuery(GetModCreditsQuery)
        }).segment('readme', {
          controller: 'ModFileController',
          templateUrl: '/src_legacy/app/play/mods/show/file.html',
          resolve: getModFileResolve('readme'),
        }).segment('license', {
          controller: 'ModFileController',
          templateUrl: '/src_legacy/app/play/mods/show/file.html',
          resolve: getModFileResolve('license'),
        }).segment('changelog', {
          controller: 'ModFileController',
          templateUrl: '/src_legacy/app/play/mods/show/file.html',
          resolve: getModFileResolve('changelog'),
        }).segment('settings', {
          templateUrl: '/src_legacy/app/play/mods/show/settings.html',
        });

      game.
        segment('new_mission', {
          controller: 'UploadNewmissionController',
          templateUrl: '/src_legacy/app/play/missions/upload-newmission.html',
          dependencies: ['gameSlug'],
          resolve: setupQuery(NewMissionQuery),
          role: [Role.user]
        }).
        segment('edit_mission', {
          controller: 'EditMissionController',
          templateUrl: '/src_legacy/app/play/missions/edit-mission.html',
          dependencies: ['gameSlug', 'missionId', 'missionSlug'],
          resolve: setupQuery(EditMissionQuery),
        }).
        segment('new_mission_version', {
          controller: 'UploadNewversionController',
          templateUrl: '/src_legacy/app/play/missions/upload-newversion.html',
          dependencies: ['gameSlug', 'missionId', 'missionSlug']
        }).
        segment('publish_mission_version', {
          controller: 'PublishVersionController',
          templateUrl: '/src_legacy/app/play/missions/publish-version.html',
          dependencies: ['gameSlug', 'missionId', 'missionSlug', 'versionSlug'],
          resolve: setupQuery(GetPublishMissionVersionQuery)
        }).
        segment('missionsShow', {
          controller: 'MissionController',
          templateUrl: '/src_legacy/app/play/missions/show.html',
          dependencies: ['gameSlug', 'missionId', 'missionSlug'],
          resolve: setupQuery(GetMissionQuery),
        })
        .within()
        .segment('info', {
          controller: 'MissionInfoController',
          default: true,
          templateUrl: '/src_legacy/app/play/missions/show/info.html',
        }).segment('download', {
          templateUrl: '/src_legacy/app/play/missions/show/download.html'
        });

      game.
        segment('collectionsShow', {
          controller: 'CollectionController',
          templateUrl: '/src_legacy/app/play/collections/show.html',
          dependencies: ['gameSlug', 'collectionId', 'collectionSlug'],
          resolve: setupQuery(GetCollectionQuery)
        })
        .within()
        .segment('info', {
          controller: 'CollectionInfoController',
          default: true,
          templateUrl: '/src_legacy/app/play/collections/show/info.html',
        })
        .segment('content-edit', {
        })
        .segment('content', {
        })
        .segment('related', {
          controller: 'CollectionRelatedController',
          templateUrl: '/src_legacy/app/play/collections/show/related.html',
          resolve: setupQuery(GetForkedCollectionsQuery)
        });
    }
  ])
}
