import { FeatureStorage, IFeatureFlag, KnownFeatures } from 'src/modules/feature/constants/index';
import { CloudSsoFeatureFlag } from 'src/modules/cloud/cloud-sso.feature.flag';

export const knownFeatures: Record<KnownFeatures, IFeatureFlag> = {
  [KnownFeatures.InsightsRecommendations]: {
    name: KnownFeatures.InsightsRecommendations,
    storage: FeatureStorage.Database,
  },
  [KnownFeatures.CloudSso]: {
    name: KnownFeatures.CloudSso,
    storage: FeatureStorage.Database,
    factory: CloudSsoFeatureFlag.getFeature,
  },
  [KnownFeatures.RedisModuleFilter]: {
    name: KnownFeatures.RedisModuleFilter,
    storage: FeatureStorage.Database,
  },
};
