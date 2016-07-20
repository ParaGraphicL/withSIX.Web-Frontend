
import {W6} from './services/withSIX';
import { setup as legacySetup, bootAngular as legacyBootAngular } from './legacy/app';

export async function bootAngular(w6: W6) {
  legacySetup({
    dfp: { publisherId: "19223485" },
    adsense: { client: "ca-pub-8060864068276104" },
    w6
  });
  await legacyBootAngular(w6.url);
}
