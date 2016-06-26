
import {W6} from './services/withSIX';
import {MyApp} from './legacy/app';
import legacySetup = MyApp.setup;
import legacyBootAngular = MyApp.bootAngular;

export async function bootAngular(w6: W6) {
  legacySetup({
    dfp: { publisherId: "19223485" },
    adsense: { client: "ca-pub-8060864068276104" },
    w6
  });
  await legacyBootAngular(w6.url);
}
